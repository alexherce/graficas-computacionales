var container;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2(), INTERSECTED;
var radius = 100, theta = 0;
var group = null;
var rows = 4, columns = 4;
var userMoves = [];
var systemMoves = [];
var gameTurn = 1;
var duration = .5;
var animator = null;
var selector = null;
var currentTurn = 0;
var gameMoving = false;

function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function createScene(canvas)
{
    renderer = new THREE.WebGLRenderer( { canvas: canvas, antialias: true } );

    group = new THREE.Object3D;

    // Set the viewport size
    renderer.setSize(window.innerWidth, window.innerHeight);

    camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xf0f0f0 );

    var light = new THREE.DirectionalLight( 0xffffff, 1 );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    var cube = new THREE.BoxBufferGeometry(1,1,1);

    for (var i = 0; i < rows; i++)
    {
      for (var j = 0; j < columns; j++)
      {
        var object = new THREE.Mesh( cube, new THREE.MeshLambertMaterial( { color: Math.random() * 0xffffff } ) );
        object.position.set(j-columns/3, i-rows/3, -5);
        object.rotation.set(0,0,0);
        object.scale.set(1,1,1);
        group.add(object);
      }
    }

    scene.add(group);

    raycaster = new THREE.Raycaster();

    renderer.setPixelRatio( window.devicePixelRatio );

    document.addEventListener( 'mousemove', onDocumentMouseMove );
    document.addEventListener('mousedown', onDocumentMouseDown);

    //
    window.addEventListener( 'resize', onWindowResize);
}

function onWindowResize()
{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

function onDocumentMouseMove( event )
{
    event.preventDefault();
    mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;

    // find intersections
    raycaster.setFromCamera( mouse, camera );

    var intersects = raycaster.intersectObjects( group.children );

    if ( intersects.length > 0 )
    {
        if ( INTERSECTED != intersects[ 0 ].object )
        {
            if ( INTERSECTED )
                INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

            INTERSECTED = intersects[ 0 ].object;
            INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();
            INTERSECTED.material.emissive.setHex( 0xff0000 );
        }
    }
    else
    {
        if ( INTERSECTED )
            INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );

        INTERSECTED = null;
    }
}

async function onDocumentMouseDown(event)
{
    event.preventDefault();

    if(gameMoving)
    {
      selector = INTERSECTED;
    }else{
      selector = null;
    }

    if (selector != null){
      if(selector == userMoves.shift())
      {
        playAnimations(selector);
        if(userMoves.length < 1)
        {
          gameTurn += 1;
          currentTurn = gameTurn - 1;
          await sleep(1000);
          fabulosoFred();
        }
      }else{
        systemMoves = [];
        userMoves = [];
        gameTurn = 1;
        alert("Game Over... you lost! Score: " + currentTurn);
        fabulosoFred();
      }
    }

}
//
function run()
{
    requestAnimationFrame( run );
    render();
    KF.update()
}

function render()
{
    renderer.render( scene, camera );
}

async function fabulosoFred()
{
    gameMoving = false;
    var pos = getRandomInt(0, group.children.length-1);
    var obj = group.children[pos];
    systemMoves.push(obj);
    userMoves = [...systemMoves];

    for (var i = 0; i < userMoves.length; i++)
    {
      playAnimations(userMoves[i]);
      await sleep(duration*1500);
    }
    gameMoving = true;
}

function playAnimations(obj)
{
  // position animation
  animator = new KF.KeyFrameAnimator;

  animator.init({
      interps:
          [
              {
                keys:[0, .5, 1],
                values:[
                        { x : 1, y: 1, z: 1 },
                        { x : 1.2, y: 1.2, z: 1.2 },
                        { x : 1, y: 1, z: 1 },
                        ],
                target:obj.scale
              },
          ],
      loop: false,
      duration:duration * 1000,
      easing:TWEEN.Easing.Linear.None,
  });
  animator.start();
}
