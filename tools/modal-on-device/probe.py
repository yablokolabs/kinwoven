"""Reproduce the Kinwoven on-device proof on Modal.

The app probe uses a synthetic photo and notes. It writes a local test-only
Firebase config at build time; that is enough to initialize Firebase AI Logic,
but it is not a Firebase project, App Check, or cloud proof.

Commands:
    modal run tools/modal-on-device/probe.py::raw_probe
    modal run tools/modal-on-device/probe.py::app_probe
"""

import json
import os
import platform
import subprocess
import threading
import time
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import modal

app = modal.App("kinwoven-on-device-probe")

BUILD_ID = "2026-11-15-v3"

image = (
    modal.Image.debian_slim(python_version="3.12")
    .apt_install(
        "ca-certificates",
        "gnupg",
        "wget",
        "xvfb",
        "fonts-liberation",
        "libasound2",
        "libatk-bridge2.0-0",
        "libatk1.0-0",
        "libcups2",
        "libdrm2",
        "libgbm1",
        "libgtk-3-0",
        "libnspr4",
        "libnss3",
        "libxcomposite1",
        "libxdamage1",
        "libxfixes3",
        "libxkbcommon0",
        "libxrandr2",
    )
    .run_commands(
        "wget -q -O /tmp/google-chrome.deb "
        "https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb",
        "apt-get update && apt-get install -y /tmp/google-chrome.deb",
        "rm -f /tmp/google-chrome.deb",
    )
    .pip_install("playwright==1.55.0")
    .run_commands("playwright install ffmpeg")
    .run_commands(f"echo {BUILD_ID} > /opt/kinwoven-probe-build")
)

# The local add_local_dir paths exist only on the machine running `modal run`.
# Inside a container Modal imports this same file from /root/probe.py, so the
# built image is already present and must not be rebuilt from the container's
# filesystem.
if modal.is_local():
    ROOT = Path(__file__).resolve().parents[2]
    app_image = (
        image.add_local_dir(ROOT / "dist", remote_path="/app/dist")
        .add_local_dir(ROOT / "assets/generated", remote_path="/app/fixtures")
    )
else:
    app_image = image

profile = modal.Volume.from_name("kinwoven-chrome-profile", create_if_missing=True)

# Playwright normally adds flags that stop component updates and background
# networking. Chrome needs those to fetch and keep the on-device model, so they
# are removed. OnDeviceModelForceCpuBackend keeps the proof independent of a GPU.
PLAYWRIGHT_IGNORE_DEFAULTS = [
    "--disable-component-update",
    "--disable-background-networking",
    "--disable-field-trial-config",
    "--disable-extensions",
    "--disable-component-extensions-with-background-pages",
    "--disable-default-apps",
]

DISABLED_FEATURES = [
    "AvoidUnnecessaryBeforeUnloadCheckSync",
    "DestroyProfileOnBrowserClose",
    "DialMediaRouteProvider",
    "GlobalMediaControls",
    "MediaRouter",
    "LensOverlay",
    "msForceBrowserSignIn",
]

CHROME_ARGS = [
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--no-first-run",
    "--no-default-browser-check",
    f"--disable-features={','.join(DISABLED_FEATURES)}",
    "--enable-features=CDPScreenshotNewSurface,OnDeviceModelForceCpuBackend",
]

NOTES = (
    "The table was in the kitchen.\n"
    "We ate there every Sunday.\n"
    "The radio was always on."
)
ANSWER = "The radio was always on. Mum would hum along while she poured the tea."

