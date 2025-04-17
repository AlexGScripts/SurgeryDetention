function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x111111); // Dark background

  camera = new THREE.PerspectiveCamera(
    75, window.innerWidth / window.innerHeight, 0.1, 1000
  );
  camera.position.set(0, 1.6, 5);
  camera.lookAt(0, 1.6, 0); // Look forward slightly down

  renderer = new THREE.WebGLRenderer({ canvas: document.getElementById("game") });
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Add directional light so walls show up better
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(5, 10, 5);
  scene.add(dirLight);

  const ambient = new THREE.AmbientLight(0x404040); // Soft light
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

  // Enemy setup remains the same...
  // (keep your teacher + knife model here)

  document.addEventListener("keydown", (e) => keys[e.key.toLowerCase()] = true);
  document.addEventListener("keyup", (e) => keys[e.key.toLowerCase()] = false);
}
