<script setup lang="ts">
import { onMounted, nextTick, ref,onBeforeUnmount } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';


let mixer: any = null;
// 该对象用于跟踪时间。
const clock = new THREE.Clock();
// 性能监测
const stats:any = new Stats();
// 渲染器
const renderer = new THREE.WebGLRenderer();
// 设置设备像素比。
renderer.setPixelRatio(window.devicePixelRatio);
// 渲染尺寸
renderer.setSize(window.innerWidth, window.innerHeight);
// dom实例
const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    // 将渲染器场景加到dom上，生成对应covers
    threeRef.value?.appendChild(renderer.domElement);
    // 添加性能监测到dom上
    threeRef.value?.appendChild(stats.dom);
  })
})

// 辐射环境贴图  允许根据材料粗糙度快速访问不同级别的模糊  我们保持分辨率以平滑地插入漫射照明，同时限制采样计算。
const pmremGenerator = new THREE.PMREMGenerator(renderer);
// 场景
const scene = new THREE.Scene();
// 场景背景色
scene.background = new THREE.Color(0xbfe3dd);
// 若该值不为null，则该纹理贴图将会被设为场景中所有物理材质的环境贴图。
//  然而，该属性不能够覆盖已存在的、已分配给 MeshStandardMaterial.envMap 的贴图。默认为null。
/* 
scene - 给定的场景
sigma - （可选）指定在PMREM生成之前应用于场景的以弧度为单位的模糊半径。默认为0。
near - （可选）近平面值，默认值为0.1。
far - （可选）远平面值。默认值为100。 */
scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
// 相机
const camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 1, 100);
camera.position.set(5, 2, 8);
// 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.5, 0);
controls.update();
// 启用或禁用摄像机平移，默认为true。
controls.enablePan = false;
// 阻尼（惯性）
controls.enableDamping = true;

// 平行光
const dirLight1 = new THREE.DirectionalLight(0xffffff);
dirLight1.position.set(1, 1, 1);
scene.add(dirLight1);
// 灯光 -- 环境光会均匀的照亮场景中的所有物体。
const ambientLight = new THREE.AmbientLight(0xffffff);
// scene.add(ambientLight);

// 一个用于加载经过Draco压缩的图形库。
const dracoLoader = new DRACOLoader();
// — 包含JS和WASM解压缩库的文件夹路径。
dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');

// 用于载入glTF 2.0资源的加载器。
const loader = new GLTFLoader();
// — THREE.DRACOLoader的实例，用于解码使用KHR_draco_mesh_compression扩展压缩过的文件。
loader.setDRACOLoader(dracoLoader);
// 加载成功完成后将会被调用的函数
loader.load('gltf/LittlestTokyo.glb', function (gltf) {
  const model = gltf.scene;
  model.position.set(1, 1, 0);
  model.scale.set(0.01, 0.01, 0.01);
  scene.add(model);
  // 动画混合器是用于场景中特定对象的动画的播放器。当场景中的多个对象独立动画时，每个对象都可以使用同一个动画混合器。
  mixer = new THREE.AnimationMixer(model);
  /* 返回所传入的剪辑参数的AnimationAction, 根对象参数可选，
  默认值为混合器的默认根对象。第一个参数可以是动画剪辑(AnimationClip)对象或者动画剪辑的名称。 
  如果不存在符合传入的剪辑和根对象这两个参数的动作, 该方法将会创建一个。传入相同的参数多次调用将会返回同一个剪辑实例。*/
  mixer.clipAction(gltf.animations[0]).play();
  animate();
}, undefined, function (e) {
  console.error(e);
});
// 响应式
window.onresize = function () {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

// 实时渲染
function animate() {
  requestAnimationFrame(animate);
  /* 
  获取自 .oldTime 设置后到当前的秒数。 同时将 .oldTime 设置为当前时间。
  如果 .autoStart 设置为 true 且时钟并未运行，则该方法同时启动时钟。 */
  const delta = clock.getDelta();
  /* 
  推进混合器时间并更新动画
  通常在渲染循环中完成, 传入按照混合器的时间比例(timeScale)缩放过的clock.getDelta */
  mixer.update(delta);
  // 控制器更新
  controls.update();
  // 性能监测更新
  stats.update();
  // 渲染器渲染
  renderer.render(scene, camera);
}

</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
