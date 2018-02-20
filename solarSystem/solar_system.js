var WIDTH = $(window).innerWidth(),
HEIGHT = $(window).innerHeight();

var VIEW_ANGLE = 45,
ASPECT = WIDTH / HEIGHT,
NEAR = 0.1,
FAR = 50000;

var container = document.getElementById("container");

var renderer = new THREE.WebGLRenderer({ antialias: true });

var camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);

camera.position.set(0, -700, 100);
camera.lookAt({x: 0, y: 0, z: 0});

var controls = new THREE.OrbitControls( camera, renderer.domElement );

var sunLight = new THREE.PointLight(16777215, 1);
sunLight.position.x = 0;
sunLight.position.y = 0;
sunLight.position.z = 0;

var camLight = new THREE.PointLight(16777215, 0.5);
camLight.position.set(0, -300, 0);

renderer.setSize(WIDTH, HEIGHT);
container.appendChild(renderer.domElement);

var scene = new THREE.Scene();
scene.add(camera);

var planets = {},
sun, sunTexture, orbitrings;

var sunTexture = new THREE.MeshBasicMaterial({ map: new THREE.TextureLoader().load("assets/sun.jpg") });

var AU = 50;

// Scaling:
// The Sun, planets, moons, and ring radius are scaled relative to the
// Earth's radius in kilometers (6371 km). In effect, each object is measured in 'Earths'.
// Thus, each scale = (1 / 6371) * r, where 'r' is the object's own mean radius.
// Orbit distance/radius from the sun and rotation speeds are not scaled (kind of).

// Sun's "real" scale with other planets: 109
// Easier to view system with 50
var sunSize = 50;

