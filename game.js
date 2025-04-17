let scene, camera, renderer, player, enemy;
let keys = {};
let gameStarted = false;

function startGame() {
  document.getElementById("overlay").style.display = "none";
  gameStarted = true;
  init();
  animate();
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 1.6, 5); // Player height

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Lighting
  const light = new THREE.PointLight(0xff0000, 2, 20);
  light.position.set(0, 2, 0);
  scene.add(light);

  // Floor
  const floorGeometry = new THREE.BoxGeometry(20, 0.1, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  scene.add(floor);

  // Walls
  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const wallGeometry = new THREE.BoxGeometry(1, 3, 20);

  const wallLeft = new THREE.Mesh(wallGeometry, wallMaterial);
  wallLeft.position.set(-10, 1.5, 0);
  scene.add(wallLeft);

  const wallRight = wallLeft.clone();
  wallRight.position.set(10, 1.5, 0);
  scene.add(wallRight);

  // Enemy (teacher with knife)
  const enemyGeometry = new THREE.BoxGeometry(0.8, 1.8, 0.8);
  const enemyMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
  enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
  enemy.position.set(0, 0.9, -5);
  scene.add(enemy);

  // Player (camera = player)
  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
}

function animate() {
  requestAnimationFrame(animate);

  if (gameStarted) {
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
    enemy.position.x += (dx / dist) * 0.02;
    enemy.position.z += (dz / dist) * 0.02;
  }

  if (dist < 1) {
    alert("You were caught by the teacher! Game Over.");
    window.location.reload();
  }
}
