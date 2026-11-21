/* Smart Books — главная: герой, каталог, фильтры */
(function (root) {
  'use strict';
  var C = root.SBCore, d = root.document, esc = C.esc;
  var state = { group: 'Все', q: '' };

  function cardHTML(b) {
    var low = C.isLow(b), out = b.stock === 0;
    return '<article class="card" data-id="' + esc(b.id) + '" data-cat="' + esc(b.category) + '">' +
      '<div class="cover"><img src="' + esc(b.image) + '" alt="' + esc(b.title) + ' — ' + esc(b.author) + ', купить в Бишкеке" width="400" height="500" loading="lazy">' +
      (out ? '<span class="badge out">Нет в наличии</span>' : (low ? '<span class="badge">Осталось ' + b.stock + '</span>' : '')) +
      (b.adult ? '<span class="age" title="Для читателей старше 18 лет">18+</span>' : '') + '</div>' +
      '<div class="info"><span class="cat">' + esc(b.category) + '</span>' +
      '<h3 class="title">' + esc(b.title) + '</h3><div class="author">' + esc(b.author) + '</div>' +
      (b.desc ? '<p class="desc">' + esc(b.desc) + '</p>' : '') +
      '<div class="row"><span class="price">' + C.money(b.price) + '</span>' +
      '<button type="button" class="btn sm" data-add="' + esc(b.id) + '"' + (out ? ' disabled' : '') + '>' + (out ? 'Нет' : 'В корзину') + '</button></div></div></article>';
  }

  function renderGrid() {
    var grid = d.getElementById('grid'); if (!grid) return;
    var q = state.q.trim().toLowerCase();
    var list = C.visibleBooks().filter(function (b) {
      if (state.group !== 'Все' && b.category !== state.group) return false;
      if (!q) return true;
      return (b.title + ' ' + b.author + ' ' + b.category + ' ' + (b.keywords || []).join(' ')).toLowerCase().indexOf(q) >= 0;
    });
    grid.innerHTML = list.length ? list.map(cardHTML).join('') : '<p class="empty" style="grid-column:1/-1">Ничего не нашли. Напишите нам в WhatsApp — подберём или привезём под заказ.</p>';
    var cnt = d.getElementById('foundCount'); if (cnt) cnt.textContent = list.length + ' ' + C.plural(list.length, 'книга', 'книги', 'книг');
  }

  function renderChips() {
    var box = d.getElementById('chips'); if (!box) return;
    var groups = ['Все'].concat(C.GROUPS.filter(function (g) { return C.visibleBooks().some(function (b) { return b.category === g; }); }));
    box.innerHTML = groups.map(function (g) { return '<button type="button" class="chip" aria-pressed="' + (g === state.group) + '" data-g="' + esc(g) + '">' + esc(g) + '</button>'; }).join('');
  }

  function renderHero() {
    var s = C.summary(), li = C.levelOf(s.qty), type = C.dominantType(s.items);
    var art = d.getElementById('heroArt'); if (art) art.innerHTML = root.SBHero.render(type, li);
    var L = C.LEVELS[li];
    var lb = d.getElementById('heroLevel'); if (lb) lb.textContent = 'Уровень ' + li + ' · ' + L.name;
    var ot = d.getElementById('heroOutfit');
    if (ot) ot.textContent = type === 'base' ? 'Образ откроется после первой книги — он зависит от жанра' : 'Образ: ' + root.SBHero.OUTFITS[type].name;
    var bar = d.getElementById('heroBar'); if (bar) bar.style.width = Math.min(s.qty, 10) * 10 + '%';
    var hint = d.getElementById('heroHint'); if (hint) hint.innerHTML = C.nextHint(s.qty);
  }

  function init() {
    renderChips(); renderGrid(); renderHero();
    d.getElementById('chips').addEventListener('click', function (e) {
      var b = e.target.closest('[data-g]'); if (!b) return; state.group = b.getAttribute('data-g'); renderChips(); renderGrid();
    });
    var s = d.getElementById('search'); if (s) s.addEventListener('input', function () { state.q = s.value; renderGrid(); });
    d.getElementById('grid').addEventListener('click', function (e) {
      var b = e.target.closest('[data-add]'); if (b) C.Cart.add(b.getAttribute('data-add'));
    });
    d.addEventListener('sb:cart', renderHero);
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window);
