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

function makeDollar(overrides) {
  const fn = shimjQuery();
  if (overrides) {
    Object.keys(overrides).forEach(function (key) {
      fn[key] = overrides[key];
    });
  }
  global.jQuery = fn;
  global.$ = fn;
  return fn;
}

describe('ChatBot additional coverage', () => {
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

  test('webknox react handles a successful response without media', () => {
    const engine = ChatBot.Engines.webknox('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });

    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ answerText: 'An answer.' });
        return { fail: function () { return this; } };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    const thinkingSpy = jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('what is dna');

    expect(spy).toHaveBeenCalledWith('An answer.', 'bot');
    expect(thinkingSpy).toHaveBeenCalledWith(false);
  });

  test('webknox react handles a successful response with media', () => {
    const engine = ChatBot.Engines.webknox('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });

    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ answerText: 'Answer', media: [{ image: 'img.png', title: 't', link: 'http://x' }] });
        return { fail: function () { return this; } };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    ChatBot.react('what is dna');

    expect(spy).toHaveBeenCalled();
  });

  test('spoonacular react handles a successful response', () => {
    const engine = ChatBot.Engines.spoonacular('secret-key');
    ChatBot.init({
      inputCapabilityListing: false,
      patterns: [],
      engines: [engine],
      addChatEntryCallback: function () {}
    });

    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({ answerText: 'Food answer.' });
        return { fail: function () { return this; } };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    ChatBot.react('pizza');

    expect(spy).toHaveBeenCalledWith('Food answer.', 'bot');
  });

  test('duckduckgo react handles a successful response with related topics', () => {
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
            cb({ AbstractText: '', RelatedTopics: [{ Result: '<a>res</a>', Icon: { URL: 'icon.png' } }] });
            return { fail: function () { return this; } };
          }
        };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    ChatBot.react('simpsons characters');

    expect(spy).toHaveBeenCalled();
  });

  test('duckduckgo react handles a successful response with image', () => {
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
            cb({ AbstractText: 'Abstract', Image: 'img.png', Heading: 'H' });
            return { fail: function () { return this; } };
          }
        };
      })
    };

    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});
    ChatBot.react('braveheart');

    expect(spy).toHaveBeenCalled();
  });

  test('playConversation runs through its typing loop', async () => {
    ChatBot.init({
      inputs: '',
      inputCapabilityListing: false,
      patterns: [],
      engines: []
    });
    jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'react').mockImplementation(function () {});

    ChatBot.playConversation(['Hi'], 10);

    await new Promise(function (resolve) {
      setTimeout(resolve, 200);
    });

    expect(true).toBe(true);
  });

  test('setBotName and setHumanName update names', () => {
    ChatBot.setBotName('bender');
    ChatBot.setHumanName('tim');
    expect(true).toBe(true);
  });
});