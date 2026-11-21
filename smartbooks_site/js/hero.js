/* Smart Books — герой. Рисуется слоями: база -> наряд (по категории) -> предметы уровня */
(function (root) {
  var SKIN = '#F0C4A0', SKIN2 = '#E2AE88', HAIR = '#3A2A22';
  var AMBER = '#F5A50A', CREAM = '#F4ECE0';

  var OUTFITS = {
    base:         { name: 'Новичок',        torso: '#8E949F', pants: '#3C4B66', shoes: '#E8E8E8' },
    thinker:      { name: 'Мыслитель',      torso: '#7B6350', pants: '#4B4B52', shoes: '#2B2623' },
    entrepreneur: { name: 'Предприниматель',torso: '#1F2F4A', pants: '#1F2F4A', shoes: '#15110F' },
    warrior:      { name: 'Воин',           torso: '#2B2623', pants: '#1E1E22', shoes: '#15110F' },
    mystic:       { name: 'Мистик',         torso: '#3B2F6B', pants: '#3B2F6B', shoes: '#2B2250' },
    dreamer:      { name: 'Мечтатель',      torso: '#E9A4B6', pants: '#6F6A8F', shoes: '#F4ECE0' }
  };

  function star(cx, cy, r, fill) {
    var pts = [];
    for (var i = 0; i < 10; i++) {
      var ang = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r * 0.45 : r;
      pts.push((cx + Math.cos(ang) * rad).toFixed(1) + ',' + (cy + Math.sin(ang) * rad).toFixed(1));
    }
    return '<polygon points="' + pts.join(' ') + '" fill="' + fill + '"/>';
  }
  function spark(x, y, s, d) {
    return '<g class="tw" style="animation-delay:' + d + 's"><path d="M' + x + ' ' + (y - s) + ' L' + (x + s * 0.3) + ' ' + (y - s * 0.3) + ' L' + (x + s) + ' ' + y + ' L' + (x + s * 0.3) + ' ' + (y + s * 0.3) + ' L' + x + ' ' + (y + s) + ' L' + (x - s * 0.3) + ' ' + (y + s * 0.3) + ' L' + (x - s) + ' ' + y + ' L' + (x - s * 0.3) + ' ' + (y - s * 0.3) + 'Z" fill="' + AMBER + '"/></g>';
  }
  function miniBook(x, y, rot, c) {
    return '<g transform="translate(' + x + ' ' + y + ') rotate(' + rot + ')"><rect x="-13" y="-17" width="26" height="34" rx="3" fill="' + c + '"/><rect x="-13" y="-17" width="5" height="34" rx="2" fill="rgba(0,0,0,.25)"/><rect x="-4" y="-9" width="14" height="3" rx="1.5" fill="rgba(255,255,255,.6)"/><rect x="-4" y="-2" width="10" height="3" rx="1.5" fill="rgba(255,255,255,.4)"/></g>';
  }

  /* ---------- слои ---------- */
  function aura(level) {
    if (level < 4) return '';
    var op = level >= 5 ? 0.55 : 0.38;
    return '<circle cx="160" cy="215" r="165" fill="url(#sbAura)" opacity="' + op + '"/>' +
      '<g class="orbit">' + miniBook(52, 140, -18, '#DEA062') + miniBook(270, 120, 16, '#7B6350') + miniBook(262, 300, -10, '#F4ECE0') + (level >= 5 ? miniBook(58, 290, 12, '#3B2F6B') : '') + '</g>';
  }
  function cape(level, type) {
    if (level < 3) return '';
    var c = type === 'mystic' ? '#5B4A9B' : (type === 'dreamer' ? '#C97A94' : '#C9822F');
    return '<path d="M104 182 C70 230 56 300 52 352 L268 352 C264 300 250 230 216 182 Z" fill="' + c + '"/>' +
           '<path d="M104 182 C80 230 70 300 70 352 L110 352 C110 290 112 230 124 190Z" fill="rgba(0,0,0,.18)"/>';
  }
  function legs(o, type) {
    if (type === 'mystic') return '';
    return '<rect x="125" y="282" width="32" height="74" rx="10" fill="' + o.pants + '"/><rect x="163" y="282" width="32" height="74" rx="10" fill="' + o.pants + '"/>' +
      '<ellipse cx="139" cy="362" rx="22" ry="9" fill="' + o.shoes + '"/><ellipse cx="181" cy="362" rx="22" ry="9" fill="' + o.shoes + '"/>' +
      (type === 'base' ? '<rect x="118" y="360" width="42" height="4" rx="2" fill="#C9CCD2"/><rect x="160" y="360" width="42" height="4" rx="2" fill="#C9CCD2"/>' : '');
  }
  function torso(o, type) {
    var t = '<rect x="104" y="174" width="112" height="116" rx="26" fill="' + o.torso + '"/>';
    if (type === 'mystic') {
      t = '<path d="M104 190 C104 176 216 176 216 190 L238 364 L82 364 Z" fill="' + o.torso + '"/>' +
          '<path d="M160 176 L160 364" stroke="rgba(255,255,255,.12)" stroke-width="3"/>' +
          star(124, 250, 6, CREAM) + star(198, 300, 5, AMBER) + star(142, 330, 4, CREAM) + star(188, 228, 4, CREAM);
    }
    return t;
  }
  function arms(o, type) {
    var sl = o.torso, hand = SKIN;
    var L = '<path d="M108 190 C92 214 88 246 90 274" stroke="' + sl + '" stroke-width="28" stroke-linecap="round" fill="none"/>';
    var R = '<path d="M212 190 C228 214 232 246 230 274" stroke="' + sl + '" stroke-width="28" stroke-linecap="round" fill="none"/>';
    var hands = '<circle cx="90" cy="282" r="13" fill="' + hand + '"/><circle cx="230" cy="282" r="13" fill="' + hand + '"/>';
    var extra = '';
    if (type === 'warrior') extra = '<rect x="78" y="256" width="26" height="14" rx="5" fill="' + AMBER + '"/><rect x="216" y="256" width="26" height="14" rx="5" fill="' + AMBER + '"/>';
    return L + R + extra + hands;
  }
  function outfitDetails(type) {
    switch (type) {
      case 'thinker':
        return '<path d="M144 176 L160 214 L176 176 Z" fill="' + CREAM + '"/>' +
               '<rect x="157" y="212" width="6" height="78" fill="rgba(0,0,0,.25)"/>' +
               '<circle cx="160" cy="236" r="3" fill="' + CREAM + '"/><circle cx="160" cy="258" r="3" fill="' + CREAM + '"/>';
      case 'entrepreneur':
        return '<path d="M140 176 L160 226 L180 176 Z" fill="#FFFFFF"/>' +
               '<path d="M156 188 L164 188 L168 202 L160 258 L152 202 Z" fill="' + AMBER + '"/>' +
               '<path d="M140 176 L128 232 L158 224 Z" fill="#162239"/><path d="M180 176 L192 232 L162 224 Z" fill="#162239"/>';
      case 'warrior':
        return '<path d="M104 196 L216 262 L216 284 L104 218 Z" fill="' + AMBER + '"/>' +
               '<rect x="104" y="282" width="112" height="9" rx="4" fill="' + AMBER + '"/>';
      case 'dreamer':
        return '<path d="M160 244 C142 226 144 208 156 208 C160 208 160 212 160 214 C160 212 160 208 164 208 C176 208 178 226 160 244Z" fill="#E94B6A"/>';
      case 'mystic':
        return '<path d="M146 190 C146 226 176 226 176 190 C168 208 154 208 146 190Z" fill="' + AMBER + '"/>';
      default: return '';
    }
  }
  function head(type) {
    var s = '';
    if (type === 'mystic') s += '<path d="M104 150 C100 80 220 80 216 150 C214 178 106 178 104 150Z" fill="#2B2250"/>';
    s += '<rect x="149" y="156" width="22" height="24" rx="8" fill="' + SKIN2 + '"/>';
    s += '<circle cx="113" cy="124" r="9" fill="' + SKIN2 + '"/><circle cx="207" cy="124" r="9" fill="' + SKIN2 + '"/>';
    s += '<circle cx="160" cy="120" r="48" fill="' + SKIN + '"/>';
    // волосы
    if (type === 'dreamer') {
      s += '<path d="M110 118 C106 66 214 66 210 118 C204 92 116 92 110 118Z" fill="#6B3E2E"/><path d="M110 112 C100 150 104 176 118 188 L122 128Z" fill="#6B3E2E"/><path d="M210 112 C220 150 216 176 202 188 L198 128Z" fill="#6B3E2E"/>';
    } else if (type === 'mystic') {
      s += '<path d="M116 108 C122 80 198 80 204 108 C190 94 130 94 116 108Z" fill="#2B2223"/>';
    } else if (type === 'entrepreneur') {
      s += '<path d="M112 112 C110 70 210 66 208 112 C200 90 150 82 128 98 C122 102 116 108 112 112Z" fill="#1E1715"/>';
    } else {
      s += '<path d="M111 114 C108 68 212 66 209 114 C200 92 120 90 111 114Z" fill="' + HAIR + '"/>';
    }
    // лицо
    s += '<circle cx="143" cy="124" r="4.6" fill="#2B1F1A"/><circle cx="177" cy="124" r="4.6" fill="#2B1F1A"/>';
    s += '<circle cx="144.5" cy="122.5" r="1.4" fill="#fff"/><circle cx="178.5" cy="122.5" r="1.4" fill="#fff"/>';
    s += '<path d="M146 141 Q160 154 174 141" stroke="#8A4B3A" stroke-width="3.4" stroke-linecap="round" fill="none"/>';
    s += '<circle cx="132" cy="138" r="6" fill="#F2A39A" opacity=".45"/><circle cx="188" cy="138" r="6" fill="#F2A39A" opacity=".45"/>';
    // аксессуары по типу
    if (type === 'thinker') {
      s += '<circle cx="143" cy="124" r="13" fill="rgba(255,255,255,.12)" stroke="' + AMBER + '" stroke-width="3.2"/><circle cx="177" cy="124" r="13" fill="rgba(255,255,255,.12)" stroke="' + AMBER + '" stroke-width="3.2"/><path d="M156 124 L164 124" stroke="' + AMBER + '" stroke-width="3"/>';
      s += '<g class="tw"><circle cx="160" cy="36" r="13" fill="#FFD27A"/><rect x="154" y="48" width="12" height="8" rx="2" fill="#B0A69A"/><path d="M160 12 L160 6 M182 22 L187 17 M138 22 L133 17 M190 38 L196 38 M130 38 L124 38" stroke="#FFD27A" stroke-width="3" stroke-linecap="round"/></g>';
    }
    if (type === 'warrior') s += '<path d="M112 100 C130 88 190 88 208 100 L208 112 C190 102 130 102 112 112Z" fill="' + AMBER + '"/><path d="M208 104 L232 98 M208 108 L236 112" stroke="' + AMBER + '" stroke-width="5" stroke-linecap="round"/>';
    if (type === 'dreamer') s += '<g transform="translate(206 84)"><circle r="6" fill="#FFD27A"/><circle cx="0" cy="-10" r="7" fill="#fff"/><circle cx="10" cy="-3" r="7" fill="#fff"/><circle cx="6" cy="8" r="7" fill="#fff"/><circle cx="-6" cy="8" r="7" fill="#fff"/><circle cx="-10" cy="-3" r="7" fill="#fff"/><circle r="5" fill="#FFD27A"/></g>';
    if (type === 'mystic') s += '<path d="M206 70 C192 70 190 96 206 98 C198 90 198 78 206 70Z" fill="' + AMBER + '"/>';
    return s;
  }
  function props(level, type) {
    var s = '';
    if (type === 'entrepreneur') s += '<g><rect x="62" y="290" width="46" height="34" rx="5" fill="#7A4B2B"/><rect x="76" y="282" width="18" height="10" rx="3" fill="none" stroke="#7A4B2B" stroke-width="4"/><rect x="62" y="304" width="46" height="4" fill="#5A3519"/></g>';
    if (level >= 1) s += '<g transform="translate(236 276) rotate(-14)"><rect x="-17" y="-22" width="34" height="44" rx="4" fill="#DEA062"/><rect x="-17" y="-22" width="7" height="44" rx="3" fill="rgba(0,0,0,.25)"/><rect x="-5" y="-12" width="18" height="4" rx="2" fill="rgba(255,255,255,.65)"/><rect x="-5" y="-4" width="13" height="4" rx="2" fill="rgba(255,255,255,.45)"/></g><circle cx="230" cy="282" r="13" fill="' + SKIN + '"/>';
    if (level >= 2) s += star(160, 204, 11, AMBER);
    return s;
  }
  function crown(level) {
    if (level < 5) return '';
    return '<ellipse cx="160" cy="66" rx="62" ry="12" fill="none" stroke="#FFD27A" stroke-width="4" opacity=".9"/>' +
           '<path d="M126 78 L134 48 L148 66 L160 40 L172 66 L186 48 L194 78 Z" fill="#FFD27A" stroke="#C9822F" stroke-width="2.5" stroke-linejoin="round"/>' +
           '<circle cx="160" cy="46" r="4" fill="#E94B6A"/><circle cx="134" cy="52" r="3" fill="#6FB1FF"/><circle cx="186" cy="52" r="3" fill="#6FB1FF"/>';
  }
  function sparkles(level) {
    var s = '';
    if (level >= 2) s += spark(76, 110, 9, 0) + spark(250, 160, 7, .6);
    if (level >= 4) s += spark(40, 210, 8, .3) + spark(284, 236, 10, .9) + spark(96, 60, 6, 1.2);
    if (level >= 5) s += spark(214, 40, 9, .4) + spark(30, 320, 7, .7) + spark(292, 330, 8, 1.1);
    return s;
  }

  function render(type, level) {
    type = OUTFITS[type] ? type : 'base';
    level = Math.max(0, Math.min(5, level | 0));
    var o = OUTFITS[type];
    return '<svg class="hero-svg" viewBox="0 0 320 390" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Герой Smart Books: ' + o.name + ', уровень ' + level + '">' +
      '<defs><radialGradient id="sbAura"><stop offset="0" stop-color="#FFD27A" stop-opacity=".95"/><stop offset=".55" stop-color="#F5A50A" stop-opacity=".35"/><stop offset="1" stop-color="#F5A50A" stop-opacity="0"/></radialGradient></defs>' +
      aura(level) +
      '<ellipse cx="160" cy="372" rx="84" ry="10" fill="rgba(0,0,0,.45)"/>' +
      '<g class="hero-body">' +
        cape(level, type) + legs(o, type) + torso(o, type) + outfitDetails(type) + arms(o, type) + props(level, type) + head(type) + crown(level) +
      '</g>' + sparkles(level) + '</svg>';
  }

  var api = { render: render, OUTFITS: OUTFITS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SBHero = api;
})(typeof window !== 'undefined' ? window : this);
