let scene, camera, renderer;
let keys = {}, gameStarted = false, caught = false;
let enemies = [], lights = [], redOverlay;

function startGame() {
  document.getElementById("overlay").style.display = "none";
  gameStarted = true;
  init();
  animate();
}

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0a);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);

  addMap();
  addLights();
  addEnemies();
  setupOverlay();
}

function addMap() {
  const floorMat = new THREE.MeshStandardMaterial({ color: 0x222222 });
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x444444 });

  // Floor
  const floor = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 30), floorMat);
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(new THREE.BoxGeometry(30, 0.1, 30), floorMat);
  ceiling.position.y = 3;
  scene.add(ceiling);

  // Walls
  const wallThickness = 0.2;
  const wallHeight = 3;

  const wallPositions = [
    // outer walls
    [-15, wallHeight/2, 0, 0.2, wallHeight, 30],
    [15, wallHeight/2, 0, 0.2, wallHeight, 30],
    [0, wallHeight/2, -15, 30, wallHeight, 0.2],
    [0, wallHeight/2, 15, 30, wallHeight, 0.2],
    // classroom and camera room walls
    [-5, wallHeight/2, 0, 0.2, wallHeight, 10],
    [5, wallHeight/2, 0, 0.2, wallHeight, 10],
    [0, wallHeight/2, -5, 10, wallHeight, 0.2]
  ];

  wallPositions.forEach(pos => {
    const wall = new THREE.Mesh(
      new THREE.BoxGeometry(pos[3], pos[4], pos[5]),
      wallMat
    );
    wall.position.set(pos[0], pos[1], pos[2]);
    scene.add(wall);
  });

  // Security cameras
  for (let i = -10; i <= 10; i += 5) {
    const cam = makeCamera(i, 2.7, -14.8);
    scene.add(cam);
  }
}

function makeCamera(x, y, z) {
  const cam = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, 0.2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
  const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), new THREE.MeshStandardMaterial({ color: 0x00aaff }));
  lens.rotation.z = Math.PI / 2;
  lens.position.z = 0.2;
  cam.add(body);
  cam.add(lens);
  cam.position.set(x, y, z);
  return cam;
}

function addLights() {
  const ambient = new THREE.AmbientLight(0x202020);
  scene.add(ambient);

  const positions = [-10, 0, 10];
  positions.forEach(z => {
    const light = new THREE.PointLight(0xffffff, 0.8, 20);
    light.position.set(0, 2.8, z);
    scene.add(light);
    lights.push(light);
  });
}

function flickerLights() {
  if (Math.random() < 0.01) {
    lights.forEach(light => light.intensity = Math.random() > 0.5 ? 0 : 0.8);
  }
}

function addEnemies() {
  createEnemy("Teacher", 0xff0000, -10, 0);
  createEnemy("Principal", 0x0000ff, 10, 0);
}

function createEnemy(name, color, x, z) {
  const enemy = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1, 1.5, 0.5), new THREE.MeshStandardMaterial({ color }));
  body.position.y = 0.75;
  enemy.add(body);

  const head = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0xffccaa }));
  head.position.y = 1.9;
  enemy.add(head);

  const knife = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.6, 0.1), new THREE.MeshStandardMaterial({ color: 0xcccccc }));
  knife.position.set(0.6, 0.9, 0.2);
  enemy.add(knife);

  enemy.position.set(x, 0, z);
  enemy.userData = { knife, name };
  enemies.push(enemy);
  scene.add(enemy);
}

function updateEnemies() {
  enemies.forEach(enemy => {
    const dx = camera.position.x - enemy.position.x;
    const dz = camera.position.z - enemy.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist > 0.2) {
      enemy.position.x += (dx / dist) * 0.03;
      enemy.position.z += (dz / dist) * 0.03;
    }
    if (dist < 1.3 && !caught) {
      caught = true;
      playStabCutscene(enemy);
    }
  });
}

function handleMovement() {
  const speed = 0.1;
  let newX = camera.position.x;
  let newZ = camera.position.z;

  if (keys["w"]) newZ -= speed;
  if (keys["s"]) newZ += speed;
  if (keys["a"]) newX -= speed;
  if (keys["d"]) newX += speed;

  if (newX > -14 && newX < 14) camera.position.x = newX;
  if (newZ > -14 && newZ < 14) camera.position.z = newZ;
}

function setupOverlay() {
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

function playStabCutscene(enemy) {
  let stabCount = 0;
  const maxStabs = 5;

  const stabInterval = setInterval(() => {
    camera.lookAt(enemy.position);
    enemy.lookAt(camera.position);
    enemy.position.lerp(camera.position, 0.1);
    enemy.userData.knife.rotation.z = Math.random() > 0.5 ? 1 : -1;

    redOverlay.style.background = "rgba(255, 0, 0, 0.3)";
    setTimeout(() => redOverlay.style.background = "rgba(255, 0, 0, 0)", 100);

    stabCount++;
    if (stabCount >= maxStabs) {
      clearInterval(stabInterval);
      setTimeout(() => fadeToBlack(enemy.userData.name), 800);
    }
  }, 500);
}

function fadeToBlack(enemyName) {
  redOverlay.style.transition = "1s ease";
  redOverlay.style.background = "black";
  setTimeout(() => {
    alert(`You were stabbed by the ${enemyName}...`);
    window.location.reload();
  }, 1500);
}

function animate() {
  requestAnimationFrame(animate);
  if (gameStarted && !caught) {
    handleMovement();
    updateEnemies();
    flickerLights();
  }
  renderer.render(scene, camera);
}
