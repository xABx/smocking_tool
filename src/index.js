import './templates/index.html';
import './styles/main.scss';
import WEBGL from './WebGL.js';
import { cloth, clothFunction, ballSize, simulate } from './Cloth.js';
import OrbitControls from './OrbitControls.js';
import Grass from './images/grasslight-big.jpg';
import Circuit from './images/circuit_pattern.png';

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
  scene.background = new THREE.Color( 0x332044 );

  // camera
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.set( 0, 0, 1000 );

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
