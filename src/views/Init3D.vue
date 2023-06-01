<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    threeRef.value?.appendChild(renderer.domElement);
  })
})

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
const scene = new THREE.Scene();
const loader = new GLTFLoader();
loader.load('/gltf/AnimatedMorphSphere/glTF/AnimatedMorphSphere.gltf', function (gltf) {
  scene.add(gltf.scene);
}, undefined, function (error) {
  console.error(error);
});

renderer.render(scene, camera);
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
