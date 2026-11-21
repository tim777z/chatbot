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

  test('required fields must be own properties, not inherited ones', () => {
    expect(validateApiResponse({}, ['constructor'])).toBe(false);
    expect(validateApiResponse({}, ['toString'])).toBe(false);
    expect(validateApiResponse({ answerText: 'hi' }, ['answerText'])).toBe(true);
  });

  test('optional field type expectations reject wrong shapes but allow absent fields', () => {
    expect(validateApiResponse({ answerText: 42 }, ['answerText'], { answerText: 'string' }))
      .toBe(false);
    expect(validateApiResponse({ answerText: 'hi' }, ['answerText'], { answerText: 'string' }))
      .toBe(true);
    expect(validateApiResponse({ RelatedTopics: [] }, [], { RelatedTopics: 'array' }))
      .toBe(true);
    expect(validateApiResponse({ RelatedTopics: {} }, [], { RelatedTopics: 'array' }))
      .toBe(false);
    expect(validateApiResponse({ RelatedTopics: null }, [], { RelatedTopics: 'array' }))
      .toBe(true);
    expect(validateApiResponse({ Image: 7 }, [], { Image: 'string' }))
      .toBe(false);
  });
});
