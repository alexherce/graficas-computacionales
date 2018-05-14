'use strict';

Physijs.scripts.worker = './js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var initScene, render, renderer, scene, camera, cubeCamera, box, directionalLight,
player, controls, guiparams, container, door, mat1, animate, zombie_loader, zombieOG;

var pbox, dbox, mouse = { x: 0, y: 0, z: 0 };
var initAudio = false;
var zombies = [];
var spawns = [];
var sequence = 0;

var lastSpawn = 0;
var nextSpawn = 0;

var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
var wireMat = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
var clock = new THREE.Clock();

var loadingScreen = {
  scene: new THREE.Scene(),
  camera: new THREE.PerspectiveCamera(90, 1280/720, 0.1, 100),
  box: new THREE.Mesh(
    new THREE.BoxGeometry(0.1,0.5,0.1),
    new THREE.MeshBasicMaterial({ color:0x4444ff })
  )
};

var loadingManager = null;
var RESOURCES_LOADED = false;

// FBXLoader variables
var mixers = [];
var model, stats;
var animations_zombie = [];

// Game handler
var hp = 5;
var gameOver = false;
var pointsDisplay;
var score = 0;

// 0's is where user can walk
// 1 & 2 are textures for the wall
var map = [
// 0  1  2  3  4  5  6  7
  [1, 1, 1, 1, 1, 1, 1, 1], // 0
  [1, 1, 1, 1, 2, 1, 1, 1], // 1
  [1, 1, 0, 0, 0, 0, 1, 1], // 2
  [1, 1, 0, 0, 0, 0, 1, 1], // 3
  [1, 2, 0, 0, 0, 0, 2, 1], // 4
  [1, 1, 0, 0, 0, 0, 1, 1], // 5
  [1, 1, 1, 1, 2, 1, 1, 1], // 6
  [1, 1, 1, 1, 1, 1, 1, 1], // 7
], mapW = map.length, mapH = map[0].length;

// Semi-constants
var UNITSIZE = 400,
WALLHEIGHT = UNITSIZE / 3,
MOVESPEED = 50,
BULLETMOVESPEED = MOVESPEED * 15,
BULLETMOVESPEEDENEMY = MOVESPEED * 2,
NUMAI = 5,
PROJECTILEDAMAGE = 20;

function getRndInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1) ) + min;
}

function load_zombie(modelPar) {

  var model = 'assets/Zombie_Walk.fbx';

  if(modelPar == 2) {
    model = 'assets/Zombie2_Walk.fbx';
  } else if (modelPar == 3) {
    model = 'assets/Zombie3_Walk.fbx';
  }

  zombie_loader.load( model, function ( object ) {

    object.scale.x = 0.2;
    object.scale.y = 0.2;
    object.scale.z = 0.2;

    object.position.x = 0;
    object.position.y = -21;
    object.position.z = 0;

    zombieOG = object;
  });
}

function create_zombie(modelPar) {

  let loader = new THREE.FBXLoader();
  loader.load( 'assets/Zombie3_Walk.fbx', function ( object ) {
    object.scale.x = 0.2;
    object.scale.y = 0.2;
    object.scale.z = 0.2;

    object.position.x = 0;
    object.position.y = -21;
    object.position.z = 0;

    object.mixer = new THREE.AnimationMixer( object );
    let action = object.mixer.clipAction(animations_zombie[3]);
    action.play();

    let zombie = new Physijs.CylinderMesh(
      new THREE.CylinderGeometry(7, 7, 40, 10),
      Physijs.createMaterial(new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}), 2, 0),
      1000
    );

    zombie.add(object);

    zombie.health = 100;

    zombie.name = 'zombie';
    zombie.material.visible = false;

    zombie.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
      collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
    });

    // RANDOM PLACE TO SPAWN
    let rand = getRndInt(0, spawns.length-1);
    zombie.position.copy(spawns[rand].position);
    console.log(zombie.position);

    scene.add(zombie);
    zombie.setAngularFactor(new THREE.Vector3(0,0,0));
    zombies.push({
      zombie: zombie,
      walking: false,
      speed: getRndInt(50, 100),
      mixer: object.mixer
    });
  });
}