planets.mercury = {
  name: "Mercury",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 0.4),
  speed: 0.8,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 0.38, //0.38
  planetTexture: new THREE.TextureLoader().load("assets/mercury.jpg"),
  planetBumpMap: new THREE.TextureLoader().load("assets/mercury_bump.jpg")
};
planets.venus = {
  name: "Venus",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 0.7),
  speed: 0.7,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 0.94, //0.94
  planetTexture: new THREE.TextureLoader().load("assets/venus.jpg"),
  planetBumpMap: new THREE.TextureLoader().load("assets/venus_bump.jpg")
};
planets.earth = {
  name: "Earth",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + AU,
  speed: 0.6,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 1, //1
  planetTexture: new THREE.TextureLoader().load("assets/earth.jpg"),
  cloudTexture: new THREE.TextureLoader().load("assets/earth_cloud.jpg"),
  planetBumpMap: new THREE.TextureLoader().load("assets/earth_bump.jpg"),
  planetSpec: new THREE.TextureLoader().load("assets/earth_specular.jpg"),
  moons: [
    {
      name: "moon",
      size: 0.27,
      radian: 0,
      moonTexture: new THREE.TextureLoader().load("assets/moon.jpg"),
      moonBump: new THREE.TextureLoader().load("assets/moon_bump.jpg"),
      posX: 2,
      posY: 0,
      posZ: 0,
      rotation: -0.007
    }
  ]
};
planets.mars = {
  name: "Mars",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 1.5),
  speed: 0.48,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 0.5299, //0.52
  planetTexture: new THREE.TextureLoader().load("assets/mars.jpg"),
  planetBumpMap: new THREE.TextureLoader().load("assets/mars_bump.jpg"),
  moons: [
    {
      name: "phobos",
      size: 0.001742269659394,
      radian: 0,
      moonTexture: new THREE.TextureLoader().load("assets/phobos.jpg"),
      posX: 0.85,
      posY: 0,
      posZ: -1,
      rotation: -0.007
    },
    {
      name: "deimos",
      size: 0.000973159629571,
      radian: 0,
      moonTexture: new THREE.TextureLoader().load("assets/deimos.jpg"),
      posX: -0.85,
      posY: 0,
      posZ: 0,
      rotation: -0.007
    }
  ]
};
planets.jupiter = {
  name: "Jupiter",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 5.2),
  speed: 0.26,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 10.97, //10.97
  planetTexture: new THREE.TextureLoader().load("assets/jupiter.jpg"),
  moons: [
    {
      name: "io",
      size: 0.2858,
      radian: 1,
      moonTexture: new THREE.TextureLoader().load("assets/io.jpg"),
      posX: 15,
      posY: 14,
      posZ: -3,
      rotation: -0.007
    },
    {
      name: "ganymede",
      size: 0.4134,
      radian: 60,
      moonTexture: new THREE.TextureLoader().load("assets/ganymede.jpg"),
      posX: 13,
      posY: 2,
      posZ: 0,
      rotation: -0.007
    },
    {
      name: "callisto",
      size: 0.3783,
      radian: 100,
      moonTexture: new THREE.TextureLoader().load("assets/callisto.jpg"),
      posX: -15,
      posY: 0,
      posZ: 0,
      rotation: -0.007
    },
    {
      name: "europa",
      size: 0.2449,
      radian: 180,
      moonTexture: new THREE.TextureLoader().load("assets/europa.jpg"),
      posX: 16,
      posY: 10,
      posZ: 0,
      rotation: -0.007
    }
  ]
};
planets.saturn = {
  name: "Saturn",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 9.5),
  speed: 0.18,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 9.4597, //9.45
  planetTexture: new THREE.TextureLoader().load("assets/saturn.jpg"),
  ringsTexture: new THREE.TextureLoader().load("assets/saturn_rings.png"),
  innerRingRadius: 11.69,
  outerRingRadius: 22.0091,
  ringRotation: [0, 0, 0],
  moons: [
    {
      name: "titan",
      size: 0.4043,
      radian: 1,
      moonTexture: new THREE.TextureLoader().load("assets/titan.jpg"),
      posX: 28,
      posY: 0,
      posZ: 2,
      rotation: -0.007
    },
    {
      name: "hyperion",
      size: 0.0211,
      radian: 0,
      moonTexture: new THREE.TextureLoader().load("assets/hyperion.jpg"),
      posX: 22,
      posY: 0,
      posZ: 0,
      rotation: -0.007
    },
    {
      name: "rhea",
      size: 0.11,
      radian: 100,
      moonTexture: new THREE.TextureLoader().load("assets/rhea.jpg"),
      posX: -22,
      posY: 0,
      posZ: -1,
      rotation: -0.007
    },
    {
      name: "iapetus",
      size: 0.1152,
      radian: 180,
      moonTexture: new THREE.TextureLoader().load("assets/iapetus.jpg"),
      posX: -19,
      posY: 0,
      posZ: 1,
      rotation: -0.007
    }
  ]
};
planets.uranus = {
  name: "Uranus",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 19.2),
  speed: 0.05,
  speedRotationX: 0.01 * -1,
  speedRotationY: 0,
  speedRotationZ: 0,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 4.011, //4.01
  planetTexture: new THREE.TextureLoader().load("assets/uranus.jpg"),
  ringsTexture: new THREE.TextureLoader().load("assets/uranus_rings.png"),
  innerRingRadius: 4.2128,
  outerRingRadius: 16.16,
  planetRotation: [0, 0, 90],
  ringRotation: [0, 90, 0]
};
planets.neptune = {
  name: "Neptune",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 30.1),
  speed: 0.1,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 3.88, //3.88
  planetTexture: new THREE.TextureLoader().load("assets/neptune.jpg"),
  moons: [
    {
      name: "triton",
      size: 0.21,
      radian: 0,
      moonTexture: new THREE.TextureLoader().load("assets/triton.jpg"),
      posX: 6,
      posY: 0,
      posZ: 0,
      rotation: -0.007
    }
  ]
};
planets.pluto = {
  name: "Pluto",
  x: WIDTH * 0.5,
  y: HEIGHT * 0.5,
  radius: sunSize + (AU * 38.3),
  speed: 0.01,
  speedRotationX: 0,
  speedRotationY: 0,
  speedRotationZ: 0.05,
  degree: Math.random() * 1000,
  radian: 0,
  planetSize: 0.18097, //0.18
  planetTexture: new THREE.TextureLoader().load("assets/pluto.jpg"),
  planetBumpMap: new THREE.TextureLoader().load("assets/pluto_bump.jpg")
};

