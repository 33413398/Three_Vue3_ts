<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

let mixer: any = null;

const clock = new THREE.Clock();
const stats = new Stats();

const renderer = new THREE.WebGLRenderer();
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    threeRef.value?.appendChild(renderer.domElement);
    threeRef.value?.appendChild(stats.dom);
  })
})


const pmremGenerator = new THREE.PMREMGenerator(renderer);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xbfe3dd);
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;

const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
camera.position.set(5, 2, 8);

const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.update();
controls.enablePan = false;
controls.enableDamping = true;

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');


const loader = new GLTFLoader();
loader.setDRACOLoader(dracoLoader);
loader.load('gltf/LittlestTokyo.glb', function (gltf) {
  const model = gltf.scene;
  model.position.set(1, 1, 0);
  model.scale.set(0.01, 0.01, 0.01);
  scene.add(model);
  mixer = new THREE.AnimationMixer(model);
  mixer.clipAction(gltf.animations[0]).play();
  animate();
}, undefined, function (e) {
  console.error(e);
});

window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};


function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  mixer.update(delta);
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