function crosshair(camera) {

  var size = 0.005;
  var padding = 0.002;

  // MATERIAL
  var material = new THREE.LineBasicMaterial({
    // color: 0xffffff
    // color: 0xAAAAff //hellblau
    color: 0x55FF55
    // color: 0xAAFFAA
    // color: 0xFF0000
  });

  // GEOMETRY
  var geometry = new THREE.Geometry();
  var geometry2 = new THREE.Geometry();
  var geometry3 = new THREE.Geometry();
  var geometry4 = new THREE.Geometry();

  // // closed triangle
  geometry.vertices.push(new THREE.Vector3(-size, 0, 0));
  geometry.vertices.push(new THREE.Vector3(0, size, 0));
  geometry.vertices.push(new THREE.Vector3(size, 0, 0));
  geometry.vertices.push(new THREE.Vector3(-size, 0, 0));

  // open crosshair
  // geometry.vertices.push(new THREE.Vector3(0, size + padding, 0));
  // geometry.vertices.push(new THREE.Vector3(0, padding, 0));

  geometry2 = geometry.clone();
  geometry2.rotateZ( Math.PI );

  geometry3 = geometry.clone();
  geometry3.rotateZ( - Math.PI / 2 );

  geometry4 = geometry.clone();
  geometry4.rotateZ( Math.PI / 2 );

  var line = new THREE.Line( geometry, material );
  var line2 = new THREE.Line( geometry2, material );
  var line3 = new THREE.Line( geometry3, material );
  var line4 = new THREE.Line( geometry4, material );

  line.add( line2 );
  line.add( line3 );
  line.add( line4 );

  // POSITION
  var crosshairPercentX = 50;
  var crosshairPercentY = 50;
  var crosshairPositionX = (crosshairPercentX / 100) * 2 - 1;
  var crosshairPositionY = (crosshairPercentY / 100) * 2 - 1;

  line.position.x = crosshairPositionX * camera.aspect;
  line.position.y = crosshairPositionY;
  line.position.z = -0.2;
  line.name ="crosshair";

  camera.add( line );
}

function gun(camera) {
  // instantiate a loader
  var texture = new THREE.TGALoader(loadingManager).load('assets/launcher.tga');
  var loader = new THREE.OBJLoader(loadingManager);

  // load a resource
  loader.load(
    // resource URL
    'assets/launcher.obj',
    // called when resource is loaded
    function ( object ) {

      // var texture = new THREE.TextureLoader().load('assets/mpx_s.png');
      var material = new THREE.MeshPhongMaterial({map: texture});

      // For any meshes in the model, add our material.
      object.traverse( function ( node ) {
        if ( node.isMesh ) node.material = material;
      });

      object.position.set(1,-2.5,-2);
      object.rotation.set(0,1.57,0);
      object.scale.set(0.5,0.5,0.5);
      object.name = "gun";

      var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
      var sphereGeo = new THREE.SphereGeometry(0.2, 6, 6);
      var sphere = new THREE.Mesh(sphereGeo, sphereMaterial);
      sphere.position.set(1.5, 3.55, 0);
      sphere.name = "muzzle";

      object.add(sphere);

      camera.add(object);

    }, function ( xhr ) {
      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
    },
    // called when loading has errors
    function ( error ) {
      console.log( 'An error happened: ' + error );
    }
  );
}

function createCapsule(width, height) {

  var merged = new THREE.Geometry(),
  cyl = new THREE.CylinderGeometry(width, width, height, 10),
  top = new THREE.SphereGeometry(width, 10, 10),
  bot = new THREE.SphereGeometry(width, 10, 10),
  matrix = new THREE.Matrix4();

  matrix.makeTranslation(0, -(height - width), 0);
  bot.applyMatrix(matrix);
  matrix.makeTranslation(0, (height - width), 0);
  top.applyMatrix(matrix);
  // merge to create a capsule
  merged.merge(top);
  merged.merge(bot);
  merged.merge(cyl);

  return merged;
}

function playerShoot( event ) {
  shootBullet();
}

function resumeAudioContext(context) {
  context.resume().then(() => {
    console.log('Playback resumed successfully');
    document.removeEventListener('click', resumeAudioContext);
  });
}

