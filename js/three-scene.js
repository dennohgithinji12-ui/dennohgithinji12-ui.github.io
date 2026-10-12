/**
 * TERRAFORM & CRAFT - INTERACTIVE 3D ARCHITECTURAL LAB
 * Three.js WebGL Interactive Architectural Model & Controls
 * Lead Project Manager: Raphael
 */

(function () {
  'use strict';

  let scene, camera, renderer, controls;
  let villaGroup, terrainGroup, structureGroup, finishesGroup, pinsGroup;
  let ambientLight, sunLight, interiorLights = [];
  let currentMode = 'full'; // 'full', 'framing', 'blueprint', 'land'
  let isNight = false;
  let autoRotate = true;
  let raycaster, mouse;

  const container = document.getElementById('three-canvas-container');
  if (!container) return;

  const hotspotData = {
    pin1: {
      tag: "PHASE 01 • LAND ACQUISITION",
      title: "Zoning & Soil Mechanics Survey",
      desc: "Prime parcel verified by Raphael Kamau. Geotechnical soil profiling and bedrock stability tested. Ministry of Lands title deed verification and county approvals expedited."
    },
    pin2: {
      tag: "PHASE 03 • FOUNDATION & CORE",
      title: "Seismic Geo-Piles & Post-Tensioned Slabs",
      desc: "Engineered deep micro-piles with seismic dampening joints. High-performance reinforced concrete poured with 0.02mm tolerance under Raphael Kamau's strict on-site supervision."
    },
    pin3: {
      tag: "PHASE 04 • STRUCTURAL ENCLOSURE",
      title: "Thermally-Broken Cantilevered Glazing",
      desc: "Low-iron acoustic triple glazing with structural steel cantilevers. Engineered to harmonize with Kenya's equatorial light and year-round ambient climate."
    },
    pin4: {
      tag: "PHASE 05 • TURNKEY COMPLETION",
      title: "Smart Solar Microgrid & White-Glove Handover",
      desc: "Turnkey installation featuring integrated solar PV array, battery storage, treated borehole water, and smart automation. Handed over with 10-year NCA warranty."
    }
  };

  function init() {
    // 1. Scene Setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x070b14);
    scene.fog = new THREE.FogExp2(0x070b14, 0.025);

    // 2. Camera Setup
    const aspect = container.clientWidth / container.clientHeight;
    camera = new THREE.PerspectiveCamera(45, aspect, 0.1, 1000);
    camera.position.set(14, 9, 14);

    // 3. Renderer Setup
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    if (typeof THREE.OrbitControls !== 'undefined') {
      controls = new THREE.OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.maxPolarAngle = Math.PI / 2 - 0.05; // Don't go below ground
      controls.minDistance = 6;
      controls.maxDistance = 35;
      controls.target.set(0, 1.8, 0);

      controls.addEventListener('start', () => { autoRotate = false; });
    }

    // 5. Lighting
    setupLighting();

    // 6. Build Architectural Model Hierarchy
    buildSceneModel();

    // 7. Raycaster for Hotspots
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    // 8. Event Listeners
    window.addEventListener('resize', onWindowResize);
    renderer.domElement.addEventListener('click', onCanvasClick);

    setupHUDControls();

    // 9. Start Render Loop
    animate();
  }

  function setupLighting() {
    ambientLight = new THREE.AmbientLight(0xdde8fa, 0.85);
    scene.add(ambientLight);

    sunLight = new THREE.DirectionalLight(0xffecd2, 1.6);
    sunLight.position.set(15, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 60;
    sunLight.shadow.camera.left = -12;
    sunLight.shadow.camera.right = 12;
    sunLight.shadow.camera.top = 12;
    sunLight.shadow.camera.bottom = -12;
    sunLight.shadow.bias = -0.0005;
    scene.add(sunLight);

    // Secondary subtle fill light
    const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.4);
    fillLight.position.set(-15, 10, -10);
    scene.add(fillLight);

    // Warm Interior Point Lights
    const p1 = new THREE.PointLight(0xffaa44, 2.0, 10);
    p1.position.set(0, 1.8, 0);
    scene.add(p1);
    interiorLights.push(p1);

    const p2 = new THREE.PointLight(0xffb86c, 2.2, 10);
    p2.position.set(2, 4.0, 0);
    scene.add(p2);
    interiorLights.push(p2);

    const poolLight = new THREE.PointLight(0x00f0ff, 1.5, 8);
    poolLight.position.set(4.5, 0.2, 3.5);
    scene.add(poolLight);
    interiorLights.push(poolLight);
  }

  function buildSceneModel() {
    villaGroup = new THREE.Group();
    terrainGroup = new THREE.Group();
    structureGroup = new THREE.Group();
    finishesGroup = new THREE.Group();
    pinsGroup = new THREE.Group();

    // Materials Library
    const concreteMat = new THREE.MeshStandardMaterial({
      color: 0x8a929e,
      roughness: 0.65,
      metalness: 0.1
    });

    const darkSlabMat = new THREE.MeshStandardMaterial({
      color: 0x1f2937,
      roughness: 0.5,
      metalness: 0.2
    });

    const steelColumnMat = new THREE.MeshStandardMaterial({
      color: 0x111827,
      metalness: 0.85,
      roughness: 0.2
    });

    const glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x7dd3fc,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.8,
      ior: 1.5,
      thickness: 0.5
    });

    const cedarLouversMat = new THREE.MeshStandardMaterial({
      color: 0xa16207,
      roughness: 0.7,
      metalness: 0.05
    });

    const poolWaterMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.1,
      metalness: 0.6,
      transparent: true,
      opacity: 0.85
    });

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.9,
      metalness: 0.1
    });

    // 1. TERRAIN & PARCEL BOUNDARY (Representing Land Acquisition)
    const groundGeo = new THREE.CylinderGeometry(14, 15, 0.4, 32);
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.y = -0.2;
    ground.receiveShadow = true;
    terrainGroup.add(ground);

    // Topographical Grid Lines
    const gridHelper = new THREE.GridHelper(26, 26, 0xc5a059, 0x1e293b);
    gridHelper.position.y = 0.02;
    terrainGroup.add(gridHelper);

    // Glowing Property Parcel Boundary Line
    const boundaryPoints = [
      new THREE.Vector3(-6, 0.05, -6),
      new THREE.Vector3(7, 0.05, -6),
      new THREE.Vector3(7, 0.05, 7),
      new THREE.Vector3(-6, 0.05, 7),
      new THREE.Vector3(-6, 0.05, -6)
    ];
    const boundaryGeo = new THREE.BufferGeometry().setFromPoints(boundaryPoints);
    const boundaryMat = new THREE.LineBasicMaterial({ color: 0xc89d56, linewidth: 2 });
    const boundaryLine = new THREE.Line(boundaryGeo, boundaryMat);
    terrainGroup.add(boundaryLine);

    // 2. FOUNDATION & STRUCTURAL SLABS
    // Subterranean piles
    for (let x = -4; x <= 4; x += 4) {
      for (let z = -3; z <= 3; z += 3) {
        const pileGeo = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 12);
        const pile = new THREE.Mesh(pileGeo, concreteMat);
        pile.position.set(x, -1.2, z);
        structureGroup.add(pile);
      }
    }

    // Ground Floor Slab
    const groundSlabGeo = new THREE.BoxGeometry(9, 0.35, 7);
    const groundSlab = new THREE.Mesh(groundSlabGeo, darkSlabMat);
    groundSlab.position.set(0, 0.18, 0);
    groundSlab.receiveShadow = true;
    groundSlab.castShadow = true;
    structureGroup.add(groundSlab);

    // Infinity Pool
    const poolGeo = new THREE.BoxGeometry(4.5, 0.3, 3.2);
    const pool = new THREE.Mesh(poolGeo, poolWaterMat);
    pool.position.set(5.2, 0.16, 2.2);
    finishesGroup.add(pool);

    const poolDeckGeo = new THREE.BoxGeometry(5.2, 0.25, 4);
    const poolDeck = new THREE.Mesh(poolDeckGeo, darkSlabMat);
    poolDeck.position.set(5.2, 0.1, 2.2);
    poolDeck.receiveShadow = true;
    structureGroup.add(poolDeck);

    // Ground Floor Columns (Steel Framing)
    const colCoordsG = [
      [-4, -3], [-4, 3], [0, -3], [0, 3], [4, -3], [4, 3],
      [-2, 0], [2, 0]
    ];
    colCoordsG.forEach(([cx, cz]) => {
      const colGeo = new THREE.BoxGeometry(0.2, 2.6, 0.2);
      const col = new THREE.Mesh(colGeo, steelColumnMat);
      col.position.set(cx, 1.48, cz);
      col.castShadow = true;
      structureGroup.add(col);
    });

    // Ground Floor Interior Shear Wall (Concrete Core)
    const coreGeo = new THREE.BoxGeometry(2.5, 2.6, 1.6);
    const core = new THREE.Mesh(coreGeo, concreteMat);
    core.position.set(-1.8, 1.48, -1.2);
    core.castShadow = true;
    structureGroup.add(core);

    // Ground Floor Glass Walls
    const glassGF1 = new THREE.Mesh(new THREE.BoxGeometry(7.8, 2.5, 0.08), glassMat);
    glassGF1.position.set(0.2, 1.48, 3.2);
    finishesGroup.add(glassGF1);

    const glassGF2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.5, 6.2), glassMat);
    glassGF2.position.set(4.2, 1.48, 0.1);
    finishesGroup.add(glassGF2);

    // 3. FIRST FLOOR CANTILEVER & UPPER LEVEL
    // Cantilevered Mid Slab (Offset for dramatic modern look)
    const midSlabGeo = new THREE.BoxGeometry(10.5, 0.35, 7.5);
    const midSlab = new THREE.Mesh(midSlabGeo, darkSlabMat);
    midSlab.position.set(0.6, 2.95, 0.3);
    midSlab.castShadow = true;
    midSlab.receiveShadow = true;
    structureGroup.add(midSlab);

    // Upper Floor Columns
    const colCoordsU = [
      [-3.5, -2.5], [-3.5, 2.5], [1, -2.5], [1, 2.5], [4.5, -2.5], [4.5, 2.5]
    ];
    colCoordsU.forEach(([cx, cz]) => {
      const colGeo = new THREE.BoxGeometry(0.2, 2.4, 0.2);
      const col = new THREE.Mesh(colGeo, steelColumnMat);
      col.position.set(cx, 4.3, cz);
      col.castShadow = true;
      structureGroup.add(col);
    });

    // Upper Level Concrete Master Suite Box
    const upperSuiteGeo = new THREE.BoxGeometry(5.5, 2.4, 4.5);
    const upperSuite = new THREE.Mesh(upperSuiteGeo, concreteMat);
    upperSuite.position.set(-1.2, 4.3, -0.6);
    upperSuite.castShadow = true;
    structureGroup.add(upperSuite);

    // Upper Level Glass Pavilion
    const glassUF1 = new THREE.Mesh(new THREE.BoxGeometry(4.2, 2.3, 0.08), glassMat);
    glassUF1.position.set(3.4, 4.3, 2.4);
    finishesGroup.add(glassUF1);

    const glassUF2 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 2.3, 4.8), glassMat);
    glassUF2.position.set(5.5, 4.3, 0);
    finishesGroup.add(glassUF2);

    // Cantilevered Glass Balustrade
    const balustradeGeo = new THREE.BoxGeometry(9.8, 0.9, 0.05);
    const balustrade = new THREE.Mesh(balustradeGeo, glassMat);
    balustrade.position.set(0.6, 3.55, 3.9);
    finishesGroup.add(balustrade);

    // Timber Architectural Louvers
    for (let l = 0; l < 8; l++) {
      const louverGeo = new THREE.BoxGeometry(0.08, 2.3, 0.35);
      const louver = new THREE.Mesh(louverGeo, cedarLouversMat);
      louver.position.set(1.4 + l * 0.45, 4.3, -2.8);
      louver.castShadow = true;
      finishesGroup.add(louver);
    }

    // 4. ROOF & SOLAR ARRAY
    const roofSlabGeo = new THREE.BoxGeometry(11.2, 0.3, 8.2);
    const roofSlab = new THREE.Mesh(roofSlabGeo, darkSlabMat);
    roofSlab.position.set(0.6, 5.65, 0.2);
    roofSlab.castShadow = true;
    structureGroup.add(roofSlab);

    // Solar PV Panels on Roof
    const solarMat = new THREE.MeshStandardMaterial({
      color: 0x1e3a8a,
      metalness: 0.9,
      roughness: 0.1
    });
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        const pvGeo = new THREE.BoxGeometry(1.6, 0.05, 1.2);
        const pv = new THREE.Mesh(pvGeo, solarMat);
        pv.position.set(-2.5 + col * 1.9, 5.85, -2 + row * 1.5);
        finishesGroup.add(pv);
      }
    }

    // 5. INTERACTIVE 3D HOTSPOT PINS
    createHotspotPin('pin1', -5, 0.5, 4.5, "01 Land");
    createHotspotPin('pin2', -1.8, 1.5, 0.8, "02 Core");
    createHotspotPin('pin3', 3.4, 4.5, 2.6, "03 Glass");
    createHotspotPin('pin4', 0.5, 6.2, 0, "04 Energy");

    // Assemble groups into Villa
    villaGroup.add(terrainGroup);
    villaGroup.add(structureGroup);
    villaGroup.add(finishesGroup);
    villaGroup.add(pinsGroup);

    scene.add(villaGroup);
  }

  function createHotspotPin(id, x, y, z, labelText) {
    const pinGroup = new THREE.Group();
    pinGroup.position.set(x, y, z);
    pinGroup.userData = { id: id };

    // Outer pulsating ring
    const ringGeo = new THREE.RingGeometry(0.25, 0.35, 24);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xc89d56,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = -Math.PI / 2;
    pinGroup.add(ring);

    // Center Core Sphere
    const sphereGeo = new THREE.SphereGeometry(0.18, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xc89d56,
      emissiveIntensity: 0.6,
      roughness: 0.2
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.userData = { isHotspot: true, id: id };
    pinGroup.add(sphere);

    // Floating vertical stem
    const stemGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 8);
    const stemMat = new THREE.MeshBasicMaterial({ color: 0xc89d56 });
    const stem = new THREE.Mesh(stemGeo, stemMat);
    stem.position.y = -0.3;
    pinGroup.add(stem);

    pinsGroup.add(pinGroup);
  }

  function setupHUDControls() {
    // Layer Toggles
    const layerButtons = document.querySelectorAll('.layer-btn');
    layerButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        layerButtons.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        const mode = target.getAttribute('data-mode');
        setInspectionMode(mode);
        if (window.playSfx) window.playSfx('click');
      });
    });

    // View Angles
    const viewButtons = document.querySelectorAll('.hud-btn[data-view]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.currentTarget;
        viewButtons.forEach(b => b.classList.remove('active'));
        target.classList.add('active');
        const view = target.getAttribute('data-view');
        setCameraView(view);
        if (window.playSfx) window.playSfx('swoosh');
      });
    });

    // Lighting Day/Night
    const lightToggle = document.getElementById('hud-light-toggle');
    if (lightToggle) {
      lightToggle.addEventListener('click', () => {
        isNight = !isNight;
        setLightingMode(isNight);
        lightToggle.innerHTML = isNight ? '🌙 Night Mode' : '☀️ Golden Sunset';
        if (window.playSfx) window.playSfx('toggle');
      });
    }

    // Hotspot Info Card Close
    const closeBtn = document.getElementById('hotspot-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        const card = document.getElementById('hotspot-info-card');
        if (card) card.classList.remove('visible');
      });
    }
  }

  function setInspectionMode(mode) {
    currentMode = mode;

    switch (mode) {
      case 'full':
        terrainGroup.visible = true;
        structureGroup.visible = true;
        finishesGroup.visible = true;
        setWireframeMode(false);
        break;

      case 'framing':
        terrainGroup.visible = true;
        structureGroup.visible = true;
        finishesGroup.visible = false;
        setWireframeMode(false);
        break;

      case 'blueprint':
        terrainGroup.visible = true;
        structureGroup.visible = true;
        finishesGroup.visible = true;
        setWireframeMode(true);
        break;

      case 'land':
        terrainGroup.visible = true;
        structureGroup.visible = false;
        finishesGroup.visible = false;
        setWireframeMode(false);
        break;
    }
  }

  function setWireframeMode(enabled) {
    villaGroup.traverse(child => {
      if (child.isMesh && !child.userData.isHotspot) {
        if (enabled) {
          if (!child.userData.originalMaterial) {
            child.userData.originalMaterial = child.material;
          }
          child.material = new THREE.MeshBasicMaterial({
            color: 0x38bdf8,
            wireframe: true,
            transparent: true,
            opacity: 0.45
          });
        } else if (child.userData.originalMaterial) {
          child.material = child.userData.originalMaterial;
        }
      }
    });
  }

  function setLightingMode(night) {
    if (night) {
      scene.background.set(0x04060d);
      scene.fog.color.set(0x04060d);
      ambientLight.color.set(0x1e293b);
      ambientLight.intensity = 0.4;
      sunLight.intensity = 0.2;
      interiorLights.forEach(l => l.intensity = 3.5);
    } else {
      scene.background.set(0x070b14);
      scene.fog.color.set(0x070b14);
      ambientLight.color.set(0xdde8fa);
      ambientLight.intensity = 0.85;
      sunLight.intensity = 1.6;
      interiorLights.forEach(l => l.intensity = 1.8);
    }
  }

  function setCameraView(view) {
    if (!controls) return;
    autoRotate = false;

    let targetPos = new THREE.Vector3();
    let lookTarget = new THREE.Vector3(0, 1.8, 0);

    if (view === 'overview') {
      targetPos.set(14, 9, 14);
    } else if (view === 'cutaway') {
      targetPos.set(0, 3.5, 14);
      lookTarget.set(0, 2.5, 0);
    } else if (view === 'aerial') {
      targetPos.set(0.1, 18, 0.1);
      lookTarget.set(0, 0, 0);
    }

    animateCameraTo(targetPos, lookTarget);
  }

  function animateCameraTo(targetPos, lookTarget) {
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    let progress = 0;

    function step() {
      progress += 0.04;
      if (progress > 1) progress = 1;

      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      camera.position.lerpVectors(startPos, targetPos, ease);
      controls.target.lerpVectors(startTarget, lookTarget, ease);
      controls.update();

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    }
    step();
  }

  function onCanvasClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(pinsGroup.children, true);

    if (intersects.length > 0) {
      let hit = intersects[0].object;
      while (hit && !hit.userData.id && hit.parent) {
        hit = hit.parent;
      }
      if (hit && hit.userData && hit.userData.id) {
        displayHotspotInfo(hit.userData.id);
        if (window.playSfx) window.playSfx('ping');
      }
    }
  }

  function displayHotspotInfo(id) {
    const info = hotspotData[id];
    if (!info) return;

    const card = document.getElementById('hotspot-info-card');
    const badge = document.getElementById('hotspot-card-badge');
    const title = document.getElementById('hotspot-card-title');
    const desc = document.getElementById('hotspot-card-desc');

    if (card && badge && title && desc) {
      badge.textContent = info.tag;
      title.textContent = info.title;
      desc.textContent = info.desc;
      card.classList.add('visible');
    }
  }

  function onWindowResize() {
    if (!container || !renderer || !camera) return;
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function animate(timestamp) {
    requestAnimationFrame(animate);

    if (controls) {
      if (autoRotate) {
        villaGroup.rotation.y += 0.0018;
      }
      controls.update();
    }

    // Gently pulse hotspot rings
    if (pinsGroup) {
      pinsGroup.children.forEach((p, idx) => {
        const ring = p.children[0];
        if (ring) {
          const s = 1 + 0.15 * Math.sin((timestamp || 0) * 0.003 + idx);
          ring.scale.set(s, s, s);
        }
      });
    }

    renderer.render(scene, camera);
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
