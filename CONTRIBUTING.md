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

Prefer conventional commit prefixes (`feat:`, `fix:`, `test:`, `docs:`, `chore:`).
