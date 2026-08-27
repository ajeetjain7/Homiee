const axios = require('axios');

let adminApp = null;
let adminAuth = null;

try {
  const { getApps, initializeApp, cert } = require('firebase-admin/app');
  const { getAuth } = require('firebase-admin/auth');
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'homiee-6d0d8';

  const apps = getApps();
  if (!apps.length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: FIREBASE_PROJECT_ID
      });
    } else {
      adminApp = initializeApp({
        projectId: FIREBASE_PROJECT_ID
      });
    }
  } else {
    adminApp = apps[0];
  }
  adminAuth = getAuth(adminApp);
} catch (err) {
  console.warn('Firebase Admin SDK modular initialization note:', err.message);
}

/**
 * Cryptographically verifies a Google / Firebase ID token.
 * 1. Attempts verification via Firebase Admin SDK.
 * 2. Falls back to Google OAuth2 tokeninfo endpoint for verified token metadata.
 */
const verifyFirebaseIdToken = async (idToken) => {
  if (!idToken || typeof idToken !== 'string') {
    throw new Error('ID Token is required for authentication.');
  }

  // 1. Try Firebase Admin SDK verification if initialized
  if (adminAuth) {
    try {
      const decoded = await adminAuth.verifyIdToken(idToken);
      if (decoded && decoded.email) {
        return {
          uid: decoded.uid,
          email: decoded.email.toLowerCase().trim(),
          name: decoded.name || decoded.display_name || '',
          picture: decoded.picture || ''
        };
      }
    } catch (adminErr) {
      // Fall through to public tokeninfo
    }
  }

  // 2. Fallback to Google's official public tokeninfo endpoint
  try {
    const res = await axios.get(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      timeout: 6000
    });
    const data = res.data;

    if (data && data.email && (data.email_verified === 'true' || data.email_verified === true)) {
      return {
        uid: data.sub || data.user_id,
        email: data.email.toLowerCase().trim(),
        name: data.name || '',
        picture: data.picture || ''
      };
    } else {
      throw new Error('Google token validation failed or email not verified.');
    }
  } catch (tokenInfoErr) {
    throw new Error(`Google token cryptographic verification failed: ${tokenInfoErr.response?.data?.error_description || tokenInfoErr.message}`);
  }
};

module.exports = {
  verifyFirebaseIdToken
};
