// Physijs required

// Global vars
var cam, scene, renderer, controls, gun, test, player;
var t = THREE, mouse = { x: 0, y: 0, z: 0 }, model, skin;
var runAnim = true, kills = 0, health = 100;
var healthCube, lastHealthPickup = 0;

var objects = [];

var raycaster;

var blocker, instructions;

var controlsEnabled = false;
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;
var moveJump = false;
var canJump = false;

var prevTime = performance.now();
var velocity, direction;

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
var UNITSIZE = 100,
WALLHEIGHT = UNITSIZE / 3,
MOVESPEED = 50,
BULLETMOVESPEED = MOVESPEED * 15,
BULLETMOVESPEEDENEMY = MOVESPEED * 2,
NUMAI = 5,
PROJECTILEDAMAGE = 20;

function initPointerLock() {
  var havePointerLock = 'pointerLockElement' in document || 'mozPointerLockElement' in document || 'webkitPointerLockElement' in document;

  if ( havePointerLock ) {
    var element = document.body;

    var pointerlockchange = function ( event ) {

      if ( document.pointerLockElement === element || document.mozPointerLockElement === element || document.webkitPointerLockElement === element ) {

        controlsEnabled = true;
        controls.enabled = true;
        scene.onSimulationResume();

        blocker.style.display = 'none';

      } else {

        controlsEnabled = false;
        controls.enabled = false;
        blocker.style.display = 'block';
        instructions.style.display = '';

      }

    };

    var pointerlockerror = function ( event ) {

      instructions.style.display = '';

    };

    // Hook pointer lock state change events
    document.addEventListener( 'pointerlockchange', pointerlockchange, false );
    document.addEventListener( 'mozpointerlockchange', pointerlockchange, false );
    document.addEventListener( 'webkitpointerlockchange', pointerlockchange, false );

    document.addEventListener( 'pointerlockerror', pointerlockerror, false );
    document.addEventListener( 'mozpointerlockerror', pointerlockerror, false );
    document.addEventListener( 'webkitpointerlockerror', pointerlockerror, false );

    instructions.addEventListener( 'click', function ( event )
    {
      instructions.style.display = 'none';

      // Ask the browser to lock the pointer
      element.requestPointerLock = element.requestPointerLock || element.mozRequestPointerLock || element.webkitRequestPointerLock;
      element.requestPointerLock();

    }, false );

  } else {
    instructions.innerHTML = 'Your browser doesn\'t seem to support Pointer Lock API';
  }
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

      object.position.set(2.5,-5.5,-5);
      object.rotation.set(0,1.57,0);
      object.scale.set(1,1,1);
      object.name = "gun";

      var sphereMaterial = new t.MeshBasicMaterial({color: 0x333333});
      var sphereGeo = new t.SphereGeometry(0.2, 6, 6);
      var sphere = new t.Mesh(sphereGeo, sphereMaterial);
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

function onKeyDown ( event ) {
  switch ( event.keyCode ) {
    case 38: // up
    case 87: // w
    moveForward = true;
    break;

    case 37: // left
    case 65: // a
    moveLeft = true;
    break;

    case 40: // down
    case 83: // s
    moveBackward = true;
    break;

    case 39: // right
    case 68: // d
    moveRight = true;
    break;

    case 32: // space
    shootBullet();
    break;

    case 16: // shift
    if ( canJump === true ) velocity.y += 200;
    canJump = false;
    break;
  }
}

function onKeyUp( event ) {
  switch( event.keyCode ) {
    case 38: // up
    case 87: // w
    moveForward = false;
    break;

    case 37: // left
    case 65: // a
    moveLeft = false;
    break;

    case 40: // down
    case 83: // s
    moveBackward = false;
    break;

    case 39: // right
    case 68: // d
    moveRight = false;
    break;
  }
}

function onDocumentMouseMove(e) {
  e.preventDefault();
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (e.clientY / window.innerHeight) * 2 + 1;
  mouse.z = 0.5;
}

function onWindowResize() {
  cam.aspect = window.innerWidth / window.innerHeight;
  cam.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

function collisionDetection(obj, otherObject, relativeVelocity, relativeRotation, contactNormal) {
  if(obj.name == "bullet" && otherObject.name == "wall") {
    scene.remove(obj);
  }

  if(obj.name == "bullet" && otherObject.name == "floor") {
    scene.remove(obj);
  }

  if(obj.name == "bullet" && otherObject.name == "enemy") {
    scene.remove(obj);
    console.log("bullet hit enemy");
  }
}

// Setup
function init(canvas) {
  scene = new Physijs.Scene;
  scene.setGravity(new THREE.Vector3( 0, -30, 0 ));
  scene.background = new THREE.Color( 0xffffff );
  scene.fog = new THREE.Fog( 0xffffff, 0, 290 );

  renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );

  window.addEventListener( 'resize', onWindowResize, false );

  velocity = new THREE.Vector3();
  direction = new THREE.Vector3();

  blocker = document.getElementById( 'blocker' );
  instructions = document.getElementById( 'instructions' );

  cam = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 300 );

  crosshair(cam);
  gun(cam);

  var playerGeometry = new t.SphereGeometry(2, 6, 6);
  var playerMaterial = new t.MeshBasicMaterial({wireframe: true});
  player = new Physijs.SphereMesh(playerGeometry, playerMaterial, 1);
  player.position.set(0,20,0);
  player.rotation.set(0, Math.PI, 0);
  player.setLinearVelocity(0,0,0);
  scene.add(player);

  controls = new THREE.PointerLockControls( cam );
  controls.getObject().position.set(0,20,0);
  scene.add(controls.getObject());

  document.addEventListener( 'keydown', onKeyDown, false );
  document.addEventListener( 'keyup', onKeyUp, false );

  // Raycaster( origin, direction, near, far )
  // origin — The origin vector where the ray casts from.
  // direction — The direction vector that gives direction to the ray. Should be normalized.
  // near — All results returned are further away than near. Near can't be negative. Default value is 0.
  // far — All results returned are closer then far. Far can't be lower then near . Default value is Infinity.
  raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );

  // World objects
  setupScene();

  // Artificial Intelligence
  setupAI();

  // Shoot on click
  // $(document).click(function(e) {
  // 	e.preventDefault;
  // 	if (e.which === 1) { // Left click only
  // 		shootBullet();
  // 	}
  // });

}