RAW_PAGE = r"""<!doctype html>
<meta charset="utf-8">
<title>Kinwoven on-device probe</title>
<style>
  body { font: 20px system-ui, sans-serif; max-width: 900px; margin: 40px auto; padding: 0 24px; }
  button { font: inherit; padding: 14px 22px; }
  pre { white-space: pre-wrap; background: #f3f0ea; padding: 18px; border-radius: 10px; }
</style>
<h1>Chrome on-device probe</h1>
<p>This is a local test page. No Kinwoven app data is present.</p>
<button id="go">Start local model</button>
<pre id="out">Waiting…</pre>
<script>
const options = {
  expectedInputs: [{type: 'text', languages: ['en']}],
  expectedOutputs: [{type: 'text', languages: ['en']}]
};
window.__probe = {
  availability: null,
  status: 'loading',
  progress: [],
  text: null,
  error: null,
  durationMs: null,
};
function show() {
  document.getElementById('out').textContent = JSON.stringify(window.__probe, null, 2);
}
(async () => {
  try {
    if (typeof LanguageModel === 'undefined') {
      window.__probe.availability = 'api-missing';
      window.__probe.status = 'failed';
      window.__probe.error = 'LanguageModel is not defined';
    } else {
      window.__probe.availability = await LanguageModel.availability(options);
      window.__probe.status = 'ready';
    }
  } catch (error) {
    window.__probe.status = 'failed';
    window.__probe.error = String(error);
  }
  show();
})();
document.getElementById('go').addEventListener('click', async () => {
  try {
    window.__probe.status = 'creating';
    window.__probe.error = null;
    window.__probe.text = null;
    show();
    const session = await LanguageModel.create({
      ...options,
      monitor(m) {
        m.addEventListener('downloadprogress', (event) => {
          const pct = Math.round(event.loaded * 100);
          if (!window.__probe.progress.length || window.__probe.progress[window.__probe.progress.length - 1] !== pct) {
            window.__probe.progress.push(pct);
            show();
          }
        });
      },
    });
    window.__probe.status = 'prompting';
    show();
    const started = performance.now();
    const text = await session.prompt('Reply with exactly the single word: local-ready');
    window.__probe.durationMs = Math.round(performance.now() - started);
    window.__probe.text = text;
    window.__probe.status = 'complete';
    session.destroy();
    show();
  } catch (error) {
    window.__probe.status = 'failed';
    window.__probe.error = String(error);
    show();
  }
});
</script>
"""


def _memory_gib() -> float:
    for line in Path("/proc/meminfo").read_text().splitlines():
        if line.startswith("MemTotal:"):
            return round(int(line.split()[1]) / 1024 / 1024, 2)
    return 0.0


def _disk_gib(path: str) -> float:
    stats = os.statvfs(path)
    return round(stats.f_bavail * stats.f_frsize / 1024**3, 2)


def _model_info() -> dict:
    result: dict[str, object] = {}
    local_state = Path("/data/profile/Local State")
    if local_state.exists():
        try:
            data = json.loads(local_state.read_text())
            result["local_state_optimization_guide"] = data.get("optimization_guide", {}).get(
                "on_device", {}
            )
        except Exception as exc:
            result["local_state_error"] = str(exc)
    manifests = []
    for path in Path("/data/profile").rglob("manifest.json"):
        if "OptGuideOnDeviceModel" in str(path) or "OptGuideManifestModel" in str(path):
            item = {"path": str(path)}
            try:
                item["data"] = json.loads(path.read_text())
            except Exception as exc:
                item["error"] = str(exc)
            manifests.append(item)
    result["manifests"] = manifests
    return result


def _wait_for(page, expression: str, timeout_seconds: float = 60):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        value = page.evaluate(expression)
        if value is not None:
            return value
        time.sleep(0.5)
    raise TimeoutError(expression)


def _wait_ready(page, timeout_seconds: float = 60):
    deadline = time.time() + timeout_seconds
    while time.time() < deadline:
        if page.locator("button", has_text="Next: one question").is_enabled():
            return
        time.sleep(0.5)
    raise TimeoutError("capture Next button never enabled")


def _wait_for_draft(page, timeout_ms: int = 300000) -> dict:
    page.wait_for_function(
        """() => {
          const h = document.querySelector('h1');
          const p = document.querySelector('.provenance');
          const e = document.querySelector('.notice-error');
          return Boolean((h && h.textContent.includes('Read your story') && p) || e);
        }""",
        timeout=timeout_ms,
    )
    error = page.locator(".notice-error")
    if error.count():
        return {"ok": False, "error": error.first.inner_text()}
    return {
        "ok": True,
        "heading": page.locator("h1").first.inner_text(),
        "provenance": page.locator(".provenance").first.inner_text(),
        "status": page.locator(".status").first.inner_text() if page.locator(".status").count() else "",
        "caption": page.locator("input.input").first.input_value(),
        "story": page.locator("textarea.textarea-story").first.input_value(),
        "review": page.locator(".notice-review").first.inner_text()
        if page.locator(".notice-review").count()
        else "",
    }


