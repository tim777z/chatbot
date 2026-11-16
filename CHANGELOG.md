# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Added
- `js/validate.js` with `validateApiResponse(payload, requiredFields)` for runtime
  validation of engine API responses.
- Optional `onEngineError(engineName, error)` callback in `ChatBot.init` config,
  invoked from each engine's failure path before UI text is appended.
- Additional Jest coverage for validation and engine error handling.

### Changed
- DuckDuckGo engine now uses HTTPS endpoints.
- Engine success callbacks validate API responses before rendering.
- Raised Jest coverage thresholds and widened `collectCoverageFrom` to all of `js/`.

### Security
- Hardened engine response handling against malformed payloads.
- Documented client-side API key exposure and recommended backend proxying.
