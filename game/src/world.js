// AZURA BAY — the city. Classic script, no imports. Written fresh for the v12
// entry. A deterministic build (seeded RNG, so every render matches): Strand
// Boulevard running north-south, beach and sea to the east, tower blocks to the
// west, Neon Row night market on Lantern Avenue, the Azura Customs garage, tube
// palms, lit windows, billboards and a walking crowd.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  // Deterministic RNG so staged shots reproduce exactly.
  AZ.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  var rand = AZ.rng(20261124);

  function std(color, metalness, roughness, extra) {
    var p = { color: color, metalness: metalness == null ? 0.5 : metalness, roughness: roughness == null ? 0.8 : roughness };
    if (extra) for (var k in extra) p[k] = extra[k];
    return new THREE.MeshStandardMaterial(p);
  }
  function textTexture(draw, w, h) {
    var c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    var t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  }
  AZ.signTexture = function (text, sub, fg, bg) {
    return textTexture(function (g, w, h) {
      g.fillStyle = bg; g.fillRect(0, 0, w, h);
      g.strokeStyle = fg; g.lineWidth = 10; g.strokeRect(8, 8, w - 16, h - 16);
      g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
      // shrink the headline until it fits the canvas (a clipped sign reads broken)
      var size = 92;
      g.font = 'bold ' + size + 'px Arial';
      while (g.measureText(text).width > w - 36 && size > 24) { size -= 4; g.font = 'bold ' + size + 'px Arial'; }
      g.fillText(text, w / 2, sub ? h / 2 - 30 : h / 2);
      if (sub) { g.font = 'bold 44px Arial'; g.fillText(sub, w / 2, h / 2 + 52); }
    }, 512, 256);
  };

  // ---------- ground, roads, beach, sea ----------
  AZ.buildGround = function (scene) {
    var ground = new THREE.Mesh(new THREE.PlaneGeometry(520, 520), std(0x4a3f38, 0, 1));
    ground.rotation.x = -Math.PI / 2; ground.position.y = -0.05; ground.receiveShadow = true; scene.add(ground);
    // Strand Boulevard: the main north-south road (x -7.5..7.5, z 70..-150)
    var road = new THREE.Mesh(new THREE.PlaneGeometry(15, 220), std(0x2e2a30, 0, 0.92));
    road.rotation.x = -Math.PI / 2; road.position.set(0, 0, -40); road.receiveShadow = true; scene.add(road);
    // centre dashes + edge lines
    var dashMat = std(0xd8d2c0, 0, 0.8);
    for (var z = 60; z > -145; z -= 8) {
      var d = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.02, 2.4), dashMat);
      d.position.set(0, 0.02, z); scene.add(d);
    }
    for (var s = -1; s <= 1; s += 2) {
      var edge = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.02, 220), std(0xf2c14e, 0, 0.7));
      edge.position.set(s * 6.9, 0.02, -40); scene.add(edge);
    }
    // sidewalks
    for (var s2 = -1; s2 <= 1; s2 += 2) {
      var walk = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 220), std(0x8a7a68, 0, 1));
      walk.rotation.x = -Math.PI / 2; walk.position.set(s2 * 9.1, 0.03, -40); walk.receiveShadow = true; scene.add(walk);
    }
    // Lantern Avenue: the market cross street (x -34..8, z -26..-38)
    var lane = new THREE.Mesh(new THREE.PlaneGeometry(42, 12), std(0x2e2a30, 0, 0.92));
    lane.rotation.x = -Math.PI / 2; lane.position.set(-13, 0, -32); lane.receiveShadow = true; scene.add(lane);
    // beach + sea to the east
    var sand = new THREE.Mesh(new THREE.PlaneGeometry(48, 320), std(0xc9a06a, 0, 1));
    sand.rotation.x = -Math.PI / 2; sand.position.set(36, 0.02, -40); sand.receiveShadow = true; scene.add(sand);
    var sea = new THREE.Mesh(new THREE.PlaneGeometry(140, 320), std(0x2a5f8a, 0.45, 0.18));
    sea.rotation.x = -Math.PI / 2; sea.position.set(130, 0.0, -40); scene.add(sea);
    var shore = new THREE.Mesh(new THREE.PlaneGeometry(3, 320), std(0xe8d8b0, 0, 0.9));
    shore.rotation.x = -Math.PI / 2; shore.position.set(59.5, 0.04, -40); scene.add(shore);
    // beach umbrellas
    var umCols = [0xff5a5a, 0xffd23e, 0x3ec6ff, 0xff8ac2];
    for (var i = 0; i < 6; i++) {
      var ux = 20 + rand() * 24, uz = 20 - i * 18 - rand() * 6;
      var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.2, 6), std(0xeeeeee, 0, 0.6));
      pole.position.set(ux, 1.1, uz); scene.add(pole);
      var top = new THREE.Mesh(new THREE.ConeGeometry(1.7, 0.7, 10), std(umCols[i % 4], 0, 0.8));
      top.position.set(ux, 2.4, uz); top.castShadow = true; scene.add(top);
    }
  };

  // ---------- buildings with lit windows ----------
  var winMatOn = new THREE.MeshStandardMaterial({ color: 0x201a10, emissive: 0xffc46a, emissiveIntensity: 1.4 });
  var winMatOff = new THREE.MeshStandardMaterial({ color: 0x1a2028, roughness: 0.6 });
  AZ.buildBuilding = function (scene, x, z, w, h, d, col, face) {
    var g = new THREE.Group();
    var b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), std(col, 0, 0.85));
    b.position.y = h / 2; b.castShadow = true; b.receiveShadow = true; g.add(b);
    // roof rim
    var rim = new THREE.Mesh(new THREE.BoxGeometry(w + 0.4, 0.3, d + 0.4), std(0x2a2a30, 0, 0.8));
    rim.position.y = h + 0.15; g.add(rim);
    var cols = Math.max(2, Math.floor(w / 2.4)), rows = Math.max(2, Math.floor(h / 2.6));
    for (var r = 0; r < rows; r++) for (var c = 0; c < cols; c++) {
      if (rand() < 0.28) continue;
      var win = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.4), rand() < 0.62 ? winMatOn : winMatOff);
      win.position.set((c - (cols - 1) / 2) * 2.4, 2 + r * 2.6, face * (d / 2 + 0.03));
      if (face < 0) win.rotation.y = Math.PI;
      g.add(win);
    }
    g.position.set(x, 0, z);
    scene.add(g);
    return g;
  };
  AZ.buildCityBlocks = function (scene) {
    var cols = [0x5a6276, 0x6a6a7e, 0x4a5670, 0x7a6a52, 0x44506e, 0x64584a];
    var z, i;
    // west blocks: two rows of towers along the boulevard. The z=30 row is
    // skipped on purpose: the Azura Customs garage sits in that gap.
    for (z = 10; z > -140; z -= 20) {
      AZ.buildBuilding(scene, -17 - rand() * 5, z, 9 + rand() * 5, 10 + rand() * 18, 10, cols[Math.floor(rand() * cols.length)], 1);
      AZ.buildBuilding(scene, -34 - rand() * 6, z - 10, 10 + rand() * 6, 14 + rand() * 22, 11, cols[Math.floor(rand() * cols.length)], 1);
    }
    // east hotels past the beach, low and bright
    for (i = 0; i < 4; i++) {
      AZ.buildBuilding(scene, 66 + rand() * 6, 30 - i * 34, 10 + rand() * 4, 8 + rand() * 10, 10, 0xd8c8a8, -1);
    }
    // a couple of towers across the market street for the market backdrop
    AZ.buildBuilding(scene, -30, -58, 14, 24, 12, 0x6a768e, 1);
    AZ.buildBuilding(scene, -44, -18, 12, 18, 10, 0x8a8a9e, 1);
  };

  // ---------- palms ----------
  AZ.buildPalm = function (lean) {
    var g = new THREE.Group();
    var curve = new THREE.QuadraticBezierCurve3(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(lean * 0.7, 3.4, 0),
      new THREE.Vector3(lean * 1.6, 6.4, 0)
    );
    var trunk = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.17, 7), std(0x8a6b48, 0, 1));
    trunk.castShadow = true; g.add(trunk);
    var top = new THREE.Vector3(lean * 1.6, 6.4, 0);
    var frondMat = new THREE.MeshStandardMaterial({ color: 0x3f8f3a, roughness: 0.9, side: THREE.DoubleSide });
    for (var i = 0; i < 8; i++) {
      var a = (i / 8) * Math.PI * 2;
      var f = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.55), frondMat);
      f.position.set(top.x + Math.cos(a) * 1.2, top.y + 0.15, top.z + Math.sin(a) * 1.2);
      f.rotation.set(0.55, -a, 0.3, 'YXZ');
      g.add(f);
    }
    return g;
  };
  AZ.buildPalms = function (scene) {
    for (var z = 50; z > -130; z -= 15) {
      var p1 = AZ.buildPalm(1); p1.position.set(-10.8, 0, z); scene.add(p1);
      var p2 = AZ.buildPalm(-1); p2.position.set(11.2, 0, z - 7); scene.add(p2);
    }
  };

  // ---------- people ----------
  AZ.makePerson = function (shirt, pants, skin) {
    var g = new THREE.Group();
    var body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.75, 4, 8), std(shirt, 0, 0.9));
    body.position.y = 0.95; body.castShadow = true; g.add(body);
    var head = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), std(skin || 0xd8a077, 0, 0.7));
    head.position.y = 1.62; head.castShadow = true; g.add(head);
    for (var s = -1; s <= 1; s += 2) {
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.55, 8), std(pants, 0, 0.9));
      leg.position.set(s * 0.11, 0.28, 0); g.add(leg);
    }
    return g;
  };
  AZ.buildCrowd = function (scene, n, x0, x1, z0, z1) {
    var shirts = [0xff5a5a, 0xffd23e, 0x3ec6ff, 0x8affc1, 0xff8ac2, 0xf2f2ee, 0x2a2a30, 0xff9a3d];
    var group = new THREE.Group();
    for (var i = 0; i < n; i++) {
      var p = AZ.makePerson(shirts[Math.floor(rand() * shirts.length)], 0x2a2a34, [0xd8a077, 0x8a5a30, 0xf0c8a0][Math.floor(rand() * 3)]);
      p.position.set(x0 + rand() * (x1 - x0), 0, z0 + rand() * (z1 - z0));
      p.rotation.y = rand() * Math.PI * 2;
      group.add(p);
    }
    scene.add(group);
    return group;
  };

  // ---------- Neon Row night market (Lantern Avenue) ----------
  AZ.buildMarket = function (scene) {
    var g = new THREE.Group();
    var stallCols = [0xff5a5a, 0xffd23e, 0x3ec6ff, 0xff8ac2, 0x8affc1];
    var goodsCols = [0xff9a3d, 0x8affc1, 0xff5a5a, 0xffd23e, 0xc98aff];
    // stalls along both sides of Lantern Avenue
    for (var i = 0; i < 8; i++) {
      var side = i % 2 === 0 ? 1 : -1;
      var sx = -12 - Math.floor(i / 2) * 5.2, sz = side === 1 ? -27.5 : -36.5;
      var stall = new THREE.Group();
      var counter = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.9, 1.6), std(0x6a4a2a, 0, 0.9));
      counter.position.y = 0.45; counter.castShadow = true; stall.add(counter);
      var canopy = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.08, 2.2), std(stallCols[i % 5], 0, 0.7));
      canopy.position.y = 2.3; canopy.castShadow = true; stall.add(canopy);
      for (var p = -1; p <= 1; p += 2) {
        var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 2.3, 6), std(0xcccccc, 0.6, 0.4));
        pole.position.set(p * 1.7, 1.15, 0); stall.add(pole);
      }
      for (var k = 0; k < 5; k++) {
        var good = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), std(goodsCols[(i + k) % 5], 0, 0.6));
        good.position.set(-1.2 + k * 0.6, 1.05, 0); stall.add(good);
      }
      stall.position.set(sx, 0, sz);
      g.add(stall);
    }
    // string lights across the avenue (catenary rows of glowing bulbs)
    var bulbMat = new THREE.MeshStandardMaterial({ color: 0x332211, emissive: 0xffd9a0, emissiveIntensity: 2.2 });
    for (var row = 0; row < 4; row++) {
      var rz = -24 - row * 4.5;
      var wire = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 26, 4), std(0x222222, 0, 0.8));
      wire.rotation.z = Math.PI / 2; wire.position.set(-14, 4.6 - row * 0.12, rz); g.add(wire);
      for (var b = -12; b <= 12; b += 2) {
        var bulb = new THREE.Mesh(new THREE.SphereGeometry(0.11, 8, 6), bulbMat);
        bulb.position.set(b, 4.55 - row * 0.12 - Math.abs(b) * 0.02, rz); g.add(bulb);
      }
    }
    // neon signs on the market buildings
    function neonSign(tex, x, y, z, w, h, ry) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
        new THREE.MeshStandardMaterial({ map: tex, emissive: 0xffffff, emissiveMap: tex, emissiveIntensity: 1.6, transparent: true }));
      m.position.set(x, y, z); m.rotation.y = ry; g.add(m);
      var glow = AZ.glowSprite(AZ.glowRed, 6, 0.3); glow.position.set(x, y, z + 0.4); g.add(glow);
    }
    neonSign(AZ.signTexture('RAMEN', '24H', '#ff5ad2', '#1a0a1e'), -12.2, 6.5, -30, 7, 3.5, Math.PI / 2);
    neonSign(AZ.signTexture('NEON ROW', '', '#3ec6ff', '#0a1a2e'), -28, 6.5, -26, 8, 4, Math.PI / 2);
    neonSign(AZ.signTexture('TAKOYAKI', '', '#ffd23e', '#1a1408'), -30, 6, -36, 6, 3, Math.PI / 2);
    scene.add(g);
    return g;
  };

  // ---------- Azura Customs garage ----------
  AZ.buildGarage = function (scene) {
    var g = new THREE.Group();
    // floor + back wall + side walls (open front toward the camera)
    var floor = new THREE.Mesh(new THREE.PlaneGeometry(16, 12), std(0x3a3a40, 0, 0.95));
    floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0.05, 0); floor.receiveShadow = true; g.add(floor);
    var back = new THREE.Mesh(new THREE.BoxGeometry(16, 7, 0.4), std(0x2a2a30, 0, 0.9));
    back.position.set(0, 3.5, -6); back.receiveShadow = true; g.add(back);
    for (var s = -1; s <= 1; s += 2) {
      var wall = new THREE.Mesh(new THREE.BoxGeometry(0.4, 7, 12), std(0x33333a, 0, 0.9));
      wall.position.set(s * 8, 3.5, 0); g.add(wall);
    }
    // big AZURA CUSTOMS sign on the back wall
    var sign = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.0),
      new THREE.MeshStandardMaterial({ map: AZ.signTexture('AZURA CUSTOMS', '24K GOLD PAINT', '#ffd23e', '#1a1408'), emissive: 0xffffff, emissiveMap: AZ.signTexture('AZURA CUSTOMS', '24K GOLD PAINT', '#ffd23e', '#1a1408'), emissiveIntensity: 1.2 }));
    sign.position.set(-1.5, 3.6, -5.75); g.add(sign);
    // toolboxes + tyre stacks
    var box1 = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.8), std(0xb02020, 0.4, 0.5));
    box1.position.set(-6.5, 0.55, -4.5); box1.castShadow = true; g.add(box1);
    var box2 = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.9, 0.7), std(0x2a6ab0, 0.4, 0.5));
    box2.position.set(6.5, 0.45, -4.5); box2.castShadow = true; g.add(box2);
    for (var i = 0; i < 3; i++) {
      var tyre = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16), std(0x111111, 0, 0.9));
      tyre.position.set(7.0, 0.21 + i * 0.32, -2.5); tyre.castShadow = true; g.add(tyre);
    }
    // a teal project car on the lift at the back
    var lift = AZ.buildTrafficCar('sedan', 0x2a9a8a);
    lift.position.set(-4.5, 0.9, -3.5); lift.rotation.y = 0.4; g.add(lift);
    var liftBase = new THREE.Mesh(new THREE.BoxGeometry(5.4, 0.9, 2.4), std(0x444444, 0.5, 0.6));
    liftBase.position.set(-4.5, 0.45, -3.5); g.add(liftBase);
    // spray particles: small gold points floating around the hero spot
    var pGeo = new THREE.BufferGeometry();
    var pPos = [];
    for (var p2 = 0; p2 < 120; p2++) {
      pPos.push((rand() - 0.5) * 4 + 1.5, 0.5 + rand() * 2.2, (rand() - 0.5) * 3);
    }
    pGeo.setAttribute('position', new THREE.Float32BufferAttribute(pPos, 3));
    var pts = new THREE.Points(pGeo, new THREE.PointsMaterial({ color: 0xffd23e, size: 0.09, transparent: true, opacity: 0.85 }));
    pts.position.set(0, 0, 0); g.add(pts);
    // work lights: two warm cones from the ceiling
    for (var l = -1; l <= 1; l += 2) {
      var lamp = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8),
        new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffe9b0, emissiveIntensity: 3 }));
      lamp.position.set(l * 4, 6.4, 0); g.add(lamp);
      var cone = new THREE.Mesh(new THREE.ConeGeometry(3.2, 6, 20, 1, true),
        new THREE.MeshBasicMaterial({ color: 0xffe9b0, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
      cone.position.set(l * 4, 3.4, 0); g.add(cone);
    }
    g.position.set(-18, 0, 34);
    scene.add(g);
    return g;
  };

  // ---------- billboards ----------
  AZ.buildBillboards = function (scene) {
    var boards = [
      { x: -12.5, y: 14, z: -8, w: 10, h: 5, tex: AZ.signTexture('SOLARA GT', '0-100 IN 2.9s', '#ffd23e', '#101018'), ry: 0 },
      { x: -12.5, y: 12, z: -70, w: 9, h: 4.5, tex: AZ.signTexture('AZURA 98.4', 'ISLAND POP', '#3ec6ff', '#0a1420'), ry: 0 },
      { x: -12.5, y: 15, z: -95, w: 10, h: 5, tex: AZ.signTexture('MARINA QUAY', 'HARBOUR DRIVE', '#ff8ac2', '#1a0a14'), ry: 0 }
    ];
    for (var i = 0; i < boards.length; i++) {
      var b = boards[i];
      var m = new THREE.Mesh(new THREE.PlaneGeometry(b.w, b.h),
        new THREE.MeshStandardMaterial({ map: b.tex, emissive: 0xffffff, emissiveMap: b.tex, emissiveIntensity: 1.1 }));
      m.position.set(b.x, b.y, b.z); m.rotation.y = b.ry; scene.add(m);
    }
  };

  // ---------- scooter (traffic variety) ----------
  AZ.buildScooter = function (color) {
    var g = new THREE.Group();
    var paint = std(color, 0.5, 0.4);
    var body = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.35, 0.5), paint);
    body.position.y = 0.55; body.castShadow = true; g.add(body);
    var nose = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.5, 0.45), paint);
    nose.position.set(0.7, 0.75, 0); nose.rotation.z = -0.3; g.add(nose);
    var seat = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 0.45), std(0x1a1a1a, 0, 0.9));
    seat.position.set(-0.35, 0.78, 0); g.add(seat);
    var wheelGeo = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 14);
    for (var w = -1; w <= 1; w += 2) {
      var wh = new THREE.Mesh(wheelGeo, std(0x111111, 0, 0.9));
      wh.rotation.x = Math.PI / 2; wh.position.set(w * 0.65, 0.26, 0); wh.castShadow = true; g.add(wh);
    }
    var lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.1, 0.2),
      new THREE.MeshBasicMaterial({ color: 0xfff3c4, toneMapped: false }));
    lamp.position.set(0.92, 0.7, 0); g.add(lamp);
    var rider = AZ.makePerson(0xff5a5a, 0x2a2a34);
    rider.position.set(-0.25, 0.35, 0); rider.scale.setScalar(0.95); g.add(rider);
    return g;
  };
})();
