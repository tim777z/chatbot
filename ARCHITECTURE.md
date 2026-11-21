# Architecture

## Overview

`js/chatbot.js` is a single jQuery plugin exposed as the global `ChatBot` IIFE.
It contains:

- Core state and pattern matching (`init`, `react`, `addPattern`, `playConversation`).
- Three engine factories under `ChatBot.Engines`: `webknox`, `spoonacular`, `duckduckgo`.
- DOM rendering helpers (`addChatEntry`, `thinking`, `updateCommandDescription`).

## Supporting modules

- `js/validate.js` provides
  `validateApiResponse(payload, requiredFields, fieldTypes)` used by engine
  success callbacks to guard against malformed API responses. It checks own
  properties and optional field types; if the module cannot be resolved in a
  browser, `js/chatbot.js` uses a fail-closed stub (see the "Response
  Validation" table in `README.md` for the per-engine contract).
- `js/sanitize.js` provides `escapeHtml`, `plainText`, `safeUrl` and `mediaMarkup`.
  Engine callbacks pass every third-party string through it before building HTML,
  so untrusted markup and non-HTTP URL schemes cannot reach the DOM. It must be
  loaded before `js/chatbot.js` in a browser (the minified build bundles
  sanitize, validate and chatbot, in that order).

## Data flow

1. User input is matched against registered patterns. Captures substituted into
   `response` templates are HTML-escaped; `rewrite` captures are expanded literally
   because they become engine queries, not markup.
2. On no match, each configured engine's `react(query)` is invoked.
3. Engines call third-party APIs, validate the response shape, pass every string
   through `js/sanitize.js`, and render results via `ChatBot.addChatEntry`.
4. Failures invoke the optional `onEngineError(engineName, error)` hook and show an
   "unavailable" message.
5. Keyboard input is escaped in `init()` before it is displayed in the history,
   while the raw value is still forwarded to engines as the query.

## Security notes

API keys are embedded in client-side requests. Proxy through a backend in
production and inject keys server-side. `addChatEntry` treats its `text` argument
as HTML, so every untrusted value is escaped before that call; see `SECURITY.md`
for the reporting path and the full threat model.
