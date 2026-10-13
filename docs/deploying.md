# Deploying The Tech Shed for Todoist

## GitHub Pages

Live URL: https://willcurtis.github.io/todoist-enhanced/

The repository uses GitHub Actions as its Pages source. `.github/workflows/pages.yml` runs on pushes to `main` and manual dispatch. It runs type checking, lint, unit tests and focused browser smoke tests before publishing `dist/`. The full browser suite still contains the documented upstream saved-title test failure; the deployment smoke tests cover branding, task actions and mobile layout.

The workflow derives `PUBLIC_URL` from `actions/configure-pages`, so OAuth metadata matches the actual Pages address, including the repository subpath. `scripts/check-pages.mjs` checks that metadata, the manifest assets and retained licence before upload.

GitHub Pages does not read `.htaccess`. The production build embeds supported Content-Security-Policy directives and Referrer-Policy in HTML. Header-only directives such as `frame-ancestors` and Permissions-Policy require a hosting service or proxy that supports custom headers; they are not claimed to be provided by this configuration.

Rollback: revert the problematic commit on `main` and let the same checked workflow publish again. For an urgent site withdrawal, disable Pages in repository settings; browser caches and queued local edits must not be deleted as part of rollback.

## Other static hosts

1. Use Node 22.12+ (22.x), 24.x or 26+ and run `npm ci`.
2. Build for the exact HTTPS app address, including a trailing slash and any subfolder:

   ```sh
   PUBLIC_URL=https://your-domain.example/ npm run package
   ```

3. Upload the complete archive contents. Include `.htaccess`, the manifest, icons, `oauth/client.json`, `LICENSE` and `NOTICE.txt`.
4. On Apache, verify `.htaccess` is active. On another server, reproduce the headers in `vite.config.ts`, particularly Content-Security-Policy and frame protection. Serve over HTTPS.
5. Verify the app title, Tech Shed logo, demo, mobile layout, assets and OAuth metadata. Test sign-in only with an account authorised for this deployment. Check an actual edit and reload before declaring sync operational.

The default build uses a local development address. It is not a public OAuth deployment. No production hostname is assumed by this fork.

Rollback: retain the previous complete build and restore it as a unit. Do not remove the user's browser data as part of an asset rollback; it can contain queued edits. The PWA adopts a new build on reload.

This fork is MIT licensed with original attribution retained; do not remove `LICENSE` or `NOTICE.txt` from redistribution.
