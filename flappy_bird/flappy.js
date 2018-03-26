var WIDTH = $(window).innerWidth(),
HEIGHT = $(window).innerHeight();

var VIEW_ANGLE = 45,
ASPECT = WIDTH / HEIGHT,
NEAR = 0.1,
FAR = 1000,
BLOCKSPEED = 0.5;

var container, renderer, camera, controls, light, scene, player, background, floor, playerBB, floorBB, pointsDisplay, score, sky, skyBB;
var velocity = 0;
var play = false;
var canJump = true;
var gameOver = false;
var controlsEnabled = false;
var gameOverTime;
var backgroundAnimator = null;
var animateBackground = true;

var prevTime;

var walls = [];

var wallPositions = [
  {top: 50.25, bottom: 10.25},
  {top: 40.25, bottom: 0.25},
  {top: 30.25, bottom: -9.75}
];

var map = new THREE.TextureLoader().load("assets/brick.jpg");
map.wrapS = map.wrapT = THREE.RepeatWrapping;
map.repeat.set(1, 2);

var wallGeometry = new THREE.BoxGeometry(5, 30, 10);
var wallMaterial = new THREE.MeshLambertMaterial({map: map});

function onKeyDown(event) {
  switch (event.keyCode) {
    case 32: // space
    if(controlsEnabled) {
      if (play === false && gameOver === false) {
        prevTime = performance.now();
        play = true;
      }
      if(gameOver) {
        restart();
      } else {
        if (canJump === true) velocity += 40;
        canJump = false;
      }
    }
    break;
  }
}

function onKeyUp(event) {
  switch (event.keyCode) {
    case 32: // space
    canJump = true;
    break;
  }
}

function restart() {
  document.getElementById("menu").style.display = "none";
  pointsDisplay.style.display = "block";

  scene.remove(player);
  for(var i = walls.length-1; i >= 0; i--) {
    scene.remove(walls[i].wall);
    scene.remove(walls[i].colliderUp);
    scene.remove(walls[i].colliderDown);
    walls.splice(i, 1);
  }
  score = 0;
  createPlayer();
  createObstacle();
  backgroundAnimator.start();
  gameOver = false;
  controlsEnabled = true;
}

function gameOverFreeze() {
  controlsEnabled = false;
  play = false;
  velocity = 0;
  gameOver = true;
  backgroundAnimator.stop();
  document.getElementById("menu").style.display = "block";
  pointsDisplay.style.display = "none";
}

function init() {

  document.addEventListener('keydown', onKeyDown, false);
  document.addEventListener('keyup', onKeyUp, false);

  container = document.getElementById("container");

  renderer = new THREE.WebGLRenderer({ antialias: true });

  camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

  camera.position.set(0, 20, 50);
  camera.lookAt(new THREE.Vector3(0, 20, 50));

  // controls = new THREE.OrbitControls( camera, renderer.domElement );

  light = new THREE.HemisphereLight( 0xeeeeff, 0x777788, 1 );
  light.position.set(0, 20.25, 0);

  renderer.setSize(WIDTH, HEIGHT);
  container.appendChild(renderer.domElement);

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xaed6f1);
  scene.fog = new THREE.Fog( 0xffffff, 50, 70 );

  scene.add(camera);
  scene.add(light);

  pointsDisplay = document.getElementById("points");

  document.getElementById("menu").style.display = "block";
  pointsDisplay.style.display = "none";

  document.getElementById("play_button").addEventListener('click', function (event) {
    event.preventDefault();
    restart();
  });

  score = 0;
}

function createMeshes() {
  var skyGeometry = new THREE.PlaneGeometry(200, 20, 10, 1);
  sky = new THREE.Mesh(skyGeometry, new THREE.MeshBasicMaterial({color:0xc0c5d5, transparent: true, opacity: 0, side:THREE.DoubleSide}));
  sky.rotation.x = -Math.PI / 2;
  sky.position.y = 42;
  scene.add(sky);

  skyBB = new THREE.Box3().setFromObject(sky);

  var map = new THREE.TextureLoader().load("assets/grass.png");
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(5, 1);

  var floorGeometry = new THREE.PlaneGeometry(200, 20, 10, 1);
  floor = new THREE.Mesh(floorGeometry, new THREE.MeshPhongMaterial({color:0xffffff, map:map, side:THREE.DoubleSide}));
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  floorBB = new THREE.Box3().setFromObject(floor);

  var backgroundTexture = new THREE.TextureLoader().load("assets/citybg2.png");
  backgroundTexture.wrapS = backgroundTexture.wrapT = THREE.RepeatWrapping;
  backgroundTexture.repeat.set(2, 1);

  var backGeometry = new THREE.PlaneGeometry(200, 45, 10, 5);
  background = new THREE.Mesh(backGeometry, new THREE.MeshPhongMaterial({color:0xffffff, map:backgroundTexture, side:THREE.DoubleSide}));
  background.position.y = 22.5;
  background.position.z = -10;
  // back.rotation.x = -Math.PI / 2;
  scene.add(background);

}

