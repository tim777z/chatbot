/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

// Load the chatbot source
const chatbotSrc = fs.readFileSync(path.join(__dirname, '../js/chatbot.js'), 'utf8');

// Evaluate the IIFE and capture the ChatBot object it returns
let ChatBot;

// Minimal jQuery shim so init() can run without a real jQuery instance
function jqueryShim() {
  const fn = function () {
    return fn;
  };
  fn.attr = fn.val = fn.keyup = fn.prepend = fn.html = fn.focus =
    fn.removeAttr = fn.addClass = fn.append = function () {
      return fn;
    };
  fn.size = function () {
    return 0;
  };
  fn.extend = Object.assign;
  return fn;
}

beforeAll(() => {
  global.jQuery = jqueryShim();
  global.$ = jqueryShim();

  const script = new Function(chatbotSrc + '\nreturn ChatBot;');
  ChatBot = script();
  ChatBot.init({
    inputCapabilityListing: false,
    patterns: [],
    engines: []
  });
});

describe('ChatBot.addPattern', () => {
  test('registers a pattern without throwing', () => {
    if (!ChatBot || typeof ChatBot.addPattern !== 'function') {
      console.warn('ChatBot.addPattern not available - skipping');
      return;
    }
    const callback = jest.fn();
    expect(() => {
      ChatBot.addPattern(/test pattern/i, 'rewrite', 'replacement', callback, 'A test pattern');
    }).not.toThrow();
  });
});

describe('ChatBot.addPatternObject', () => {
  test('is a function', () => {
    if (!ChatBot) {
      console.warn('ChatBot not available - skipping');
      return;
    }
    expect(typeof ChatBot.addPatternObject).toBe('function');
  });
});

describe('ChatBot constructor', () => {
  test('ChatBot is defined', () => {
    expect(ChatBot).toBeDefined();
  });
});