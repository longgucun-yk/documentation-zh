(function () {
  'use strict';

  // ── Configuration ──────────────────────────────────────────────────────────
  var API_URL    = 'https://formation-showing-travelers-port.trycloudflare.com/v1/ask';
  var API_KEY    = 'a345b897dda27088135608941122a2ab4362b03c2635bd92eff150c839151a57';
  var ORIGIN_RE  = /https?:\/\/tronprotocol\.github\.io\/documentation-zh/g;
  var FORK_ORIGIN = 'https://longgucun-yk.github.io/documentation-zh';

  // ── State ──────────────────────────────────────────────────────────────────
  var sessionId = generateUUID();
  var isLoading = false;

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  // ── CSS ────────────────────────────────────────────────────────────────────
  var CSS = [
    '#qa-btn{position:fixed;bottom:24px;right:24px;z-index:9998;background:#ec0b2a;color:#fff;',
    'border:none;border-radius:24px;padding:11px 18px;font-size:14px;font-weight:600;cursor:pointer;',
    'display:flex;align-items:center;gap:7px;box-shadow:0 4px 16px rgba(236,11,42,.35);',
    'transition:transform .15s,box-shadow .15s;font-family:Roboto,sans-serif;}',
    '#qa-btn:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(236,11,42,.45);}',

    '#qa-overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:9999;}',
    '#qa-overlay.open{display:block;}',

    '#qa-panel{position:fixed;top:0;right:0;bottom:0;width:50vw;max-width:100vw;',
    'background:#fff;z-index:10000;display:flex;flex-direction:column;',
    'transform:translateX(100%);transition:transform .28s cubic-bezier(.4,0,.2,1);',
    'box-shadow:-4px 0 28px rgba(0,0,0,.18);font-family:Roboto,sans-serif;}',
    '#qa-panel.open{transform:translateX(0);}',
    '@media(max-width:768px){#qa-panel{width:100vw;}}',

    '#qa-header{display:flex;align-items:center;justify-content:space-between;',
    'padding:15px 18px;background:#ec0b2a;color:#fff;flex-shrink:0;}',
    '#qa-header h3{margin:0;font-size:15px;font-weight:600;display:flex;align-items:center;gap:7px;}',
    '#qa-close{background:none;border:none;color:#fff;font-size:22px;cursor:pointer;',
    'padding:0 2px;line-height:1;opacity:.85;}',
    '#qa-close:hover{opacity:1;}',

    '#qa-messages{flex:1;overflow-y:auto;padding:18px;display:flex;flex-direction:column;gap:14px;}',

    '.qa-msg{max-width:90%;line-height:1.65;font-size:14px;}',
    '.qa-msg.user{align-self:flex-end;background:#ec0b2a;color:#fff;',
    'padding:10px 14px;border-radius:16px 16px 4px 16px;}',
    '.qa-msg.bot{align-self:flex-start;background:#f4f4f4;color:#1a1a1a;',
    'padding:12px 14px;border-radius:4px 16px 16px 16px;}',
    '.qa-msg.bot p{margin:0 0 8px;}.qa-msg.bot p:last-child{margin-bottom:0;}',
    '.qa-msg.bot ul{margin:4px 0 8px;padding-left:18px;}',
    '.qa-msg.bot li{margin-bottom:2px;}',
    '.qa-msg.bot a{color:#ec0b2a;}',
    '.qa-msg.bot code{background:#e4e4e4;padding:1px 5px;border-radius:3px;',
    'font-size:12.5px;font-family:"Roboto Mono",monospace;}',
    '.qa-msg.bot pre{background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:6px;',
    'overflow-x:auto;font-size:12px;margin:8px 0;}',
    '.qa-msg.bot pre code{background:none;padding:0;color:inherit;}',

    '.qa-sources{margin-top:8px;padding-top:8px;border-top:1px solid #e0e0e0;',
    'font-size:12px;color:#888;}',
    '.qa-sources span{display:inline-block;background:#ececec;border-radius:3px;',
    'padding:1px 7px;margin:2px 3px 2px 0;}',

    '.qa-typing{align-self:flex-start;display:flex;gap:5px;',
    'padding:12px 14px;background:#f4f4f4;border-radius:4px 16px 16px 16px;}',
    '.qa-typing span{width:7px;height:7px;background:#bbb;border-radius:50%;',
    'animation:qa-bounce 1.2s infinite;}',
    '.qa-typing span:nth-child(2){animation-delay:.2s;}',
    '.qa-typing span:nth-child(3){animation-delay:.4s;}',
    '@keyframes qa-bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)}}',

    '#qa-input-area{display:flex;gap:8px;padding:14px 16px;',
    'border-top:1px solid #eee;flex-shrink:0;align-items:flex-end;}',
    '#qa-input{flex:1;border:1px solid #ddd;border-radius:8px;padding:9px 12px;',
    'font-size:14px;font-family:Roboto,sans-serif;resize:none;max-height:120px;',
    'outline:none;line-height:1.5;color:#1a1a1a;}',
    '#qa-input:focus{border-color:#ec0b2a;}',
    '#qa-send{background:#ec0b2a;color:#fff;border:none;border-radius:8px;',
    'padding:9px 16px;cursor:pointer;font-size:14px;font-weight:600;flex-shrink:0;',
    'transition:opacity .15s;}',
    '#qa-send:disabled{opacity:.45;cursor:not-allowed;}',
    '#qa-send:not(:disabled):hover{opacity:.87;}'
  ].join('');

  function injectCSS() {
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  // ── Markdown renderer ──────────────────────────────────────────────────────
  function escapeHTML(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  function renderMarkdown(raw) {
    var text = raw.replace(ORIGIN_RE, FORK_ORIGIN);

    // Protect code blocks
    var blocks = [];
    text = text.replace(/```[\w]*\n?([\s\S]*?)```/g, function (_, code) {
      blocks.push('<pre><code>' + escapeHTML(code.trim()) + '</code></pre>');
      return '\x00BLK' + (blocks.length - 1) + '\x00';
    });

    // Protect inline code
    var inlines = [];
    text = text.replace(/`([^`\n]+)`/g, function (_, code) {
      inlines.push('<code>' + escapeHTML(code) + '</code>');
      return '\x00INL' + (inlines.length - 1) + '\x00';
    });

    text = escapeHTML(text);

    // Restore placeholders before further processing
    inlines.forEach(function (v, i) { text = text.replace('\x00INL' + i + '\x00', v); });

    // Inline formatting
    text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');

    // Links
    text = text.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');
    text = text.replace(/(^|[\s(])(https?:\/\/[^\s)<"]+)/g,
      '$1<a href="$2" target="_blank" rel="noopener">$2</a>');

    // Paragraphs + lists
    text = text.split(/\n\n+/).map(function (block) {
      if (/^\s*[-*]\s/.test(block)) {
        var items = block.split('\n').filter(Boolean).map(function (l) {
          return '<li>' + l.replace(/^\s*[-*]\s*/, '') + '</li>';
        });
        return '<ul>' + items.join('') + '</ul>';
      }
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    }).join('');

    // Restore code blocks
    blocks.forEach(function (v, i) { text = text.replace('\x00BLK' + i + '\x00', v); });

    return text;
  }

  // ── DOM ────────────────────────────────────────────────────────────────────
  var CHAT_ICON = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

  function buildWidget() {
    if (document.getElementById('qa-btn')) return;

    var btn = document.createElement('button');
    btn.id = 'qa-btn';
    btn.innerHTML = CHAT_ICON + 'Ask AI';
    document.body.appendChild(btn);

    var overlay = document.createElement('div');
    overlay.id = 'qa-overlay';
    document.body.appendChild(overlay);

    var panel = document.createElement('div');
    panel.id = 'qa-panel';
    panel.innerHTML =
      '<div id="qa-header">' +
        '<h3>' + CHAT_ICON + 'Ask AI</h3>' +
        '<button id="qa-close" aria-label="Close">&#215;</button>' +
      '</div>' +
      '<div id="qa-messages"></div>' +
      '<div id="qa-input-area">' +
        '<textarea id="qa-input" rows="1" placeholder="Ask a question about java-tron…"></textarea>' +
        '<button id="qa-send">Send</button>' +
      '</div>';
    document.body.appendChild(panel);

    btn.addEventListener('click', openPanel);
    overlay.addEventListener('click', closePanel);
    document.getElementById('qa-close').addEventListener('click', closePanel);
    document.getElementById('qa-send').addEventListener('click', sendMessage);

    var input = document.getElementById('qa-input');
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
    });
    input.addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  function openPanel() {
    document.getElementById('qa-overlay').classList.add('open');
    document.getElementById('qa-panel').classList.add('open');
    setTimeout(function () { document.getElementById('qa-input').focus(); }, 280);
  }

  function closePanel() {
    document.getElementById('qa-overlay').classList.remove('open');
    document.getElementById('qa-panel').classList.remove('open');
  }

  // ── Messaging ──────────────────────────────────────────────────────────────
  function scrollBottom() {
    var m = document.getElementById('qa-messages');
    m.scrollTop = m.scrollHeight;
  }

  function appendUser(text) {
    var div = document.createElement('div');
    div.className = 'qa-msg user';
    div.textContent = text;
    document.getElementById('qa-messages').appendChild(div);
    scrollBottom();
  }

  function appendBot(html, sources) {
    var div = document.createElement('div');
    div.className = 'qa-msg bot';
    div.innerHTML = html;
    if (sources && sources.length) {
      var src = document.createElement('div');
      src.className = 'qa-sources';
      src.innerHTML = 'Sources: ' + sources.map(function (s) {
        if (typeof s === 'object' && s !== null) {
          var label = escapeHTML(s.header || s.source || 'link');
          return s.url
            ? '<span><a href="' + escapeHTML(s.url) + '" target="_blank" rel="noopener">' + label + '</a></span>'
            : '<span>' + label + '</span>';
        }
        return '<span>' + escapeHTML(String(s)) + '</span>';
      }).join('');
      div.appendChild(src);
    }
    document.getElementById('qa-messages').appendChild(div);
    scrollBottom();
  }

  function showTyping() {
    var div = document.createElement('div');
    div.className = 'qa-typing';
    div.id = 'qa-typing';
    div.innerHTML = '<span></span><span></span><span></span>';
    document.getElementById('qa-messages').appendChild(div);
    scrollBottom();
  }

  function removeTyping() {
    var el = document.getElementById('qa-typing');
    if (el) el.remove();
  }

  function sendMessage() {
    if (isLoading) return;
    var input = document.getElementById('qa-input');
    var query = input.value.trim();
    if (!query) return;

    input.value = '';
    input.style.height = 'auto';
    document.getElementById('qa-send').disabled = true;
    isLoading = true;

    appendUser(query);
    showTyping();

    fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Api-Key': API_KEY },
      body: JSON.stringify({ query: query, session_id: sessionId })
    })
    .then(function (res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function (data) {
      removeTyping();
      appendBot(renderMarkdown(data.answer || '(No response)'), data.sources);
    })
    .catch(function (err) {
      removeTyping();
      appendBot('<p>Error: ' + escapeHTML(err.message) + '. Please try again.</p>', null);
    })
    .finally(function () {
      isLoading = false;
      document.getElementById('qa-send').disabled = false;
    });
  }

  // ── Init ───────────────────────────────────────────────────────────────────
  function init() {
    injectCSS();
    buildWidget();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Material for MkDocs instant navigation
  if (typeof document$ !== 'undefined') {
    document$.subscribe(function () { buildWidget(); });
  }

}());