function shootBullet(obj) {
  var isPlayer = false;
  var pos = new THREE.Vector3();
  if (obj === undefined) {
    obj = player;
    isPlayer = true;
  }

  if (isPlayer) {
    var sphereGeo = new THREE.SphereGeometry(0.5, 6, 6);

    var gunPosVector = new THREE.Vector3();
    gunPosVector.setFromMatrixPosition(camera.getObjectByName("gun").getObjectByName("muzzle").matrixWorld);

    var sphere = new Physijs.SphereMesh(sphereGeo, sphereMaterial, 0.1);

    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    sphere.ray = new THREE.Ray(obj.position, vector.sub(obj.position).normalize());

    sphere.position.copy(sphere.ray.direction);
    sphere.position.add(gunPosVector);
  } else {
    var sphereGeo = new THREE.SphereGeometry(2, 6, 6);

    var sphere = new Physijs.SphereMesh(sphereGeo, sphereMaterial, 0.1);

    var vector = controls.getObject().position.clone();
    sphere.ray = new THREE.Ray(obj.position, vector.sub(obj.position).normalize());

    sphere.position.copy(sphere.ray.direction);
    sphere.position.add(new THREE.Vector3(obj.position.x, obj.position.y * 0.8, obj.position.z));
  }
  sphere.owner = obj;
  sphere.name = "bullet";

  sphere.setCcdMotionThreshold(0.5);
  sphere.setCcdSweptSphereRadius(0.01);

  // sphere.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
  //   collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  // });

  scene.add(sphere);

  pos.copy(sphere.ray.direction);
  if(isPlayer) pos.multiplyScalar(600);
  else pos.multiplyScalar(200);
  sphere.setLinearVelocity(new THREE.Vector3(pos.x, pos.y, pos.z));

  return sphere;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function collisionDetection(obj, otherObject, relativeVelocity, relativeRotation, contactNormal) {
  if(obj.name == "floor" && otherObject.name == "bullet") {
    scene.remove(otherObject);
  }

  if(obj.name == "wall" && otherObject.name == "bullet") {
    scene.remove(otherObject);
  }

  if(obj.name == "player" && otherObject.name == "zombie") {
    hp -= getRndInt(5,10);
    console.log("zombie hit player");
  }

  if(obj.name == "zombie" && otherObject.name == "bullet") {
    console.log("bullet hit zombie");

    // REMOVE BULLET
    scene.remove(otherObject);

    // DAMAGE TO ZOMBIE
    obj.health -= 20;

    // KILL ZOMBIE
    if(obj.health <= 0) {
      let objIndex = zombies.findIndex(x => x.zombie.id == obj.id);
      console.log(objIndex);
      zombies.splice(objIndex, 1);
      score += 1;
      scene.remove(obj);
    }
  }
}

// -------------------------------

// Set up the objects in the world
function setupWorld() {
  var units = mapW;

  var floorMat = new THREE.MeshPhongMaterial({color: 0xEDCBA0});
  var floor = new Physijs.BoxMesh(
    new THREE.CubeGeometry(units * UNITSIZE, 1, units * UNITSIZE),
    new Physijs.createMaterial( floorMat, 4, 0.5 ),
    0
  );

  floor.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
    collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  });

  floor.name = "floor";
  scene.add(floor);

  // Geometry: walls
  var cube = new THREE.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
  var materials = [
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader(loadingManager).load('assets/hull.png')}),
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader(loadingManager).load('assets/hull_2.jpg')}),
    new THREE.MeshLambertMaterial({color: 0xFBEBCD}),
  ];

  for (var i = 0; i < mapW; i++) {
    for (var j = 0, m = map[i].length; j < m; j++) {
      if (map[i][j] == 1) {
        var wall = new Physijs.BoxMesh(cube, materials[map[i][j]-1], 0);
        wall.position.x = (i - units/2) * UNITSIZE;
        wall.position.y = WALLHEIGHT/2;
        wall.position.z = (j - units/2) * UNITSIZE;
        wall.name = "wall";

        wall.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
          collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
        });

        scene.add(wall);
      }

      if (map[i][j] == 2) {
        var wall = new THREE.Mesh(cube, wireMat, 0);
        wall.position.x = (i - units/2) * UNITSIZE;
        wall.position.y = WALLHEIGHT/2;
        wall.position.z = (j - units/2) * UNITSIZE;

        wall.name = "spawn";
        wall.material.visible = false;
        spawns.push(wall);
        scene.add(wall);
      }
    }
  }

  // Lighting
  var directionalLight1 = new THREE.DirectionalLight( 0xF7EFBE, 0.7 );
  directionalLight1.position.set( 0.5, 1, 0.5 );
  scene.add( directionalLight1 );
  var directionalLight2 = new THREE.DirectionalLight( 0xF7EFBE, 0.5 );
  directionalLight2.position.set( -0.5, -1, -0.5 );
  scene.add( directionalLight2 );
}

