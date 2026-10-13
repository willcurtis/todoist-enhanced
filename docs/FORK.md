# The Tech Shed fork

Source: Jules-Valentin Bertolino's `todoist-enhanced`, commit `4c1649efc9c4a93d43d6806427f0c703f0809258`.

## Licence and identity

The source uses the MIT licence, which permits modification and redistribution while retaining its copyright and permission notice. `LICENSE` remains unchanged. Builds include `public/LICENSE` and `public/NOTICE.txt`; the packaging check requires both. The About screen credits the upstream author. Todoist's non-affiliation notice remains visible.

The supplied logo comes from The Tech Shed website's `src/images/tts-round-outline.png`, used without redrawing or recolouring. Theme colours come from that website's `src/assets/site.css`. Icons are reproducible with `npm run icons`; maskable icons keep the logo inside the safe area. The green accent and dark theme are defaults; appearance controls remain available.

This fork's feedback links point to its GitHub issues. It does not advertise the upstream author's recruitment message, donation account or separately maintained desktop binary. Historic changelogs and `UPSTREAM-README.md` preserve provenance.

## Reliability changes

- Outbox insertion rejects on storage failure. `apply` waits for durable storage before showing an edit and incrementing the pending count. Failures produce an English/French error message. Delayed deletions restore their baseline if saving fails.
- Disconnect invalidates in-flight sync/write and estimate-verification work, cancels delayed snapshot/preferences/deletion work, clears undo entries and then clears device storage. Late OAuth refreshes cannot restore credentials after disconnect.
- OAuth code exchange and refresh use a 20-second deadline for both fetching and reading the body. Timers are released in `finally`; failed refreshes release the shared promise so later calls can retry. Transient failures retain credentials.

## Hosting boundary

At fork creation, no production site, DNS record, live account or native application was deployed. The subsequent GitHub Pages deployment is documented in [deploying.md](deploying.md). Set `PUBLIC_URL` to the real HTTPS app address before building for hosting. Todoist must be able to read that site's generated OAuth metadata. Local development and API-token sign-in do not require a hosted OAuth client. Never put a personal token into the build or repository.

Run `npm ci`, `npm run dev`, then open http://127.0.0.1:5192/. Use the demo before connecting an account.

## Verification (13 October 2026)

- TypeScript production build and ESLint passed.
- 640 unit tests passed, including new storage-failure, delayed deletion, sign-out and OAuth timeout/retry regressions.
- 302 of 303 Chromium end-to-end tests passed. The remaining upstream test, `e2e/fixes-1.16.spec.ts:29`, expects a priority highlight after appending `p1` to a reopened title. It also fails at the same assertion on untouched upstream commit `4c1649e`; it has not been suppressed or marked as passing.
- `npm audit`: zero known vulnerabilities, including development dependencies, at verification time.
- Desktop sign-in, desktop planner and mobile planner screenshots inspected. Fixed the longer brand name truncating the non-affiliation notice, sign-in contrast and mobile group-action overlap.
- Packaged ZIP integrity checked and its LICENSE verified byte-for-byte against the retained upstream licence.
- No live Todoist credentials or account writes used in testing. OAuth production-host integration remains a deployment acceptance check.

An initial browser run encountered local disk exhaustion while saving traces. The final run used a persistent browser runtime and disabled traces; it completed with only the separately reproduced upstream failure above.