function createMeshes() {
  for (var planet in planets) {
    if (planets.hasOwnProperty(planet)) {
      var obj = new THREE.Group();

      var geometry = new THREE.SphereGeometry(planets[planet].planetSize, 32, 32);
      var material = new THREE.MeshPhongMaterial({
        map: planets[planet].planetTexture,
        bumpMap: (planets[planet].planetBump) ? planets[planet].planetBump : null,
        bumpScale: (planets[planet].planetBump) ? 1.5 : null,
        specularMap: (planets[planet].planetSpec) ? planets[planet].planetSpec : null,
        color: 0xDDDDDD,
        specular: 0x000000
      });

      var mesh = new THREE.Mesh(geometry, material);
      mesh.rotation.x = Math.PI / 2;
      if (planets[planet].planetRotation !== undefined) {
        mesh.rotation.x = planets[planet].planetRotation[0] * (Math.PI/180);
        mesh.rotation.y = planets[planet].planetRotation[1] * (Math.PI/180);
        mesh.rotation.z = planets[planet].planetRotation[2] * (Math.PI/180);
      }
      mesh.name = "planet";
      obj.add(mesh);

      if (planets[planet].cloudTexture) {
        var cloudGeometry = new THREE.SphereGeometry(planets[planet].planetSize + .05, 32, 32);
        var cloudMaterial = new THREE.MeshLambertMaterial({
          alphaMap: planets[planet].cloudTexture,
          transparent: true
        });

        var clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
        clouds.rotation.x = Math.PI / 2;
        clouds.name = "clouds";
        obj.add(clouds);
      }

      if (planets[planet].ringsTexture) {
        planets[planet].ringsTexture.flipY = false;
        var ringGeometry = new THREE.RingGeometry2(planets[planet].innerRingRadius, planets[planet].outerRingRadius, 180, 1, 0, Math.PI * 2);
        var ringMaterial = new THREE.MeshPhongMaterial({
          map: planets[planet].ringsTexture,
          transparent: true,
          side: THREE.DoubleSide
        });

        var rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.name = "rings";
        if (planets[planet].ringRotation !== undefined) {
          rings.rotation.x = planets[planet].ringRotation[0] * (Math.PI/180);
          rings.rotation.y = planets[planet].ringRotation[1] * (Math.PI/180);
          rings.rotation.z = planets[planet].ringRotation[2] * (Math.PI/180);
        }
        obj.add(rings);
      }

      if(planets[planet].moons){
        var planetMoonsGroup = new THREE.Group();
        planetMoonsGroup.name = "moons";

        for (var moonTmp in planets[planet].moons) {

          var geometryMoon = new THREE.SphereGeometry(planets[planet].moons[moonTmp].size, 32, 32);
          var materialMoon = new THREE.MeshPhongMaterial({
            map: planets[planet].moons[moonTmp].moonTexture,
            bumpMap: (planets[planet].moons[moonTmp].moonBump) ? planets[planet].moons[moonTmp].moonBump : null,
            bumpScale: (planets[planet].moons[moonTmp].moonBump) ? 1.5 : null,
            color: 0xDDDDDD,
            specular: 0x000000
          });

          var moonObj = new THREE.Mesh(geometryMoon, materialMoon);
          moonObj.rotation.x = Math.PI / 2;
          moonObj.name = planets[planet].moons[moonTmp].name;
          moonObj.position.set((Math.cos(planets[planet].moons[moonTmp].radian) * planets[planet].moons[moonTmp].posX), planets[planet].moons[moonTmp].posY, planets[planet].moons[moonTmp].posZ);
          planetMoonsGroup.add(moonObj);
        }
        obj.add(planetMoonsGroup);
      }

      planets[planet].object = obj;

      // No orbit around the sun (for debugging)
      // planets[planet].object.position.x = planets[planet].x = (Math.cos(planets[planet].radian) * planets[planet].radius);
      // planets[planet].object.position.y = planets[planet].y = (-Math.sin(planets[planet].radian) * planets[planet].radius);
      // planets[planet].object.position.z = 0;
    }
  }
  sun = new THREE.Mesh(new THREE.SphereGeometry(sunSize, 48, 48), sunTexture);
  sun.rotation.x = Math.PI / 2
}

