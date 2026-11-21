/* Smart Books — админ-панель: остатки, цены, карточки */
(function (root) {
  'use strict';
  var C = root.SBCore, d = root.document, esc = C.esc, W = [], dirty = false;

  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return 'h' + (h >>> 0).toString(16) + s.length; }
  function $(id) { return d.getElementById(id); }
  function setDirty(v) { dirty = v; var s = $('dirty'); if (s) s.textContent = v ? '● Есть несохранённые изменения' : '✓ Всё сохранено'; }

  /* ---------- вход ---------- */
  function gate() {
    var pin = C.LS.get('sb_admin_pin', null), box = $('gate'), app = $('app');
    function open() { box.style.display = 'none'; app.style.display = ''; try { root.sessionStorage.setItem('sb_admin_ok', '1'); } catch (e) {} start(); }
    var ok = false; try { ok = root.sessionStorage.getItem('sb_admin_ok') === '1'; } catch (e) {}
    if (pin && ok) { open(); return; }
    $('gateTitle').textContent = pin ? 'Вход в админ-панель' : 'Придумайте PIN-код';
    $('gateText').textContent = pin ? 'Введите PIN-код.' : 'Первый вход: задайте PIN (минимум 4 символа). Он хранится только в этом браузере.';
    $('gateGo').addEventListener('click', function () {
      var v = $('gatePin').value;
      if (!pin) { if (v.length < 4) { $('gateErr').textContent = 'Минимум 4 символа'; return; } C.LS.set('sb_admin_pin', hash(v)); open(); return; }
      if (hash(v) === pin) open(); else $('gateErr').textContent = 'Неверный PIN';
    });
    $('gatePin').addEventListener('keydown', function (e) { if (e.key === 'Enter') $('gateGo').click(); });
  }

  /* ---------- таблица ---------- */
  function catOptions(sel) { return C.GROUPS.map(function (g) { return '<option' + (g === sel ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join(''); }
  function row(b) {
    var low = b.stock !== null && b.stock <= C.CFG.lowStock;
    return '<tr data-id="' + esc(b.id) + '" class="' + (low ? 'low-row' : '') + '">' +
      '<td><img src="' + esc(b.image) + '" alt="" width="48" height="60"></td>' +
      '<td><input type="text" data-f="title" value="' + esc(b.title) + '"><input type="text" data-f="author" value="' + esc(b.author) + '" style="margin-top:6px"></td>' +
      '<td><input type="number" data-f="price" min="0" step="10" value="' + b.price + '"></td>' +
      '<td><input type="number" data-f="stock" min="0" step="1" value="' + (b.stock === null ? '' : b.stock) + '" placeholder="∞"></td>' +
      '<td><select data-f="category">' + catOptions(b.category) + '</select></td>' +
      '<td><label><input type="checkbox" data-f="adult"' + (b.adult ? ' checked' : '') + '> 18+</label><br><label><input type="checkbox" data-f="hidden"' + (b.hidden ? ' checked' : '') + '> скрыть</label></td>' +
      '<td><textarea data-f="desc" rows="3" style="width:100%">' + esc(b.desc) + '</textarea></td>' +
      '<td><button type="button" class="btn ghost sm" data-del="1">Удалить</button></td></tr>';
  }
  function render() {
    var q = ($('filter').value || '').toLowerCase(), onlyLow = $('onlyLow').checked;
    var rows = W.filter(function (b) {
      if (onlyLow && !(b.stock !== null && b.stock <= C.CFG.lowStock)) return false;
      return !q || (b.title + ' ' + b.author).toLowerCase().indexOf(q) >= 0;
    });
    $('rows').innerHTML = rows.map(row).join('') || '<tr><td colspan="8" class="empty">Ничего не найдено</td></tr>';
    var low = W.filter(function (b) { return b.stock !== null && b.stock > 0 && b.stock <= C.CFG.lowStock; }).length;
    var out = W.filter(function (b) { return b.stock === 0; }).length;
    $('summary').textContent = 'Всего книг: ' + W.length + ' · мало (≤' + C.CFG.lowStock + '): ' + low + ' · нет в наличии: ' + out;
  }
  function persist() { C.LS.set('sb_books', { version: C.D.version, books: W }); setDirty(false); C.toast('Сохранено в этом браузере'); }

  function onEdit(e) {
    var el = e.target, f = el.getAttribute('data-f'); if (!f) return;
    var id = el.closest('tr').getAttribute('data-id'), b = W.filter(function (x) { return x.id === id; })[0]; if (!b) return;
    if (el.type === 'checkbox') b[f] = el.checked;
    else if (f === 'price') b.price = Number(el.value) || 0;
    else if (f === 'stock') b.stock = el.value === '' ? null : Math.max(0, Math.floor(Number(el.value)));
    else b[f] = el.value;
    setDirty(true);
    if (f === 'stock') el.closest('tr').classList.toggle('low-row', b.stock !== null && b.stock <= C.CFG.lowStock);
  }

  /* ---------- новая книга ---------- */
  function slug(s) {
    var m = { а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'j', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ы: 'y', э: 'e', ю: 'yu', я: 'ya' };
    return s.toLowerCase().split('').map(function (c) { return m[c] !== undefined ? m[c] : c; }).join('').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'book';
  }
  function makeImage(file, cb) {
    var rd = new root.FileReader();
    rd.onload = function () {
      var img = new root.Image();
      img.onload = function () {
        var cv = d.createElement('canvas'); cv.width = 800; cv.height = 1000; var cx = cv.getContext('2d');
        cx.fillStyle = '#0E0D0C'; cx.fillRect(0, 0, 800, 1000);
        var g = cx.createRadialGradient(400, 480, 40, 400, 480, 420); g.addColorStop(0, 'rgba(110,68,38,.9)'); g.addColorStop(1, 'rgba(14,13,12,0)'); cx.fillStyle = g; cx.fillRect(0, 0, 800, 1000);
        var bw = 560, bh = Math.round(bw * img.height / img.width); if (bh > 780) { bh = 780; bw = Math.round(bh * img.width / img.height); }
        cx.shadowColor = 'rgba(0,0,0,.7)'; cx.shadowBlur = 40; cx.shadowOffsetY = 24; cx.drawImage(img, (800 - bw) / 2, (1000 - bh) / 2 - 10, bw, bh);
        var url = cv.toDataURL('image/webp', 0.82); if (url.indexOf('image/webp') < 0) url = cv.toDataURL('image/jpeg', 0.85);
        cb(url);
      };
      img.src = rd.result;
    };
    rd.readAsDataURL(file);
  }
  function addBook() {
    var t = $('nTitle').value.trim(); if (!t) { C.toast('Укажите название'); return; }
    var f = $('nImg').files[0];
    function finish(url) {
      var b = C.normalize({ id: slug(t) + '-' + Date.now().toString(36), title: t, author: $('nAuthor').value.trim(), price: $('nPrice').value, stock: $('nStock').value === '' ? null : Number($('nStock').value), category: $('nCat').value, adult: $('nAdult').checked, desc: $('nDesc').value.trim(), image: url || 'img/books/placeholder.svg', keywords: [t + ' купить Бишкек', $('nAuthor').value.trim()].filter(Boolean) });
      W.unshift(b); setDirty(true); render(); persist();
      ['nTitle', 'nAuthor', 'nPrice', 'nStock', 'nDesc'].forEach(function (i) { $(i).value = ''; }); $('nImg').value = '';
    }
    if (f) makeImage(f, finish); else finish('');
  }

  /* ---------- публикация / экспорт ---------- */
  function download(name, text, type) {
    var blob = new root.Blob([text], { type: type || 'text/plain;charset=utf-8' }), a = d.createElement('a');
    a.href = root.URL.createObjectURL(blob); a.download = name; d.body.appendChild(a); a.click(); a.remove();
  }
  function publish() {
    var ver = Date.now(), data = { version: ver, config: C.CFG, books: W, actions: C.D.actions };
    download('data.js', '/* Smart Books — данные магазина. Создано админ-панелью. Загрузите в папку js/ на хостинге. */\nwindow.SB = ' + JSON.stringify(data, null, 1) + ';\n', 'text/javascript;charset=utf-8');
    C.LS.set('sb_books', { version: ver, books: W }); setDirty(false);
    C.toast('Файл data.js скачан — загрузите его в папку js/ на хостинге');
  }
  function importJson(file) {
    var rd = new root.FileReader();
    rd.onload = function () { try { var arr = JSON.parse(rd.result); if (!Array.isArray(arr)) throw 0; W = arr.map(C.normalize); setDirty(true); render(); C.toast('Импортировано: ' + W.length); } catch (e) { C.toast('Не удалось прочитать файл'); } };
    rd.readAsText(file);
  }

  function start() {
    W = C.loadBooks(); render(); setDirty(false);
    var cats = $('nCat'); cats.innerHTML = catOptions('Психология');
    $('rows').addEventListener('input', onEdit); $('rows').addEventListener('change', onEdit);
    $('rows').addEventListener('click', function (e) {
      var b = e.target.closest('[data-del]'); if (!b) return;
      var id = b.closest('tr').getAttribute('data-id'), bk = W.filter(function (x) { return x.id === id; })[0];
      if (root.confirm('Удалить «' + (bk ? bk.title : '') + '» из каталога?')) { W = W.filter(function (x) { return x.id !== id; }); setDirty(true); render(); }
    });
    $('filter').addEventListener('input', render); $('onlyLow').addEventListener('change', render);
    $('save').addEventListener('click', persist); $('publish').addEventListener('click', publish);
    $('addBtn').addEventListener('click', addBook);
    $('exportBtn').addEventListener('click', function () { download('books-export.json', JSON.stringify(W, null, 1), 'application/json'); });
    $('importFile').addEventListener('change', function (e) { if (e.target.files[0]) importJson(e.target.files[0]); });
    $('resetBtn').addEventListener('click', function () { if (root.confirm('Сбросить все правки в этом браузере и вернуть данные с сайта?')) { C.LS.del('sb_books'); W = C.loadBooks(); render(); setDirty(false); } });
    $('pinBtn').addEventListener('click', function () { var v = root.prompt('Новый PIN (минимум 4 символа):'); if (v && v.length >= 4) { C.LS.set('sb_admin_pin', hash(v)); C.toast('PIN изменён'); } });
    $('logout').addEventListener('click', function () { try { root.sessionStorage.removeItem('sb_admin_ok'); } catch (e) {} root.location.reload(); });
    root.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
  }
  if (d.readyState === 'loading') d.addEventListener('DOMContentLoaded', gate); else gate();
})(window);