function initScene() {
  var audioContext;
  gameOver = false;

  pointsDisplay = document.getElementById("points");

  // FIX AUDIO FOR CHROME
  // document.addEventListener('click', resumeAudioContext(audioContext), false);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  container = document.getElementById( 'webGL' )
  container.appendChild( renderer.domElement );

  //Stats
  stats = new Stats();
  container.appendChild( stats.dom );

  window.addEventListener( 'resize', onWindowResize, false );

  scene = new Physijs.Scene;
  scene.setGravity(new THREE.Vector3(0,-30,0));

  // scene.fog = new THREE.Fog( 0x000000, 0, 1000 );
  // scene.fog.color.setHSL( 0.51, 0.6, 0.6 );
  // scene.background = new THREE.Color( 0xffffff );

  // Physics worker thread
  // This updates on different clock
  // scene.addEventListener(
  //   'update',
  //   function() {
  //     var dt = clock.getDelta();
  //     if (dt > 0.05) dt = 0.05;
  //     scene.simulate(undefined, 2);
  //     controls.updatePhys(dt);
  //   }
  // );

  // Set up the loading screen's scene.
  // It can be treated just like our main scene.
  loadingScreen.box.position.set(0,0,5);
  loadingScreen.camera.lookAt(loadingScreen.box.position);
  loadingScreen.scene.add(loadingScreen.box);

  // Create a loading manager to set RESOURCES_LOADED when appropriate.
  // Pass loadingManager to all resource loaders.
  loadingManager = new THREE.LoadingManager();

  loadingManager.onProgress = function(item, loaded, total){
    loadingScreen.box.scale.x = total * 2;
  };

  loadingManager.onLoad = function(){
    console.log("loaded all resources");
    RESOURCES_LOADED = true;
  };

  document.addEventListener('click', playerShoot, false );

  camera =  new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 10000 );
  camera.position.set(0, 17.5, 0);
  camera.lookAt(scene.position);

  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );

  // PLAYER COLLIDER
  player = new Physijs.CapsuleMesh(
    createCapsule(1, 18),
    Physijs.createMaterial(
      new THREE.MeshBasicMaterial({color: 0xffffff, wireframe: true}),
      2, // friction
      0 // restitution
    )
  );

  crosshair(camera);
  gun(camera);

  player.material.visible = false;
  player.name = 'player'
  player.position.y = 30;
  player.position.x = 0;
  player.position.z = 0;
  player.add(camera);
  scene.add(player);
  player.setAngularFactor(new THREE.Vector3(0,0,0));

  player.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
    collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  });

  // CONTROLS
  controls = new THREE.PhysicsFirstPersonControls(player);

  try {
    window.AudioContext = window.AudioContext || window.webkitAudioContext;
    audioContext = new AudioContext();
    audioContext.resume();
  } catch(e) {
    console.log(e);
  } finally {
    controls.setAudioContext(audioContext).startOn(container, false);
  }

  // LOAD ZOMBIE ANIMATIONS
  try {
    zombie_loader = new THREE.FBXLoader(loadingManager);

    zombie_loader.load( 'assets/Zombie_Idle.FBX', function ( object ) {
      animations_zombie.push(object.animations[ 1 ]);

      zombie_loader.load( 'assets/Zombie_Attack.FBX', function ( object ) {
        animations_zombie.push(object.animations[ 1 ]);

        zombie_loader.load( 'assets/Zombie_Death.FBX', function ( object ) {
          animations_zombie.push(object.animations[ 1 ]);

          zombie_loader.load( 'assets/Zombie_Running.FBX', function ( object ) {
            animations_zombie.push(object.animations[ 1 ]);

            zombie_loader.load( 'assets/Zombie3_Walk.FBX', function ( object ) {
              animations_zombie.push(object.animations[ 0 ]);

              try {
                // SETUP WORLD
                setupWorld();
              } finally {
                create_zombie(3);
                animate();
                render();
                updateUser();
              }
            });
          });
        });
      });
    });
  } catch(e) {
    console.log(e);
  }
};

