<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue"
// 导入库
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

onMounted(() => {

  // 创建场景、相机和渲染器
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  const threeRef = ref<HTMLDivElement | null>()
  onMounted(() => {
    nextTick(() => {
      threeRef.value?.appendChild(renderer.domElement);
    })
  })

  // 创建文本材质和几何体
  const fontLoader = new FontLoader();
  fontLoader.load('/fonts/helvetiker_regular.typeface.json', function (font: any) {
    const textGeometry = new TextGeometry('Hello, World!', {
      font: font,
      size: 80,
      height: 20,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 8,
      bevelOffset: 0,
      bevelSegments: 5
    });
    const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const textMesh = new THREE.Mesh(textGeometry, textMaterial);
    scene.add(textMesh);
    // 渲染场景
    renderer.render(scene, camera);
  });

  // 添加轨道控制器
  const controls = new OrbitControls(camera, renderer.domElement);
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
