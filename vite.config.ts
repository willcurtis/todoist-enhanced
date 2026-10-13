import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

/**
 * The security headers the host sends, from public/.htaccess.
 *
 * Apache applies them in production. `npm run preview` applies the same ones
 * here so a build can be checked against the policy before it is uploaded.
 * Keep the two in step.
 */
const SECURITY_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "connect-src 'self' https://api.todoist.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self'",
    "manifest-src 'self'",
    "worker-src 'self'",
    "base-uri 'self'",
    "frame-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
  ].join('; '),
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};

/** Pages cannot send custom headers. The supported CSP directives travel with
 * the HTML, before any resource is loaded; frame-ancestors remains header-only.
 * Development is excluded so Vite's local websocket/HMR can operate normally. */
function staticHostPolicy(): Plugin {
  return {
    name: 'static-host-policy',
    apply: 'build',
    transformIndexHtml() {
      return [
        {
          tag: 'meta', injectTo: 'head-prepend',
          attrs: {
            'http-equiv': 'Content-Security-Policy',
            content: SECURITY_HEADERS['Content-Security-Policy']
              .split('; ').filter((directive) => !directive.startsWith('frame-ancestors')).join('; '),
          },
        },
        {
          tag: 'meta', injectTo: 'head-prepend',
          attrs: { name: 'referrer', content: SECURITY_HEADERS['Referrer-Policy'] },
        },
      ];
    },
  };
}

/**
 * Where this copy of the app is served from, ending with `/`.
 *
 * "Continue with Todoist" identifies the app by the URL of a small JSON file
 * it hosts (`oauth/client.json`), and Todoist only sends people back to the
 * addresses that file lists. Written by hand for the official site, it made
 * every other copy fail with "Invalid redirect URI": a fork on its own domain
 * asked Todoist to check its address against this site's list. A copy built
 * with `PUBLIC_URL=https://example.com/ npm run build` describes itself
 * instead. Left unset, this fork targets local development; production OAuth needs PUBLIC_URL.
 */
const LOCAL_URL = 'http://localhost:5192/';
const PUBLIC_URL = (() => {
  const url = (process.env.PUBLIC_URL ?? '').trim() || LOCAL_URL;
  return url.endsWith('/') ? url : `${url}/`;
})();
/** The dev server Todoist also accepts, so signing in works in development. */
const DEV_REDIRECT = 'http://localhost:5192/';

/** The build-time constants the app reads (declared in src/vite-env.d.ts); the unit tests use them too. */
export const APP_DEFINE = {
  __PUBLIC_URL__: JSON.stringify(PUBLIC_URL),
  __OAUTH_DEV_REDIRECT__: JSON.stringify(DEV_REDIRECT),
};

/**
 * `oauth/client.json`, built for `PUBLIC_URL`: emitted with the build, and
 * served by the dev server. `vite preview` serves the built one from `dist/`,
 * which is the file that will be uploaded.
 */
function oauthClientDocument(publicUrl: string): Plugin {
  const body = `{
  "client_id": "${publicUrl}oauth/client.json",
  "client_name": "The Tech Shed for Todoist",
  "client_uri": "${publicUrl}",
  "logo_uri": "${publicUrl}icon-192.png",
  "redirect_uris": [
    "${publicUrl}",
    "${DEV_REDIRECT}"
  ],
  "grant_types": ["authorization_code", "refresh_token"],
  "response_types": ["code"],
  "token_endpoint_auth_method": "none"
}
`;
  return {
    name: 'oauth-client-document',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.split('?')[0] !== '/oauth/client.json') return next();
        res.setHeader('Content-Type', 'application/json');
        res.end(body);
      });
    },
    generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'oauth/client.json', source: body });
    },
  };
}

export default defineConfig({
  // Relative base so the build can be dropped into any subfolder on Infomaniak.
  base: './',
  server: { host: '127.0.0.1', port: 5192, strictPort: true },
  preview: { headers: SECURITY_HEADERS },
  define: APP_DEFINE,
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  plugins: [
    react(),
    staticHostPolicy(),
    oauthClientDocument(PUBLIC_URL),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      /* The service worker is a build artefact only. The plugin can serve a
         development one, but under this app's relative `base` it fails to
         register and fills the console with an error about a script it cannot
         fetch — which is noise standing in for the very thing it was turned on
         to check. Installing is verified against a build. */
      manifest: {
        /* A stable identity for the installed app, independent of the URL it
           was installed from. Chromium browsers — Brave included — will not
           offer to install a manifest they cannot tell apart from another. */
        id: './',
        name: 'The Tech Shed for Todoist',
        short_name: 'Tech Shed',
        description: 'An independent project, not created by, affiliated with, or supported by Todoist. A local-first client built around planning a week.',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'standalone',
        start_url: './',
        scope: './',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          /* A maskable icon is cropped to whatever shape the system likes, so
             it needs its own full-bleed square. The rounded one was losing its
             corners to the mask. */
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // The share card is fetched by link scrapers, never by the app. There
        // is no reason to spend a fifth of the offline cache on it.
        globIgnores: ['og-image.png'],
        // A new build takes effect on the next reload instead of sitting behind
        // the old one until every tab has been closed.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        // The Todoist API is never cached: the app owns its own offline cache in IndexedDB.
        navigateFallbackDenylist: [/^\/api/],
        runtimeCaching: [],
      },
    }),
  ],
});
