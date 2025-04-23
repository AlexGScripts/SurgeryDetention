let scene, camera, renderer, enemy, knife, redOverlay, listener, stabSound;
let keys = {};
let gameStarted = false;
let caught = false;
let level = 1;
let isDragging = false;
let dragTarget = new THREE.Vector3(0, 0, 0);

let camYaw = 0;
let camPitch = 0;
let winDoor;

function startGame() {
  document.getElementById("overlay").style.display = "none";
  gameStarted = true;
  init();
  animate();
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  listener = new THREE.AudioListener();
  camera.add(listener);

  stabSound = new THREE.Audio(listener);
  const audioLoader = new THREE.AudioLoader();
  audioLoader.load("stab.mp3", (buffer) => {
    stabSound.setBuffer(buffer);
    stabSound.setVolume(0.5);
  });

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0x333333 }));
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(20, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  ceiling.position.y = 3;
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444, emissive: 0x222222 });

  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 20), wallMaterial);
  wallLeft.position.set(-10, 1.5, 0);
  scene.add(wallLeft);

  const wallRight = wallLeft.clone();
  wallRight.position.set(10, 1.5, 0);
  scene.add(wallRight);

  const wallBack = new THREE.Mesh(new THREE.BoxGeometry(20, 3, 0.1), wallMaterial);
  wallBack.position.set(0, 1.5, -10);
  scene.add(wallBack);

  const wallFront = wallBack.clone();
  wallFront.position.set(0, 1.5, 10);
  scene.add(wallFront);

  if (level === 1 || level === 2) {
    for (let i = -8; i <= 8; i += 2.5) {
      scene.add(makeCamera(-9.8, 2.5, i, Math.PI / 2));
      scene.add(makeCamera(9.8, 2.5, i, -Math.PI / 2));
      scene.add(makeCamera(i, 2.5, -9.8, 0));
      scene.add(makeCamera(i, 2.5, 9.8, Math.PI));
    }

    winDoor = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshStandardMaterial({ color: level === 1 ? 0x00ff00 : 0xff0000 }));
    winDoor.position.set(0, 1, -9.95);
    scene.add(winDoor);

    // Improved hospital bed
    const bedGroup = new THREE.Group();

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(4, 0.4, 2),
      new THREE.MeshStandardMaterial({ color: 0xdddddd })
    );
    mattress.position.y = 0.4;
    bedGroup.add(mattress);

    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 1, 2),
      new THREE.MeshStandardMaterial({ color: 0x999999 })
    );
    headboard.position.set(-2.1, 0.8, 0);
    bedGroup.add(headboard);

    for (let x = -1.8; x <= 1.8; x += 3.6) {
      for (let z = -0.8; z <= 0.8; z += 1.6) {
        const leg = new THREE.Mesh(
          new THREE.BoxGeometry(0.1, 0.4, 0.1),
          new THREE.MeshStandardMaterial({ color: 0x555555 })
        );
        leg.position.set(x, 0.2, z);
        bedGroup.add(leg);
      }
    }

    bedGroup.position.set(0, 0, 0);
    scene.add(bedGroup);
  }

  enemy = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color: 0xaa0000 }));
  body.position.y = 0.75;
  enemy.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffccaa }));
  head.position.y = 1.9;
  enemy.add(head);

  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1, 0.2), new THREE.MeshStandardMaterial({ color: 0xaa0000 }));
  arm.position.set(0.6, 1.2, 0);
  enemy.add(arm);

  knife = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  knife.position.set(0.6, 0.9, 0.2);
  enemy.add(knife);

  enemy.position.set(0, 0, -5);
  scene.add(enemy);

  redOverlay = document.createElement("div");
  redOverlay.style.position = "fixed";
  redOverlay.style.top = 0;
  redOverlay.style.left = 0;
  redOverlay.style.width = "100vw";
  redOverlay.style.height = "100vh";
  redOverlay.style.background = "rgba(255, 0, 0, 0)";
  redOverlay.style.zIndex = 10;
  redOverlay.style.pointerEvents = "none";
  document.body.appendChild(redOverlay);

  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
}

