/**
 * @jest-environment jsdom
 */

const ChatBot = require('../js/chatbot.js');

function shimjQuery() {
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
  global.jQuery = fn;
  global.$ = fn;
}

describe('ChatBot engine error handling', () => {
  beforeEach(() => {
    shimjQuery();
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [],
      addChatEntryCallback: function () {}
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('webknox factory throws when apiKey is missing', () => {
    expect(function () {
      ChatBot.Engines.webknox();
    }).toThrow(/API key/);
    expect(function () {
      ChatBot.Engines.webknox('');
    }).toThrow(/API key/);
  });

  test('spoonacular factory throws when apiKey is missing', () => {
    expect(function () {
      ChatBot.Engines.spoonacular();
    }).toThrow(/API key/);
  });

  test('a failed webknox ajax call turns thinking off and adds an error entry', () => {
    const engine = ChatBot.Engines.webknox('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
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

    const chatSpy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    const thinkingSpy = jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('hello');

    expect(thinkingSpy).toHaveBeenCalledWith(false);
    expect(chatSpy).toHaveBeenCalledWith(expect.stringContaining('unavailable'), 'bot');
  });

  test('a failed duckduckgo ajax call turns thinking off and adds an error entry', () => {
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

    const chatSpy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    const thinkingSpy = jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('where is china');

    expect(thinkingSpy).toHaveBeenCalledWith(false);
    expect(chatSpy).toHaveBeenCalledWith(expect.stringContaining('unavailable'), 'bot');
  });
});