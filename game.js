<script type="module">
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene, camera, renderer, enemy, knife, redOverlay;
let keys = {};
let gameStarted = false;
let caught = false;
let yaw = Math.PI; // Start facing toward -Z
let pitch = 0;

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

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  // Floor & Ceiling
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  scene.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a })
  );
  ceiling.position.y = 3;
  scene.add(ceiling);

  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });

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

  // Security Cameras
  for (let i = -8; i <= 8; i += 2.5) {
    scene.add(makeCamera(-9.8, 2.5, i, Math.PI / 2));
    scene.add(makeCamera(9.8, 2.5, i, -Math.PI / 2));
    scene.add(makeCamera(i, 2.5, -9.8, 0));
    scene.add(makeCamera(i, 2.5, 9.8, Math.PI));
  }

  // Enemy
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

  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

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
    handleCameraRotation();
    handleMovement();
    moveEnemy();
    animateKnife();
  }

  const target = new THREE.Vector3(
    camera.position.x + Math.sin(yaw),
    camera.position.y + pitch,
    camera.position.z + Math.cos(yaw)
  );
  camera.lookAt(target);

  renderer.render(scene, camera);
}

function handleMovement() {
  const speed = 0.1;
  const direction = new THREE.Vector3();

  if (keys["w"]) direction.z -= 1;
  if (keys["s"]) direction.z += 1;
  if (keys["a"]) direction.x -= 1;
  if (keys["d"]) direction.x += 1;

  direction.normalize();

  const moveX = Math.sin(yaw) * direction.z + Math.cos(yaw) * direction.x;
  const moveZ = Math.cos(yaw) * direction.z - Math.sin(yaw) * direction.x;

  const newX = camera.position.x + moveX * speed;
  const newZ = camera.position.z + moveZ * speed;

  if (newX > -9.5 && newX < 9.5) camera.position.x = newX;
  if (newZ > -9.5 && newZ < 9.5) camera.position.z = newZ;
}

function handleCameraRotation() {
  const rotateSpeed = 0.03;
  if (keys["arrowleft"]) yaw += rotateSpeed;
  if (keys["arrowright"]) yaw -= rotateSpeed;
  if (keys["arrowup"]) pitch = Math.max(-0.5, pitch - rotateSpeed);
  if (keys["arrowdown"]) pitch = Math.min(0.5, pitch + rotateSpeed);
}

function moveEnemy() {
  const dx = camera.position.x - enemy.position.x;
  const dz = camera.position.z - enemy.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > 0.2) {
    enemy.position.x += (dx / dist) * 0.035;
    enemy.position.z += (dz / dist) * 0.035;
  }

  if (dist < 1.3 && !caught) {
    caught = true;
    playStabCutscene();
  }
}

function animateKnife() {
  knife.rotation.z = Math.sin(Date.now() * 0.01) * 0.8;
}

function playStabCutscene() {
  let stabCount = 0;
  const maxStabs = 5;

  const stabInterval = setInterval(() => {
    camera.lookAt(enemy.position);
    enemy.lookAt(camera.position);
    enemy.position.lerp(camera.position, 0.15);
    knife.rotation.z = Math.random() > 0.5 ? 1 : -1;

    redOverlay.style.background = "rgba(255, 0, 0, 0.3)";
    setTimeout(() => {
      redOverlay.style.background = "rgba(255, 0, 0, 0)";
    }, 100);

    stabCount++;
    if (stabCount >= maxStabs) {
      clearInterval(stabInterval);
      setTimeout(() => {
        fadeToBlack();
      }, 800);
    }
  }, 600);
}

function fadeToBlack() {
  redOverlay.style.transition = "1s ease";
  redOverlay.style.background = "black";
  setTimeout(() => {
    alert("You were stabbed by the teacher in surgery detention...");
    window.location.reload();
  }, 1500);
}
</script>
