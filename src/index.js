import './templates/index.html';
import './styles/main.scss';
import WEBGL from './WebGL.js';
import { cloth, clothFunction, ballSize, simulate } from './Cloth.js';
import OrbitControls from './OrbitControls.js';
import Grass from './images/grasslight-big.jpg';
import Circuit from './images/circuit_pattern.png';
import {settings, parseInterfaceGrid} from './smocking.js';

if ( WEBGL.isWebGLAvailable() === false ) {
  document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}
var container;
var camera, scene, renderer;
var clothGeometry;
var object;
init();
animate();
function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  // scene
  scene = new THREE.Scene();
  //scene.background = new THREE.Color( 0x332044 );
  scene.background = new THREE.Color( 0xFFFFFF );

  // camera
  camera = new THREE.PerspectiveCamera( 20, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0, 0, 300 );

  // lights
  scene.add( new THREE.AmbientLight( 0x666666 ) );
  var light = new THREE.DirectionalLight( 0xdfebff, 1 );
  light.position.set( 50, 200, 100 );
  light.position.multiplyScalar( 1.3 );
  light.castShadow = true;
  light.shadow.mapSize.width = 1024;
  light.shadow.mapSize.height = 1024;
  var d = 300;
  light.shadow.camera.left = - d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = - d;
  light.shadow.camera.far = 1000;
  scene.add( light );
  
  var light2 = new THREE.DirectionalLight( 0xdfebff, 1 );
  light2.position.set( 50, 200, -100 );
  light2.position.multiplyScalar( 1.3 );
  light2.castShadow = true;
  light2.shadow.mapSize.width = 1024;
  light2.shadow.mapSize.height = 1024;
  var d2 = 300;
  light2.shadow.camera.left =  d;
  light2.shadow.camera.right = d;
  light2.shadow.camera.top = d;
  light2.shadow.camera.bottom = - d;
  light2.shadow.camera.far = 1000;

  scene.add( light2 );

  // cloth material
  var loader = new THREE.TextureLoader();
  var clothTexture = loader.load( Circuit );
  clothTexture.anisotropy = 16;
  var clothMaterial = new THREE.MeshLambertMaterial( {
    //map: clothTexture,
    shadowSide: THREE.DoubleSide,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
  } );

  // cloth geometry
  clothGeometry = new THREE.ParametricBufferGeometry( clothFunction, cloth.w, cloth.h );

  // cloth mesh
  object = new THREE.Mesh( clothGeometry, clothMaterial );
  object.position.set( 0, 0, 0 );
  object.castShadow = true;
  scene.add( object );
  object.customDepthMaterial = new THREE.MeshDepthMaterial( {
    depthPacking: THREE.RGBADepthPacking,
    map: clothTexture,
    alphaTest: 0.5
  } );

  // renderer
  renderer = new THREE.WebGLRenderer( { antialias: true } );
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  // controls
  var controls = new OrbitControls( camera, renderer.domElement );
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 400;
  controls.maxDistance = 5000;
  window.addEventListener( 'resize', onWindowResize, false );
}
//
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
//
function animate() {
  requestAnimationFrame( animate );
  var time = Date.now();
  simulate( time );
  render();
}
function render() {
  var p = cloth.particles;
  for ( var i = 0, il = p.length; i < il; i ++ ) {
    var v = p[ i ].position;
    clothGeometry.attributes.position.setXYZ( i, v.x, v.y, v.z );
  }
  clothGeometry.attributes.position.needsUpdate = true;
  clothGeometry.computeVertexNormals();
  renderer.render( scene, camera );
}

// Setup Grid Interface
var domTile = document.getElementsByClassName('tile');
var totalTilesForDom = settings.numOfTilesInRow*settings.numOfTilesInRow;
var domInterface = document.getElementsByClassName('interface')[0];
var interfaceWidth = domInterface.offsetWidth;
var tileWidth = (interfaceWidth/settings.numOfTilesInRow)-2;
var diagonalLength = Math.sqrt((2*(tileWidth*tileWidth)));

document.addEventListener('click', function (event) {
	event.preventDefault();
  
  if (event.target.matches('.calculate-grid')) {
    calculateTiles();
  } else if (event.target.matches('.clear-grid')) { 
    clearTiles();
  } else if (event.target.matches('.tile')) { 
    toggleTile(event.target);
  } else {
    return;
  }

}, false);

for (var t = 1; t <= totalTilesForDom; t++) {
  var createdTile = document.createElement('div');
  createdTile.style.width = tileWidth+'px';
  createdTile.style.height = tileWidth+'px';
  createdTile.className += "tile";
  createdTile.setAttribute('data-tilenumber', t);
  createdTile.setAttribute('data-state', 'blank');
  domInterface.appendChild(createdTile);
}

function toggleTile(target) {
  if (target.getAttribute('data-state') === 'blank') {
    target.setAttribute('data-state', 'diagonalTopToBottom');
  } else if (target.getAttribute('data-state') === 'diagonalTopToBottom') {
    target.setAttribute('data-state', 'diagonalBottomToTop');
  } else if (target.getAttribute('data-state') === 'diagonalBottomToTop') {
    target.setAttribute('data-state', 'blank');
  }
}

function clearTiles() {
  for (var t = 0; t < totalTilesForDom; t++) {
    domTile[t].setAttribute('data-state', 'blank');
  }
}

function calculateTiles() {
  var tileAndCompressionMethod = [];
  for (var t = 0; t < totalTilesForDom; t++) {
    var compressionMethod = domTile[t].getAttribute('data-state');
    if (compressionMethod !== 'blank') {
      tileAndCompressionMethod.push({
        tileNumber: domTile[t].getAttribute('data-tilenumber'), 
        compressionMethod: domTile[t].getAttribute('data-state')
      });
    }
  }
  console.log(tileAndCompressionMethod, 'this is the comp method');
  parseInterfaceGrid(tileAndCompressionMethod);
}