function createOrbitRings() {
  orbitrings = new THREE.Group();

  for (var planet in planets) {
    if (planets.hasOwnProperty(planet)) {
      var geometry = new THREE.RingGeometry(planets[planet].radius - 0.5, planets[planet].radius + 0.5, 180, 1, 0, Math.PI * 2);
      var material = new THREE.MeshBasicMaterial( { color: 0xffff00, side: THREE.DoubleSide } );
      var ring = new THREE.Mesh( geometry, material );
      orbitrings.add(ring);
    }
  }
  scene.add(orbitrings);
}

function createAsteroidBelt() {
  asteroidBelt = new THREE.Object3D();

  var asteroidnormal = new THREE.TextureLoader().load("assets/asteroid.jpg");
  var asteroidbright = new THREE.TextureLoader().load("assets/asteroidbright.jpg");
  var asteroiddark = new THREE.TextureLoader().load("assets/asteroiddark.jpg");
  var asteroidmedium = new THREE.TextureLoader().load("assets/asteroidmedium.jpg");

  var asteroidTextures = [asteroidnormal, asteroidbright, asteroiddark, asteroidmedium];

  var asteroidOrbitStart = sunSize + (AU * 2.3);
  var asteroidOrbitEnd = sunSize + (AU * 3.3);

  for(var x=0; x<2000; x++) {

    // Scaled size for biggest asteroid in the belt (Ceres): 0.1491
    var asteroidSize = getRandomArbitrary(0.005, 0.1491),
    asteroidShape1 = getRandomArbitrary(4, 10),
    asteroidShape2 = getRandomArbitrary(4, 10),
    asteroidOrbit = getRandomArbitrary(asteroidOrbitStart, asteroidOrbitEnd),
    asteroidPositionY = getRandomArbitrary(-2, 2);

    var asteroidGeometry = new THREE.SphereGeometry(asteroidSize, asteroidShape1, asteroidShape2);
    var asteroidMaterial = new THREE.MeshLambertMaterial({map: asteroidTextures[getRandomInt(0, 3)]});
    var asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

    asteroid.position.z = asteroidPositionY;
    var radians = getRandomArbitrary(0, 360) * Math.PI / 180;
    asteroid.position.x = Math.cos(radians) * asteroidOrbit;
    asteroid.position.y = Math.sin(radians) * asteroidOrbit;
    asteroidBelt.add(asteroid);
  }
  scene.add(asteroidBelt);
}

function updatePositions() {
  for (var a in planets) {
    if (planets.hasOwnProperty(a)) {
      planets[a].degree += planets[a].speed;
      planets[a].radian = (planets[a].degree / 180) * Math.PI;

      // Orbit around the sun
      planets[a].object.position.x = planets[a].x = (Math.cos(planets[a].radian) * planets[a].radius);
      planets[a].object.position.y = planets[a].y = (-Math.sin(planets[a].radian) * planets[a].radius);
      planets[a].object.position.z = 0;
      planets[a].object.rotation.x += planets[a].speedRotationX;
      planets[a].object.rotation.y += planets[a].speedRotationY;
      planets[a].object.rotation.z += planets[a].speedRotationZ;

      if (planets[a].object.children.length > 1) {
        if(planets[a].ringsTexture) planets[a].object.getObjectByName('rings').rotation.z -= 0.005;
        if(planets[a].cloudTexture) planets[a].object.getObjectByName('clouds').rotation.y += 0.005;
        if(planets[a].moons) {
          var moons = planets[a].object.getObjectByName('moons').children;
          for(var moon in moons) {
            moons[moon].rotation.y += planets[a].moons[moon].rotation;
          }
        }
      }
    }
  }

  sun.rotation.y += 0.001;
  asteroidBelt.rotation.z += 0.0001;

  camLight.position.set(camera.position.x, camera.position.y, camera.position.z);
}

function renderAll() {
  for (var a in planets) {
    if (planets.hasOwnProperty(a)) {
      scene.add(planets[a].object);
    }
  }
  scene.add(sunLight);
  scene.add(camLight);
  scene.add(sun);
  renderer.render(scene, camera)
}

