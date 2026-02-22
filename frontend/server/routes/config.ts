import { Router } from 'express';
import { issueSessionToken } from './gemini.js';

const router = Router();

// GET /api/config — return runtime configuration (unauthenticated)
// M24: Also issues a session token for pre-auth Gemini access
router.get('/', (_req, res) => {
  res.json({
    firebase: {
      apiKey: process.env.FIREBASE_API_KEY || '',
      authDomain: process.env.FIREBASE_AUTH_DOMAIN || '',
      projectId: process.env.FIREBASE_PROJECT_ID || '',
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || '',
      appId: process.env.FIREBASE_APP_ID || '',
    },
    tracking: {
      metaPixelId: process.env.META_PIXEL_ID || '',
    },
    sessionToken: issueSessionToken(),
  });
});

export default router;
