import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function loadDevCerts() {
  const keyPath = path.resolve(__dirname, '../.certs/localhost-key.pem');
  const certPath = path.resolve(__dirname, '../.certs/localhost.pem');
  if (fs.existsSync(keyPath) && fs.existsSync(certPath)) {
    return { key: fs.readFileSync(keyPath), cert: fs.readFileSync(certPath) };
  }
  return undefined;
}

/**
 * Serve static HTML files from public/ before the SPA history-api-fallback.
 * Without this, Vite rewrites /landing/kids.html → /index.html and the React
 * app loads instead of the stakeholder-specific landing page.
 */
function serveStaticHtml(): Plugin {
  const publicDir = path.resolve(__dirname, 'public');
  return {
    name: 'serve-static-html',
    configureServer(server) {
      // No return → middleware runs BEFORE Vite internals (incl. history fallback)
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.endsWith('.html') && !req.url.startsWith('/@')) {
          const urlPath = req.url.split('?')[0];
          const filePath = path.join(publicDir, urlPath);
          if (fs.existsSync(filePath)) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.end(fs.readFileSync(filePath, 'utf-8'));
            return;
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const https = loadDevCerts();

  // Go backend port: 8080 when running directly, 9090 when via docker-compose
  const goPort = env.VITE_GO_PORT || '8080';
  const scheme = https ? 'https' : 'http';

  return {
    server: {
      port: 3000,
      host: 'localhost',
      https,
      proxy: {
        '/api': {
          target: `${scheme}://localhost:${goPort}`,
          changeOrigin: true,
          secure: false,
        },
      },
    },
    plugins: [serveStaticHtml(), tailwindcss(), react()],
    // API keys and Firebase config are now injected at runtime via /api/config (FR-051)
    // No secrets in the JS bundle
    define: {},
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      include: ['**/*.test.ts', '**/*.test.tsx'],
      exclude: ['node_modules', 'server'],
    },
  };
});
