// AZURA BAY — entry point. Classic script, no imports. Written fresh for the
// v12 entry. Builds the renderer (ACES filmic, 2048 shadow map, gradient dusk
// sky dome), assembles the static city, then either stages one screenshot
// (?shot=1..4 or car) or runs the playable chase: WASD drives the Solara GT
// down Strand Boulevard with the police in pursuit and a live HUD.
(function () {
  var AZ = (window.AZURA = window.AZURA || {});
  var W = 1280, H = 720;

  var renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setSize(W, H);
  renderer.setPixelRatio(1);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xcf7a44, 70, 260);
  var camera = new THREE.PerspectiveCamera(40, W / H, 0.1, 900);

  // ---- sky dome: vertical gradient, colours set per shot ----
  var skyUniforms = {
    uTop: { value: new THREE.Color(0x211247) },
    uMid: { value: new THREE.Color(0xb83a6b) },
    uHor: { value: new THREE.Color(0xff8a3d) }
  };
  var skyMat = new THREE.ShaderMaterial({
    side: THREE.BackSide, fog: false, depthWrite: false,
    uniforms: skyUniforms,
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
    fragmentShader: 'varying vec3 vP; uniform vec3 uTop; uniform vec3 uMid; uniform vec3 uHor;' +
      'void main(){ float t = clamp(normalize(vP).y, -0.05, 1.0);' +
      ' vec3 c = mix(uHor, uMid, smoothstep(0.0,0.22,t));' +
      ' c = mix(c, uTop, smoothstep(0.22,0.75,t));' +
      ' gl_FragColor = vec4(c, 1.0); }'
  });
  scene.add(new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat));
  AZ.setSky = function (top, mid, hor) {
    skyUniforms.uTop.value.setHex(top);
    skyUniforms.uMid.value.setHex(mid);
    skyUniforms.uHor.value.setHex(hor);
  };

  // ---- lights: low warm sun + hemisphere + warm fill from the camera side ----
  var sun = new THREE.DirectionalLight(0xffb36b, 2.4);
  sun.position.set(55, 30, -70);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -60; sun.shadow.camera.right = 60;
  sun.shadow.camera.top = 60; sun.shadow.camera.bottom = -60;
  sun.shadow.camera.far = 260;
  scene.add(sun);
  var hemi = new THREE.HemisphereLight(0x8a6fd6, 0x5a3a28, 0.95);
  scene.add(hemi);
  var fill = new THREE.DirectionalLight(0xffe0b0, 0.7);
  fill.position.set(10, 20, 40); scene.add(fill);
  AZ.setSun = function (color, intensity, pos, hemiI, exposure, fogColor) {
    sun.color.setHex(color); sun.intensity = intensity;
    sun.position.set(pos[0], pos[1], pos[2]);
    hemi.intensity = hemiI;
    renderer.toneMappingExposure = exposure;
    scene.fog.color.setHex(fogColor);
  };

  // ---- static city ----
  AZ.buildGround(scene);
  AZ.buildCityBlocks(scene);
  AZ.buildPalms(scene);
  AZ.buildMarket(scene);
  AZ.buildGarage(scene);
  AZ.buildBillboards(scene);

  // ---- HUD ----
  AZ.buildHUD();

  // ---- mode: staged shot, or playable drive ----
  var params = new URLSearchParams(window.location.search);
  var shotKey = params.get('shot');
  var dyn = [];
  var clock = new THREE.Clock();
  var frames = 0;

  function animate() {
    requestAnimationFrame(animate);
    var dt = Math.min(clock.getDelta(), 0.05);
    var t = clock.elapsedTime;
    // rotor spin + police glow pulse + crowd bob keep every shot alive
    for (var i = 0; i < dyn.length; i++) {
      var o = dyn[i];
      if (o && o.userData && o.userData.rotor) o.userData.rotor.rotation.y = t * 18;
    }
    renderer.render(scene, camera);
    if (++frames === 3) window.__gameReady = true;
  }

  if (shotKey) {
    dyn = AZ.applyShot(scene, camera, shotKey);
    animate();
  } else {
    // ---- playable chase: WASD drives, police pursue, HUD stays live ----
    var hero = AZ.buildSolaraGT(0xe8341f, { goldRims: true, plate: 'AZR-7' });
    hero.position.set(0.5, 0, -6); hero.rotation.y = Math.PI / 2;
    scene.add(hero);
    var cops = [];
    for (var c = 0; c < 2; c++) {
      var cop = AZ.buildTrafficCar('police', 0xf2f2ee);
      cop.position.set(c === 0 ? -2.4 : 3.2, 0, -19 - c * 11);
      cop.rotation.y = Math.PI / 2;
      scene.add(cop); cops.push(cop);
    }
    var heli = AZ.buildHeli();
    heli.position.set(-1.5, 15, -34); scene.add(heli);
    var taxi = AZ.buildTrafficCar('taxi', 0xf2b705);
    taxi.position.set(-3.0, 0, -56); taxi.rotation.y = Math.PI / 2; scene.add(taxi);
    AZ.buildCrowd(scene, 12, -10.5, -8, -2, -40);
    var m = AZ.MISSIONS[0];
    AZ.setSky(0x2f6fd0, 0x9ec8e8, 0xffc98a);
    AZ.setSun(0xffd9a0, 2.6, [40, 55, 30], 0.9, 1.35, 0xcfe0ea);
    document.querySelector('.hud').style.display = 'block';
    AZ.state.driving = true;
    AZ.updateHUD(m);
    var keys = {};
    window.addEventListener('keydown', function (e) { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', function (e) { keys[e.key.toLowerCase()] = false; });
    var speed = 0, steer = 0;
    var hint = document.createElement('div');
    hint.className = 'drive-hint';
    hint.textContent = 'WASD / ARROWS — DRIVE · R — RESET · The city is yours, boss.';
    document.body.appendChild(hint);
    setTimeout(function () { hint.style.opacity = '0'; }, 6000);
    function drive() {
      requestAnimationFrame(drive);
      var dt = Math.min(clock.getDelta(), 0.05);
      var t = clock.elapsedTime;
      if (keys['w'] || keys['arrowup']) speed = Math.min(speed + 26 * dt, 38);
      else if (keys['s'] || keys['arrowdown']) speed = Math.max(speed - 34 * dt, -8);
      else speed = Math.max(0, speed - 8 * dt);
      if (keys['a'] || keys['arrowleft']) steer = Math.max(steer - 1.6 * dt, -0.45);
      else if (keys['d'] || keys['arrowright']) steer = Math.min(steer + 1.6 * dt, 0.45);
      else steer *= (1 - 3 * dt);
      if (keys['r']) { hero.position.set(0.5, 0, -6); speed = 0; steer = 0; }
      hero.rotation.y = Math.PI / 2 + steer * 0.5;
      hero.position.x = Math.max(-6.2, Math.min(6.2, hero.position.x - steer * speed * dt * 0.6));
      hero.position.z -= speed * dt;
      if (hero.position.z < -140) hero.position.z = 60;
      if (hero.position.z > 62) hero.position.z = -138;
      // chase camera
      var cx = hero.position.x + 6.4, cy = 2.7, cz = hero.position.z + 12.5;
      camera.position.set(cx, cy, cz);
      camera.lookAt(hero.position.x - 1, 1.0, hero.position.z - 8);
      // police close in, heli tracks, rotor spins
      for (var i = 0; i < cops.length; i++) {
        cops[i].position.z -= (speed * 0.92 + 2) * dt;
        if (cops[i].position.z < hero.position.z - 60) cops[i].position.z = hero.position.z + 30;
      }
      heli.position.set(hero.position.x - 2, 15, hero.position.z - 26);
      heli.userData.rotor.rotation.y = t * 18;
      AZ.state.speed = Math.round(speed * 3.6);
      AZ.state.dented = Math.min(62, Math.round(62 * (1 - speed / 60)) + 8);
      AZ.updateHUD(m);
      renderer.render(scene, camera);
      if (++frames === 3) window.__gameReady = true;
    }
    drive();
  }
})();
