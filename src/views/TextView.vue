<script setup lang="ts">
import { onMounted, nextTick, ref, onBeforeUnmount } from "vue"
// 导入库
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const threeRef = ref<HTMLDivElement | null>()
let gui: any = null
THREE.Cache.enabled = true;


let camera: any = null
let cameraTarget: any = null
let scene: any = null
let renderer: any = null
let group: any = null
let textMesh1: any = null
let textMesh2: any = null
let textGeo: any = null
let materials: any = null

let firstLetter = true;

let text = 'three.js'

let bevelEnabled: any = true

let font: any = undefined

let fontName: any = 'optimer' // helvetiker, optimer, gentilis, droid sans, droid serif
let fontWeight: any = 'bold' // normal bold

const height: any = 20
let size: any = 70
let hover: any = 30

let curveSegments: any = 4

let bevelThickness: any = 2
let bevelSize = 1.5
const mirror: any = true
const fontMap: any = {
  'helvetiker': 0,
  'optimer': 1,
  'gentilis': 2,
  'droid/droid_sans': 3,
  'droid/droid_serif': 4
};

const weightMap: any = {
  'regular': 0,
  'bold': 1
};

const reverseFontMap: any = [];
const reverseWeightMap: any = [];

for (const i in fontMap) reverseFontMap[fontMap[i]] = i;
for (const i in weightMap) reverseWeightMap[weightMap[i]] = i;

let targetRotation = 0;
let targetRotationOnPointerDown = 0;

let pointerX = 0;
let pointerXOnPointerDown = 0;

let windowHalfX = window.innerWidth / 2;

let fontIndex = 1;

function init() {

  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
  camera.position.set(0, 400, 700);

  cameraTarget = new THREE.Vector3(0, 150, 0);

  // SCENE

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);
  scene.fog = new THREE.Fog(0x000000, 250, 1400);

  // LIGHTS

  const dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);

  const pointLight = new THREE.PointLight(0xffffff, 1.5);
  pointLight.color.setHSL(Math.random(), 1, 0.5);
  pointLight.position.set(0, 100, 90);
  scene.add(pointLight);

  materials = [
    new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
    new THREE.MeshPhongMaterial({ color: 0xffffff }) // side
  ];

  group = new THREE.Group();
  group.position.y = 100;

  scene.add(group);

  loadFont();

  const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(10000, 10000),
    new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
  );
  plane.position.y = 100;
  plane.rotation.x = - Math.PI / 2;
  scene.add(plane);

  // RENDERER

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  threeRef.value?.appendChild(renderer.domElement);
  // EVENTS

  // threeRef.value && threeRef.value.style.touchAction = 'none'
  threeRef.value && threeRef.value.addEventListener('pointerdown', onPointerDown);

  document.addEventListener('keypress', onDocumentKeyPress);
  document.addEventListener('keydown', onDocumentKeyDown);

  //

  const params = {
    changeColor: function () {

      pointLight.color.setHSL(Math.random(), 1, 0.5);

    },
    changeFont: function () {

      fontIndex++;

      fontName = reverseFontMap[fontIndex % reverseFontMap.length];

      loadFont();

    },
    changeWeight: function () {

      if (fontWeight === 'bold') {

        fontWeight = 'regular';

      } else {

        fontWeight = 'bold';

      }

      loadFont();

    },
    changeBevel: function () {

      bevelEnabled = !bevelEnabled;

      refreshText();

    }
  };

  //

  gui = new GUI();

  gui.add(params, 'changeColor').name('change color');
  gui.add(params, 'changeFont').name('change font');
  gui.add(params, 'changeWeight').name('change weight');
  gui.add(params, 'changeBevel').name('change bevel');
  gui.open();

  //

  window.addEventListener('resize', onWindowResize);

}

function onWindowResize() {

  windowHalfX = window.innerWidth / 2;

  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);

}

//

function onDocumentKeyDown(event: any) {

  if (firstLetter) {

    firstLetter = false;
    text = '';

  }

  const keyCode = event.keyCode;

  // backspace

  if (keyCode == 8) {

    event.preventDefault();

    text = text.substring(0, text.length - 1);
    refreshText();

    return false;

  }

}

function onDocumentKeyPress(event: any) {

  const keyCode = event.which;

  // backspace

  if (keyCode == 8) {

    event.preventDefault();

  } else {

    const ch = String.fromCharCode(keyCode);
    text += ch;

    refreshText();

  }

}

function loadFont() {

  const loader = new FontLoader();
  loader.load('fonts/' + fontName + '_' + fontWeight + '.typeface.json', function (response) {

    font = response;

    refreshText();

  });

}

function createText() {

  textGeo = new TextGeometry(text, {

    font: font,

    size: size,
    height: height,
    curveSegments: curveSegments,

    bevelThickness: bevelThickness,
    bevelSize: bevelSize,
    bevelEnabled: bevelEnabled

  });

  textGeo.computeBoundingBox();

  const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);

  textMesh1 = new THREE.Mesh(textGeo, materials);

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = hover;
  textMesh1.position.z = 0;

  textMesh1.rotation.x = 0;
  textMesh1.rotation.y = Math.PI * 2;

  group.add(textMesh1);

  if (mirror) {

    textMesh2 = new THREE.Mesh(textGeo, materials);

    textMesh2.position.x = centerOffset;
    textMesh2.position.y = - hover;
    textMesh2.position.z = height;

    textMesh2.rotation.x = Math.PI;
    textMesh2.rotation.y = Math.PI * 2;

    group.add(textMesh2);

  }

}

function refreshText() {

  group.remove(textMesh1);
  if (mirror) group.remove(textMesh2);

  if (!text) return;

  createText();

}

function onPointerDown(event: any) {

  if (event.isPrimary === false) return;

  pointerXOnPointerDown = event.clientX - windowHalfX;
  targetRotationOnPointerDown = targetRotation;

  document.addEventListener('pointermove', onPointerMove);
  document.addEventListener('pointerup', onPointerUp);

}

function onPointerMove(event: any) {

  if (event.isPrimary === false) return;

  pointerX = event.clientX - windowHalfX;

  targetRotation = targetRotationOnPointerDown + (pointerX - pointerXOnPointerDown) * 0.02;

}

function onPointerUp(event: any) {
  if (event.isPrimary === false) return;
  document.removeEventListener('pointermove', onPointerMove);
  document.removeEventListener('pointerup', onPointerUp);
}


function animate() {
  requestAnimationFrame(animate);
  render();
}

function render() {
  group.rotation.y += (targetRotation - group.rotation.y) * 0.05;
  camera.lookAt(cameraTarget);
  renderer.clear();
  renderer.render(scene, camera);

}

onMounted(() => {
  nextTick(() => {
    init();
    animate();
  })
})

onBeforeUnmount(() => {
  gui.domElement.remove()
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
