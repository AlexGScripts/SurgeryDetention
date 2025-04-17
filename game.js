let scene, camera, renderer, enemy, knife;
let keys = {};
let gameStarted = false;
let caught = false;

function startGame() {
  document.getElementById("overlay").style.display = "none";
  gameStarted = true;
  init();
  animate();
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111);

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 1.6, 5);
  camera.lookAt(0, 1.6, 0);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0x404040);
  scene.add(ambient);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(20, 0.1, 20),
    new THREE.MeshStandardMaterial({ color: 0x2a2a2a })
  );
  scene.add(floor);

  // Ceiling
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
  for (let i = -8; i <= 8; i += 4) {
    const cam = createSecurityCamera();
    cam.position.set(-9.8, 2.5, i);
    cam.rotation.y = Math.PI / 2;
    scene.add(cam);

    const cam2 = createSecurityCamera();
    cam2.position.set(9.8, 2.5, i);
    cam2.rotation.y = -Math.PI / 2;
    scene.add(cam2);
  }

  // Enemy (teacher with knife)
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
  knife.rotation.x = Math.PI / 4;
  enemy.add(knife);

  enemy.position.set(0, 0, -5);
  scene.add(enemy);

  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
}

function createSecurityCamera() {
  const cam = new THREE.Group();

  const base = new THREE.Mesh(
    new THREE.BoxGeometry(0.3, 0.2, 0.3),
    new THREE.MeshStandardMaterial({ color: 0x222222 })
  );
  cam.add(base);

  const lens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8),
    new THREE.MeshStandardMaterial({ color: 0x1111ff })
  );
  lens.rotation.z = Math.PI / 2;
  lens.position.z = 0.25;
  cam.add(lens);

  return cam;
}

function animate() {
  requestAnimationFrame(animate);

  if (gameStarted && !caught) {
    handleMovement();
    moveEnemy();
  }

  renderer.render(scene, camera);
}

function handleMovement() {
  const speed = 0.1;
  if (keys["w"]) camera.position.z -= speed;
  if (keys["s"]) camera.position.z += speed;
  if (keys["a"]) camera.position.x -= speed;
  if (keys["d"]) camera.position.x += speed;
}

function moveEnemy() {
  const dx = camera.position.x - enemy.position.x;
  const dz = camera.position.z - enemy.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist > 0.2) {
    enemy.position.x += (dx / dist) * 0.015;
    enemy.position.z += (dz / dist) * 0.015;
  }

  if (dist < 1.5 && !caught) {
    caught = true;
    playCutscene();
  }
}

function playCutscene() {
  const interval = setInterval(() => {
    enemy.position.lerp(camera.position, 0.05);
    knife.rotation.z += 0.2;

    const dx = camera.position.x - enemy.position.x;
    const dz = camera.position.z - enemy.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);

    if (dist < 0.6) {
      clearInterval(interval);
      setTimeout(() => {
        alert("You were stabbed by the teacher in surgery detention...");
        window.location.reload();
      }, 800);
    }
  }, 50);
}
