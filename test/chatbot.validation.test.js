/**
 * @jest-environment jsdom
 */

const { validateApiResponse } = require('../js/validate.js');

describe('validateApiResponse', () => {
  test('returns false for null/undefined/non-object payloads', () => {
    expect(validateApiResponse(null, ['a'])).toBe(false);
    expect(validateApiResponse(undefined, ['a'])).toBe(false);
    expect(validateApiResponse('str', ['a'])).toBe(false);
    expect(validateApiResponse(42, ['a'])).toBe(false);
  });

  test('returns true when no required fields are given', () => {
    expect(validateApiResponse({}, [])).toBe(true);
    expect(validateApiResponse({ a: 1 }, [])).toBe(true);
  });

  test('returns true when all required fields are present', () => {
    expect(validateApiResponse({ answerText: 'hi' }, ['answerText'])).toBe(true);
    expect(validateApiResponse({ answerText: '' }, ['answerText'])).toBe(true);
  });

  test('returns false when a required field is missing or null', () => {
    expect(validateApiResponse({ foo: 'bar' }, ['answerText'])).toBe(false);
    expect(validateApiResponse({ answerText: null }, ['answerText'])).toBe(false);
    expect(validateApiResponse({ answerText: undefined }, ['answerText'])).toBe(false);
  });

  test('treats non-array requiredFields as "no constraints"', () => {
    expect(validateApiResponse({ a: 1 }, null)).toBe(true);
  });
});
