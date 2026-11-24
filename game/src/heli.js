// AZURA BAY — police helicopter. Classic script, no imports. Written fresh for
// the v12 entry. Lathe fuselage in white with a navy belly, dark glossy cockpit
// glass, tail boom and fin, two-blade main rotor with a translucent rotor disc,
// and a searchlight cone plus a bright pool on the road below.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  AZ.buildHeli = function () {
    var g = new THREE.Group();
    var white = new THREE.MeshStandardMaterial({ color: 0xf4f4f0, metalness: 0.35, roughness: 0.35 });
    var navy = new THREE.MeshStandardMaterial({ color: 0x16233d, metalness: 0.3, roughness: 0.5 });
    var dark = new THREE.MeshStandardMaterial({ color: 0x14181f, roughness: 0.6 });
    var glass = new THREE.MeshStandardMaterial({ color: 0x0a1424, metalness: 0.9, roughness: 0.1 });

    // fuselage: lathe profile, laid horizontal, nose toward -z
    var prof = [];
    prof.push(new THREE.Vector2(0.02, -2.6));
    prof.push(new THREE.Vector2(0.55, -2.3));
    prof.push(new THREE.Vector2(0.85, -1.2));
    prof.push(new THREE.Vector2(0.88, 0.0));
    prof.push(new THREE.Vector2(0.78, 1.1));
    prof.push(new THREE.Vector2(0.45, 1.9));
    prof.push(new THREE.Vector2(0.02, 2.15));
    var fus = new THREE.Mesh(new THREE.LatheGeometry(prof, 20), white);
    fus.rotation.x = Math.PI / 2;
    fus.castShadow = true;
    g.add(fus);
    // navy belly
    var belly = new THREE.Mesh(new THREE.SphereGeometry(0.85, 16, 12),
      new THREE.MeshStandardMaterial({ color: 0x4a5a73, metalness: 0.4, roughness: 0.5 }));
    belly.scale.set(0.95, 0.45, 2.1); belly.position.set(0, -0.45, 0.1); g.add(belly);
    // blue cheatline stripe along the fuselage
    var stripe = new THREE.Mesh(new THREE.TorusGeometry(0.86, 0.05, 8, 24),
      new THREE.MeshStandardMaterial({ color: 0x2456c8, metalness: 0.5, roughness: 0.3 }));
    stripe.rotation.x = Math.PI / 2; stripe.scale.set(1, 1, 1.9); stripe.position.set(0, 0.05, 0); g.add(stripe);
    // searchlight housing under the belly, bright from below
    var sl = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.1, 16),
      new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xffffff, emissiveIntensity: 2.5 }));
    sl.position.set(0, -0.82, -0.6); g.add(sl);
    // cockpit glass at the nose
    var cg = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 12), glass);
    cg.scale.set(1.0, 0.75, 1.1); cg.position.set(0, 0.18, -1.75); g.add(cg);
    // tail boom + fin + tail rotor
    var boom = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.16, 3.4, 10), white);
    boom.rotation.x = Math.PI / 2; boom.position.set(0, 0.12, 3.6); boom.castShadow = true; g.add(boom);
    var fin = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 0.7), navy);
    fin.position.set(0, 0.55, 5.1); g.add(fin);
    var tailRotor = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.4, 0.12), dark);
    tailRotor.position.set(0.14, 0.35, 5.0); g.add(tailRotor);
    // skids
    for (var s = -1; s <= 1; s += 2) {
      var skid = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 8), dark);
      skid.rotation.x = Math.PI / 2; skid.position.set(s * 0.75, -0.95, 0); g.add(skid);
      var leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), dark);
      leg.position.set(s * 0.75, -0.7, 0.9); g.add(leg);
      var leg2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 8), dark);
      leg2.position.set(s * 0.75, -0.7, -0.9); g.add(leg2);
    }
    // main rotor: mast + two long blades + translucent disc (spins in main.js)
    var mast = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.7, 8), dark);
    mast.position.set(0, 1.0, 0); g.add(mast);
    var rotor = new THREE.Group();
    rotor.position.set(0, 1.35, 0);
    for (var a = 0; a < 2; a++) {
      var bl = new THREE.Mesh(new THREE.BoxGeometry(7.6, 0.06, 0.34), dark);
      bl.rotation.y = a * Math.PI / 2; bl.castShadow = true; rotor.add(bl);
    }
    var disc = new THREE.Mesh(new THREE.CircleGeometry(3.9, 40),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, side: THREE.DoubleSide, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; rotor.add(disc);
    g.add(rotor);
    g.userData.rotor = rotor;
    // spotlight cone (additive) + bright pool on the road
    var cone = new THREE.Mesh(new THREE.ConeGeometry(2.8, 22, 24, 1, true),
      new THREE.MeshBasicMaterial({ color: 0xfff8dd, transparent: true, opacity: 0.08, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    cone.position.set(0, -12.4, -1.5); cone.rotation.x = 0.06; g.add(cone);
    var pool = AZ.glowSprite(AZ.glowWhite, 11, 0.5);
    pool.position.set(0, -24.4, -3); g.add(pool);
    return g;
  };
})();
