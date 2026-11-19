# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- JSDoc types on the public `ChatBot` API, engine factories, and the sanitize /
  validate modules, plus `jsconfig.json` and a `npm run typecheck` CI job.
- `SECURITY.md` with a private vulnerability-reporting path.
- `js/sanitize.js` with `escapeHtml`, `plainText`, `safeUrl` and `mediaMarkup`.
- `js/validate.js` with `validateApiResponse(payload, requiredFields)` for runtime
  validation of engine API responses.
- Optional `onEngineError(engineName, error)` callback in `ChatBot.init` config,
  invoked from each engine's failure path before UI text is appended.
- Tests covering sanitization helpers, malicious API payloads and state edge cases.

### Fixed
- Keyboard input and conversation entries are escaped before being rendered,
  while the raw value is still passed to engines as the query.
- `$1`..`$N` substitution in `response` patterns escapes user captures instead of
  injecting them as HTML; captures in `rewrite` patterns stay literal so queries
  are not corrupted. Replacement now uses a callback, so a capture containing
  `$&` is inserted verbatim.
- `npm test` now terminates reliably by running Jest in-band.
- DuckDuckGo answers no longer render the literal string `undefined` when
  `AbstractText` is missing, and missing `Icon` objects no longer throw.
- README quick-start commands, demo links and license now match the repository.

### Changed
- Engine responses are escaped/stripped before rendering; media links use safe
  `http(s)` URLs with `rel="noopener noreferrer"` instead of inline navigation.
- DuckDuckGo engine uses HTTPS endpoints.
- Coverage gate raised to 85% lines / 65% branches and `collectCoverageFrom`
  covers all of `js/`.
- Minified build now bundles `js/sanitize.js` and `js/validate.js` ahead of
  `js/chatbot.js`, so browser response validation is no longer fail-open.

### Security
- Hardened engine response handling against malformed payloads and HTML/script
  injection from third-party APIs.
- Closed a DOM XSS path: untrusted human input and regex captures no longer reach
  `addChatEntry` unescaped. Regression tests live in `test/chatbot.xss.test.js`.
- Documented client-side API key exposure and recommended backend proxying.
