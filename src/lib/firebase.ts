import { appCheckDebugTokenEnabled, appCheckSiteKey, firebaseConfig, isFirebaseConfigured } from './config';

let appPromise: Promise<import('firebase/app').FirebaseApp> | null = null;

/**
 * Firebase is initialised lazily and only for work that needs it (model drafts
 * or family sharing). Local-only drafting never reaches this module.
 */
export function getFirebaseApp(): Promise<import('firebase/app').FirebaseApp> {
  if (!isFirebaseConfigured) {
    return Promise.reject(
      new Error(
        'This copy has no Firebase project configured. Add the VITE_FIREBASE_* values from .env.example.',
      ),
    );
  }
  if (!appPromise) {
    appPromise = (async () => {
      const { initializeApp } = await import('firebase/app');
      const app = initializeApp(firebaseConfig);
      if (appCheckDebugTokenEnabled) {
        // Local development only. Never ship a build with this flag enabled.
        (self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }).FIREBASE_APPCHECK_DEBUG_TOKEN =
          true;
      }
      if (appCheckSiteKey) {
        const { initializeAppCheck, ReCaptchaEnterpriseProvider } = await import('firebase/app-check');
        initializeAppCheck(app, {
          provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
          isTokenAutoRefreshEnabled: true,
        });
      }
      return app;
    })();
  }
  return appPromise;
}
