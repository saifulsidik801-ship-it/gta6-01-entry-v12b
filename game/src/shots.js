// AZURA BAY — shot staging. Classic script, no imports. Written fresh for the
// v12 entry. One staged scene per screenshot, all with ACTION (moving traffic,
// a hovering heli, a walking crowd — never a static pose), plus the solo-car
// gate render used to verify the lofted body before any scene was built.
// Conventions: the boulevard runs along Z (north is -Z); a car model faces
// +X at rotation.y = 0, so facing -Z is rotation.y = PI/2.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});

  function faceNorth() { return Math.PI / 2; }
  function placeCar(scene, car, x, z, rotY) {
    car.position.set(x, 0, z); car.rotation.y = rotY; scene.add(car); return car;
  }

  // Per-shot sky + light recipes. 16:00 is bright and warm (top-1's chase
  // hour); dusk is the magenta/orange gradient; night is deep blue with a
  // low orange glow on the horizon; the garage is warm and dark.
  var SKIES = {
    day:   { top: 0x2f6fd0, mid: 0x9ec8e8, hor: 0xffc98a, sun: 0xffd9a0, sunI: 2.6, sunPos: [40, 55, 30], hemi: 0.9, exp: 1.35, fog: 0xcfe0ea },
    dusk:  { top: 0x211247, mid: 0xb83a6b, hor: 0xff8a3d, sun: 0xffb36b, sunI: 2.4, sunPos: [45, 35, 45], hemi: 1.0, exp: 1.35, fog: 0xcf7a44 },
    night: { top: 0x0a0a28, mid: 0x2a1a4a, hor: 0xb3502e, sun: 0x8a9fd8, sunI: 0.7, sunPos: [-30, 40, 20], hemi: 0.85, exp: 1.25, fog: 0x1a1426 },
    gold:  { top: 0x3a2a18, mid: 0x6a4a28, hor: 0xffb36b, sun: 0xffc98a, sunI: 1.6, sunPos: [20, 35, 40], hemi: 0.7, exp: 1.3, fog: 0x4a3428 }
  };

  AZ.SHOTS = {
    // 1 — CHASE: bright 16:00 sun, hero big in frame, rear three-quarter.
    1: {
      mission: 0, sky: 'day',
      camera: { pos: [7.6, 2.5, 5.2], look: [-1.2, 1.6, -10] },
      stage: function (scene, dyn) {
        var hero = AZ.buildSolaraGT(0xe8341f, { goldRims: true, plate: 'AZR-7' });
        placeCar(scene, hero, 0.5, -6, faceNorth() + 0.45); dyn.hero = hero;
        var cop1 = AZ.buildTrafficCar('police', 0xf2f2ee);
        placeCar(scene, cop1, -2.4, -19, faceNorth() + 0.12); dyn.push(cop1);
        var cop2 = AZ.buildTrafficCar('police', 0xf2f2ee);
        placeCar(scene, cop2, 3.2, -30, faceNorth() - 0.18); dyn.push(cop2);
        var sedan = AZ.buildTrafficCar('sedan', 0x3a7bd5);
        placeCar(scene, sedan, -3.6, -38, faceNorth() + 0.15); dyn.push(sedan);
        var van = AZ.buildTrafficCar('van', 0x8a8a9e);
        placeCar(scene, van, 4.4, -48, faceNorth() - 0.1); dyn.push(van);
        var taxi = AZ.buildTrafficCar('taxi', 0xf2b705);
        placeCar(scene, taxi, -3.0, -56, faceNorth() + 0.08); dyn.push(taxi);
        var scooter = AZ.buildScooter(0xd92b1e);
        placeCar(scene, scooter, 5.2, -13, faceNorth() - 0.3); dyn.push(scooter);
        var heli = AZ.buildHeli();
        heli.position.set(-2, 9.5, -19); heli.rotation.y = 0.15; scene.add(heli);
        dyn.heli = heli;
        AZ.buildCrowd(scene, 14, -10.5, -8, -2, -40);
        AZ.buildCrowd(scene, 10, 8, 10.5, 4, -30);
        AZ.buildCrowd(scene, 8, 14, 40, -4, -34);
      }
    },
    // 2 — MARKET: night, Lantern Avenue, hero side three-quarter in the crowd.
    // Camera high at the east end, looking down the avenue over the crowd, so
    // the car reads big and the stalls, string lights and neon frame it.
    2: {
      mission: 1, sky: 'night',
      camera: { pos: [1.5, 3.4, -18], look: [-13, 0.9, -31.5] },
      stage: function (scene, dyn) {
        var hero = AZ.buildSolaraGT(0xe8341f, { goldRims: true, plate: 'AZR-7' });
        placeCar(scene, hero, -11, -32, Math.PI - 0.22); dyn.hero = hero;
        var sedan = AZ.buildTrafficCar('sedan', 0x2a2a30);
        placeCar(scene, sedan, -26, -32, Math.PI + 0.1); dyn.push(sedan);
        var van = AZ.buildTrafficCar('van', 0x5a6a8e);
        placeCar(scene, van, -24, -32, Math.PI - 0.1); dyn.push(van);
        var cop = AZ.buildTrafficCar('police', 0xf2f2ee);
        placeCar(scene, cop, -2, -16, -Math.PI / 2 - 0.2); dyn.push(cop);
        var heli = AZ.buildHeli();
        heli.position.set(-8, 16, -44); heli.rotation.y = -0.3; scene.add(heli);
        dyn.heli = heli;
        // crowd hugs the stall edges; the road down the middle stays clear
        AZ.buildCrowd(scene, 16, -28, -4, -37.5, -35.5);
        AZ.buildCrowd(scene, 14, -28, -16, -28.5, -26.5);
        // a few shoppers on the road's south edge, east of the hero
        AZ.buildCrowd(scene, 6, -6, -2, -34.5, -32.5);
        // warm market lights over the avenue so the night scene reads
        for (var li = -1; li <= 1; li++) {
          var lamp = new THREE.PointLight(0xffc98a, 1.6, 26);
          lamp.position.set(-8 + li * 9, 5.5, -32); scene.add(lamp);
        }
      }
    },
    // 3 — CUSTOM: 24K gold respray inside Azura Customs, mechanic at work.
    // Camera close, just outside the open front, so the gold car fills the frame.
    3: {
      mission: 2, sky: 'gold',
      camera: { pos: [-11.5, 2.2, 44.5], look: [-18.5, 1.1, 33.5] },
      stage: function (scene, dyn) {
        var hero = AZ.buildSolaraGT(0xd4af37, { goldRims: false, plate: 'GOLD-24' });
        placeCar(scene, hero, -18, 34, -0.55); dyn.hero = hero;
        var mech = AZ.makePerson(0x3ec6ff, 0x2a2a34);
        mech.position.set(-20.5, 0, 36.5); mech.rotation.y = -2.2; scene.add(mech);
        dyn.push(mech);
        var warm = new THREE.PointLight(0xffd9a0, 2.2, 22);
        warm.position.set(-16, 5, 38); scene.add(warm);
      }
    },
    // 4 — MAP: high oblique over the whole city, route + district labels.
    4: {
      mission: 3, sky: 'dusk',
      camera: { pos: [34, 58, 34], look: [-8, 0, -34] },
      stage: function (scene, dyn) {
        var hero = AZ.buildSolaraGT(0xe8341f, { goldRims: true, plate: 'AZR-7' });
        placeCar(scene, hero, 0.5, -18, faceNorth() + 0.15); dyn.hero = hero;
        var cop1 = AZ.buildTrafficCar('police', 0xf2f2ee);
        placeCar(scene, cop1, -2.6, -28, faceNorth() - 0.1); dyn.push(cop1);
        var cop2 = AZ.buildTrafficCar('police', 0xf2f2ee);
        placeCar(scene, cop2, 3.4, -10, faceNorth() + 0.3); dyn.push(cop2);
        var sedan = AZ.buildTrafficCar('sedan', 0x3a7bd5);
        placeCar(scene, sedan, -3.4, -44, faceNorth()); dyn.push(sedan);
        var van = AZ.buildTrafficCar('van', 0x8a8a9e);
        placeCar(scene, van, 4.2, -58, faceNorth() - 0.15); dyn.push(van);
        var taxi = AZ.buildTrafficCar('taxi', 0xf2b705);
        placeCar(scene, taxi, -3.0, 2, faceNorth() + 0.1); dyn.push(taxi);
        var heli = AZ.buildHeli();
        heli.position.set(-4, 18, -40); heli.rotation.y = 0.4; scene.add(heli);
        dyn.heli = heli;
        AZ.buildCrowd(scene, 20, 12, 44, -10, -50);
        AZ.buildCrowd(scene, 12, -10.5, -8, -10, -50);
      }
    },
    // car — solo-car gate: the lofted body alone, dusk, rear three-quarter.
    car: {
      mission: 0, sky: 'dusk', noHUD: true,
      camera: { pos: [6.2, 2.5, 6.4], look: [-0.4, 0.7, -1.0] },
      stage: function (scene, dyn) {
        var hero = AZ.buildSolaraGT(0xe8341f, { goldRims: true, plate: 'AZR-7' });
        placeCar(scene, hero, 0, 0, faceNorth() + 0.55); dyn.hero = hero;
        var sedan = AZ.buildTrafficCar('sedan', 0x3a7bd5);
        placeCar(scene, sedan, -3.5, -16, faceNorth() + 0.1); dyn.push(sedan);
      }
    }
  };

  // Apply one shot: sky + lights + camera + staged vehicles + HUD state.
  AZ.applyShot = function (scene, camera, key) {
    var shot = AZ.SHOTS[key] || AZ.SHOTS[1];
    var sky = SKIES[shot.sky];
    AZ.setSky(sky.top, sky.mid, sky.hor);
    AZ.setSun(sky.sun, sky.sunI, sky.sunPos, sky.hemi, sky.exp, sky.fog);
    camera.position.set(shot.camera.pos[0], shot.camera.pos[1], shot.camera.pos[2]);
    camera.lookAt(shot.camera.look[0], shot.camera.look[1], shot.camera.look[2]);
    var dyn = [];
    shot.stage(scene, dyn);
    var m = AZ.MISSIONS[shot.mission];
    AZ.state.speed = m.speed; AZ.state.dented = m.dented; AZ.state.cash = m.cash;
    AZ.state.wanted = m.unitCount === 0 ? 0 : 5;
    if (!shot.noHUD) {
      document.querySelector('.hud').style.display = 'block';
      AZ.updateHUD(m);
    }
    return dyn;
  };
})();
