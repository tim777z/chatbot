/**
 * @jest-environment jsdom
 */

const sanitize = require('../js/sanitize.js');
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
  fn.extend = Object.assign;
  global.jQuery = fn;
  global.$ = fn;
}

function initEngine(engine) {
  ChatBot.init({
    inputCapabilityListing: false,
    patterns: [],
    engines: [engine],
    addChatEntryCallback: function () {}
  });
}

describe('sanitize helpers', () => {
  test('escapeHtml encodes characters that can break out of HTML context', () => {
    expect(sanitize.escapeHtml(`<a href="x" onclick='y'>&</a>`))
      .toBe('&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
    expect(sanitize.escapeHtml(null)).toBe('');
    expect(sanitize.escapeHtml(undefined)).toBe('');
  });

  test('plainText removes markup instead of trying to allowlist it', () => {
    expect(sanitize.plainText('<script>alert(1)</script>Hello <b>world</b>'))
      .toBe('alert(1)Hello world');
    expect(sanitize.stripHtml(undefined)).toBe('');
    expect(sanitize.plainText(42)).toBe('42');
  });

  test('safeUrl rejects executable schemes and malformed URLs', () => {
    expect(sanitize.safeUrl('javascript:alert(1)')).toBe('');
    expect(sanitize.safeUrl('JaVaScRiPt:alert(1)')).toBe('');
    expect(sanitize.safeUrl('data:text/html;base64,PHNjcmlwdD4=')).toBe('');
    expect(sanitize.safeUrl('vbscript:msgbox(1)')).toBe('');
    expect(sanitize.safeUrl('//evil.example/x')).toBe('');
    expect(sanitize.safeUrl('java\\script:alert(1)')).toBe('');
    expect(sanitize.safeUrl('https://x.example/a\u0000b')).toBe('');
    expect(sanitize.safeUrl(null)).toBe('');
    expect(sanitize.safeUrl('')).toBe('');
  });

  test('safeUrl keeps http(s) and relative URLs and escapes ampersands', () => {
    expect(sanitize.safeUrl('https://x.example/a?b=1')).toBe('https://x.example/a?b=1');
    expect(sanitize.safeUrl('http://x.example')).toBe('http://x.example');
    expect(sanitize.safeUrl('icon.png')).toBe('icon.png');
    expect(sanitize.safeUrl('/img/a.png')).toBe('/img/a.png');
    expect(sanitize.safeUrl('https://x.example/?a=1&b=2'))
      .toBe('https://x.example/?a=1&amp;b=2');
    expect(sanitize.safeUrl('https://x.example/"onload="x')).toBe('');
  });

  test('mediaMarkup escapes titles and never emits attacker-controlled handlers', () => {
    expect(sanitize.mediaMarkup(null)).toBe('');
    expect(sanitize.mediaMarkup([{}])).toBe('');

    const html = sanitize.mediaMarkup([{
      image: 'javascript:alert(1)',
      link: 'https://example.test/details',
      title: '<img src=x onerror="alert(1)">Title'
    }]);

    expect(html).not.toContain('javascript:');
    expect(html).not.toContain('onerror');
    expect(html).not.toContain('<img src=x');
    expect(html).toContain('href="https://example.test/details"');
    expect(html).toContain('rel="noopener noreferrer"');
    expect(html).toContain('>Title</div>');
  });
});

describe('engine response rendering', () => {
  beforeEach(() => {
    shimjQuery();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('webknox does not render injected markup from answer or media', () => {
    initEngine(ChatBot.Engines.webknox('secret-key'));
    global.$ = {
      get: jest.fn(function (url, cb) {
        cb({
          answerText: '<script>alert(1)</script>Safe answer',
          media: [{
            image: 'x" onerror="alert(1)',
            title: '<b onclick="alert(1)">Title</b>',
            link: 'javascript:alert(1)'
          }]
        });
        return { fail: function () { return this; } };
      })
    };
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('question');

    const rendered = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(rendered).toContain('Safe answer');
    expect(rendered).not.toContain('<script');
    expect(rendered).not.toContain('javascript:');
    expect(rendered).not.toContain('onerror');
    expect(rendered).not.toContain('onclick="alert');
  });

  test('duckduckgo strips markup from related topics and rejects unsafe icon URLs', () => {
    initEngine(ChatBot.Engines.duckduckgo());
    global.$ = {
      ajax: jest.fn(function () {
        return {
          done: function (cb) {
            cb({
              AbstractText: '',
              RelatedTopics: [{
                Result: '<img src=x onerror="alert(1)">A safe answer',
                Icon: { URL: 'javascript:alert(1)' }
              }]
            });
            return { fail: function () { return this; } };
          }
        };
      })
    };
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('question');

    const rendered = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(rendered).toContain('A safe answer');
    expect(rendered).not.toContain('onerror');
    expect(rendered).not.toContain('javascript:');
  });

  test('duckduckgo with no AbstractText does not render the string undefined', () => {
    initEngine(ChatBot.Engines.duckduckgo());
    global.$ = {
      ajax: jest.fn(function () {
        return {
          done: function (cb) {
            cb({ AbstractText: undefined, Image: 'javascript:alert(1)', Heading: '<b>x</b>' });
            return { fail: function () { return this; } };
          }
        };
      })
    };
    const spy = jest.spyOn(ChatBot, 'addChatEntry').mockImplementation(function () {});
    jest.spyOn(ChatBot, 'thinking').mockImplementation(function () {});

    ChatBot.react('question');

    const rendered = spy.mock.calls[spy.mock.calls.length - 1][0];
    expect(rendered).toBe('');
    expect(rendered).not.toContain('undefined');
    expect(rendered).not.toContain('javascript:');
  });
});
