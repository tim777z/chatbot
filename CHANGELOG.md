# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- `js/sanitize.js` with `escapeHtml`, `plainText`, `safeUrl` and `mediaMarkup`.
- `js/validate.js` with `validateApiResponse(payload, requiredFields)` for runtime
  validation of engine API responses.
- Optional `onEngineError(engineName, error)` callback in `ChatBot.init` config,
  invoked from each engine's failure path before UI text is appended.
- Tests covering sanitization helpers, malicious API payloads and state edge cases.

### Fixed
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
- Minified build now bundles `js/sanitize.js` ahead of `js/chatbot.js`.

### Security
- Hardened engine response handling against malformed payloads and HTML/script
  injection from third-party APIs.
- Documented client-side API key exposure and recommended backend proxying.
