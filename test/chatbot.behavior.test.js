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

describe('ChatBot behavior', () => {
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

  test('produces the configured response for a matching input', () => {
    ChatBot.addPattern(/hello/i, 'response', 'Hi there!');
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(() => {});

    ChatBot.react('hello');

    expect(spy).toHaveBeenCalledWith('Hi there!', 'bot');
  });

  test('compute 2 plus 3 replies "That would be 5."', () => {
    ChatBot.addPattern(
      /compute ([0-9]+) plus ([0-9]+)/,
      'response',
      undefined,
      function (matches) {
        ChatBot.addChatEntry('That would be ' + (1 * matches[1] + 1 * matches[2]) + '.', 'bot');
      },
      'Say \'compute [number] plus [number]\' to make the bot your math monkey'
    );
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(() => {});

    ChatBot.react('compute 2 plus 3');

    expect(spy).toHaveBeenCalledWith('That would be 5.', 'bot');
  });

  test('updateCommandDescription extracts example phrases from an engine capabilities array', () => {
    const engine = {
      react: function () {},
      getCapabilities: function () {
        return ['Say "hello" to greet', 'Ask "something" else'];
      },
      getSuggestUrl: function () {
        return null;
      }
    };

    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine]
    });

    expect(ChatBot.getExamplePhrases()).toContain('hello');
    expect(ChatBot.getExamplePhrases()).toContain('something');
  });
});