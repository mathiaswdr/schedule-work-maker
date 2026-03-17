# Temiqo

Temiqo is a Next.js 14 SaaS for time tracking, client management, invoicing, and subscription billing.

## Development

```bash
npm run dev
npm run lint
npm run build
```

The app runs on [http://localhost:3000](http://localhost:3000).

## Playwright E2E

Playwright is configured in `playwright.config.ts` and the tests live in `tests/e2e/`.

Current E2E coverage focuses on the main user paths:

- `tests/e2e/home.spec.ts`: homepage rendering
- `tests/e2e/auth.spec.ts`: magic-link login and unauthenticated redirect protection
- `tests/e2e/logout.spec.ts`: authenticated logout flow
- `tests/e2e/settings.spec.ts`: settings save and business profile completion
- `tests/e2e/clients.spec.ts`: authenticated client create, edit, and delete flows
- `tests/e2e/time-tracking.spec.ts`: start, pause, resume, and finish session flow

### Local setup

Install the browser once:

```bash
npm run test:e2e:install
```

Run the full suite:

```bash
npm run test:e2e
```

Run the suite in headed mode:

```bash
npm run test:e2e:headed
```

Open the HTML report after a run:

```bash
npm run test:e2e:report
```

### Notes

- The Playwright web server starts the app with `E2E_TEST_MODE=1`, which enables a local-only magic-link capture flow for testing.
- Outside E2E mode, magic-link login requires `EMAIL_SERVER_HOST`, `EMAIL_SERVER_PORT`, `EMAIL_FROM`, and optional `EMAIL_SERVER_USER` / `EMAIL_SERVER_PASSWORD`.
- Test artifacts are written to `playwright-report/` and `test-results/`.
