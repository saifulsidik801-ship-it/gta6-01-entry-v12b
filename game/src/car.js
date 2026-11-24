// AZURA BAY — car builders. Classic script, no imports. Written fresh for the
// v12 entry. The hero Solara GT is a LOFTED SKIN, never stacked boxes: 11
// rounded cross-section rings swept nose-to-tail, skinned into one smooth
// BufferGeometry, so the flanks curve and light slides across them instead of
// sitting flat on a slab. Doors, roof panel, windshield and pillars are curved
// patches sampled off the same rings, so they follow the body's curvature.
// Paint is clearcoat physical material; glass is dark and glossy; lamps are
// lenses plus additive glow sprites plus a beam pool on the road.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  // ---------- shared helpers ----------
  function glowTexture(inner, outer) {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d');
    var grad = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    grad.addColorStop(0, inner); grad.addColorStop(1, outer);
    g.fillStyle = grad; g.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(c);
  }
  AZ.glowWhite = glowTexture('rgba(255,244,200,0.95)', 'rgba(255,244,200,0)');
  AZ.glowRed = glowTexture('rgba(255,42,42,0.9)', 'rgba(255,42,42,0)');
  AZ.glowBlue = glowTexture('rgba(70,130,255,0.9)', 'rgba(70,130,255,0)');
  AZ.glowGold = glowTexture('rgba(255,205,90,0.95)', 'rgba(255,205,90,0)');

  AZ.glowSprite = function (tex, scale, opacity) {
    var m = new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: opacity });
    var s = new THREE.Sprite(m); s.scale.set(scale, scale, 1); return s;
  };

  function std(color, metalness, roughness, extra) {
    var p = { color: color, metalness: metalness == null ? 0.5 : metalness, roughness: roughness == null ? 0.35 : roughness };
    if (extra) for (var k in extra) p[k] = extra[k];
    return new THREE.MeshStandardMaterial(p);
  }
  function box(w, h, d, mat, x, y, z) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z); m.castShadow = true; return m;
  }
  function paintMaterial(color) {
    return new THREE.MeshPhysicalMaterial({
      color: color, metalness: 0.55, roughness: 0.30,
      clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.1
    });
  }

  // ---------- loft machinery ----------
  // A ring is a rounded section: exponent 1.0 is a true ellipse, so the flank
  // is a genuine curve (the old 0.48 exponent made squarish flat sides — that
  // was the "kotak" look). The crown is flattened a little for a car roofline,
  // and the top pulls in slightly (tumblehome).
  function ringPoint(st, a, exp, crown) {
    var ca = Math.cos(a), sa = Math.sin(a);
    var px = Math.sign(ca) * Math.pow(Math.abs(ca), exp);
    var py = Math.sign(sa) * Math.pow(Math.abs(sa), exp);
    if (py > crown) py = crown + (py - crown) * 0.45;
    if (py > 0) px *= (1 - 0.08 * py * py);
    var yc = (st.fl + st.bl) / 2, hh = (st.bl - st.fl) / 2;
    return { x: st.x, y: yc + py * hh, z: px * st.hw, ny: sa, nz: ca };
  }
  function catmull(a, b, c, d, u) {
    return 0.5 * ((2 * b) + (-a + c) * u + (2 * a - 5 * b + 4 * c - d) * u * u + (-a + 3 * b - 3 * c + d) * u * u * u);
  }
  function sampleStations(stations, t) {
    var n = stations.length - 1;
    var f = Math.max(0, Math.min(1, t)) * n;
    var i = Math.min(Math.floor(f), n - 1), u = f - i;
    var p0 = stations[Math.max(0, i - 1)], p1 = stations[i];
    var p2 = stations[Math.min(n, i + 1)], p3 = stations[Math.min(n, i + 2)];
    return {
      x: catmull(p0.x, p1.x, p2.x, p3.x, u),
      hw: catmull(p0.hw, p1.hw, p2.hw, p3.hw, u),
      fl: catmull(p0.fl, p1.fl, p2.fl, p3.fl, u),
      bl: catmull(p0.bl, p1.bl, p2.bl, p3.bl, u)
    };
  }
  // Closed loft: one smooth skin over all stations, end caps fanned to centre.
  function loftGeometry(stations, ns, nr, exp, crown) {
    var pos = [], idx = [], s, r;
    for (s = 0; s <= ns; s++) {
      var st = sampleStations(stations, s / ns);
      for (r = 0; r <= nr; r++) {
        var p = ringPoint(st, (r / nr) * Math.PI * 2, exp, crown);
        pos.push(p.x, p.y, p.z);
      }
    }
    for (s = 0; s < ns; s++) for (r = 0; r < nr; r++) {
      var a0 = s * (nr + 1) + r, b0 = a0 + nr + 1;
      idx.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1);
    }
    var first = sampleStations(stations, 0), last = sampleStations(stations, 1);
    var c0 = pos.length / 3; pos.push(first.x, (first.fl + first.bl) / 2, 0);
    var c1 = pos.length / 3; pos.push(last.x, (last.fl + last.bl) / 2, 0);
    for (r = 0; r < nr; r++) { idx.push(c0, r + 1, r); idx.push(c1, (ns * (nr + 1)) + r, (ns * (nr + 1)) + r + 1); }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  // Curved patch: a sheet sampled off the same rings over a t-range and an
  // angular band, pushed outward along the ring normal by `off`. Doors, roof,
  // windshield, pillars and crease lines are all patches — they hug the curve.
  function patchGeometry(stations, t0, t1, a0, a1, nt, na, off, exp, crown) {
    var pos = [], idx = [], i, j;
    for (i = 0; i <= nt; i++) {
      var st = sampleStations(stations, t0 + (t1 - t0) * (i / nt));
      for (j = 0; j <= na; j++) {
        var p = ringPoint(st, a0 + (a1 - a0) * (j / na), exp, crown);
        pos.push(p.x, p.y + p.ny * off, p.z + p.nz * off);
      }
    }
    for (i = 0; i < nt; i++) for (j = 0; j < na; j++) {
      var a = i * (na + 1) + j, b = a + na + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setIndex(idx);
    g.computeVertexNormals();
    return g;
  }
  function patchMesh(stations, t0, t1, a0, a1, nt, na, off, exp, crown, mat) {
    var m = new THREE.Mesh(patchGeometry(stations, t0, t1, a0, a1, nt, na, off, exp, crown), mat);
    m.castShadow = true; return m;
  }

  // ---------- station tables (x: tail - to nose +; hw: half width; fl/bl: floor/beltline) ----------
  // Hero sports car: narrow tail and nose, widest at the doors, beltline arcing
  // low at the nose, rising over the cabin, falling to the tail.
  var SPORTS = [
    { x: -2.55, hw: 0.60, fl: 0.26, bl: 0.68 },
    { x: -2.40, hw: 0.84, fl: 0.20, bl: 0.78 },
    { x: -2.00, hw: 0.96, fl: 0.17, bl: 0.92 },
    { x: -1.40, hw: 1.02, fl: 0.15, bl: 0.95 },
    { x: -0.70, hw: 1.03, fl: 0.15, bl: 0.98 },
    { x: 0.00, hw: 1.01, fl: 0.15, bl: 0.97 },
    { x: 0.70, hw: 0.98, fl: 0.16, bl: 0.91 },
    { x: 1.40, hw: 0.93, fl: 0.17, bl: 0.80 },
    { x: 2.00, hw: 0.86, fl: 0.19, bl: 0.68 },
    { x: 2.40, hw: 0.68, fl: 0.22, bl: 0.58 },
    { x: 2.55, hw: 0.42, fl: 0.26, bl: 0.52 }
  ];
  var SEDAN = [
    { x: -2.45, hw: 0.84, fl: 0.24, bl: 0.86 },
    { x: -2.20, hw: 0.96, fl: 0.20, bl: 0.93 },
    { x: -1.60, hw: 1.01, fl: 0.18, bl: 0.98 },
    { x: -0.80, hw: 1.02, fl: 0.18, bl: 1.00 },
    { x: 0.20, hw: 1.01, fl: 0.18, bl: 0.99 },
    { x: 1.10, hw: 0.99, fl: 0.19, bl: 0.93 },
    { x: 1.90, hw: 0.94, fl: 0.20, bl: 0.80 },
    { x: 2.35, hw: 0.80, fl: 0.22, bl: 0.64 },
    { x: 2.55, hw: 0.58, fl: 0.26, bl: 0.50 }
  ];
  var VAN = [
    { x: -2.50, hw: 0.88, fl: 0.26, bl: 1.40 },
    { x: -2.30, hw: 0.99, fl: 0.22, bl: 1.54 },
    { x: -1.60, hw: 1.04, fl: 0.20, bl: 1.60 },
    { x: -0.60, hw: 1.05, fl: 0.20, bl: 1.62 },
    { x: 0.60, hw: 1.04, fl: 0.20, bl: 1.60 },
    { x: 1.70, hw: 1.01, fl: 0.21, bl: 1.52 },
    { x: 2.30, hw: 0.90, fl: 0.24, bl: 1.28 },
    { x: 2.55, hw: 0.66, fl: 0.28, bl: 1.02 }
  ];
  // Glasshouse: narrower than the body (tumblehome), floor on the beltline,
  // roofline arcing over the cabin. t=0 is the rear, t=1 the nose.
  var GLASS = [
    { x: -1.48, hw: 0.52, fl: 0.90, bl: 1.00 },
    { x: -1.20, hw: 0.70, fl: 0.90, bl: 1.17 },
    { x: -0.80, hw: 0.79, fl: 0.90, bl: 1.26 },
    { x: -0.30, hw: 0.81, fl: 0.90, bl: 1.29 },
    { x: 0.20, hw: 0.79, fl: 0.90, bl: 1.27 },
    { x: 0.55, hw: 0.72, fl: 0.90, bl: 1.16 },
    { x: 0.82, hw: 0.50, fl: 0.90, bl: 1.00 }
  ];
  var GLASS_SEDAN = [
    { x: -1.55, hw: 0.60, fl: 0.94, bl: 1.04 },
    { x: -1.10, hw: 0.80, fl: 0.94, bl: 1.22 },
    { x: -0.40, hw: 0.86, fl: 0.94, bl: 1.30 },
    { x: 0.30, hw: 0.84, fl: 0.94, bl: 1.28 },
    { x: 0.80, hw: 0.72, fl: 0.94, bl: 1.12 },
    { x: 1.05, hw: 0.50, fl: 0.94, bl: 1.00 }
  ];

  // ---------- small hardware shared by every car ----------
  function plateTexture(text) {
    var c = document.createElement('canvas'); c.width = 128; c.height = 40;
    var g = c.getContext('2d');
    g.fillStyle = '#f2f0e4'; g.fillRect(0, 0, 128, 40);
    g.fillStyle = '#1a2a6b'; g.fillRect(0, 0, 128, 8);
    g.fillStyle = '#111'; g.font = 'bold 24px Arial'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 24);
    return new THREE.CanvasTexture(c);
  }
  function addPlates(g, frontX, rearX, text) {
    var tex = plateTexture(text);
    var mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.2 });
    var f = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.46), mat);
    f.position.set(frontX, 0.30, 0); g.add(f);
    var r = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.14, 0.46), mat);
    r.position.set(rearX, 0.30, 0); g.add(r);
  }
  function addWheels(g, rimMat, accentMat, wx, r) {
    var tireMat = std(0x111111, 0.05, 0.9);
    var tireGeo = new THREE.CylinderGeometry(r, r, 0.32, 22);
    var positions = [[wx, 0.88], [wx, -0.88], [-wx, 0.88], [-wx, -0.88]];
    for (var i = 0; i < positions.length; i++) {
      var px = positions[i][0], pz = positions[i][1];
      var w = new THREE.Mesh(tireGeo, tireMat);
      w.rotation.x = Math.PI / 2; w.position.set(px, r, pz); w.castShadow = true; g.add(w);
      // dark rim barrel so the wheel reads as an alloy, not a starburst
      var barrel = new THREE.Mesh(new THREE.CylinderGeometry(r - 0.10, r - 0.10, 0.33, 22), std(0x2e2e34, 0.5, 0.5));
      barrel.rotation.x = Math.PI / 2; barrel.position.set(px, r, pz); g.add(barrel);
      // bright accent ring on the outer face
      var ring = new THREE.Mesh(new THREE.TorusGeometry(r - 0.11, 0.025, 8, 24), accentMat);
      ring.position.set(px, r, pz + (pz > 0 ? 0.17 : -0.17)); g.add(ring);
      // 5 silver spokes, flush with the outer face
      for (var k = 0; k < 5; k++) {
        var ang = (k / 5) * Math.PI * 2;
        var sp = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.34, 0.05), rimMat);
        sp.position.set(px + Math.cos(ang) * 0.14, r + Math.sin(ang) * 0.14, pz + (pz > 0 ? 0.165 : -0.165));
        sp.rotation.z = ang - Math.PI / 2; g.add(sp);
      }
      var cap = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.34, 12), accentMat);
      cap.rotation.x = Math.PI / 2; cap.position.set(px, r, pz); g.add(cap);
    }
  }
  function addArchFlares(g, stations, paintMat, trimMat, wx, r) {
    var flareGeo = new THREE.TorusGeometry(r + 0.10, 0.055, 8, 22, Math.PI);
    var lipGeo = new THREE.TorusGeometry(r + 0.15, 0.02, 6, 22, Math.PI);
    var xs = [wx, -wx];
    var x0 = stations[0].x, x1 = stations[stations.length - 1].x;
    for (var i = 0; i < xs.length; i++) {
      var hw = sampleStations(stations, (xs[i] - x0) / (x1 - x0)).hw;
      for (var s = -1; s <= 1; s += 2) {
        var f = new THREE.Mesh(flareGeo, paintMat);
        f.position.set(xs[i], r, s * (hw + 0.01));
        if (s < 0) f.rotation.y = Math.PI;
        f.castShadow = true; g.add(f);
        var lip = new THREE.Mesh(lipGeo, trimMat);
        lip.position.set(xs[i], r, s * (hw + 0.04));
        if (s < 0) lip.rotation.y = Math.PI;
        g.add(lip);
      }
    }
  }
  // Lamps: lens boxes (MeshBasicMaterial, toneMapped false) + additive glow
  // sprites + a headlight beam pool on the road + a tail bar proud of the tail.
  function addLights(g, opts) {
    var headMat = new THREE.MeshBasicMaterial({ color: 0xfff3c4, toneMapped: false });
    var tailMat = new THREE.MeshBasicMaterial({ color: 0xff2a22, toneMapped: false });
    for (var s = -1; s <= 1; s += 2) {
      var hl = box(0.08, 0.12, 0.42, headMat, opts.headX, 0.55, s * 0.58);
      hl.rotation.y = -s * 0.10; g.add(hl);
      var hg = AZ.glowSprite(AZ.glowWhite, 0.9, 0.4); hg.position.set(opts.headX + 0.18, 0.55, s * 0.58); g.add(hg);
      var tl = box(0.06, 0.13, 0.40, tailMat, opts.tailX, 0.60, s * 0.45);
      g.add(tl);
      var tg = AZ.glowSprite(AZ.glowRed, 0.7, 0.45); tg.position.set(opts.tailX - 0.14, 0.60, s * 0.45); g.add(tg);
    }
    // full-width tail bar, 0.05+ proud of the tail face so it can never z-fight
    var bar = box(0.06, 0.16, 0.80, tailMat, opts.tailX - 0.03, 0.70, 0); g.add(bar);
    var bg = AZ.glowSprite(AZ.glowRed, 1.6, 0.25); bg.position.set(opts.tailX - 0.22, 0.70, 0); g.add(bg);
    // headlight beam: additive pool on the road ahead
    var beam = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6),
      new THREE.MeshBasicMaterial({ map: AZ.glowWhite, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, depthWrite: false }));
    beam.rotation.x = -Math.PI / 2;
    beam.position.set(opts.headX + 3.0, 0.04, 0); g.add(beam);
  }

  // ---------- the hero: Solara GT ----------
  // Body = one smooth loft. Glasshouse = its own smaller loft in dark glass.
  // Roof panel, windshield, pillars, doors and crease lines are curved patches
  // sampled off those lofts — nothing flat is ever laid on a body panel.
  AZ.buildSolaraGT = function (paint, opts) {
    opts = opts || {};
    var g = new THREE.Group();
    var paintMat = paintMaterial(paint);
    var trimMat = std(0x0a0a0c, 0.3, 0.6);
    var chromeMat = std(0xd8dce0, 0.95, 0.15);
    var glassDark = std(0x33455c, 0.85, 0.10);
    var glassLight = std(0x8fb8d8, 0.85, 0.06);

    // lofted hull — curves in every direction, low sports-car stance
    var body = new THREE.Mesh(loftGeometry(SPORTS, 30, 24, 1.0, 0.62), paintMat);
    body.castShadow = true; body.receiveShadow = true; g.add(body);

    // ---- separate glasshouse loft (tumblehome: narrower than the body) ----
    var glasshouse = new THREE.Mesh(loftGeometry(GLASS, 22, 20, 1.0, 0.5), glassDark);
    glasshouse.castShadow = true; g.add(glasshouse);
    // painted roof panel: a curved patch over the glasshouse's middle top, so
    // the windshield and the side windows read as separate glass areas
    g.add(patchMesh(GLASS, 0.18, 0.66, 0.87, 2.27, 10, 10, 0.02, 1.0, 0.5, paintMat));
    // windshield: LIGHT glass patch on the raked front slope of the glasshouse
    g.add(patchMesh(GLASS, 0.66, 0.97, 0.87, 2.27, 6, 10, 0.015, 1.0, 0.5, glassLight));
    // rear window: LIGHT glass patch on the raked rear slope, so the cabin
    // never reads as a black box from behind either
    g.add(patchMesh(GLASS, 0.03, 0.17, 0.87, 2.27, 4, 10, 0.015, 1.0, 0.5, glassLight));
    // pillars: paint hoops wrapping from one flank, over the roof, to the other
    // flank — they split the glass into front window / rear window / windshield
    g.add(patchMesh(GLASS, 0.655, 0.705, -0.44, 3.58, 2, 18, 0.035, 1.0, 0.5, paintMat)); // A
    g.add(patchMesh(GLASS, 0.40, 0.45, -0.44, 3.58, 2, 18, 0.035, 1.0, 0.5, paintMat));   // B
    g.add(patchMesh(GLASS, 0.14, 0.19, -0.44, 3.58, 2, 18, 0.035, 1.0, 0.5, paintMat));   // C

    // ---- doors: curved patches hugging the flank, with a dark shut-line ----
    // Body t for the door x-range (-1.15..+0.55 of -2.55..+2.55) is 0.275..0.608;
    // the flank band around the side is a in [-0.66, 0.66] rad.
    for (var s = -1; s <= 1; s += 2) {
      var a0 = s > 0 ? -0.66 : Math.PI - 0.66, a1 = s > 0 ? 0.66 : Math.PI + 0.66;
      // dark under-patch, slightly larger: its rim shows as the shut-line
      g.add(patchMesh(SPORTS, 0.255, 0.628, a0 - 0.05, a1 + 0.05, 8, 8, 0.008, 1.0, 0.62, trimMat));
      // the door itself, proud paint following the flank curve
      g.add(patchMesh(SPORTS, 0.275, 0.608, a0, a1, 8, 8, 0.02, 1.0, 0.62, paintMat));
      // handle: small chrome bar on the curved flank
      var st = sampleStations(SPORTS, 0.52);
      var hp = ringPoint(st, s > 0 ? 0.35 : Math.PI - 0.35, 1.0, 0.62);
      var h = box(0.24, 0.05, 0.05, chromeMat, hp.x + 0.28, hp.y + 0.10, hp.z + s * 0.03);
      h.rotation.y = s > 0 ? 0 : Math.PI; g.add(h);
    }
    // side character line: a thin GOLD crease running the whole flank
    var goldLine = std(0xd4af37, 0.7, 0.3);
    for (var c2 = -1; c2 <= 1; c2 += 2) {
      var ca0 = c2 > 0 ? 0.42 : Math.PI - 0.62, ca1 = c2 > 0 ? 0.62 : Math.PI - 0.42;
      g.add(patchMesh(SPORTS, 0.04, 0.96, ca0, ca1, 14, 2, 0.012, 1.0, 0.62, goldLine));
    }

    // ---- mirrors on stalks ----
    for (var m = -1; m <= 1; m += 2) {
      var stalk = box(0.06, 0.04, 0.16, trimMat, 0.72, 0.92, m * 1.00); g.add(stalk);
      var mir = box(0.20, 0.12, 0.15, paintMat, 0.72, 0.98, m * 1.08); g.add(mir);
    }

    // ---- bumpers, grille, plates ----
    var fb = box(0.30, 0.09, 1.55, trimMat, 2.42, 0.20, 0); g.add(fb);
    var rb = box(0.30, 0.09, 1.55, trimMat, -2.42, 0.20, 0); g.add(rb);
    var grille = box(0.05, 0.20, 1.20, trimMat, 2.52, 0.40, 0); g.add(grille);
    var gstrip = box(0.06, 0.035, 1.20, chromeMat, 2.53, 0.50, 0); g.add(gstrip);
    addPlates(g, 2.58, -2.58, opts.plate || 'AZR-7');

    // ---- curved spoiler: a thin lofted wing, not a flat slab ----
    var WING = [
      { x: -2.62, hw: 0.78, fl: 0.92, bl: 0.98 },
      { x: -2.44, hw: 0.85, fl: 0.96, bl: 1.02 },
      { x: -2.22, hw: 0.80, fl: 1.00, bl: 1.06 }
    ];
    var wing = new THREE.Mesh(loftGeometry(WING, 6, 16, 1.0, 0.6), paintMat);
    wing.castShadow = true; g.add(wing);
    // wing struts down to the rear deck
    for (var w2 = -1; w2 <= 1; w2 += 2) {
      var strut = box(0.08, 0.34, 0.06, trimMat, -2.42, 0.85, w2 * 0.55); g.add(strut);
    }
    // twin centre exhausts + flame glow, clear of the number plate
    for (var e = -1; e <= 1; e += 2) {
      var ex = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.30, 10), chromeMat);
      ex.rotation.z = Math.PI / 2; ex.position.set(-2.58, 0.26, e * 0.32); g.add(ex);
      var fg = AZ.glowSprite(AZ.glowGold, 0.5, 0.3); fg.position.set(-2.80, 0.26, e * 0.32); g.add(fg);
    }
    // side skirts, dark lower band
    for (var sk = -1; sk <= 1; sk += 2) {
      var skirt = box(4.20, 0.14, 0.05, trimMat, 0, 0.26, sk * 1.04); g.add(skirt);
    }

    // ---- lights that glow ----
    addLights(g, { headX: 2.40, tailX: -2.50 });

    // ---- arches + 5-spoke wheels (silver spokes, gold ring + cap) ----
    addArchFlares(g, SPORTS, paintMat, trimMat, 1.55, 0.42);
    var rimMat = std(0xd8dce0, 0.9, 0.2);
    var accentMat = std(opts.goldRims ? 0xd4af37 : 0xd8dce0, 0.9, 0.2);
    addWheels(g, rimMat, accentMat, 1.55, 0.42);
    return g;
  };

  // ---------- traffic: sedan / van / police / taxi — same loft, own silhouettes ----------
  AZ.buildTrafficCar = function (kind, paint) {
    var g = new THREE.Group();
    var paintMat = paintMaterial(paint);
    var trimMat = std(0x0a0a0c, 0.3, 0.6);
    var chromeMat = std(0xd8dce0, 0.95, 0.15);
    var glassDark = std(0x33455c, 0.85, 0.10);
    var stations = kind === 'van' ? VAN : SEDAN;
    var glassStations = kind === 'van' ? null : GLASS_SEDAN;
    var tall = kind === 'van';
    var body = new THREE.Mesh(loftGeometry(stations, 24, 20, 1.0, 0.62), paintMat);
    body.castShadow = true; body.receiveShadow = true; g.add(body);
    if (glassStations) {
      var gh = new THREE.Mesh(loftGeometry(glassStations, 18, 18, 1.0, 0.5), glassDark);
      gh.castShadow = true; g.add(gh);
      // painted roof panel over the glasshouse middle
      g.add(patchMesh(glassStations, 0.20, 0.62, 0.87, 2.27, 8, 10, 0.02, 1.0, 0.5, paintMat));
      // pillar hoops splitting the side glass
      g.add(patchMesh(glassStations, 0.60, 0.65, -0.44, 3.58, 2, 18, 0.035, 1.0, 0.5, paintMat));
      g.add(patchMesh(glassStations, 0.36, 0.41, -0.44, 3.58, 2, 18, 0.035, 1.0, 0.5, paintMat));
    } else {
      // van: tall glass band with painted pillars, raked windshield
      for (var s = -1; s <= 1; s += 2) {
        var win = box(2.6, 0.55, 0.05, glassDark, -0.4, 1.62, s * 0.98);
        win.rotation.x = -s * 0.08; g.add(win);
        var bp = box(0.08, 0.55, 0.06, paintMat, -0.4, 1.62, s * 1.0);
        bp.rotation.x = -s * 0.08; g.add(bp);
      }
      var shield = box(0.06, 0.8, 1.7, std(0x5a7a94, 0.85, 0.08), 1.35, 1.55, 0);
      shield.rotation.z = -0.25; g.add(shield);
      var roof = box(3.0, 0.06, 1.7, paintMat, -0.4, 1.92, 0);
      g.add(roof);
    }
    // doors with the same curved patches as the hero
    var dt0 = tall ? 0.24 : 0.27, dt1 = tall ? 0.60 : 0.60;
    for (var d = -1; d <= 1; d += 2) {
      var a0 = d > 0 ? -0.62 : Math.PI - 0.62, a1 = d > 0 ? 0.62 : Math.PI + 0.62;
      g.add(patchMesh(stations, dt0 - 0.02, dt1 + 0.02, a0 - 0.05, a1 + 0.05, 8, 8, 0.008, 1.0, 0.62, trimMat));
      g.add(patchMesh(stations, dt0, dt1, a0, a1, 8, 8, 0.02, 1.0, 0.62, paintMat));
      var dst = sampleStations(stations, 0.45);
      var dp = ringPoint(dst, d > 0 ? 0.35 : Math.PI - 0.35, 1.0, 0.62);
      var dh = box(0.22, 0.05, 0.05, chromeMat, dp.x + 0.25, dp.y + 0.08, dp.z + d * 0.03);
      g.add(dh);
    }
    // bumpers + grille + plates
    var fx = tall ? 2.52 : 2.50, rx = tall ? -2.48 : -2.44;
    g.add(box(0.28, 0.10, 1.70, trimMat, fx, 0.22, 0));
    g.add(box(0.28, 0.10, 1.70, trimMat, rx, 0.22, 0));
    g.add(box(0.05, 0.18, 1.15, trimMat, fx + 0.04, 0.42, 0));
    addPlates(g, fx + 0.08, rx - 0.08, kind === 'taxi' ? 'TAX-21' : 'AZR-1');
    addLights(g, { headX: fx - 0.08, tailX: rx + 0.06 });
    addArchFlares(g, stations, paintMat, trimMat, tall ? 1.55 : 1.45, tall ? 0.40 : 0.38);
    addWheels(g, chromeMat, chromeMat, tall ? 1.55 : 1.45, tall ? 0.40 : 0.38);
    if (kind === 'police') {
      // light bar: red left / blue right, emissive + glow pools + point lights
      var bar = box(0.36, 0.18, 1.30, trimMat, -0.15, 1.34, 0); g.add(bar);
      var r = box(0.38, 0.14, 0.60, std(0x330000, 0.2, 0.4, { emissive: 0xff2222, emissiveIntensity: 3 }), -0.15, 1.44, 0.32); g.add(r);
      var b = box(0.38, 0.14, 0.60, std(0x000033, 0.2, 0.4, { emissive: 0x2244ff, emissiveIntensity: 3 }), -0.15, 1.44, -0.32); g.add(b);
      var pr = AZ.glowSprite(AZ.glowRed, 3.0, 0.5); pr.position.set(0, 0.3, 1.6); g.add(pr);
      var pb = AZ.glowSprite(AZ.glowBlue, 3.0, 0.5); pb.position.set(0, 0.3, -1.6); g.add(pb);
      var plR = new THREE.PointLight(0xff2222, 3, 9); plR.position.set(0, 1.2, 1.6); g.add(plR);
      var plB = new THREE.PointLight(0x2244ff, 3, 9); plB.position.set(0, 1.2, -1.6); g.add(plB);
    }
    if (kind === 'taxi') {
      var sign = box(0.5, 0.14, 0.3, std(0xffd23e, 0.2, 0.4, { emissive: 0xffc400, emissiveIntensity: 0.8 }), -0.2, 1.36, 0);
      g.add(sign);
    }
    return g;
  };
})();
