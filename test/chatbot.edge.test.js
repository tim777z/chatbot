/**
 * @jest-environment jsdom
 */

const ChatBot = require('../js/chatbot.js');

function shimjQuery(options) {
  const opts = options || {};
  const fn = function () {
    return fn;
  };
  fn.attr = fn.val = fn.keyup = fn.prepend = fn.html = fn.focus =
    fn.removeAttr = fn.addClass = fn.append = fn.remove = fn.css = function () {
      return fn;
    };
  fn.size = function () {
    return opts.existingElements ? 1 : 0;
  };
  fn.offset = function () {
    return { left: 0, top: 0 };
  };
  fn.outerHeight = fn.outerWidth = function () {
    return 10;
  };
  fn.animate = function () {
    return fn;
  };
  fn.extend = Object.assign;
  global.jQuery = fn;
  global.$ = fn;
}

function init(overrides) {
  const settings = Object.assign({
    inputCapabilityListing: false,
    patterns: [],
    engines: [],
    addChatEntryCallback: function () {}
  }, overrides);
  ChatBot.init(settings);
}

describe('ChatBot edge cases', () => {
  beforeEach(() => {
    shimjQuery();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keyed engines reject an empty query', () => {
    init({ engines: [] });
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.Engines.webknox('secret-key').react('');
    ChatBot.Engines.spoonacular('secret-key').react('');

    expect(spy).toHaveBeenCalledWith('Please ask a question.', 'bot');
    expect(spy).toHaveBeenCalledTimes(2);
  });

  test('suggest URLs are exposed only by the keyed engines', () => {
    expect(ChatBot.Engines.webknox('webknox-key').getSuggestUrl()).toContain('webknox-key');
    expect(ChatBot.Engines.spoonacular('spoon-key').getSuggestUrl()).toContain('spoon-key');
    expect(ChatBot.Engines.duckduckgo().getSuggestUrl()).toBeNull();
  });

  test('addChatEntry ignores undefined text and explains empty text', () => {
    init({});
    const spy = jest.spyOn(ChatBot, 'addChatEntry');

    ChatBot.addChatEntry(undefined, 'bot');
    expect(spy).toHaveBeenCalledTimes(1);

    // Call the restored implementation for the empty-string path.
    spy.mockRestore();
    const htmlSpy = jest.fn();
    const realDollar = global.$;
    const fakeDollar = function () {
      return {
        html: htmlSpy,
        addClass: function () {},
        prepend: function () {}
      };
    };
    global.$ = fakeDollar;
    ChatBot.addChatEntry('', 'bot');
    expect(htmlSpy).toHaveBeenCalled();
    global.$ = realDollar;
    global.jQuery = realDollar;
  });

  test('rewrite patterns forward the rewritten query to engines', () => {
    const engine = { react: jest.fn(), getCapabilities: function () { return []; }, getSuggestUrl: function () { return null; } };
    init({ engines: [engine] });
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    const callback = jest.fn();
    ChatBot.addPattern(/hello (.*)/, 'rewrite', 'hi $1', callback);

    ChatBot.react('hello world');

    expect(engine.react).toHaveBeenCalledWith('hi world');
    expect(callback).toHaveBeenCalled();
  });

  test('playConversation refuses a second concurrent run', () => {
    // Suppress the typing timers entirely: this test only checks the guard.
    jest.spyOn(global, 'setTimeout').mockImplementation(function () { return 0; });
    shimjQuery();
    init({ inputs: '', inputCapabilityListing: false, patterns: [], engines: [] });
    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'react').mockImplementation(function () {});

    expect(ChatBot.playConversation(['Hi', 'Bye'], 10)).toBe(true);
    expect(ChatBot.playConversation(['Hi'], 10)).toBe(false);
  });

  test('init handles a pre-existing datalist element', () => {
    shimjQuery({ existingElements: true });
    expect(() => init({
      patterns: [{ description: 'Say "hello" to [someone]' }],
      engines: []
    })).not.toThrow();
    expect(ChatBot.getExamplePhrases()).toContain('hello');
  });

  test('engine failures without an error hook still render a message', () => {
    init({ engines: [] });
    global.$.ajax = jest.fn(function () {
      return {
        done: function () {
          return { fail: function (cb) { cb(); return this; } };
        }
      };
    });
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    init({ engines: [ChatBot.Engines.duckduckgo()] });

    ChatBot.react('anything');

    expect(spy).toHaveBeenCalledWith(expect.stringContaining('unavailable'), 'bot');
  });
});