def _start_server(directory: str, port: int):
    handler = partial(SimpleHTTPRequestHandler, directory=directory)
    server = ThreadingHTTPServer(("127.0.0.1", port), handler)
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    return server


def _start_xvfb():
    process = subprocess.Popen(
        ["Xvfb", ":99", "-screen", "0", "1920x1080x24", "-nolisten", "tcp"],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )
    os.environ["DISPLAY"] = ":99"
    time.sleep(2)
    return process


def _launch(
    p,
    width: int,
    height: int,
    video_dir: str | None = None,
    profile_dir: str = "/data/profile",
):
    options = dict(
        user_data_dir=profile_dir,
        executable_path="/usr/bin/google-chrome",
        headless=False,
        ignore_default_args=PLAYWRIGHT_IGNORE_DEFAULTS,
        args=CHROME_ARGS,
        viewport={"width": width, "height": height},
    )
    if video_dir:
        options["record_video_dir"] = video_dir
        options["record_video_size"] = {"width": width, "height": height}
    return p.chromium.launch_persistent_context(**options)


@app.function(image=image, timeout=300)
def version_probe():
    import importlib.metadata

    print(subprocess.check_output(["google-chrome", "--version"], text=True).strip())
    print("playwright=" + importlib.metadata.version("playwright"))


