# Contributing

Thank you for your interest in contributing.

## Development setup

```bash
npm ci
npm test
npm run lint
```

## Guidelines

- Keep each change small and focused, with tests in the same commit.
- Follow the existing code style (ESLint configuration in `.eslintrc.json`).
- Add or update tests for any behavior change.
- Do not commit secrets or API keys; use `.env.example` as a template.

## Commit messages

Use conventional commit prefixes so changes stay reviewable and mineable:
`feat:`, `fix:`, `test:`, `docs:`, `refactor:`, `chore:`. Keep the subject under
72 characters and put the rationale in the body when it is not obvious.

Examples:

```
fix: escape user captures before rendering pattern responses
test: cover XSS payloads in keyboard input and response templates
chore: add JSDoc types and a CI typecheck job
```

Pair each source change with the test that pins its behaviour in the **same**
commit. Avoid mixing formatting, refactors and features in one commit; small
focused commits make regressions easy to bisect and fixes easy to review.
CI runs `npm test`, `npm run lint`, `npm run typecheck`, `npm audit --audit-level=high`
and `npm run build`; run them locally before opening a PR. Keep JSDoc annotations
on any public API you add so the typecheck job continues to pass.
