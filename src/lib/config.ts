export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
};

/**
 * True only when the full web app configuration is present. Firebase web keys
 * are public identifiers; family content is protected by rules, not by hiding them.
 */
export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

export const appCheckSiteKey = import.meta.env.VITE_APPCHECK_SITE_KEY ?? '';

export const appCheckDebugTokenEnabled = import.meta.env.VITE_APPCHECK_DEBUG === 'true';

export const cloudModel = import.meta.env.VITE_CLOUD_MODEL?.trim() || 'gemini-3.5-flash-lite';