@app.function(
    image=image,
    cpu=8,
    memory=32768,
    timeout=1800,
    volumes={"/data": profile},
)
def raw_probe():
    """Prove the raw Chrome Prompt API online and with the browser offline."""
    from playwright.sync_api import sync_playwright

    evidence: dict[str, object] = {
        "scope": "Raw Chrome Prompt API only; no Kinwoven app or Firebase call.",
        "chrome": subprocess.check_output(["google-chrome", "--version"], text=True).strip(),
        "platform": platform.platform(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "memory_gib": _memory_gib(),
        "profile_disk_gib": _disk_gib("/data"),
    }
    print(json.dumps(evidence, indent=2))

    site = Path("/tmp/kinwoven-raw-site")
    site.mkdir(parents=True, exist_ok=True)
    (site / "index.html").write_text(RAW_PAGE)
    server = _start_server(str(site), 8765)
    xvfb = _start_xvfb()
    context = None
    try:
        with sync_playwright() as p:
            context = _launch(p, 1280, 900)
            page = context.pages[0] if context.pages else context.new_page()
            page.goto("http://127.0.0.1:8765/", wait_until="domcontentloaded")
            availability = _wait_for(page, "window.__probe ? window.__probe.availability : null")
            evidence["availability"] = availability
            print("availability=" + str(availability))

            if availability not in ("unavailable", "api-missing"):
                page.locator("#go").click()
                deadline = time.time() + 1200
                while time.time() < deadline:
                    probe = page.evaluate("window.__probe")
                    if probe.get("status") in ("complete", "failed"):
                        evidence["online"] = probe
                        break
                    time.sleep(2)
                else:
                    evidence["online"] = page.evaluate("window.__probe")
                    evidence["online_timeout"] = True

                if evidence.get("online", {}).get("status") == "complete":
                    context.set_offline(True)
                    page.evaluate(
                        """() => {
                          window.__probe.status = 'offline-starting';
                          window.__probe.error = null;
                          window.__probe.text = null;
                          window.__probe.durationMs = null;
                        }"""
                    )
                    page.locator("#go").click()
                    deadline = time.time() + 300
                    while time.time() < deadline:
                        probe = page.evaluate("window.__probe")
                        if probe.get("status") in ("complete", "failed"):
                            evidence["offline"] = probe
                            break
                        time.sleep(2)
                    else:
                        evidence["offline"] = page.evaluate("window.__probe")
                        evidence["offline_timeout"] = True
                    context.set_offline(False)

            context.close()
            context = None
            evidence["model"] = _model_info()
            Path("/data/raw-evidence.json").write_text(json.dumps(evidence, indent=2))
            profile.commit()
            print("RAW_EVIDENCE")
            print(json.dumps(evidence, indent=2))
    finally:
        if context is not None:
            context.close()
        server.shutdown()
        xvfb.terminate()


@app.function(
    image=app_image,
    cpu=8,
    memory=32768,
    timeout=1800,
    volumes={"/data": profile},
)
def app_probe():
    """Run the real Kinwoven local-only draft and capture UI, network and model evidence."""
    from playwright.sync_api import sync_playwright

    app_js = list(Path("/app/dist/assets").glob("index-*.js"))
    if not any("kinwoven-draft-v3" in path.read_text(errors="ignore") for path in app_js):
        raise RuntimeError(
            "Stale app image: /app/dist does not contain prompt kinwoven-draft-v3. "
            "Rebuild with npx vite build --mode test and rerun."
        )

    evidence: dict[str, object] = {
        "scope": "On-device only. The Firebase config is a local test-only placeholder; "
        "no Firebase project, App Check, cloud inference, or cloud data is used.",
        "build": Path("/opt/kinwoven-probe-build").read_text().strip(),
        "chrome": subprocess.check_output(["google-chrome", "--version"], text=True).strip(),
        "platform": platform.platform(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "memory_gib": _memory_gib(),
        "profile_disk_gib": _disk_gib("/data"),
    }
    # A fresh port bypasses the persistent Chrome profile's HTTP cache, which
    # otherwise can serve the previously built index.html from port 8770.
    server = _start_server("/app/dist", 8771)
    xvfb = _start_xvfb()

    requests: list[dict[str, str]] = []
    draft_requests: list[dict[str, str]] = []
    recording = {"draft": False}
    console: list[str] = []
    page_errors: list[str] = []
    context = None
    try:
        with sync_playwright() as p:
            context = _launch(p, 1440, 1100)
            page = context.pages[0] if context.pages else context.new_page()
            page.on(
                "request",
                lambda request: (
                    requests.append(
                        {"method": request.method, "url": request.url, "type": request.resource_type}
                    ),
                    draft_requests.append(
                        {"method": request.method, "url": request.url, "type": request.resource_type}
                    )
                    if recording["draft"]
                    else None,
                ),
            )
            page.on("console", lambda message: console.append(f"{message.type}: {message.text}"))
            page.on("pageerror", lambda error: page_errors.append(str(error)))

            page.goto(
                f"http://127.0.0.1:8771/?build={BUILD_ID}",
                wait_until="networkidle",
            )
            page.get_by_role("button", name="Start a memory").click()
            page.get_by_role("heading", name="Add one photo").wait_for()
            page.locator('input[type="file"]').set_input_files("/app/fixtures/kitchen-table.jpg")
            page.locator("textarea").fill(NOTES)
            _wait_ready(page)
            page.get_by_role("button", name="Next: one question").click()
            page.get_by_role("heading", name="One thing the photo cannot show").wait_for()
            page.locator("textarea").fill(ANSWER)

            recording["draft"] = True
            page.get_by_role("button", name="Make my draft").click()
            online = _wait_for_draft(page)
            recording["draft"] = False

            evidence["online"] = online
            evidence["page_errors"] = list(page_errors)
            evidence["console"] = list(console)
            evidence["requests_during_draft"] = list(draft_requests)
            evidence["online_requests"] = [
                item
                for item in draft_requests
                if any(
                    host in item["url"]
                    for host in (
                        "googleapis.com",
                        "firebase",
                        "gstatic.com",
                        "cloudfunctions.net",
                        "run.app",
                    )
                )
            ]
            evidence["cloud_inference_requests"] = [
                item for item in draft_requests if "firebasevertexai" in item["url"]
            ]
            if online.get("ok"):
                page.screenshot(path="/data/app-online.png", full_page=True)
                evidence["draft_text"] = {
                    "caption": online.get("caption"),
                    "story": online.get("story"),
                }

            context.close()
            context = None
            evidence["model"] = _model_info()
            Path("/data/app-evidence.json").write_text(json.dumps(evidence, indent=2))
            profile.commit()
            print("APP_EVIDENCE")
            print(json.dumps(evidence, indent=2))
    finally:
        if context is not None:
            try:
                context.close()
            except Exception:
                pass
        server.shutdown()
        xvfb.terminate()


@app.function(
    image=app_image,
    cpu=8,
    memory=32768,
    timeout=1800,
    volumes={"/data": profile},
)
def live_app_probe():
    """Run the deployed v3 app on-device and record real UI video."""
    from playwright.sync_api import sync_playwright

    live_url = "https://kinwoven-proof.web.app/?build=live-v3"
    video_dir = Path("/data/ondevice-video")
    video_dir.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, object] = {
        "scope": "Live deployed app, on-device only, real Firebase project and App Check. "
        "Synthetic fixture; no family data.",
        "url": live_url,
        "build": BUILD_ID,
        "chrome": subprocess.check_output(["google-chrome", "--version"], text=True).strip(),
        "platform": platform.platform(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "memory_gib": _memory_gib(),
        "profile_disk_gib": _disk_gib("/data"),
    }
    xvfb = _start_xvfb()
    draft_requests: list[dict[str, str]] = []
    recording = {"draft": False}
    console: list[str] = []
    page_errors: list[str] = []
    context = None
    try:
        with sync_playwright() as p:
            context = _launch(p, 1920, 1080, str(video_dir))
            page = context.pages[0] if context.pages else context.new_page()
            video = page.video
            page.on(
                "request",
                lambda request: draft_requests.append(
                    {"method": request.method, "url": request.url, "type": request.resource_type}
                )
                if recording["draft"]
                else None,
            )
            page.on("console", lambda message: console.append(f"{message.type}: {message.text}"))
            page.on("pageerror", lambda error: page_errors.append(str(error)))

            page.goto(live_url, wait_until="domcontentloaded")
            page.get_by_role("button", name="Start a memory").wait_for(timeout=120000)
            page.get_by_role("button", name="Start a memory").click()
            page.get_by_role("heading", name="Add one photo").wait_for()
            page.locator('input[type="file"]').set_input_files("/app/fixtures/kitchen-table.jpg")
            page.locator("textarea").fill(NOTES)
            _wait_ready(page, timeout_seconds=120)
            page.get_by_role("button", name="Next: one question").click()
            page.get_by_role("heading", name="One thing the photo cannot show").wait_for()
            page.locator("textarea").fill(ANSWER)

            recording["draft"] = True
            page.get_by_role("button", name="Make my draft").click()
            online = _wait_for_draft(page)
            recording["draft"] = False

            evidence["online"] = online
            evidence["page_errors"] = list(page_errors)
            evidence["console"] = list(console)
            evidence["requests_during_draft"] = list(draft_requests)
            evidence["online_requests"] = [
                item
                for item in draft_requests
                if any(
                    host in item["url"]
                    for host in (
                        "googleapis.com",
                        "firebase",
                        "gstatic.com",
                        "cloudfunctions.net",
                        "run.app",
                    )
                )
            ]
            evidence["cloud_inference_requests"] = [
                item for item in draft_requests if "firebasevertexai" in item["url"]
            ]
            if online.get("ok"):
                page.wait_for_timeout(6000)
                page.screenshot(path="/data/ondevice-live.png", full_page=True)
                evidence["draft_text"] = {
                    "caption": online.get("caption"),
                    "story": online.get("story"),
                }

            context.close()
            context = None
            if video:
                try:
                    Path(video.path()).replace("/data/ondevice-live.webm")
                    evidence["video"] = "/data/ondevice-live.webm"
                except Exception as exc:
                    evidence["video_error"] = str(exc)
            evidence["model"] = _model_info()
            Path("/data/ondevice-live-evidence.json").write_text(json.dumps(evidence, indent=2))
            profile.commit()
            print("LIVE_APP_EVIDENCE")
            print(json.dumps(evidence, indent=2))
    finally:
        if context is not None:
            try:
                context.close()
            except Exception:
                pass
        xvfb.terminate()


@app.function(
    image=app_image,
    cpu=8,
    memory=32768,
    timeout=1800,
    volumes={"/data": profile},
)
def cloud_probe():
    """Run the deployed v3 app in a fresh profile so it falls back to cloud."""
    from playwright.sync_api import sync_playwright

    live_url = "https://kinwoven-proof.web.app/?build=live-v3-cloud"
    video_dir = Path("/data/cloud-video")
    video_dir.mkdir(parents=True, exist_ok=True)
    evidence: dict[str, object] = {
        "scope": "Live deployed app, fresh Chrome profile, cloud fallback with real App Check. "
        "Synthetic fixture; no family data.",
        "url": live_url,
        "build": BUILD_ID,
        "chrome": subprocess.check_output(["google-chrome", "--version"], text=True).strip(),
        "platform": platform.platform(),
        "python": platform.python_version(),
        "cpu_count": os.cpu_count(),
        "memory_gib": _memory_gib(),
        "profile_disk_gib": _disk_gib("/data"),
    }
    xvfb = _start_xvfb()
    draft_requests: list[dict[str, object]] = []
    recording = {"draft": False}
    console: list[str] = []
    page_errors: list[str] = []
    context = None
    try:
        with sync_playwright() as p:
            context = _launch(p, 1920, 1080, str(video_dir), "/data/cloud-profile")
            page = context.pages[0] if context.pages else context.new_page()
            video = page.video
            page.on(
                "request",
                lambda request: draft_requests.append(
                    {
                        "method": request.method,
                        "url": request.url,
                        "type": request.resource_type,
                        "app_check": bool(request.headers.get("x-firebase-appcheck")),
                    }
                )
                if recording["draft"]
                else None,
            )
            page.on("console", lambda message: console.append(f"{message.type}: {message.text}"))
            page.on("pageerror", lambda error: page_errors.append(str(error)))

            page.goto(live_url, wait_until="domcontentloaded")
            page.get_by_role("button", name="Start a memory").wait_for(timeout=120000)
            page.get_by_role("button", name="Start a memory").click()
            page.get_by_role("heading", name="Add one photo").wait_for()
            page.locator('input[type="file"]').set_input_files("/app/fixtures/kitchen-table.jpg")
            page.locator("textarea").fill(NOTES)
            _wait_ready(page, timeout_seconds=120)
            page.get_by_role("button", name="Next: one question").click()
            page.get_by_role("heading", name="One thing the photo cannot show").wait_for()
            page.locator("textarea").fill(ANSWER)
            page.locator('input[type="radio"][value="cloud"]').check()

            recording["draft"] = True
            page.get_by_role("button", name="Make my draft").click()
            online = _wait_for_draft(page)
            recording["draft"] = False

            evidence["online"] = online
            evidence["page_errors"] = list(page_errors)
            evidence["console"] = list(console)
            evidence["requests_during_draft"] = list(draft_requests)
            evidence["cloud_inference_requests"] = [
                item for item in draft_requests if "firebasevertexai" in str(item["url"])
            ]
            if online.get("ok"):
                page.screenshot(path="/data/cloud-live.png", full_page=True)
                evidence["draft_text"] = {
                    "caption": online.get("caption"),
                    "story": online.get("story"),
                }

            context.close()
            context = None
            if video:
                try:
                    Path(video.path()).replace("/data/cloud-live.webm")
                    evidence["video"] = "/data/cloud-live.webm"
                except Exception as exc:
                    evidence["video_error"] = str(exc)
            Path("/data/cloud-live-evidence.json").write_text(json.dumps(evidence, indent=2))
            profile.commit()
            print("CLOUD_LIVE_EVIDENCE")
            print(json.dumps(evidence, indent=2))
    finally:
        if context is not None:
            try:
                context.close()
            except Exception:
                pass
        xvfb.terminate()
