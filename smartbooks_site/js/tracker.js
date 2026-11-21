/* Smart Books — трекер действий: что сделать после прочтения книги */
(function (root) {
  'use strict';
  var C = root.SBCore, d = root.document, esc = C.esc, KEY = 'sb_tracker';

  function load() { var t = C.LS.get(KEY, null); return t && t.books ? t : { books: {}, days: [] }; }
  function save(t) { C.LS.set(KEY, t); }
  function today() { var n = new Date(); return n.getFullYear() + '-' + ('0' + (n.getMonth() + 1)).slice(-2) + '-' + ('0' + n.getDate()).slice(-2); }
  function dayShift(iso, delta) { var p = iso.split('-'), dt = new Date(+p[0], +p[1] - 1, +p[2] + delta); return dt.getFullYear() + '-' + ('0' + (dt.getMonth() + 1)).slice(-2) + '-' + ('0' + dt.getDate()).slice(-2); }
  function streak(days) {
    var set = {}; days.forEach(function (x) { set[x] = 1; });
    var cur = today(); if (!set[cur]) cur = dayShift(cur, -1);
    var n = 0; while (set[cur]) { n++; cur = dayShift(cur, -1); } return n;
  }
  function actionsFor(id) { return (C.D.actions && C.D.actions[id]) || ['Читайте по 20 минут в день', 'Выписывайте мысли, которые зацепили', 'Расскажите о книге близкому человеку']; }

  function render() {
    var t = load(), ids = Object.keys(t.books), total = 0, done = 0;
    var list = d.getElementById('tList');
    ids.forEach(function (id) { var a = actionsFor(id); total += a.length; a.forEach(function (_, i) { if (t.books[id].done && t.books[id].done[i]) done++; }); });
    d.getElementById('stBooks').textContent = ids.length;
    d.getElementById('stDone').textContent = done + ' / ' + total;
    d.getElementById('stStreak').textContent = streak(t.days) + ' ' + C.plural(streak(t.days), 'день', 'дня', 'дней');
    d.getElementById('stToday').textContent = t.days.indexOf(today()) >= 0 ? 'да ✓' : 'ещё нет';

    list.innerHTML = ids.length ? ids.map(function (id) {
      var b = C.bookById(id); if (!b) return '';
      var acts = actionsFor(id), bd = t.books[id].done || {}, n = acts.filter(function (_, i) { return bd[i]; }).length, pct = Math.round(n / acts.length * 100);
      return '<article class="tbook" data-id="' + esc(id) + '"><img src="' + esc(b.image) + '" alt="' + esc(b.title) + '" width="110" height="138"><div>' +
        '<h3>' + esc(b.title) + '</h3><div class="a">' + esc(b.author) + ' · выполнено ' + n + ' из ' + acts.length + '</div>' +
        '<div class="progress" style="margin:0;max-width:none"><i style="width:' + pct + '%"></i></div>' +
        '<ul class="acts">' + acts.map(function (a, i) { return '<li><label><input type="checkbox" data-i="' + i + '"' + (bd[i] ? ' checked' : '') + '><span>' + esc(a) + '</span></label></li>'; }).join('') + '</ul>' +
        '<button type="button" class="btn ghost sm" data-rm="1" style="margin-top:12px">Убрать из трекера</button></div></article>';
    }).join('') : '<p class="empty">Пока пусто. Выберите книгу, которую вы купили, и мы покажем, что сделать, чтобы она реально изменила жизнь.</p>';

    var sel = d.getElementById('tSelect');
    var free = C.loadBooks().filter(function (b) { return !t.books[b.id]; });
    sel.innerHTML = '<option value="">— выберите книгу —</option>' + free.map(function (b) { return '<option value="' + esc(b.id) + '">' + esc(b.title) + ' — ' + esc(b.author) + '</option>'; }).join('');
  }

  function init() {
    d.getElementById('tAdd').addEventListener('click', function () {
      var id = d.getElementById('tSelect').value; if (!id) { C.toast('Выберите книгу из списка'); return; }
      var t = load(); t.books[id] = { added: Date.now(), done: {} }; save(t); render(); C.toast('Книга добавлена в трекер');
    });
    d.getElementById('tList').addEventListener('change', function (e) {
      var cb = e.target; if (cb.type !== 'checkbox') return;
      var id = cb.closest('.tbook').getAttribute('data-id'), i = cb.getAttribute('data-i'), t = load();
      t.books[id].done = t.books[id].done || {};
      if (cb.checked) { t.books[id].done[i] = Date.now(); if (t.days.indexOf(today()) < 0) t.days.push(today()); C.toast('Отлично! Ещё один шаг сделан'); }
      else delete t.books[id].done[i];
      save(t); render();
    });
    d.getElementById('tList').addEventListener('click', function (e) {
      var b = e.target.closest('[data-rm]'); if (!b) return;
      var id = b.closest('.tbook').getAttribute('data-id'), t = load(); delete t.books[id]; save(t); render();
    });
    render();
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', init); else init();
})(window);
