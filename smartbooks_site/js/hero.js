/* Smart Books — пиксельный герой (RPG-спрайт слоями: аура -> плащ -> тело -> наряд -> голова -> аксессуары/уровень) */
(function (root) {
  'use strict';

  var P = 8; // размер 1 пикселя в SVG (сетка 40x48 -> 320x384)

  var OUTFITS = {
    base:         { name: 'Новичок' },
    thinker:      { name: 'Мыслитель' },
    entrepreneur: { name: 'Предприниматель' },
    warrior:      { name: 'Воин' },
    mystic:       { name: 'Мистик' },
    dreamer:      { name: 'Мечтатель' }
  };

  /* Палитры цветов по классам */
  var PAL = {
    outline: '#1B1411',
    skin1: '#FAD5B5', skin2: '#EDC098', skin3: '#D1976C',
    blush: '#EE9389', eye: '#241914', white: '#FFFFFF',
    gold1: '#FFE082', gold2: '#F5A50A', gold3: '#B86E08',
    cream: '#F4ECE0', cream2: '#D8CCBA',
    ruby: '#E94B6A', sapphire: '#6FB1FF',
    cape: {
      base:         ['#DEA062', '#B87228', '#7D4714'],
      thinker:      ['#D6944E', '#A86724', '#6E3E12'],
      entrepreneur: ['#D99B38', '#A66C18', '#6B420A'],
      warrior:      ['#D95545', '#A83226', '#6E1D15'],
      mystic:       ['#6F5AC2', '#4D3B96', '#312366'],
      dreamer:      ['#E68AA8', '#BC5E7D', '#803751']
    },
    outfit: {
      base:         { t1: '#959CA8', t2: '#787F8C', t3: '#555B66', p1: '#495A7A', p2: '#374561', s1: '#EFECE6', s2: '#B8B4AC', h1: '#543D32', h2: '#3B2A22', h3: '#261A14' },
      thinker:      { t1: '#997C64', t2: '#7B604B', t3: '#594232', p1: '#575761', p2: '#3F3F47', s1: '#3D3530', s2: '#241F1C', h1: '#543D32', h2: '#3B2A22', h3: '#261A14' },
      entrepreneur: { t1: '#2A4066', t2: '#1D2E4D', t3: '#121E33', p1: '#1D2E4D', p2: '#121E33', s1: '#2B2420', s2: '#14100E', h1: '#362A25', h2: '#211815', h3: '#140E0C' },
      warrior:      { t1: '#3D3632', t2: '#2B2522', t3: '#1C1816', p1: '#2E2E35', p2: '#1D1D22', s1: '#26201D', s2: '#14110F', h1: '#453229', h2: '#2E201A', h3: '#1C130F' },
      mystic:       { t1: '#534394', t2: '#3B2E6E', t3: '#261C4D', p1: '#3B2E6E', p2: '#261C4D', s1: '#2E2359', s2: '#1C143B', h1: '#3A3142', h2: '#261F2E', h3: '#16111C' },
      dreamer:      { t1: '#F2ABC0', t2: '#DE85A0', t3: '#B35D78', p1: '#7B759E', p2: '#5B557A', s1: '#F4ECE0', s2: '#CFC4B4', h1: '#8C523D', h2: '#6B3B2A', h3: '#4A261A' }
    }
  };

  /* Конструктор пиксельной сетки 40x48 с RLE-оптимизацией по строкам */
  function Grid(w, h) {
    this.w = w;
    this.h = h;
    this.cells = new Array(w * h);
  }
  Grid.prototype.px = function (x, y, c) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h || !c) return;
    this.cells[y * this.w + x] = c;
  };
  Grid.prototype.rect = function (x, y, w, h, c) {
    for (var dy = 0; dy < h; dy++) {
      for (var dx = 0; dx < w; dx++) this.px(x + dx, y + dy, c);
    }
  };
  Grid.prototype.rows = function (ox, oy, lines, map) {
    for (var y = 0; y < lines.length; y++) {
      var row = lines[y];
      for (var x = 0; x < row.length; x++) {
        var ch = row.charAt(x);
        if (ch !== '.' && map[ch]) this.px(ox + x, oy + y, map[ch]);
      }
    }
  };
  Grid.prototype.toSVG = function () {
    var out = '';
    for (var y = 0; y < this.h; y++) {
      var x = 0;
      while (x < this.w) {
        var c = this.cells[y * this.w + x];
        if (!c) { x++; continue; }
        var len = 1;
        while (x + len < this.w && this.cells[y * this.w + x + len] === c) len++;
        out += '<rect x="' + (x * P) + '" y="' + (y * P) + '" width="' + (len * P) + '" height="' + P + '" fill="' + c + '"/>';
        x += len;
      }
    }
    return out;
  };

  /* ---------- слои спрайта (сетка 40x48, центр x = 19.5) ---------- */
  function drawCape(g, level, type) {
    if (level < 3) return;
    var cc = PAL.cape[type] || PAL.cape.base;
    var O = PAL.outline;
    // Пиксельный развевающийся плащ за спиной
    g.rows(9, 23, [
      '....OOOOOOOOOOOOOO....',
      '...O12222222222221O...',
      '..O1223222222223221O..',
      '..O1232222222222321O..',
      '.O123222222222222321O.',
      '.O123222222222222321O.',
      '.O122322222222223221O.',
      'O12223222222222232221O',
      'O12223222222222232221O',
      'O12222322222222322221O',
      'O12222322222222322221O',
      'O12222322222222322221O',
      'O13222322222222322231O',
      'O33322322222222322333O',
      '.OO3333333333333333OO.',
      '...OO33OO....OO33OO...'
    ], { O: O, '1': cc[0], '2': cc[1], '3': cc[2] });
  }

  function drawMysticHoodBack(g, type, p) {
    if (type !== 'mystic') return;
    var O = PAL.outline;
    // Заострённый капюшон мага, обрамляющий голову
    g.rows(10, 5, [
      '.......OOOOOO.......',
      '.....OO111111OO.....',
      '....O1122222211O....',
      '...O122222222221O...',
      '..O12333333333321O..',
      '.O1233333333333321O.',
      '.O1233333333333321O.',
      '.O1233333333333321O.',
      '.O1233333333333321O.',
      '.O1233333333333321O.',
      '.O1233333333333321O.',
      '..O23333333333332O..',
      '..O23333333333332O..',
      '...O223333333322O...',
      '....OO22222222OO....'
    ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3 });
  }

  function drawLegsAndTorso(g, type, p) {
    var O = PAL.outline;
    if (type === 'mystic') {
      // Длинная мантия звездочёта
      g.rows(11, 22, [
        '....OOOOOOOOOO....',
        '...O1111221111O...',
        '..O11222G222211O..',
        '..O1222G2G22221O..',
        '..O12222G222222O..',
        '..O122222222222O..',
        '.O1222G222222223O.',
        '.O12222222222G23O.',
        '.O1222222C222223O.',
        '.O12222222222223O.',
        'O122C222222222233O',
        'O1222222222G22233O',
        'O1222222222222233O',
        'O12222G222222C233O',
        'O1222222222222233O',
        'O2222222222222233O',
        'O3333333333333333O',
        '.OOOOOOOOOOOOOOOO.',
        '..OSSSSO..OSSSSO..',
        '..OssssO..OssssO..',
        '..OOOOOO..OOOOOO..'
      ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3, G: PAL.gold2, C: PAL.cream, S: p.s1, s: p.s2 });
      return;
    }

    // Ноги и ботинки (обычные классы)
    g.rows(14, 34, [
      '.OOOOOOOOOO.',
      '.O111OO111O.',
      '.O112OO112O.',
      '.O112OO112O.',
      '.O112OO112O.',
      '.O112OO112O.',
      '.O222OO222O.',
      'OSSSSOOSSSSO',
      'OssssOOssssO',
      'OOOOOOOOOOOO'
    ], { O: O, '1': p.p1, '2': p.p2, S: p.s1, s: p.s2 });

    // Торс
    g.rows(13, 22, [
      '...OOOOOOOO...',
      '..O11111111O..',
      '.O1111111122O.',
      '.O1111111122O.',
      '.O1111111122O.',
      '.O1122222222O.',
      '.O1122222222O.',
      '.O1122222222O.',
      '.O2222222222O.',
      '.O2222222233O.',
      '.O2222222233O.',
      '.O3333333333O.',
      '..OOOOOOOOOO..'
    ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3 });

    // Детали наряда на торсе
    if (type === 'base') {
      // Шнурки худи и карман-кенгуру
      g.px(18, 24, PAL.cream); g.px(21, 24, PAL.cream);
      g.px(18, 25, PAL.cream); g.px(21, 25, PAL.cream);
      g.rect(17, 23, 6, 1, p.t3);
      g.rect(16, 29, 8, 3, p.t3);
      g.rect(17, 29, 6, 1, p.t2);
    } else if (type === 'thinker') {
      // Кардиган на пуговицах с кремовой рубашкой
      g.rows(17, 23, [
        'CCCCCC',
        '.CCCC.',
        '..CC..',
        '..3G..',
        '..33..',
        '..3G..',
        '..33..',
        '..3G..'
      ], { C: PAL.cream, '3': p.t3, G: PAL.gold2 });
    } else if (type === 'entrepreneur') {
      // Пиджак, белая рубашка и золотой галстук
      g.rows(17, 23, [
        'WWWWWW',
        'W1GG1W',
        '.WGGW.',
        '.WggW.',
        '..GG..',
        '..GG..',
        '..gg..',
        '..gg..'
      ], { W: PAL.white, '1': p.t1, G: PAL.gold2, g: PAL.gold3 });
      g.px(16, 25, p.t1); g.px(23, 25, p.t1);
      g.px(16, 26, p.t1); g.px(23, 26, p.t1);
    } else if (type === 'warrior') {
      // Диагональная перевязь и пояс с золотой пряжкой
      for (var i = 0; i < 8; i++) {
        g.px(15 + i, 24 + i, PAL.gold2);
        g.px(16 + i, 24 + i, PAL.gold1);
      }
      g.rect(14, 32, 12, 2, PAL.gold3);
      g.rect(18, 32, 4, 2, PAL.gold1);
    } else if (type === 'dreamer') {
      // Пиксельное сердечко и белый воротничок
      g.px(17, 23, PAL.cream); g.px(18, 23, PAL.cream);
      g.px(21, 23, PAL.cream); g.px(22, 23, PAL.cream);
      g.rows(17, 25, [
        '.RR.RR.',
        'RRRRRRR',
        'RRRRRRR',
        '.RRRRR.',
        '..RRR..',
        '...R...'
      ], { R: PAL.ruby });
    }
  }

  function drawArms(g, type, level, p) {
    var O = PAL.outline;
    // Левая рука (плотно прилегает к плечу)
    g.rows(10, 23, [
      '..OOO',
      '.O111',
      '.O122',
      '.O122',
      '.O222',
      '.O223',
      '.OSSS',
      '.OssO',
      '..OO.'
    ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3, S: PAL.skin2, s: PAL.skin3 });
    g.px(14, 24, p.t1); g.px(14, 25, p.t2);

    // Правая рука — чуть приподнята, если держит книгу (level >= 1)
    if (level >= 1) {
      g.rows(25, 23, [
        'OOO..',
        '111O.',
        '122O.',
        '222O.',
        '223O.',
        'OSSO.',
        'OssO.',
        '.OO..'
      ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3, S: PAL.skin1, s: PAL.skin2 });
    } else {
      g.rows(25, 23, [
        'OOO..',
        '111O.',
        '122O.',
        '122O.',
        '222O.',
        '223O.',
        'SSSO.',
        'OssO.',
        '.OO..'
      ], { O: O, '1': p.t1, '2': p.t2, '3': p.t3, S: PAL.skin2, s: PAL.skin3 });
    }
    g.px(25, 24, p.t1); g.px(25, 25, p.t2);

    // Наручи воина
    if (type === 'warrior') {
      g.rect(11, 27, 3, 2, PAL.gold2);
      g.rect(26, level >= 1 ? 26 : 27, 3, 2, PAL.gold2);
    }

    // Дипломат предпринимателя в левой руке
    if (type === 'entrepreneur') {
      g.rows(6, 29, [
        '..OOOO..',
        '.O....O.',
        'OOOOOOOO',
        'OBBBBBBO',
        'OBBGGGBO',
        'OBbbbbBO',
        'OBBBBBBO',
        'OOOOOOOO'
      ], { O: O, B: '#8A522D', b: '#5E351A', G: PAL.gold1 });
    }

    // Книга в правой руке начиная с уровня 1
    if (level >= 1) {
      g.rows(28, 22, [
        '.OOOOOO.',
        'OAAAAAAO',
        'OAaCCaAO',
        'OAaCCaAO',
        'OAaCCaAO',
        'OAaaaaAO',
        'OCCCCCBO',
        '.OOOOOO.'
      ], { O: O, A: '#E8A864', a: '#C47E38', C: PAL.cream, B: PAL.ruby });
    }
  }

  function drawHead(g, type, p) {
    var O = PAL.outline;
    // Шея
    g.rect(18, 20, 4, 3, PAL.skin3);
    g.px(17, 21, O); g.px(22, 21, O);
    g.px(17, 22, O); g.px(22, 22, O);

    // Длинные волосы сзади для Мечтателя
    if (type === 'dreamer') {
      g.rows(11, 13, [
        'OO..............OO',
        'O2O............O2O',
        'O23O..........O32O',
        'O23O..........O32O',
        'O23O..........O32O',
        '.O33O........O33O.',
        '.O33O........O33O.',
        '..OO..........OO..'
      ], { O: O, '2': p.h2, '3': p.h3 });
    }

    // База головы и уши
    g.rows(12, 9, [
      '....OOOOOOOO....',
      '..OOSSSSSSSSOO..',
      '.OSSSSSSSSSSSSO.',
      '.OSSSSSSSSSSSSO.',
      'OOSSSSSSSSSSSSOO',
      'O2SSSSSSSSSSSS2O',
      'O2SSSSSSSSSSSS2O',
      'OOSSSSSSSSSSSSOO',
      '.OSSSSSSSSSSSSO.',
      '.OSSSSSSSSSSSSO.',
      '..OO22222222OO..',
      '....OOOOOOOO....'
    ], { O: O, S: PAL.skin2, '2': PAL.skin3 });
    // Блики на лбу и лице
    g.rect(15, 11, 10, 2, PAL.skin1);
    g.rect(14, 13, 12, 5, PAL.skin1);

    // Волосы (шапка/чёлка)
    g.rows(12, 7, [
      '....OOOOOOOO....',
      '...O11111111O...',
      '..O1111111122O..',
      '.O111111112222O.',
      '.O112222222233O.',
      '.O222..2222..3O.'
    ], { O: O, '1': p.h1, '2': p.h2, '3': p.h3 });

    if (type === 'entrepreneur') {
      // Аккуратный боковой пробор
      g.rect(14, 10, 5, 2, p.h1);
      g.rect(20, 11, 6, 1, p.h2);
    } else if (type === 'warrior') {
      // Боевая повязка с лентами справа
      g.rect(13, 11, 14, 2, PAL.gold2);
      g.rect(14, 11, 12, 1, PAL.gold1);
      g.px(12, 11, O); g.px(27, 11, O);
      g.rows(27, 10, [
        'OOO..',
        '11OO.',
        '2211O',
        '.OO22'
      ], { O: O, '1': PAL.gold1, '2': PAL.gold2 });
    } else if (type === 'dreamer') {
      // Цветочек-ромашка в волосах
      g.rows(25, 10, [
        '.WW.',
        'WYYW',
        '.WW.'
      ], { W: PAL.white, Y: PAL.gold1 });
    }

    // Глаза, блики, румянец, аккуратная улыбка
    g.rect(15, 13, 2, 3, PAL.eye);
    g.px(15, 13, PAL.white);
    g.rect(23, 13, 2, 3, PAL.eye);
    g.px(23, 13, PAL.white);
    g.rect(14, 16, 2, 1, PAL.blush);
    g.rect(24, 16, 2, 1, PAL.blush);
    g.rect(19, 17, 2, 1, '#9A5440');

    // Аксессуары головы по типу
    if (type === 'thinker') {
      // Пиксельные очки с золотой оправой
      g.rect(14, 12, 4, 1, PAL.gold2); g.rect(14, 16, 4, 1, PAL.gold2);
      g.rect(13, 13, 1, 3, PAL.gold2); g.rect(18, 13, 1, 3, PAL.gold2);
      g.rect(22, 12, 4, 1, PAL.gold2); g.rect(22, 16, 4, 1, PAL.gold2);
      g.rect(21, 13, 1, 3, PAL.gold2); g.rect(26, 13, 1, 3, PAL.gold2);
      g.rect(19, 14, 2, 1, PAL.gold2);
      // Блик на стекле
      g.px(17, 13, '#A8D8FF'); g.px(25, 13, '#A8D8FF');
    }
  }

  function drawBadge(g, level, type) {
    if (level < 2 || type === 'mystic') return;
    // Небольшой золотой значок уровня на груди
    if (type === 'dreamer') {
      g.px(20, 23, PAL.gold1);
      return;
    }
    g.px(23, 24, PAL.gold1);
    g.px(22, 25, PAL.gold1); g.px(23, 25, PAL.gold2); g.px(24, 25, PAL.gold1);
    g.px(23, 26, PAL.gold2);
  }

  function drawCrown(g, level) {
    if (level < 5) return;
    var O = PAL.outline;
    g.rows(13, 2, [
      '..O...OO...O..',
      '.O1O.O11O.O1O.',
      '.O11OO11OO11O.',
      '.O1211R11211O.',
      '.O1B122221B1O.',
      '.O2222222222O.',
      '..OOOOOOOOOO..'
    ], { O: O, '1': PAL.gold1, '2': PAL.gold2, R: PAL.ruby, B: PAL.sapphire });
  }

  /* Отдельные анимированные SVG-слои (пиксельная лампочка, луна, искры, летающие книги) */
  function pxRect(x, y, w, h, c) {
    return '<rect x="' + (x * P) + '" y="' + (y * P) + '" width="' + (w * P) + '" height="' + (h * P) + '" fill="' + c + '"/>';
  }
  function pxSpark(gx, gy, c, delay) {
    return '<g class="tw" style="animation-delay:' + delay + 's">' +
      pxRect(gx, gy - 1, 1, 3, c) +
      pxRect(gx - 1, gy, 3, 1, c) +
      pxRect(gx, gy, 1, 1, '#FFFFFF') +
      '</g>';
  }
  function pxMiniBook(gx, gy, cover, spine) {
    return '<g>' +
      pxRect(gx - 1, gy - 2, 4, 5, PAL.outline) +
      pxRect(gx - 1, gy - 1, 1, 3, spine) +
      pxRect(gx, gy - 1, 2, 3, cover) +
      pxRect(gx + 1, gy, 1, 1, PAL.cream) +
      '</g>';
  }

  function extraEffects(level, type) {
    var s = '';
    // Класс-эффекты
    if (type === 'thinker') {
      // Пиксельная лампочка идеи над головой
      s += '<g class="tw">' +
        pxRect(19, 0, 2, 1, '#FFD27A') +
        pxRect(18, 1, 4, 2, '#FFE8A3') +
        pxRect(19, 2, 2, 1, '#FFFFFF') +
        pxRect(19, 3, 2, 1, '#B0A69A') +
        pxRect(16, 1, 1, 1, '#FFD27A') +
        pxRect(23, 1, 1, 1, '#FFD27A') +
        '</g>';
    } else if (type === 'mystic') {
      // Пиксельный полумесяц рядом с капюшоном
      s += '<g class="tw" style="animation-delay:.3s">' +
        pxRect(31, 7, 2, 1, PAL.gold1) +
        pxRect(30, 8, 2, 1, PAL.gold1) +
        pxRect(30, 9, 1, 2, PAL.gold2) +
        pxRect(30, 11, 2, 1, PAL.gold2) +
        pxRect(31, 12, 2, 1, PAL.gold1) +
        '</g>';
    }

    // Искры по уровням
    if (level >= 2) {
      s += pxSpark(6, 13, PAL.gold2, 0) + pxSpark(34, 18, PAL.gold1, 0.5);
    }
    if (level >= 4) {
      s += pxSpark(4, 26, PAL.gold1, 0.3) + pxSpark(35, 29, PAL.gold2, 0.8) + pxSpark(10, 6, PAL.gold1, 1.1);
    }
    if (level >= 5) {
      s += pxSpark(29, 5, PAL.gold1, 0.2) + pxSpark(3, 38, PAL.gold2, 0.7) + pxSpark(36, 39, PAL.gold1, 1.0);
    }
    return s;
  }

  function auraLayer(level) {
    if (level < 4) return '';
    var op = level >= 5 ? 0.55 : 0.38;
    var s = '<circle cx="160" cy="200" r="160" fill="url(#sbAura)" opacity="' + op + '"/>';
    // Орбитальные пиксельные книги
    s += '<g class="orbit">' +
      pxMiniBook(4, 17, '#DEA062', '#8F5620') +
      pxMiniBook(34, 14, '#7B6350', '#4A382B') +
      pxMiniBook(33, 35, '#F4ECE0', '#B0A69A') +
      (level >= 5 ? pxMiniBook(5, 34, '#5B4A9B', '#312366') : '') +
      '</g>';
    return s;
  }

  function render(type, level) {
    type = OUTFITS[type] ? type : 'base';
    level = Math.max(0, Math.min(5, level | 0));
    var p = PAL.outfit[type];
    var g = new Grid(40, 48);

    drawCape(g, level, type);
    drawMysticHoodBack(g, type, p);
    drawLegsAndTorso(g, type, p);
    drawBadge(g, level, type);
    drawArms(g, type, level, p);
    drawHead(g, type, p);
    drawCrown(g, level);

    // Пиксельная тень под ногами
    var shadow =
      '<rect x="96" y="368" width="128" height="8" fill="rgba(0,0,0,.42)"/>' +
      '<rect x="112" y="376" width="96" height="8" fill="rgba(0,0,0,.28)"/>';

    return '<svg class="hero-svg" viewBox="0 0 320 384" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Пиксельный герой Smart Books: ' + OUTFITS[type].name + ', уровень ' + level + '">' +
      '<defs><radialGradient id="sbAura"><stop offset="0" stop-color="#FFD27A" stop-opacity=".95"/><stop offset=".55" stop-color="#F5A50A" stop-opacity=".35"/><stop offset="1" stop-color="#F5A50A" stop-opacity="0"/></radialGradient></defs>' +
      auraLayer(level) +
      shadow +
      '<g class="hero-body">' + g.toSVG() + '</g>' +
      extraEffects(level, type) +
      '</svg>';
  }

  var api = { render: render, OUTFITS: OUTFITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SBHero = api;
})(typeof window !== 'undefined' ? window : this);
