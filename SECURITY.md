# Security Policy

## Supported versions

Security fixes are applied to the latest published release. Users on older
versions should upgrade before reporting an issue that may already be fixed.

## Reporting a vulnerability

Do **not** open a public GitHub issue for a suspected vulnerability. Email
timlangeveldt@gmail.com with:

- a description of the issue and the affected version or commit,
- a minimal reproduction (a small page, payload, or test case),
- the potential impact (for example: script injection, key disclosure), and
- whether you believe the issue is publicly known.

You should receive an acknowledgement within five business days. Keep the
details private until a fix is released; we will credit reporters who wish to
be named.

## Threat model for this library

This is a client-side jQuery widget. Two boundaries carry untrusted data and
are treated as security-relevant:

1. **Third-party API responses** are untrusted. `js/sanitize.js` strips markup
   from answer text, escapes names, and only permits `http(s)` or relative URLs
   in generated attributes. `js/validate.js` rejects malformed payloads.
2. **Human input and pattern captures** are untrusted. They are escaped at the
   rendering boundary in `ChatBot.init` (keyboard input) and `ChatBot.react`
   (response templates) before being handed to `addChatEntry`, which interprets
   its `text` argument as HTML.

API keys passed to the WebKnox and Spoonacular factories are embedded in
client-side requests. They are **not secrets** once the page ships. Production
deployments must proxy those calls through a backend that injects the keys
server-side; see the "Security Notes" section of `README.md` and `.env.example`.