function spawn_zombies(num) {
  for(var i = 0; i < num; i++) {
    create_zombie(3);
  }
}

function update() {
  if(zombies.length > 0) {

    // VALUE FOR ZOMBIE ATTACK WAIT (IN FRAMES PER SECOND)
    if (sequence > 120) sequence = 0;

    var pos = new THREE.Vector3();
    for(var i = 0; i < zombies.length; i++) {

      // ZOMBIE LOOK AT PLAYER
      zombies[i].zombie.lookAt(player.position);

      // GET PLAYER POSITION, RAYCAST AND MOVE TO PLAYER
      var vector = player.position.clone();
      zombies[i].ray = new THREE.Ray(zombies[i].zombie.position, vector.sub(zombies[i].zombie.position).normalize());
      pos.copy(zombies[i].ray.direction);
      pos.multiplyScalar(zombies[i].speed);
      zombies[i].zombie.setLinearVelocity(new THREE.Vector3(pos.x, pos.y, pos.z));

      // IF CLOSE TO PLAYER, ATTACK ANIMATION
      if(zombies[i].zombie.position.distanceTo(player.position) < 25 && zombies[i].walking == true) {
        zombies[i].walking = false;
        var action = zombies[i].zombie.children[0].mixer.clipAction(animations_zombie[1]);
        action.play();
      }

      // IF CLOSE TO PLAYER ATTACK IF WAITED 120 FRAMES
      if(zombies[i].zombie.position.distanceTo(player.position) < 25 && sequence == 0) {
        console.log("zombie attacked player");
      }

      // IF FAR TO PLAYER, WALK ANIMATION
      if(zombies[i].zombie.position.distanceTo(player.position) > 25 && zombies[i].walking == false) {
        zombies[i].walking = true;
        var action = zombies[i].zombie.children[0].mixer.clipAction(animations_zombie[3]);
        action.play();
      }
    }
    sequence++;
  }

  var time = performance.now();
  var delta = ( time - lastSpawn ) / 1000;

  if(delta > nextSpawn) {
    lastSpawn = performance.now();
    nextSpawn = getRndInt(10, 30);
    create_zombie(3);
  }
  pointsDisplay.innerHTML = score;
  if(hp<=0) {
    gameOver = true;
    document.getElementById("menu").style.display = "block";
    document.getElementById("play_button").addEventListener('click', function (event) {
      event.preventDefault();
      restart();
    });
  }
}

function updateUser() {
  requestAnimationFrame( updateUser );
  if(gameOver == false)
  {
    var dt = clock.getDelta();
    if (dt > 0.05) dt = 0.05;
    scene.simulate();
    controls.updatePhys(dt);
  }
}

function animate() {
  requestAnimationFrame( animate );
  var time = clock.getDelta();
  if ( zombies.length > 0 ) {
    for ( var i = 0; i < zombies.length; i ++ ) {
      zombies[i].mixer.update(time);
    }
  }
}

function render() {

  // This block runs while resources are loading.
  if( RESOURCES_LOADED == false ){
    requestAnimationFrame(render);

    renderer.render(loadingScreen.scene, loadingScreen.camera);
    return; // Stop the function here.
  }

  update();

  renderer.render( scene, camera);

  requestAnimationFrame( render );
};

function restart() {
  document.getElementById("menu").style.display = "none";
  clearScene();
  player.position.set(0,0,0);
  player.setAngularFactor(new THREE.Vector3(0,0,0));
  hp = 100
  gameOver = false;
  score = 0;
}

function clearScene() {
  for(var zx=0; zx<zombies.length; zx++)
  {
    scene.remove(zombies[zx].zombie);
  }
}

window.onload = initScene;
