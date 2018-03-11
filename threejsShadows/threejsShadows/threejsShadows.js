// 1. Enable shadow mapping in the renderer.
// 2. Enable shadows and set shadow parameters for the lights that cast shadows.
// Both the THREE.DirectionalLight type and the THREE.SpotLight type support shadows.
// 3. Indicate which geometry objects cast and receive shadows.

var renderer = null,
scene = null,
camera = null,
root = null,
gun = null,
monster = null,
monst = null,
group = null,
orbitControls = null;

var duration = 3, // sec
monsterAnimator = null,
animateMonster = true,
loopAnimation = true;

var objLoader = null, jsonLoader = null;

var currentTime = Date.now();

function loadJson()
{
  if(!jsonLoader)
  jsonLoader = new THREE.JSONLoader();

  jsonLoader.load(
    '../models/monster/monster.js',

    function(geometry, materials)
    {
      var material = materials[0];

      var object = new THREE.Mesh(geometry, material);
      object.castShadow = true;
      object. receiveShadow = true;
      object.scale.set(0.002, 0.002, 0.002);
      object.position.y = -1;
      object.position.x = 1.5;
      monster = object;
      monst.add(monster);
    },
    function ( xhr ) {

      console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );

    },
    // called when loading has errors
    function ( error ) {

      console.log( 'An error happened' );

    });
  }

  function playAnimations()
  {
    var radius = 5;
    var slices = 360;
    var positionsArray = [];
    var rotationArray = [];
    var temp = "";
    var keyArray = []
    var angle = 0;

    // Generar valores de círculo
    for (var a = 0; a <= slices; a++) {
      angle = ((2 * Math.PI)/slices) * a;
      temp = "{\"x\":" + Math.cos(angle)*radius + ",\"y\":0,\"z\":" + Math.sin(angle)*radius + '}';
      positionsArray.push(JSON.parse(temp))
      keyArray.push(a/slices);

      temp = "{\"y\":" + (angle*-1+180) + '}';
      rotationArray.push(JSON.parse(temp));
    }

    // position animation
    if (monsterAnimator)
    monsterAnimator.stop();

    monst.position.set(0, 0, 0);
    monst.rotation.set(0, 0, 0);

    if (animateMonster)
    {
      monsterAnimator = new KF.KeyFrameAnimator;
      monsterAnimator.init({
        interps:
        [
          {
            keys:keyArray,
            values:positionsArray,
            target:monst.position
          },
          {
            keys:keyArray,
            values:rotationArray,
            target:monst.rotation
          },
        ],
        loop: loopAnimation,
        duration:duration * 1000,
        easing:TWEEN.Easing.Linear.None,
      });
      monsterAnimator.start();
    }
  }

  function run() {
    requestAnimationFrame(function() { run(); });

    // Render the scene
    renderer.render( scene, camera );

    // Update the animations
    KF.update();

    // Update the camera controller
    orbitControls.update();
  }

  function setLightColor(light, r, g, b)
  {
    r /= 255;
    g /= 255;
    b /= 255;

    light.color.setRGB(r, g, b);
  }

  var directionalLight = null;
  var spotLight = null;
  var ambientLight = null;
  var mapUrl = "../images/checker_large.gif";

  var SHADOW_MAP_WIDTH = 2048, SHADOW_MAP_HEIGHT = 2048;

  function createScene(canvas) {

    // Create the Three.js renderer and attach it to our canvas
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    // Set the viewport size
    renderer.setSize(canvas.width, canvas.height);

    // Turn on shadows
    renderer.shadowMap.enabled = true;
    // Options are THREE.BasicShadowMap, THREE.PCFShadowMap, PCFSoftShadowMap
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Create a new Three.js scene
    scene = new THREE.Scene();

    // Add  a camera so we can view the scene
    camera = new THREE.PerspectiveCamera( 45, canvas.width / canvas.height, 1, 4000 );
    camera.position.set(-2, 6, 12);
    scene.add(camera);

    // Create a group to hold all the objects
    root = new THREE.Object3D;

    // Add a directional light to show off the object
    directionalLight = new THREE.DirectionalLight( 0xffffff, 1);

    // Create and add all the lights
    directionalLight.position.set(.5, 0, 3);
    root.add(directionalLight);

    spotLight = new THREE.SpotLight (0xffffff);
    spotLight.position.set(2, 8, 15);
    spotLight.target.position.set(-2, 0, -2);
    root.add(spotLight);

    spotLight.castShadow = true;

    spotLight.shadow.camera.near = 1;
    spotLight.shadow. camera.far = 200;
    spotLight.shadow.camera.fov = 45;

    spotLight.shadow.mapSize.width = SHADOW_MAP_WIDTH;
    spotLight.shadow.mapSize.height = SHADOW_MAP_HEIGHT;

    ambientLight = new THREE.AmbientLight ( 0x888888 );
    root.add(ambientLight);

    // Create a group to hold the objects
    group = new THREE.Object3D;
    root.add(group);

    monst = new THREE.Object3D;
    root.add(monst);

    // Create the objects
    loadJson();

    // Create a texture map
    var map = new THREE.TextureLoader().load(mapUrl);
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.repeat.set(8, 8);

    var color = 0xffffff;

    // Put in a ground plane to show off the lighting
    geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    var mesh = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({color:color, map:map, side:THREE.DoubleSide}));

    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = -4.02;

    // Add the mesh to our group
    group.add( mesh );
    mesh.castShadow = false;
    mesh.receiveShadow = true;

    // Now add the group to our scene
    scene.add( root );
  }
