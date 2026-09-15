/**
 * @jest-environment jsdom
 */

const fs = require('fs');
const path = require('path');

const $ = require('jquery');

let ChatBot;

beforeAll(() => {
  // The library expects jQuery to be available globally.
  global.$ = $;
  global.jQuery = $;

  // Set up the DOM elements the library reads and writes.
  document.body.innerHTML = `
    <div id="chatBotCommandDescription"></div>
    <input id="humanInput" type="text" />
    <div id="chatBot">
      <div id="chatBotThinkingIndicator"></div>
      <div id="chatBotHistory"></div>
    </div>
  `;

  // Load the library the way a browser <script> tag would: evaluating it in
  // the jsdom window makes the top-level `var ChatBot` a property of window.
  const chatbotSrc = fs.readFileSync(path.join(__dirname, '../js/chatbot.js'), 'utf8');
  window.eval(chatbotSrc);
  ChatBot = window.ChatBot;
});

afterEach(() => {
  // Reset the DOM between tests so history and descriptions do not leak.
  $('#chatBotHistory').empty();
  $('#chatBotCommandDescription').empty();
  $('#chatBotCommands').remove();
  $('#humanInput').val('');
  $('#humanInput').removeAttr('disabled');
  jest.restoreAllMocks();
});

function makeEngine(overrides) {
  return Object.assign(
    {
      react: jest.fn(),
      getCapabilities: jest.fn(() => []),
      getSuggestUrl: jest.fn(() => null)
    },
    overrides
  );
}

describe('ChatBot.addPattern + react', () => {
  test('a registered response pattern triggers the response callback with substituted matches', () => {
    const callback = jest.fn();
    ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });
    ChatBot.addPattern(
      "(?:my name is|I'm|I am) (.*)",
      'response',
      'hi $1, thanks for talking to me today',
      callback,
      "Say 'My name is [name]' to be called by your name."
    );

    ChatBot.react('my name is Fry');

    expect($('#chatBotHistory').text()).toContain('hi Fry, thanks for talking to me today');
    // String.match() arrays carry extra properties (index, input), so compare elements only.
    expect(callback).toHaveBeenCalledWith(expect.arrayContaining(['my name is Fry', 'Fry']));
  });
});

describe('ChatBot.updateCommandDescription', () => {
  test('renders pattern and engine capability descriptions as HTML', () => {
    const engine = makeEngine({
      getCapabilities: () => ["Ask for recipes like 'chicken recipes'."]
    });
    ChatBot.init({ inputs: '#humanInput', engines: [engine], patterns: [] });
    ChatBot.addPattern('^hi$', 'response', 'Howdy', undefined, "Say 'Hi' to be greeted.");

    const html = $('#chatBotCommandDescription').html();
    expect(html).toContain('<div class="commandDescription">');
    expect(html).toContain('<span class="phraseHighlight">\'Hi\'</span>');
    expect(html).toContain('<span class="phraseHighlight">\'chicken recipes\'</span>');

    const optionValues = $('#chatBotCommands option')
      .map(function () {
        return $(this).attr('value');
      })
      .get();
    expect(optionValues).toContain('Hi');
    expect(optionValues).toContain('chicken recipes');
  });
});

describe('ChatBot.react', () => {
  test('rewrites the query via a rewrite pattern before dispatching to engines', () => {
    const engine = makeEngine();
    ChatBot.init({ inputs: '#humanInput', engines: [engine], patterns: [] });
    ChatBot.addPattern('^translate (.*)$', 'rewrite', 'What is $1 in German?');

    ChatBot.react('translate dog');

    expect(engine.react).toHaveBeenCalledWith('What is dog in German?');
  });

  test('dispatches the original query to all engines when no pattern matches', () => {
    const engineA = makeEngine();
    const engineB = makeEngine();
    ChatBot.init({ inputs: '#humanInput', engines: [engineA, engineB], patterns: [] });

    ChatBot.react('hello world');

    expect(engineA.react).toHaveBeenCalledWith('hello world');
    expect(engineB.react).toHaveBeenCalledWith('hello world');
  });

  test('does not dispatch empty queries to engines and shows a validation message', () => {
    const engine = makeEngine();
    ChatBot.init({ inputs: '#humanInput', engines: [engine], patterns: [] });

    ChatBot.react('   ');

    expect(engine.react).not.toHaveBeenCalled();
    expect($('#chatBotHistory').text()).toContain('Please type a question first.');
  });
});

describe('ChatBot.validateQuery', () => {
  test('rejects empty and whitespace-only queries', () => {
    expect(ChatBot.validateQuery('')).toBe('Please type a question first.');
    expect(ChatBot.validateQuery('   ')).toBe('Please type a question first.');
    expect(ChatBot.validateQuery(undefined)).toBe('Please type a question first.');
  });

  test('rejects overly long queries', () => {
    expect(ChatBot.validateQuery('a'.repeat(501))).toBe(
      'Sorry, that question is too long. Please shorten it.'
    );
  });

  test('accepts valid queries', () => {
    expect(ChatBot.validateQuery('What is the capital of France?')).toBeNull();
    expect(ChatBot.validateQuery('a'.repeat(500))).toBeNull();
  });
});

describe('engine API calls', () => {
  test('webknox engine renders the answer from a successful response', () => {
    jest.spyOn($, 'get').mockImplementation((url, success) => {
      success({ answerText: '42' });
      return { fail: () => {} };
    });
    ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });

    ChatBot.Engines.webknox('test-key').react('what is the answer?');

    expect($('#chatBotHistory').text()).toContain('42');
  });

  test('webknox engine shows an error message when the request fails', () => {
    jest.spyOn($, 'get').mockReturnValue({
      fail: (callback) => {
        callback({ status: 500 });
        return this;
      }
    });
    ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });

    ChatBot.Engines.webknox('test-key').react('what is the answer?');

    expect($('#chatBotHistory').text()).toContain(
      'Sorry, I could not reach the WebKnox service. Please try again.'
    );
  });

  test('duckduckgo engine shows an error message when the request fails', () => {
    jest.spyOn($, 'ajax').mockReturnValue({
      done: () => ({
        fail: (callback) => {
          callback({ status: 500 });
        }
      })
    });
    ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });

    ChatBot.Engines.duckduckgo().react('what is DNA?');

    expect($('#chatBotHistory').text()).toContain(
      'Sorry, I could not reach the DuckDuckGo service. Please try again.'
    );
  });
});

describe('ChatBot.addChatEntry', () => {
  test('falls back to a default message for empty text', () => {
    ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });

    ChatBot.addChatEntry('', 'bot');

    expect($('#chatBotHistory').text()).toContain('Sorry, I have no idea.');
  });
});

describe('ChatBot.playConversation', () => {
  test('returns false while a sample conversation is already running', () => {
    jest.useFakeTimers();
    try {
      ChatBot.init({ inputs: '#humanInput', engines: [], patterns: [] });

      expect(ChatBot.playConversation(['Hi'], 1)).toBe(true);
      expect(ChatBot.playConversation(['Hi'], 1)).toBe(false);
    } finally {
      jest.useRealTimers();
    }
  });
});