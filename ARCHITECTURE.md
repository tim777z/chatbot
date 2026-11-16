# Architecture

## Overview

`js/chatbot.js` is a single jQuery plugin exposed as the global `ChatBot` IIFE.
It contains:

- Core state and pattern matching (`init`, `react`, `addPattern`, `playConversation`).
- Three engine factories under `ChatBot.Engines`: `webknox`, `spoonacular`, `duckduckgo`.
- DOM rendering helpers (`addChatEntry`, `thinking`, `updateCommandDescription`).

## Supporting modules

- `js/validate.js` provides `validateApiResponse(payload, requiredFields)` used by
  engine success callbacks to guard against malformed API responses.

## Data flow

1. User input is matched against registered patterns.
2. On no match, each configured engine's `react(query)` is invoked.
3. Engines call third-party APIs and render results via `ChatBot.addChatEntry`.
4. Failures invoke the optional `onEngineError(engineName, error)` hook and show an
   "unavailable" message.

## Security notes

API keys are embedded in client-side requests. Proxy through a backend in
production and inject keys server-side.