function createPlayer() {
  player = new THREE.Object3D();
  // playerBB = new THREE.Object3D();

  // instantiate a loader
  var texture = new THREE.TextureLoader().load("assets/BulletBill.png");
  var loader = new THREE.OBJLoader();

  // load a resource
  loader.load(
    // resource URL
    'assets/BulletBill.obj',
    // called when resource is loaded
    function ( object ) {

      // var texture = new THREE.TextureLoader().load('assets/mpx_s.png');
      var material = new THREE.MeshPhongMaterial({map: texture});

      // For any meshes in the model, add our material.
      object.traverse( function ( node ) {
        if ( node.isMesh ) node.material = material;
      });



      object.position.set(0,0,0);
      object.rotation.set(0,1.57,0);
      object.scale.set(0.02,0.02,0.02);
      object.name = "player";

      player.add(object);

      // player.add(playerBB);
      player.position.set(0,20.25,0);

    }, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened: ' + error );
    }
  );

  playerBB = new THREE.Box3().setFromObject(player);
  scene.add(player);
}

function createObstacle() {
  var randHeigth = getRandomInt(0,2);
  var wallGroup = new THREE.Object3D();

  var wallUp = new THREE.Mesh(wallGeometry, wallMaterial);
  wallUp.position.set(0, wallPositions[randHeigth].top, 0);

  wallGroup.add(wallUp);

  var wallDown = new THREE.Mesh(wallGeometry, wallMaterial);
  wallDown.position.set(0, wallPositions[randHeigth].bottom, 0);

  wallGroup.add(wallDown);

  var wallUpBB, wallDownBB;

  wallGroup.position.set(100, 0, 0);

  wallUpBB = new THREE.Box3().setFromObject(wallUp);
  wallDownBB = new THREE.Box3().setFromObject(wallDown);

  scene.add(wallGroup);

  walls.push({wall: wallGroup, wallUp: wallUp, wallDown: wallDown, colliderUp: wallUpBB, colliderDown: wallDownBB});
}

function updatePositions() {
  for(var i = walls.length-1; i >= 0; i--) {
    walls[i].wall.translateX(-BLOCKSPEED);
    walls[i].colliderUp.setFromObject(walls[i].wallUp);
    walls[i].colliderDown.setFromObject(walls[i].wallDown);

    if(walls[i].colliderUp.intersectsBox(playerBB)) {
      console.log("collision up");
      gameOverFreeze();
      pointsDisplay.innerHTML = score;
    }

    if(walls[i].colliderDown.intersectsBox(playerBB)) {
      console.log("colision down");
      pointsDisplay.innerHTML = score;
      gameOverFreeze();
    }

    if(walls[i].wall.position.x == -5) {
      score++;
      pointsDisplay.innerHTML = score;
    }

    if(walls[i].wall.position.x === 50) {
      createObstacle();
    }

    if(walls[i].wall.position.x === -95) {
      scene.remove(walls[i].wall);
      scene.remove(walls[i].colliderUp);
      scene.remove(walls[i].colliderDown);
      walls.splice(i, 1);
    }
  }
}

function playerUpdate() {

  var time = performance.now();
  var delta = (time - prevTime) / 1000;

  velocity -= 9.8 * 7.5 * delta; // 100.0 = mass

  if(velocity < -40) velocity = -40;

  if(velocity > 40) velocity = 40;

  player.translateY(velocity * delta);

  playerBB.setFromObject(player);

  if(playerBB.intersectsBox(floorBB)) {
    console.log("collision floor");
    pointsDisplay.innerHTML = score;
    gameOverFreeze();
  }

  if(playerBB.intersectsBox(skyBB)) {
    console.log("collision sky");
    pointsDisplay.innerHTML = score;
    gameOverFreeze();
  }

  prevTime = time;
}

function playAnimations() {
  if (animateBackground) {
    backgroundAnimator = new KF.KeyFrameAnimator;
    backgroundAnimator.init({
      interps:
      [
        {
          keys:[0, 0.5, 1],
          values:[
            { x : 0, y : 0 },
            { x : 0.5, y : 0 },
            { x : 1, y : 0 },
          ],
          target:background.material.map.offset
        },
        {
          keys:[0, 0.5, 1],
          values:[
            { x : 0, y : 0 },
            { x : 2.5, y : 0 },
            { x : 5, y : 0 },
          ],
          target:floor.material.map.offset
        }
      ],
      loop: true,
      duration:10000,
    });
    backgroundAnimator.start();
  }
}

function animate() {
  if(play == true) {
    updatePositions();
    playerUpdate();
  }
  renderer.render(scene, camera);
  KF.update();
  requestAnimationFrame(animate);
  // controls.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  // controls.handleResize();
  renderer.render( scene, camera );
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

window.addEventListener('resize', onWindowResize, false);

// --- CALL FUNCTIONS ---
init();
createPlayer();
createMeshes();
createObstacle();
playAnimations();
animate();
