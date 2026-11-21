/* Smart Books — общая логика: данные, корзина, уровни, скидки, WhatsApp */
(function (root) {
  'use strict';
  var D = root.SB, CFG = D.config;

  /* ---------- хранилище ---------- */
  var LS = {
    get: function (k, d) { try { var v = root.localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set: function (k, v) { try { root.localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del: function (k) { try { root.localStorage.removeItem(k); } catch (e) {} }
  };

  var GROUPS = ['Психология', 'Саморазвитие', 'Деньги и бизнес', 'Общение', 'Романы', 'Духовность'];
  var TYPE_BY_GROUP = { 'Психология': 'thinker', 'Саморазвитие': 'warrior', 'Деньги и бизнес': 'entrepreneur', 'Общение': 'entrepreneur', 'Романы': 'dreamer', 'Духовность': 'mystic' };

  /* уровни героя по числу книг в корзине (индекс = уровень героя 0..5) */
  var LEVELS = [
    { min: 0,  name: 'Новичок', perk: '' },
    { min: 1,  name: 'Ученик',  perk: '' },
    { min: 2,  name: 'Практик', perk: 'скидка 10%' },
    { min: 3,  name: 'Мастер',  perk: 'скидка 15%' },
    { min: 5,  name: 'Эксперт', perk: 'образ с аурой' },
    { min: 10, name: 'Легенда', perk: 'бесплатная доставка по Бишкеку' }
  ];

  function plural(n, a, b, c) { var m = n % 100, k = n % 10; if (m > 10 && m < 20) return c; if (k === 1) return a; if (k > 1 && k < 5) return b; return c; }
  function money(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') + '\u00A0сом'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* ---------- книги ---------- */
  function normalize(b) {
    return {
      id: b.id, title: b.title || '', author: b.author || '', price: Number(b.price) || 0,
      stock: (b.stock === null || b.stock === undefined || b.stock === '') ? null : Number(b.stock),
      category: GROUPS.indexOf(b.category) >= 0 ? b.category : 'Психология',
      adult: !!b.adult, hidden: !!b.hidden, desc: b.desc || '', image: b.image || '', keywords: b.keywords || []
    };
  }
  function loadBooks() {
    var s = LS.get('sb_books', null);
    var list = (s && s.version === D.version && Array.isArray(s.books)) ? s.books : D.books;
    return list.map(normalize);
  }
  function visibleBooks() { return loadBooks().filter(function (b) { return !b.hidden; }); }
  function bookById(id) { var l = loadBooks(); for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function typeOf(b) { return TYPE_BY_GROUP[b.category] || 'thinker'; }
  function isLow(b) { return b.stock !== null && b.stock > 0 && b.stock <= CFG.lowStock; }

  /* ---------- корзина ---------- */
  var Cart = {
    get: function () { return LS.get('sb_cart', {}); },
    save: function (c) { LS.set('sb_cart', c); root.document.dispatchEvent(new root.CustomEvent('sb:cart')); },
    count: function () { var c = Cart.get(), n = 0; Object.keys(c).forEach(function (k) { n += c[k]; }); return n; },
    add: function (id) {
      var b = bookById(id); if (!b) return false;
      var c = Cart.get(), q = (c[id] || 0) + 1;
      if (b.stock !== null && q > b.stock) { toast(b.stock > 0 ? 'В наличии только ' + b.stock + ' шт.' : 'Этой книги нет в наличии'); return false; }
      c[id] = q; c.__last = id; Cart.save(c); toast('Добавлено: ' + b.title); return true;
    },
    set: function (id, q) {
      var c = Cart.get(), b = bookById(id);
      if (q <= 0) delete c[id]; else { if (b && b.stock !== null && q > b.stock) { q = b.stock; toast('В наличии только ' + b.stock + ' шт.'); } c[id] = q; }
      Cart.save(c);
    },
    clear: function () { LS.del('sb_cart'); root.document.dispatchEvent(new root.CustomEvent('sb:cart')); }
  };
  function cartItems() {
    var c = Cart.get(), out = [];
    Object.keys(c).forEach(function (id) { if (id === '__last') return; var b = bookById(id); if (b && c[id] > 0) out.push({ book: b, qty: c[id] }); });
    return out;
  }
  function discountPct(qty) {
    var p = 0; CFG.discounts.forEach(function (d) { if (qty >= d.min) p = Math.max(p, d.percent); }); return p;
  }
  function summary() {
    var items = cartItems(), qty = 0, sub = 0;
    items.forEach(function (i) { qty += i.qty; sub += i.qty * i.book.price; });
    var pct = discountPct(qty), disc = Math.round(sub * pct / 100);
    return { items: items, qty: qty, subtotal: sub, pct: pct, discount: disc, total: sub - disc, freeDelivery: qty >= CFG.freeDeliveryFrom };
  }
  function levelOf(qty) { var i = 0; for (var k = 0; k < LEVELS.length; k++) if (qty >= LEVELS[k].min) i = k; return i; }
  function dominantType(items) {
    if (!items.length) return 'base';
    var score = {}, last = Cart.get().__last, best = null;
    items.forEach(function (i) { var t = typeOf(i.book); score[t] = (score[t] || 0) + i.qty + (i.book.id === last ? 0.1 : 0); });
    Object.keys(score).forEach(function (t) { if (best === null || score[t] > score[best]) best = t; });
    return best;
  }
  function nextHint(qty) {
    var li = levelOf(qty);
    if (li >= LEVELS.length - 1) return 'Максимальный уровень! Бесплатная доставка по Бишкеку уже ваша.';
    var nx = LEVELS[li + 1], need = nx.min - qty;
    return 'Ещё <b>' + need + ' ' + plural(need, 'книга', 'книги', 'книг') + '</b> до уровня «' + esc(nx.name) + '»' + (nx.perk ? ' — ' + esc(nx.perk) : '') + '.';
  }

  /* ---------- WhatsApp ---------- */
  function waLink(text) { return 'https://wa.me/' + CFG.whatsapp + '?text=' + encodeURIComponent(text); }
  function orderText() {
    var s = summary();
    if (!s.items.length) return 'Здравствуйте! Хочу заказать книги в Smart Books. Подскажите, что есть в наличии?';
    var t = 'Здравствуйте! Хочу заказать книги в Smart Books:\n';
    s.items.forEach(function (i, n) { t += (n + 1) + '. ' + i.book.title + ' — ' + i.qty + ' шт. × ' + i.book.price + ' = ' + (i.qty * i.book.price) + ' сом\n'; });
    if (s.pct) t += '\nСкидка ' + s.pct + '%: −' + s.discount + ' сом';
    t += '\nИтого: ' + s.total + ' сом';
    if (s.freeDelivery) t += '\nБесплатная доставка по Бишкеку (от ' + CFG.freeDeliveryFrom + ' книг)';
    t += '\nУровень героя: ' + LEVELS[levelOf(s.qty)].name + '\n\nПодскажите, как лучше оплатить и получить заказ?';
    return t;
  }

  /* ---------- UI: тост, корзина-ящик, WhatsApp-кнопка ---------- */
  var toastTimer;
  function toast(msg) {
    var el = root.document.getElementById('toast'); if (!el) return;
    el.textContent = msg; el.classList.add('on'); clearTimeout(toastTimer); toastTimer = setTimeout(function () { el.classList.remove('on'); }, 2200);
  }
  function openCart() { var d = root.document; d.getElementById('drawer').classList.add('on'); d.getElementById('overlay').classList.add('on'); renderCart(); }
  function closeCart() { var d = root.document; d.getElementById('drawer').classList.remove('on'); d.getElementById('overlay').classList.remove('on'); }

  function renderCart() {
    var d = root.document, s = summary();
    var cnt = d.getElementById('cartCount'); if (cnt) { cnt.textContent = s.qty; cnt.style.display = s.qty ? '' : 'none'; }
    var wrap = d.getElementById('cartItems'); if (!wrap) return;
    if (!s.items.length) {
      wrap.innerHTML = '<p class="empty">Корзина пуста. Добавьте книги — герой начнёт прокачиваться, а скидки вырастут.</p>';
    } else {
      wrap.innerHTML = s.items.map(function (i) {
        return '<div class="line" data-id="' + esc(i.book.id) + '"><div class="th"><img src="' + esc(i.book.image) + '" alt="' + esc(i.book.title) + '" width="56" height="70"></div>' +
          '<div><div class="t">' + esc(i.book.title) + '</div><div class="s">' + money(i.book.price) + ' за шт.</div>' +
          '<div class="qty"><button type="button" data-act="dec" aria-label="Меньше">−</button><span>' + i.qty + '</span><button type="button" data-act="inc" aria-label="Больше">+</button></div>' +
          '<button type="button" class="rm" data-act="rm">Убрать</button></div>' +
          '<div class="sum">' + money(i.qty * i.book.price) + '</div></div>';
      }).join('');
    }
    var foot = d.getElementById('cartFoot');
    if (foot) {
      var h = '';
      if (s.items.length) {
        h += '<div class="tot"><span>Товары (' + s.qty + ')</span><span>' + money(s.subtotal) + '</span></div>';
        if (s.pct) h += '<div class="tot disc"><span>Скидка ' + s.pct + '%</span><span>−' + money(s.discount) + '</span></div>';
        h += '<div class="tot"><span>Доставка по Бишкеку</span><span>' + (s.freeDelivery ? 'бесплатно' : 'уточним в WhatsApp') + '</span></div>';
        h += '<div class="tot big"><span>Итого</span><span>' + money(s.total) + '</span></div>';
        h += '<div class="cart-hint">' + nextHint(s.qty) + '</div>';
      }
      h += '<a class="btn wa" id="cartOrder" target="_blank" rel="noopener" href="' + esc(waLink(orderText())) + '">Оформить в WhatsApp</a>';
      if (s.items.length) h += '<button type="button" class="btn ghost sm" id="cartClear">Очистить корзину</button>';
      foot.innerHTML = h;
    }
    var fl = d.getElementById('waFloat'); if (fl) fl.setAttribute('href', waLink(orderText()));
  }

  function bind() {
    var d = root.document;
    var btn = d.getElementById('cartBtn'); if (btn) btn.addEventListener('click', openCart);
    var cl = d.getElementById('cartClose'); if (cl) cl.addEventListener('click', closeCart);
    var ov = d.getElementById('overlay'); if (ov) ov.addEventListener('click', closeCart);
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeCart(); });
    var bg = d.getElementById('burger'), nav = d.getElementById('nav');
    if (bg && nav) bg.addEventListener('click', function () { nav.classList.toggle('on'); });
    var items = d.getElementById('cartItems');
    if (items) items.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-act]'); if (!b) return;
      var id = b.closest('.line').getAttribute('data-id'), q = Cart.get()[id] || 0, a = b.getAttribute('data-act');
      if (a === 'inc') Cart.set(id, q + 1); else if (a === 'dec') Cart.set(id, q - 1); else Cart.set(id, 0);
    });
    var foot = d.getElementById('cartFoot');
    if (foot) foot.addEventListener('click', function (e) { if (e.target.id === 'cartClear') Cart.clear(); });
    d.addEventListener('sb:cart', renderCart);
    renderCart();
  }

  /* ---------- общие ссылки ---------- */
  function fillLinks() {
    var d = root.document;
    [].forEach.call(d.querySelectorAll('[data-wa]'), function (a) { a.setAttribute('href', waLink(a.getAttribute('data-wa') || 'Здравствуйте! Хочу заказать книги в Smart Books.')); });
    [].forEach.call(d.querySelectorAll('[data-ig]'), function (a) { a.setAttribute('href', CFG.instagram); });
  }

  var api = {
    D: D, CFG: CFG, LS: LS, GROUPS: GROUPS, LEVELS: LEVELS, TYPE_BY_GROUP: TYPE_BY_GROUP,
    plural: plural, money: money, esc: esc, normalize: normalize, loadBooks: loadBooks, visibleBooks: visibleBooks, bookById: bookById,
    typeOf: typeOf, isLow: isLow, Cart: Cart, summary: summary, levelOf: levelOf, dominantType: dominantType, nextHint: nextHint,
    waLink: waLink, orderText: orderText, toast: toast, openCart: openCart, closeCart: closeCart, renderCart: renderCart, discountPct: discountPct
  };
  root.SBCore = api;
  if (root.document) {
    var init = function () { bind(); fillLinks(); };
    if (root.document.readyState === 'loading') root.document.addEventListener('DOMContentLoaded', init); else init();
  }
})(typeof window !== 'undefined' ? window : this);
