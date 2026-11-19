/* global globalThis */
(function (global) {
    "use strict";

    /**
     * Reject malformed API payloads before any value reaches the renderer.
     * @param {*} payload Parsed response body.
     * @param {string[]} [requiredFields] Fields that must be present and non-null.
     * @returns {boolean} True when the payload is an object with all required fields.
     */
    function validateApiResponse(payload, requiredFields) {
        if (payload === null || payload === undefined) {
            return false;
        }
        if (typeof payload !== "object") {
            return false;
        }
        if (!Array.isArray(requiredFields)) {
            return true;
        }
        return requiredFields.every(function (field) {
            return payload[field] !== null && payload[field] !== undefined;
        });
    }

    var api = { validateApiResponse: validateApiResponse };

    if (typeof module !== "undefined" && module.exports) {
        module.exports = api;
    }

    if (global) {
        global.validateApiResponse = validateApiResponse;
        global.ChatBotValidate = api;
    }
})(typeof globalThis !== "undefined" ? globalThis : (typeof global !== "undefined" ? global : this));