function makeCamera(x, y, z, rotY) {
  const cam = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.3), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  cam.add(base);
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x1111ff }));
  lens.rotation.z = Math.PI / 2;
  lens.position.z = 0.25;
  cam.add(lens);
  cam.position.set(x, y, z);
  cam.rotation.y = rotY;
  return cam;
}

function animate() {
  requestAnimationFrame(animate);
  if (gameStarted && !caught) {
    handleMovement();
    moveEnemy();
    animateKnife();
    checkWinCondition();
  }
  updateCameraDirection();
  renderer.render(scene, camera);
}

function handleMovement() {
  const speed = 0.1;

  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3();
  right.crossVectors(forward, camera.up).normalize();

  let move = new THREE.Vector3();

  if (keys["w"]) move.add(forward);
  if (keys["s"]) move.sub(forward);
  if (keys["a"]) move.sub(right);
  if (keys["d"]) move.add(right);

  move.normalize().multiplyScalar(speed);
  const newX = camera.position.x + move.x;
  const newZ = camera.position.z + move.z;

  if (Math.abs(newX) < 9.5) camera.position.x = newX;
  if (Math.abs(newZ) < 9.5) camera.position.z = newZ;
}

function updateCameraDirection() {
  if (keys["arrowleft"]) camYaw += 0.03;
  if (keys["arrowright"]) camYaw -= 0.03;
  if (keys["arrowup"]) camPitch += 0.02;
  if (keys["arrowdown"]) camPitch -= 0.02;

  camPitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camPitch));

  const x = Math.cos(camPitch) * Math.sin(camYaw);
  const y = Math.sin(camPitch);
  const z = Math.cos(camPitch) * Math.cos(camYaw);
  camera.lookAt(camera.position.x + x, camera.position.y + y, camera.position.z + z);
}

function moveEnemy() {
  const dx = camera.position.x - enemy.position.x;
  const dz = camera.position.z - enemy.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > 0.2) {
    enemy.position.x += (dx / dist) * 0.045;
    enemy.position.z += (dz / dist) * 0.045;
  }

  if (dist < 1.3 && !caught && !isDragging) {
    caught = true;
    isDragging = true;
    dragTarget.set(0, 0.25, 0);
    playDragCutscene();
  }
}

function animateKnife() {
  knife.rotation.z = Math.sin(Date.now() * 0.01) * 0.8;
}

function playDragCutscene() {
  let dragInterval = setInterval(() => {
    enemy.position.lerp(dragTarget, 0.1);
    camera.position.lerp(dragTarget, 0.1);

    if (enemy.position.distanceTo(dragTarget) < 0.1) {
      clearInterval(dragInterval);
      playStabCutscene();
    }
  }, 30);
}

function playStabCutscene() {
  stabSound.play();
  let angle = 0;
  const tiltInterval = setInterval(() => {
    angle += 0.02;
    camera.rotation.z = angle;
    if (angle >= Math.PI / 4) {
      clearInterval(tiltInterval);
      redOverlay.style.transition = "2s ease";
      redOverlay.style.background = "black";
      setTimeout(() => {
        if (level === 1) {
          alert("Level 1 beaten! Moving to Level 2...");
          level = 2;
          scene.clear();
          init();
        } else {
          alert("You were stabbed by the teacher in surgery detention...");
          window.location.reload();
        }
      }, 2000);
    }
  }, 30);
}

function checkWinCondition() {
  const winDistance = 1.2;
  if (camera.position.distanceTo(winDoor.position) < winDistance) {
    if (level === 1) {
      fadeToBlack();
    } else {
      alert("You escaped Surgery Detention!");
      window.location.reload();
    }
  }
}

function fadeToBlack() {
  redOverlay.style.transition = "1s ease";
  redOverlay.style.background = "black";
  setTimeout(() => {
    if (level === 1) {
      alert("Level 1 beaten! Moving to Level 2...");
      level = 2;
      scene.clear();
      init();
    } else {
      alert("You were stabbed by the teacher in surgery detention...");
      window.location.reload();
    }
  }, 1500);
}
