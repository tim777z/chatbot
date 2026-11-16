/**
 * @jest-environment jsdom
 */

const ChatBot = require('../js/chatbot.js');

function shimjQuery() {
  const fn = function () {
    return fn;
  };
  fn.attr = fn.val = fn.keyup = fn.prepend = fn.html = fn.focus =
    fn.removeAttr = fn.addClass = fn.append = fn.remove = fn.css = function () {
      return fn;
    };
  fn.size = function () {
    return 0;
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
  return fn;
}

describe('ChatBot onEngineError hook', () => {
  beforeEach(() => {
    shimjQuery();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('webknox fail invokes onEngineError with engine name', () => {
    const onEngineError = jest.fn();
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [],
      addChatEntryCallback: function () {},
      onEngineError: onEngineError
    });
    const engine = ChatBot.Engines.webknox('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {},
      onEngineError: onEngineError
    });

    global.$ = {
      get: jest.fn(function () {
        return {
          fail: function (cb) {
            cb();
            return this;
          }
        };
      })
    };

    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('hello');

    expect(onEngineError).toHaveBeenCalledWith('webknox', expect.anything());
  });

  test('duckduckgo fail invokes onEngineError with engine name', () => {
    const onEngineError = jest.fn();
    const engine = ChatBot.Engines.duckduckgo();
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {},
      onEngineError: onEngineError
    });

    global.$ = {
      ajax: jest.fn(function () {
        return {
          done: function () {
            return {
              fail: function (cb) {
                cb();
                return this;
              }
            };
          }
        };
      })
    };

    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('where is china');

    expect(onEngineError).toHaveBeenCalledWith('duckduckgo', expect.anything());
  });

  test('malformed webknox payload invokes onEngineError and does not throw', () => {
    const onEngineError = jest.fn();
    const engine = ChatBot.Engines.webknox('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {},
      onEngineError: onEngineError
    });

    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ foo: 'bar' });
        return { fail: function () { return this; } };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    expect(() => ChatBot.react('hello')).not.toThrow();
    expect(onEngineError).toHaveBeenCalledWith('webknox', expect.anything());
    expect(spy).toHaveBeenCalledWith(expect.stringContaining('could not understand'), 'bot');
  });

  test('malformed duckduckgo payload does not throw', () => {
    const engine = ChatBot.Engines.duckduckgo();
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });

    global.$ = {
      ajax: jest.fn(function () {
        return {
          done: function (cb) {
            cb(null);
            return { fail: function () { return this; } };
          }
        };
      })
    };

    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    expect(() => ChatBot.react('braveheart')).not.toThrow();
  });
});
