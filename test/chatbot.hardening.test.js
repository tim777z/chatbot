/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');
const ChatBot = require('../js/chatbot.js');

const chatbotSrc = fs.readFileSync(path.join(__dirname, '../js/chatbot.js'), 'utf8');

function makeJQuery() {
  const htmlCalls = [];
  const selectors = [];
  const el = {
    size: function () { return 0; },
    html: function (value) {
      if (value !== undefined) { htmlCalls.push(value); }
      return el;
    },
    attr: function () { return el; },
    append: function () { return el; },
    keyup: function () { return el; },
    val: function () { return ''; },
    removeAttr: function () { return el; },
    focus: function () { return el; },
    prepend: function () { return el; },
    addClass: function () { return el; }
  };
  const dollar = function (selector) {
    selectors.push(selector);
    return el;
  };
  dollar.extend = Object.assign;
  return { dollar: dollar, htmlCalls: htmlCalls, selectors: selectors };
}

function installJQuery(jq) {
  global.$ = jq.dollar;
  global.jQuery = jq.dollar;
}

function makeEngine(overrides) {
  return Object.assign({
    react: function () {},
    getCapabilities: function () { return []; },
    getSuggestUrl: function () { return null; }
  }, overrides);
}

describe('security hardening at the rendering and configuration boundaries', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    delete global.validateApiResponse;
  });

  test('a missing validator fails closed instead of silently disabling validation', () => {
    const jq = makeJQuery();
    installJQuery(jq);

    // Evaluate a copy of the widget with no CommonJS require and no global
    // validator: that is the browser case where validate.js was not loaded.
    const savedRequire = global.require;
    const savedValidator = global.validateApiResponse;
    let isolatedBot;
    global.require = undefined;
    global.validateApiResponse = undefined;
    try {
      isolatedBot = new Function(chatbotSrc + '\nreturn ChatBot;')();
    } finally {
      global.require = savedRequire;
      if (savedValidator === undefined) {
        delete global.validateApiResponse;
      } else {
        global.validateApiResponse = savedValidator;
      }
    }

    const onEngineError = jest.fn();
    isolatedBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [isolatedBot.Engines.webknox('key')],
      addChatEntryCallback: function () {},
      onEngineError: onEngineError
    });

    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ answerText: 'a well-formed answer' });
        return { fail: function () { return this; } };
      })
    };
    const entrySpy = jest.spyOn(isolatedBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(isolatedBot, 'thinking').mockImplementation(function () {});

    isolatedBot.react('question');

    expect(entrySpy).toHaveBeenCalledWith(
      expect.stringContaining('could not understand'), 'bot');
    expect(onEngineError).toHaveBeenCalledWith('webknox', expect.anything());
  });

  test('capability text from patterns and engines cannot inject HTML', () => {
    const jq = makeJQuery();
    installJQuery(jq);
    const payload = '<img src=x onerror=alert(1)>';

    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [{ description: 'Say "' + payload + '" to [test]' }],
      engines: [makeEngine({
        getCapabilities: function () { return ['Try "' + payload + '" here']; }
      })],
      addChatEntryCallback: function () {}
    });

    const html = jq.htmlCalls[jq.htmlCalls.length - 1];
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img src=x onerror=alert(1)&gt;');
    // Quotes remain so the phrase highlighter still extracts examples.
    expect(ChatBot.getExamplePhrases().join(' ')).toContain('&lt;img');
  });

  test('API keys are URL-encoded in request and suggest URLs', () => {
    const engine = ChatBot.Engines.webknox('key&inject=1');
    expect(engine.getSuggestUrl()).toContain('mashape-key=key%26inject%3D1&query=');

    const jq = makeJQuery();
    installJQuery(jq);
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });
    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ answerText: 'ok' });
        return { fail: function () { return this; } };
      })
    };
    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('question');

    expect(global.$.get.mock.calls[0][0]).toContain(
      'mashape-key=key%26inject%3D1&contextId=');
  });

  test('origin cannot break out of the chat entry class attribute', () => {
    const jq = makeJQuery();
    installJQuery(jq);
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [],
      addChatEntryCallback: function () {}
    });
    jq.selectors.length = 0;

    ChatBot.addChatEntry('safe text', 'bot" onmouseover="alert(1)');

    expect(jq.selectors.join(' ')).not.toContain('onmouseover="alert(1)"');
    expect(jq.selectors.join(' ')).toContain('bot&quot; onmouseover=&quot;alert(1)');
  });
});
