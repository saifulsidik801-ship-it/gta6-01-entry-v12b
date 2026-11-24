// AZURA BAY — HUD. Classic script, no imports. Written fresh for the v12 entry.
// Builds the whole in-game overlay as DOM: mission panel, police response,
// district + minimap + health/armour, cash + wanted stars, rank + weapons +
// crew, speedometer, dialogue bar, and the map-shot route banner + district
// labels. Same panels and density as the v11b HUD — not redesigned.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  function el(tag, cls, parent, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }

  AZ.buildHUD = function () {
    var hud = el('div', 'hud', document.body);
    // top-left: mission panel
    var mp = el('div', 'panel mission', hud);
    var mtop = el('div', 'mission-top', mp);
    el('span', 'stage', mtop, '');
    el('span', 'mission-id', mtop, '');
    el('div', 'mission-title', mp, '');
    el('div', 'mission-bar', mp, '<div class="mission-fill"></div>');
    el('div', 'mission-obj', mp, '');
    el('div', 'mission-next', mp, '');
    // left-mid: police response
    var apd = el('div', 'panel apd', hud);
    el('div', 'apd-head', apd, '<span>APD RESPONSE</span><span class="apd-count"></span>');
    el('div', 'apd-list', apd, '');
    // bottom-left: district + minimap + vitals
    var bl = el('div', 'bl', hud);
    el('div', 'district', bl, '');
    el('div', 'street', bl, '');
    el('div', 'district-bar', bl, '<div class="district-fill"></div>');
    var mm = el('canvas', 'minimap', bl);
    mm.width = 210; mm.height = 130;
    var vit = el('div', 'vitals', bl);
    el('div', 'vital', vit, '<span>HEALTH</span><div class="bar"><div class="fill health"></div></div><b class="health-n"></b>');
    el('div', 'vital', vit, '<span>ARMOUR</span><div class="bar"><div class="fill armour"></div></div><b class="armour-n"></b>');
    // top-right: time, cash, stars, air unit
    var tr = el('div', 'tr', hud);
    el('div', 'clock', tr, '');
    el('div', 'cash', tr, '');
    el('div', 'stars', tr, '★★★★★');
    el('div', 'airunit', tr, '▲ AIR UNIT DEPLOYED');
    // right-mid: rank + weapons + crew
    var rm = el('div', 'rm', hud);
    var rk = el('div', 'panel rank', rm);
    el('div', 'rank-row', rk, '<span class="rank-letter"></span><span class="rank-title"></span>');
    el('div', 'rank-bar', rk, '<div class="rank-fill"></div>');
    el('div', 'rank-rp', rk, '');
    var wp = el('div', 'weapons', rm);
    for (var i = 0; i < AZ.WEAPONS.length; i++) {
      var w = AZ.WEAPONS[i];
      el('div', 'weapon' + (i === 2 ? ' active' : ''), wp,
        '<div class="w-num">' + w.n + '</div><div class="w-icon">' + w.icon + '</div><div class="w-name">' + w.name + '</div><div class="w-ammo">' + w.ammo + '</div>');
    }
    for (var j = 0; j < AZ.CREW.length; j++) {
      var c = AZ.CREW[j];
      var cr = el('div', 'panel crew', rm);
      cr.innerHTML = '<div class="crew-key" style="background:' + c.color + '">' + c.key + '</div>' +
        '<div class="crew-body"><div class="crew-name">' + c.name + '</div><div class="crew-who">' + c.who + '</div></div>' +
        '<div class="crew-btn">' + c.key + '</div>';
    }
    // bottom-right: speedometer
    var br = el('div', 'br', hud);
    el('div', 'speed', br, '');
    el('div', 'speed-unit', br, 'KM/H');
    el('div', 'car-name', br, '');
    el('div', 'dented', br, '');
    el('div', 'radio', br, '');
    // bottom-centre: dialogue
    var dlg = el('div', 'panel dialogue', hud);
    el('div', 'dlg-avatar', dlg, '');
    el('div', 'dlg-body', dlg, '<div class="dlg-name"></div><div class="dlg-text"></div>');
    // map shot: route banner + district labels
    var route = el('div', 'panel route', hud);
    el('div', 'route-title', route, 'ROUTE — THE GLASS RUN');
    el('div', 'route-sub', route, '');
    var labels = el('div', 'map-labels', hud);
    el('div', 'map-title', labels, 'AZURA BAY<span>CITY OF GLASS AND GOLD</span>');
    for (var k = 0; k < AZ.DISTRICTS.length; k++) {
      var d = AZ.DISTRICTS[k];
      var lab = el('div', 'map-label', labels, d.name + '<span>' + d.sub + '</span>');
      lab.style.left = d.x + '%'; lab.style.top = d.y + '%';
    }
    hud.style.display = 'none';
    return hud;
  };

  AZ.updateHUD = function (m) {
    var s = AZ.state;
    var q = function (sel) { return document.querySelector(sel); };
    q('.stage').textContent = m.stage;
    q('.mission-id').textContent = 'MISSION ' + m.id + ' — ' + (m.id === 6 ? 'THE GLASS RUN' : m.id === 2 ? 'LANTERN RUN' : 'GOLD STANDARD');
    q('.mission-title').textContent = m.title;
    q('.mission-obj').textContent = m.objective;
    q('.mission-next').innerHTML = '<b>NEXT</b> ' + m.next;
    q('.mission-fill').style.width = (m.stage === 'STAGE 2/4' ? 50 : 75) + '%';
    var apdList = q('.apd-list');
    if (m.units.length === 0) {
      apdList.innerHTML = '<div class="apd-clear">NO UNITS ON SCENE — YOU ARE CLEAR</div>';
    } else {
      var html = '';
      for (var i = 0; i < m.units.length; i++) {
        var u = m.units[i];
        html += '<div class="apd-row"><span class="dot"></span><span class="unit">' + u[0] + '</span><span class="role">' + u[1] + '</span><span class="dist">' + u[2] + '</span></div>';
      }
      html += '<div class="apd-more">+ 1 more</div>';
      apdList.innerHTML = html;
    }
    q('.apd-count').textContent = m.unitCount + ' UNITS';
    q('.district').textContent = m.district;
    q('.street').textContent = m.street;
    q('.clock').textContent = m.time;
    q('.cash').textContent = '$' + s.cash.toLocaleString('en-US');
    q('.stars').textContent = '★★★★★';
    q('.stars').style.color = s.wanted >= 4 ? '#ffd23e' : '#888888';
    q('.airunit').style.visibility = s.wanted >= 3 ? 'visible' : 'hidden';
    q('.rank-letter').textContent = 'RANK ' + s.rank;
    q('.rank-title').textContent = s.title;
    q('.rank-fill').style.width = Math.round(s.rp / s.rpMax * 100) + '%';
    q('.rank-rp').textContent = s.rp.toLocaleString('en-US') + ' / ' + s.rpMax.toLocaleString('en-US') + ' RP';
    q('.speed').textContent = Math.round(s.speed);
    q('.car-name').textContent = m.car;
    q('.dented').textContent = m.dented + '% DENTED';
    q('.radio').textContent = '♪ ' + s.radio;
    q('.health-n').textContent = s.health;
    q('.armour-n').textContent = s.armour;
    q('.fill.health').style.width = s.health + '%';
    q('.fill.armour').style.width = s.armour + '%';
    q('.dlg-avatar').textContent = m.initials;
    q('.dlg-avatar').style.background = m.color;
    q('.dlg-name').textContent = m.speaker;
    q('.dlg-name').style.color = m.color;
    q('.dlg-text').textContent = m.dialogue;
    var route = q('.route');
    if (m.route) { route.style.display = 'block'; q('.route-sub').textContent = m.route; }
    else route.style.display = 'none';
    var labels = q('.map-labels');
    labels.style.display = m.route ? 'block' : 'none';
    AZ.drawMinimap(q('.minimap'));
  };

  // Stylised minimap: street grid, beach, route line, unit dots, hero arrow.
  AZ.drawMinimap = function (cv) {
    if (!cv) return;
    var g = cv.getContext('2d');
    var W = cv.width, H = cv.height;
    g.fillStyle = '#1c2733'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#2e3d4d';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) g.fillRect(14 + c * 34, 12 + r * 20, 28, 15);
    g.fillStyle = '#c9a06a'; g.fillRect(150, 0, 34, H);
    g.fillStyle = '#2a5f8a'; g.fillRect(184, 0, 26, H);
    g.strokeStyle = '#f2c14e'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(100, 6); g.lineTo(100, H - 6); g.stroke();
    g.strokeStyle = '#ff5a5a'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(100, 100); g.lineTo(60, 70); g.lineTo(60, 30); g.stroke();
    g.fillStyle = '#3ec6ff';
    var dots = [[96, 88], [104, 60], [88, 40], [60, 30]];
    for (var i = 0; i < dots.length; i++) { g.beginPath(); g.arc(dots[i][0], dots[i][1], 3, 0, 7); g.fill(); }
    g.fillStyle = '#ffd23e'; g.beginPath(); g.arc(150, 100, 4, 0, 7); g.fill();
    // hero arrow
    g.fillStyle = '#ffffff';
    g.beginPath(); g.moveTo(100, 84); g.lineTo(94, 96); g.lineTo(106, 96); g.closePath(); g.fill();
    g.fillStyle = '#ffffff'; g.font = 'bold 11px Arial'; g.fillText('N', 8, 14);
    g.fillStyle = '#9ab'; g.font = '9px Arial'; g.fillText('AZURA BAY', 8, H - 6);
  };
})();
