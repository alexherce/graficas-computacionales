'use strict';

Physijs.scripts.worker = './js/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

var initScene, render, renderer, scene, camera, cubeCamera, box, directionalLight,
player, controls, guiparams, container, door, mat1, animate;
var pbox, dbox, mouse = { x: 0, y: 0, z: 0 };
var initAudio = false;

var sphereMaterial = new THREE.MeshBasicMaterial({color: 0x333333});
var wireMat = new THREE.MeshBasicMaterial({ color: 0x888888, wireframe: true });
var clock = new THREE.Clock();

// FBXLoader variables
var mixers = [];
var model, stats;
var animations_zombie = [];

// Load animations
var zombie_loader = new THREE.FBXLoader();
zombie_loader.load( 'assets/Zombie_Idle.FBX', function ( object ) {
  animations_zombie.push(object.animations[ 1 ]);

});
zombie_loader.load( 'assets/Zombie_Attack.FBX', function ( object ) {

  animations_zombie.push(object.animations[ 1 ]);

});
zombie_loader.load( 'assets/Zombie_Death.FBX', function ( object ) {

  animations_zombie.push(object.animations[ 1 ]);

});
zombie_loader.load( 'assets/Zombie_Running.FBX', function ( object ) {

  animations_zombie.push(object.animations[ 1 ]);

});

// 0's is where user can walk
// 1 & 2 are textures for the wall
var map = [ // 1  2  3  4  5  6  7  8  9
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 0
  [1, 1, 0, 0, 0, 0, 0, 1, 1, 1,], // 1
  [1, 1, 0, 0, 2, 0, 0, 0, 0, 1,], // 2
  [1, 0, 0, 0, 0, 2, 0, 0, 0, 1,], // 3
  [1, 0, 0, 2, 0, 0, 2, 0, 0, 1,], // 4
  [1, 0, 0, 0, 2, 0, 0, 0, 1, 1,], // 5
  [1, 1, 1, 0, 0, 0, 0, 1, 1, 1,], // 6
  [1, 1, 1, 0, 0, 1, 0, 0, 1, 1,], // 7
  [1, 1, 1, 1, 1, 1, 0, 0, 1, 1,], // 8
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1,], // 9
], mapW = map.length, mapH = map[0].length;

// Semi-constants
var UNITSIZE = 400,
WALLHEIGHT = UNITSIZE / 3,
MOVESPEED = 50,
BULLETMOVESPEED = MOVESPEED * 15,
BULLETMOVESPEEDENEMY = MOVESPEED * 2,
NUMAI = 5,
PROJECTILEDAMAGE = 20;

