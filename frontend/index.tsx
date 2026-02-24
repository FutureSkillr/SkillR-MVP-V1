import React from 'react';
import ReactDOM from 'react-dom/client';
import './styles/globals.css';
import App from './App';
import { BrandProvider } from './contexts/BrandContext';

// Fetch runtime config from backend and inject into globalThis.process.env
// so that firebase.ts can read FIREBASE_API_KEY etc. at import time.
async function bootstrap() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const cfg = await res.json();
      const g = globalThis as any;
      g.process = g.process || {};
      g.process.env = g.process.env || {};
      if (cfg?.firebase) {
        Object.assign(g.process.env, {
          FIREBASE_API_KEY: cfg.firebase.apiKey,
          FIREBASE_AUTH_DOMAIN: cfg.firebase.authDomain,
          FIREBASE_PROJECT_ID: cfg.firebase.projectId,
          FIREBASE_STORAGE_BUCKET: cfg.firebase.storageBucket,
          FIREBASE_MESSAGING_SENDER_ID: cfg.firebase.messagingSenderId,
          FIREBASE_APP_ID: cfg.firebase.appId,
        });
      }
      if (cfg?.devMode) {
        g.process.env.SKILLR_DEV_MODE = 'true';
      }
    }
  } catch {
    // Continue without Firebase — falls back to stub auth
  }

  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Could not find root element to mount to');
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <BrandProvider>
        <App />
      </BrandProvider>
    </React.StrictMode>
  );
}

bootstrap();
