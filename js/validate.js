/* global globalThis */
(function (global) {
    "use strict";

    /**
     * Reject malformed API payloads before any value reaches the renderer.
     * @param {*} payload Parsed response body.
     * @param {string[]} [requiredFields] Fields that must be own, non-null properties.
     * @param {Object<string, string>} [fieldTypes] Expected primitive type per
     *   field ("string", "number", "object" or "array"). Fields that are absent
     *   or null are treated as optional, so this can describe partial payloads.
     * @returns {boolean} True when the payload satisfies every supplied constraint.
     */
    function validateApiResponse(payload, requiredFields, fieldTypes) {
        if (payload === null || payload === undefined) {
            return false;
        }
        if (typeof payload !== "object") {
            return false;
        }
        if (Array.isArray(requiredFields)) {
            var allRequiredPresent = requiredFields.every(function (field) {
                // hasOwnProperty blocks inherited properties (e.g. "constructor")
                // from satisfying a required-field check.
                return Object.prototype.hasOwnProperty.call(payload, field) &&
                    payload[field] !== null && payload[field] !== undefined;
            });
            if (!allRequiredPresent) {
                return false;
            }
        }
        if (!fieldTypes || typeof fieldTypes !== "object") {
            return true;
        }
        return Object.keys(fieldTypes).every(function (field) {
            var value = payload[field];
            if (value === null || value === undefined) {
                return true;
            }
            var expected = fieldTypes[field];
            if (expected === "array") {
                return Array.isArray(value);
            }
            if (expected === "object") {
                return typeof value === "object" && !Array.isArray(value);
            }
            return typeof value === expected;
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