// Update and display
function render() {
  var time = performance.now();
  var delta = ( time - prevTime ) / 1000;
  var userSpeed = delta * BULLETMOVESPEED;
  var enemySpeed = delta * BULLETMOVESPEEDENEMY;
  var aispeed = delta * MOVESPEED;

  // --- Update bullets ---
  // for (var i = bullets.length-1; i >= 0; i--) {
  //   var b = bullets[i], p = b.position, d = b.ray.direction;
  //
  //   // Collide with walls
  //   if (checkWallCollision(p)) {
  //     bullets.splice(i, 1);
  //     scene.remove(b);
  //     continue;
  //   }
  //
  //   // Collide with AI
  //   var hit = false;
  //   for (var j = ai.length-1; j >= 0; j--) {
  //     var a = ai[j];
  //     var v = a.geometry.vertices[0];
  //     var c = a.position;
  //     var x = Math.abs(v.x), z = Math.abs(v.z);
  //
  //     if (p.x < c.x + x && p.x > c.x - x && p.z < c.z + z && p.z > c.z - z && b.owner != a) {
  //       bullets.splice(i, 1);
  //       scene.remove(b);
  //       a.health -= PROJECTILEDAMAGE;
  //       var color = a.material.color, percent = a.health / 100;
  //       a.material.color.setRGB(percent * color.r, percent * color.g, percent * color.b);
  //       hit = true;
  //       break;
  //     }
  //   }
  //
  //   // Bullet hits player
  //   if (distance(p.x, p.z, controls.getObject().position.x, controls.getObject().position.z) < 25 && b.owner != controls.getObject()) {
  //     // health -= 10;
  //     console.log("Bullet hits player: " + distance(p.x, p.z, controls.getObject().position.x, controls.getObject().position.z));
  //     if (health < 0) health = 0;
  //     bullets.splice(i, 1);
  //     scene.remove(b);
  //   }
  //
  //   // Move bullet if it hasn't hit anything
  //   if (!hit) {
  //     if(b.owner != controls.getObject()) {
  //       // Enemy shot bullets
  //       b.translateX(enemySpeed * d.x);
  //       b.translateZ(enemySpeed * d.z);
  //       b.translateY(enemySpeed * d.y);
  //     } else {
  //       // User shot bullets
  //       b.translateX(userSpeed * d.x);
  //       b.translateZ(userSpeed * d.z);
  //       b.translateY(userSpeed * d.y);
  //     }
  //   }
  //
  //   // Remove bullets shot to the sky or ground
  //   if(b.position.y > 60 || b.position.y < -5) {
  //     bullets.splice(i, 1);
  //     scene.remove(b);
  //   }
  // }

  // --- Update AI ---
  for (var i = ai.length-1; i >= 0; i--) {
    var a = ai[i];

    // AI kills
    if (a.health <= 0) {
      ai.splice(i, 1);
      scene.remove(a);
      kills++;
      document.getElementById("score").innerHTML = kills;
      addAI();
    }

    // Move AI
    var r = Math.random();
    if (r > 0.995) {
      a.lastRandomX = Math.random() * 2 - 1;
      a.lastRandomZ = Math.random() * 2 - 1;
    }
    a.translateX(aispeed * a.lastRandomX);
    a.translateZ(aispeed * a.lastRandomZ);
    var c = getMapSector(a.position);

    if (c.x < 0 || c.x >= mapW || c.y < 0 || c.y >= mapH || checkWallCollision(a.position)) {
      a.translateX(-2 * aispeed * a.lastRandomX);
      a.translateZ(-2 * aispeed * a.lastRandomZ);
      a.lastRandomX = Math.random() * 2 - 1;
      a.lastRandomZ = Math.random() * 2 - 1;
    }

    if (c.x < -1 || c.x > mapW || c.z < -1 || c.z > mapH) {
      ai.splice(i, 1);
      scene.remove(a);
      addAI();
    }

    var cc = getMapSector(controls.getObject().position);
    if (Date.now() > (a.lastShot + 1475) && distance(c.x, c.z, cc.x, cc.z) < 2) {
      shootBullet(a);
      a.lastShot = Date.now();
    }
  }

  // --- Player health ---
  if (health <= 0) {
    runAnim = false;
    console.log("Dead");
  }
}