function animate() {
  updatePositions();
  renderAll();
  requestAnimationFrame(animate);
  controls.update();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
  controls.handleResize();
  renderer.render( scene, camera );
}

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// RingBufferGeometry
// Modified UVs for correct ring texture rendering
THREE.RingBufferGeometry2 = function( innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength ) {

  THREE.BufferGeometry.call( this );

  this.type = 'RingBufferGeometry';

  this.parameters = {
    innerRadius: innerRadius,
    outerRadius: outerRadius,
    thetaSegments: thetaSegments,
    phiSegments: phiSegments,
    thetaStart: thetaStart,
    thetaLength: thetaLength
  };

  innerRadius = innerRadius || 0.5;
  outerRadius = outerRadius || 1;

  thetaStart = thetaStart !== undefined ? thetaStart : 0;
  thetaLength = thetaLength !== undefined ? thetaLength : Math.PI * 2;

  thetaSegments = thetaSegments !== undefined ? Math.max( 3, thetaSegments ) : 8;
  phiSegments = phiSegments !== undefined ? Math.max( 1, phiSegments ) : 1;

  // buffers

  var indices = [];
  var vertices = [];
  var normals = [];
  var uvs = [];

  // some helper variables

  var segment;
  var radius = innerRadius;
  var radiusStep = ( ( outerRadius - innerRadius ) / phiSegments );
  var vertex = new THREE.Vector3();
  var uv = new THREE.Vector2();
  var j, i;

  // generate vertices, normals and uvs

  for ( j = 0; j <= phiSegments; j ++ ) {

    for ( i = 0; i <= thetaSegments; i ++ ) {

      // values are generate from the inside of the ring to the outside

      segment = thetaStart + i / thetaSegments * thetaLength;

      // vertex

      vertex.x = radius * Math.cos( segment );
      vertex.y = radius * Math.sin( segment );

      vertices.push( vertex.x, vertex.y, vertex.z );

      // normal

      normals.push( 0, 0, 1 );

      // uv

      uv.x = ( vertex.x / outerRadius + 1 ) / 2;
      uv.y = ( vertex.y / outerRadius + 1 ) / 2;

      //uvs.push( uv.x, uv.y );
      //uvs.push( new THREE.Vector2( i / thetaSegments, j / phiSegments ) );
      uvs.push( i / thetaSegments );
      uvs.push( j / phiSegments );

    }

    // increase the radius for next row of vertices

    radius += radiusStep;

  }

  // indices

  for ( j = 0; j < phiSegments; j ++ ) {

    var thetaSegmentLevel = j * ( thetaSegments + 1 );

    for ( i = 0; i < thetaSegments; i ++ ) {

      segment = i + thetaSegmentLevel;

      var a = segment;
      var b = segment + thetaSegments + 1;
      var c = segment + thetaSegments + 2;
      var d = segment + 1;

      // faces

      indices.push( a, b, d );
      indices.push( b, c, d );

    }

  }

  // build geometry

  this.setIndex( indices );
  this.addAttribute( 'position', new THREE.Float32BufferAttribute( vertices, 3 ) );
  this.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
  this.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ) );

}

THREE.RingBufferGeometry2.prototype = Object.create( THREE.BufferGeometry.prototype );

THREE.RingGeometry2 = function( innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength ) {

  THREE.Geometry.call( this );

  this.type = 'RingGeometry';

  this.parameters = {
    innerRadius: innerRadius,
    outerRadius: outerRadius,
    thetaSegments: thetaSegments,
    phiSegments: phiSegments,
    thetaStart: thetaStart,
    thetaLength: thetaLength
  };

  this.fromBufferGeometry( new THREE.RingBufferGeometry2( innerRadius, outerRadius, thetaSegments, phiSegments, thetaStart, thetaLength ) );
  this.mergeVertices();

}

THREE.RingGeometry2.prototype = Object.create( THREE.Geometry.prototype );

window.addEventListener( 'resize', onWindowResize, false );

createMeshes();
createOrbitRings();
createAsteroidBelt();
animate();