function create_zombie() {

  zombie_loader.load( 'assets/Zombie2_Walk.FBX', function ( object ) {

    model = object;
    object.mixer = new THREE.AnimationMixer( object );
    mixers.push( object.mixer );

    for(var i=0; i<animations_zombie.length; i++)
    {
      object.animations.push(animations_zombie[i]);
    }

    /*
      Action 0: Walk
      Action 1: Nothing
      Action 2: Idle
      Action 3: Attack
      Action 4: Death
      Action 5: Running
    */
    var action = model.mixer.clipAction( object.animations[ 0 ] );
    action.play();

    model.scale.x = 0.25;
    model.scale.y = 0.25;
    model.scale.z = 0.25;

    scene.add( object );

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
  var texture = new THREE.TGALoader().load('assets/launcher.tga');
  var loader = new THREE.OBJLoader();

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

// -------------------------------

// Set up the objects in the world
function setupWorld() {
  var units = mapW;

  // Geometry: floor

  // var floor = new t.Mesh(
  //   new t.PlaneGeometry(units * UNITSIZE, units * UNITSIZE, 100, 100),
  //   new t.MeshLambertMaterial({color: 0xEDCBA0})
  // );
  //
  // floor.rotation.x = -Math.PI / 2;
  // scene.add(floor);

  var floorMat = new THREE.MeshPhongMaterial({color: 0xEDCBA0});
  var floor = new Physijs.BoxMesh(
    new THREE.CubeGeometry(units * UNITSIZE, 1, units * UNITSIZE),
    new Physijs.createMaterial( floorMat, 4, 0.5 ),
    0
  );
  // floor.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
  //   collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  // });

  floor.name = "floor";
  scene.add(floor);

  // Geometry: walls
  var cube = new THREE.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
  var materials = [
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load('assets/hull.png')}),
    new THREE.MeshLambertMaterial({map: new THREE.TextureLoader().load('assets/hull_2.jpg')}),
    new THREE.MeshLambertMaterial({color: 0xFBEBCD}),
  ];

  for (var i = 0; i < mapW; i++) {
    for (var j = 0, m = map[i].length; j < m; j++) {
      if (map[i][j]) {
        var wall = new Physijs.BoxMesh(cube, materials[map[i][j]-1], 0);
        wall.position.x = (i - units/2) * UNITSIZE;
        wall.position.y = WALLHEIGHT/2;
        wall.position.z = (j - units/2) * UNITSIZE;

        // wall.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
        //   collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
        // });

        wall.name = "wall";
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
  window.AudioContext = window.AudioContext || window.webkitAudioContext;
  var audioContext = new AudioContext();

  create_zombie();

  // FIX AUDIO FOR CHROME
  document.addEventListener('click', resumeAudioContext(audioContext), false);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize( window.innerWidth, window.innerHeight );
  container = document.getElementById( 'webGL' )
  container.appendChild( renderer.domElement );

  //Stats
  stats = new Stats();
  container.appendChild( stats.dom );

  // renderer.setPixelRatio( window.devicePixelRatio );
  // console.log("Pixel ratio: " + window.devicePixelRatio);

  window.addEventListener( 'resize', onWindowResize, false );

  scene = new Physijs.Scene;
  scene.setGravity(new THREE.Vector3(0,-30,0));

  // scene.fog = new THREE.Fog( 0x000000, 0, 1000 );
  // scene.fog.color.setHSL( 0.51, 0.6, 0.6 );
  // scene.background = new THREE.Color( 0xffffff );

  // Physics worker thread
  // This updates on different clock

  scene.addEventListener(
    'update',
    function() {
      var dt = clock.getDelta();
      if (dt > 0.05) dt = 0.05;
      scene.simulate(undefined, 2);
      //scene.simulate(null,1);
      controls.updatePhys(dt);
    }
  );

  document.addEventListener('click', playerShoot, false );

  camera =  new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
  camera.position.set(0, 17.5, 0);
  camera.lookAt(scene.position);

  var light = new THREE.AmbientLight( 0x404040 ); // soft white light
  scene.add( light );

  /*load player colider*/
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
  player.position.y = 20;
  player.position.x = 150;
  player.add(camera);
  scene.add(player);
  player.setAngularFactor(new THREE.Vector3(0,0,0));

  /*add controls*/
  controls = new THREE.PhysicsFirstPersonControls(player);
  controls.setAudioContext(audioContext).startOn(container, false);

  // CUBE CAMERA

  cubeCamera = new THREE.CubeCamera( 1, 100000, 512 );
  scene.add( cubeCamera );
  cubeCamera.renderTarget.texture.format = THREE.RGBFormat;

  // SETUP WORLD

  setupWorld();
  // loadMap();

  scene.simulate(); // run physics
  requestAnimationFrame( render );
  requestAnimationFrame( animate );
};

function render() {

  requestAnimationFrame( render );

  var delta = clock.getDelta();

  cubeCamera.position.copy( {x:player.position.x, y:-67 - player.position.y  , z:player.position.z} );

  // render scene
  cubeCamera.update( renderer, scene );

  // Zombie animations
  // if ( mixers.length > 0 ) {
  //   for ( var i = 0; i < mixers.length; i ++ ) {
  //     mixers[ i ].update( delta );
  //   }
  // }

  renderer.render( scene, camera); // render the scene

  // stats.update();

};

function animate() {

  requestAnimationFrame( animate );

  if ( mixers.length > 0 ) {
    for ( var i = 0; i < mixers.length; i ++ ) {
      mixers[ i ].update( clock.getDelta() );
    }
  }

  renderer.render( scene, camera );

  stats.update();

}

window.onload = initScene;