// Set up the objects in the world
function setupScene() {
  var units = mapW;

  // Geometry: floor

  // var floor = new t.Mesh(
  //   new t.PlaneGeometry(units * UNITSIZE, units * UNITSIZE, 100, 100),
  //   new t.MeshLambertMaterial({color: 0xEDCBA0})
  // );
  //
  // floor.rotation.x = -Math.PI / 2;
  // scene.add(floor);
  var floor = new Physijs.BoxMesh(
    new t.CubeGeometry(units * UNITSIZE, 1, units * UNITSIZE),
    new t.MeshLambertMaterial({color: 0xEDCBA0}),
    0
  );
  floor.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
    collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  });
  floor.name = "floor";
  scene.add(floor);

  // Geometry: walls
  var cube = new t.CubeGeometry(UNITSIZE, WALLHEIGHT, UNITSIZE);
  var materials = [
    new t.MeshLambertMaterial({map: new t.TextureLoader().load('assets/hull.png')}),
    new t.MeshLambertMaterial({map: new t.TextureLoader().load('assets/hull_2.jpg')}),
    new t.MeshLambertMaterial({color: 0xFBEBCD}),
  ];

  for (var i = 0; i < mapW; i++) {
    for (var j = 0, m = map[i].length; j < m; j++) {
      if (map[i][j]) {
        var wall = new Physijs.BoxMesh(cube, materials[map[i][j]-1], 0);
        wall.position.x = (i - units/2) * UNITSIZE;
        wall.position.y = WALLHEIGHT/2;
        wall.position.z = (j - units/2) * UNITSIZE;
        wall.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
          collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
        });
        wall.name = "wall";
        scene.add(wall);
      }
    }
  }

  // Lighting
  var directionalLight1 = new t.DirectionalLight( 0xF7EFBE, 0.7 );
  directionalLight1.position.set( 0.5, 1, 0.5 );
  scene.add( directionalLight1 );
  var directionalLight2 = new t.DirectionalLight( 0xF7EFBE, 0.5 );
  directionalLight2.position.set( -0.5, -1, -0.5 );
  scene.add( directionalLight2 );
}

var ai = [];
var aiGeo = new t.CubeGeometry(20, 20, 20);

function setupAI() {
  for (var i = 0; i < NUMAI; i++) {
    addAI();
  }
}

function addAI() {
  var c = getMapSector(controls.getObject().position);
  var aiMaterial = new t.MeshBasicMaterial({map: new t.TextureLoader().load('assets/face.png')});
  var o = new t.Mesh(aiGeo, aiMaterial);
  do {
    var x = getRandBetween(0, mapW-1);
    var z = getRandBetween(0, mapH-1);
  } while (map[x][z] > 0 || (x == c.x && z == c.z));
  x = Math.floor(x - mapW/2) * UNITSIZE;
  z = Math.floor(z - mapW/2) * UNITSIZE;
  o.position.set(x, UNITSIZE * 0.10, z);
  o.health = 100;
  //o.path = getAIpath(o);
  o.pathPos = 1;
  o.lastRandomX = Math.random();
  o.lastRandomZ = Math.random();
  o.lastShot = Date.now();
  o.name = "enemy";
  ai.push(o);
  scene.add(o);
}

