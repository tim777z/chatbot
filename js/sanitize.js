/* global globalThis */
/*
 * Defensive rendering helpers for data that comes from third-party APIs or
 * from host-page configuration. The chatbot renders engine responses as HTML,
 * so untrusted strings must never be interpolated into markup unescaped.
 */
(function (global) {
    "use strict";

    /**
     * Encode a value for safe interpolation into HTML text or attributes.
     * @param {*} value Any value; null and undefined render as an empty string.
     * @returns {string}
     */
    function escapeHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    // Engine answers are plain text. Drop any tag-like sequence rather than
    // trying to maintain a fragile HTML allowlist, then escape what remains.
    /**
     * Remove markup-like sequences from untrusted text.
     * @param {*} value
     * @returns {string}
     */
    function stripHtml(value) {
        if (value === null || value === undefined) {
            return '';
        }
        return String(value).replace(/<[^>]*>/g, '');
    }

    /**
     * Strip markup and HTML-escape the remainder for rendering as text.
     * @param {*} value
     * @returns {string}
     */
    function plainText(value) {
        return escapeHtml(stripHtml(value));
    }

    /**
     * @param {string} value
     * @returns {boolean}
     */
    function hasControlCharacters(value) {
        for (var i = 0; i < value.length; i++) {
            var code = value.charCodeAt(i);
            if (code <= 31 || code === 127) {
                return true;
            }
        }
        return false;
    }

    /*
     * Accept only absolute http(s) URLs and simple relative paths. Rejecting
     * other schemes blocks javascript:, data: and vbscript: payloads placed in
     * href/src attributes by a compromised or malicious API response.
     */
    /**
     * Return a URL whose scheme is http(s) or relative, escaped for an
     * attribute. Returns an empty string for anything else.
     * @param {*} value
     * @returns {string}
     */
    function safeUrl(value) {
        if (typeof value !== 'string') {
            return '';
        }
        var trimmed = value.replace(/^\s+|\s+$/g, '');
        // Quotes, angle brackets and backslashes have no place in a URL and are
        // the classic way to break out of an HTML attribute or obfuscate a
        // scheme, so reject them outright instead of merely escaping them.
        if (trimmed === '' || hasControlCharacters(trimmed) || /[\\"'<>]/.test(trimmed)) {
            return '';
        }
        var match = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed);
        if (match) {
            var scheme = match[1].toLowerCase();
            if (scheme !== 'http' && scheme !== 'https') {
                return '';
            }
        } else if (trimmed.indexOf('//') === 0) {
            // Protocol-relative URLs inherit whichever scheme the page uses.
            return '';
        }
        return escapeHtml(trimmed);
    }

    // Build media cards from validated pieces: no raw API string is inserted
    // into an attribute or as inline JavaScript.
    /**
     * Build HTML cards from validated image/link/title pieces.
     * @param {*} items Expected to be an array of media objects.
     * @returns {string}
     */
    function mediaMarkup(items) {
        if (!Array.isArray(items)) {
            return '';
        }
        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i] || {};
            var image = safeUrl(item.image);
            var link = safeUrl(item.link);
            var title = plainText(item.title);
            if (image === '' && link === '' && title === '') {
                continue;
            }

            html += '<div class="imgBox">';
            if (image !== '') {
                html += '<img src="' + image + '" alt="" />';
            }
            if (title !== '') {
                html += '<div class="title">' + title + '</div>';
            }
            html += '<div class="actions">';
            if (link !== '') {
                html += '<a class="button blue" href="' + link +
                    '" target="_blank" rel="noopener noreferrer">Details</a><br>';
            }
            // The index is generated locally, so this inline handler carries
            // no untrusted data.
            html += '<div class="button blue" onclick=" ChatBot.addChatEntry(\'more like number ' +
                (i + 1) + '\',\'human\');ChatBot.react(\'more like ' + (i + 1) + '\');">More like this</div>';
            html += '</div></div>';
        }
        return html;
    }

    var api = {
        escapeHtml: escapeHtml,
        stripHtml: stripHtml,
        plainText: plainText,
        safeUrl: safeUrl,
        mediaMarkup: mediaMarkup
    };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    if (global) {
        global.ChatBotSanitize = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : (typeof global !== "undefined" ? global : this));
