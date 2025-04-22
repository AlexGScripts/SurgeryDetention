<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Surgery Detention</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    canvas { display: block; }
    #overlay {
      position: fixed; top: 0; left: 0;
      width: 100vw; height: 100vh;
      background: black;
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 3em; z-index: 10;
      cursor: pointer;
    }
  </style>
</head>
<body>
  <div id="overlay" onclick="startGame()">Click to Start</div>
  <canvas id="game"></canvas>
  <script src="https://cdn.jsdelivr.net/npm/three@0.157.0/build/three.min.js"></script>
  <script>
let scene, camera, renderer, enemy, knife, redOverlay, winDoor, secondWinDoor;
let keys = {}, gameStarted = false, caught = false, camYaw = 0, camPitch = 0;
let currentLevel = 1;

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

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0x888888);
  scene.add(ambient);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(50, 0.1, 50), new THREE.MeshStandardMaterial({ color: 0x2a2a2a }));
  scene.add(floor);

  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(50, 0.1, 50), new THREE.MeshStandardMaterial({ color: 0x1a1a1a }));
  ceiling.position.y = 3;
  scene.add(ceiling);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
  const wallLeft = new THREE.Mesh(new THREE.BoxGeometry(0.1, 3, 50), wallMaterial);
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

  winDoor = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
  winDoor.position.set(0, 1, -9.95);
  scene.add(winDoor);

  secondWinDoor = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshStandardMaterial({ color: 0x00ff00 }));
  secondWinDoor.position.set(0, 1, 30);
  secondWinDoor.visible = false;
  scene.add(secondWinDoor);

  for (let i = -8; i <= 8; i += 2.5) {
    scene.add(makeCamera(-9.8, 2.5, i, Math.PI / 2));
    scene.add(makeCamera(9.8, 2.5, i, -Math.PI / 2));
    scene.add(makeCamera(i, 2.5, -9.8, 0));
    scene.add(makeCamera(i, 2.5, 9.8, Math.PI));
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

  if (Math.abs(newX) < 20) camera.position.x = newX;
  if (Math.abs(newZ) < 50) camera.position.z = newZ;
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
    enemy.position.x += (dx / dist) * 0.08;
    enemy.position.z += (dz / dist) * 0.08;
  }

  if (dist < 1.3 && !caught) {
    caught = true;
    playStabCutscene();
  }
}

function animateKnife() {
  knife.rotation.z = Math.sin(Date.now() * 0.01) * 0.8;
}

function checkWinCondition() {
  const dist = (a, b) => a.position.distanceTo(b.position);

  if (currentLevel === 1 && dist(camera, winDoor) < 1.5) {
    currentLevel = 2;
    camera.position.set(0, 1.6, 20);
    winDoor.visible = false;
    secondWinDoor.visible = true;
  } else if (currentLevel === 2 && dist(camera, secondWinDoor) < 1.5) {
    alert("You escaped Surgery Detention!");
    window.location.reload();
  }
}

function playStabCutscene() {
  let stabCount = 0;
  let maxStabs = 5;

  const stabInterval = setInterval(() => {
    camera.lookAt(enemy.position);
    enemy.lookAt(camera.position);
    enemy.position.lerp(camera.position, 0.15);
    knife.rotation.z = Math.random() > 0.5 ? 1 : -1;

    redOverlay.style.background = "rgba(255, 0, 0, 0.3)";
    setTimeout(() => redOverlay.style.background = "rgba(255, 0, 0, 0)", 100);

    stabCount++;
    if (stabCount >= maxStabs) {
      clearInterval(stabInterval);
      setTimeout(() => fadeToBlack(), 800);
    }
  }, 600);
}

function fadeToBlack() {
  redOverlay.style.transition = "1s ease";
  redOverlay.style.background = "black";
  setTimeout(() => {
    alert("You were stabbed by the teacher in Surgery Detention...");
    window.location.reload();
  }, 1500);
}
  </script>
</body>
</html>