function getAIpath(a) {
  var p = getMapSector(a.position);
  do {
    do {
      var x = getRandBetween(0, mapW-1);
      var z = getRandBetween(0, mapH-1);
    } while (map[x][z] > 0 || distance(p.x, p.z, x, z) < 3);
    var path = findAIpath(p.x, p.z, x, z);
  } while (path.length == 0);
  return path;
}

function findAIpath(sX, sZ, eX, eZ) {
  var backupGrid = grid.clone();
  var path = finder.findPath(sX, sZ, eX, eZ, grid);
  grid = backupGrid;
  return path;
}

function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

function getMapSector(v) {
  var x = Math.floor((v.x + UNITSIZE / 2) / UNITSIZE + mapW/2);
  var z = Math.floor((v.z + UNITSIZE / 2) / UNITSIZE + mapW/2);
  return {x: x, z: z};
}

function checkWallCollision(v) {
  var c = getMapSector(v);
  if (map[c.x][c.z] === undefined) return true;
  return map[c.x][c.z] > 0;
}

var bullets = [];
var sphereMaterial = new t.MeshBasicMaterial({color: 0x333333});

function shootBullet(obj) {
  var isPlayer = false;
  var pos = new THREE.Vector3();
  if (obj === undefined) {
    obj = controls.getObject();
    isPlayer = true;
  }

  if (isPlayer) {
    var sphereGeo = new t.SphereGeometry(1, 6, 6);

    var gunPosVector = new t.Vector3();
    gunPosVector.setFromMatrixPosition(cam.getObjectByName("gun").getObjectByName("muzzle").matrixWorld);

    var sphere = new Physijs.SphereMesh(sphereGeo, sphereMaterial, 0.1);

    var vector = new t.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(cam);
    sphere.ray = new t.Ray(obj.position, vector.sub(obj.position).normalize());

    sphere.position.copy(sphere.ray.direction);
    sphere.position.add(gunPosVector);
  } else {
    var sphereGeo = new t.SphereGeometry(2, 6, 6);

    var sphere = new Physijs.SphereMesh(sphereGeo, sphereMaterial, 0.1);

    var vector = controls.getObject().position.clone();
    sphere.ray = new t.Ray(obj.position, vector.sub(obj.position).normalize());

    sphere.position.copy(sphere.ray.direction);
    sphere.position.add(new THREE.Vector3(obj.position.x, obj.position.y * 0.8, obj.position.z));
  }
  sphere.owner = obj;

  sphere.name = "bullet";

  sphere.setCcdMotionThreshold(1);
  sphere.setCcdSweptSphereRadius(0.2);

  sphere.addEventListener('collision', function( other_object, relative_velocity, relative_rotation, contact_normal) {
    collisionDetection(this, other_object, relative_velocity, relative_rotation, contact_normal);
  });

  bullets.push(sphere);
  scene.add(sphere);

  pos.copy(sphere.ray.direction);
  if(isPlayer) pos.multiplyScalar(800);
  else pos.multiplyScalar(200);
  sphere.setLinearVelocity(new THREE.Vector3(pos.x, pos.y, pos.z));

  return sphere;
}

function getRandBetween(min, max) {
  return parseInt(Math.floor(Math.random() * (max - min + 1)) + min, 10);
}

function run() {
  if ( controlsEnabled === true ) {
    raycaster.ray.origin.copy( controls.getObject().position );
    raycaster.ray.origin.y -= 10;

    var intersections = raycaster.intersectObjects( objects );

    var onObject = intersections.length > 0;

    var time = performance.now();
    var delta = ( time - prevTime ) / 1000;

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= 9.8 * 100.0 * delta; // 100.0 = mass

    direction.z = Number( moveForward ) - Number( moveBackward );
    direction.x = Number( moveLeft ) - Number( moveRight );
    direction.y = Number( moveJump );
    direction.normalize(); // this ensures consistent movements in all directions

    if ( moveForward || moveBackward ) {
      velocity.z -= direction.z * 500.0;
    }

    if ( moveLeft || moveRight ) {
      velocity.x -= direction.x * 500.0;
    }

    if ( onObject === true ) {
      velocity.y = Math.max( 0, velocity.y );
      canJump = true;
    }

    player.quaternion.copy(controls.getObject().quaternion);
    player.setLinearVelocity(new THREE.Vector3(velocity.x * delta, 0 * delta, velocity.z * delta));
    controls.getObject().position.copy(player.position);

    // if ( controls.getObject().position.y < 10 ) {
    //   velocity.y = 0;
    //   controls.getObject().position.y = 10;
    //   canJump = true;
    // }
    prevTime = time;
  }
}

function animate() {
  if(controlsEnabled) render();
  if (controlsEnabled) {
    run();
    scene.simulate(); // run physics
  }
  renderer.render( scene, cam );
  requestAnimationFrame(animate);
}
