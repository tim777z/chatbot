/**
 * @jest-environment jsdom
 */

const ChatBot = require('../js/chatbot.js');

// Minimal jQuery shim that records the keyup handler registered by init().
function shimjQuery(inputValue) {
  const el = {
    val: function (value) {
      if (arguments.length > 0) {
        inputValue = value;
        return el;
      }
      return inputValue;
    },
    keyup: function (handler) {
      shimjQuery.keyupHandler = handler;
      return el;
    },
    attr: function () { return el; },
    removeAttr: function () { return el; },
    focus: function () { return el; },
    prepend: function () { return el; },
    append: function () { return el; },
    addClass: function () { return el; },
    html: function () { return el; },
    size: function () { return 0; }
  };
  const dollar = function () { return el; };
  dollar.extend = Object.assign;
  global.jQuery = dollar;
  global.$ = dollar;
  return el;
}

function makeEngine(react) {
  return {
    react: react || function () {},
    getCapabilities: function () { return []; },
    getSuggestUrl: function () { return null; }
  };
}

describe('untrusted input is escaped at the HTML rendering boundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('keyboard input is escaped before addChatEntry but sent raw to engines', () => {
    const payload = '<img src=x onerror="alert(1)">';
    const el = shimjQuery(payload);
    const engine = makeEngine(jest.fn());
    ChatBot.init({
      inputs: '#humanInput',
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });
    const entrySpy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(() => {});

    shimjQuery.keyupHandler.call(el, { keyCode: 13 });

    expect(entrySpy).toHaveBeenCalledTimes(1);
    const rendered = entrySpy.mock.calls[0][0];
    // The payload is preserved as inert text: no tag is opened and no
    // attribute is created, only HTML entities are present.
    expect(rendered).toBe('&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
    expect(rendered).not.toContain('<img');
    expect(engine.react).toHaveBeenCalledWith(payload);
  });

  test('user captures in response templates are escaped before rendering', () => {
    shimjQuery('');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [],
      addChatEntryCallback: function () {}
    });
    ChatBot.addPattern(/(?:my name is) (.*)/i, 'response', 'Hi $1!');
    const entrySpy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(() => {});

    ChatBot.react('my name is <script>alert(1)</script>');

    const rendered = entrySpy.mock.calls[entrySpy.mock.calls.length - 1][0];
    expect(rendered).toContain('Hi &lt;script&gt;alert(1)&lt;/script&gt;!');
    expect(rendered).not.toContain('<script>');
  });

  test('capture substitution does not reinterpret $-sequences', () => {
    shimjQuery('');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [],
      addChatEntryCallback: function () {}
    });
    ChatBot.addPattern(/^(.*)$/i, 'response', 'Value: $1');
    const entrySpy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(() => {});

    ChatBot.react('x$&y');

    expect(entrySpy).toHaveBeenCalledWith('Value: x$&amp;y', 'bot');
  });

  test('rewrite captures are not HTML-escaped so engine queries stay intact', () => {
    shimjQuery('');
    const engine = makeEngine(jest.fn());
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });
    ChatBot.addPattern(/^(.*)$/i, 'rewrite', '$1');

    ChatBot.react('AT&T <b>');

    expect(engine.react).toHaveBeenCalledWith('AT&T <b>');
  });
});
