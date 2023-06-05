<!-- eslint-disable vue/multi-word-component-names -->
<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// 初始化dom
const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    init();
    animate();
  })
})

let camera: any = null;
let controls: any = null;
let scene: any = null;
let renderer: any = null;
function init() {
  scene = new THREE.Scene();
  // 若不为空，在渲染场景的时候将设置背景，且背景总是首先被渲染的。 可以设置一个用于的“clear”的Color（颜色）、
  // 一个覆盖canvas的Texture（纹理）， 或是 a cubemap as a CubeTexture or an equirectangular as a Texture。默认值为null。
  scene.background = new THREE.Color(0xcccccc);
  // 一个fog实例定义了影响场景中的每个物体的雾的类型。默认值为null。
  scene.fog = new THREE.FogExp2(0xcccccc, 0.002);

  renderer = new THREE.WebGLRenderer({
    // 是否执行抗锯齿。默认为false.
    antialias: true
  });
  // 设置设备像素比。通常用于避免HiDPI设备上绘图模糊
  renderer.setPixelRatio(window.devicePixelRatio);
  // 将输出canvas的大小调整为(width, height)并考虑设备像素比，且将视口从(0, 0)开始调整到适合大小 将updateStyle设置为false以阻止对canvas的样式做任何改变。
  renderer.setSize(window.innerWidth, window.innerHeight);
  threeRef.value?.appendChild(renderer.domElement);

  // 透视相机
  camera = new THREE.PerspectiveCamera(
    // 视角 0-180° 摄像机视锥体垂直视野角度
    60,
    // 摄像机视锥体长宽比
    window.innerWidth / window.innerHeight,
    // 摄像机视锥体近端面
    1,
    // 摄像机视锥体远端面
    1000);
  // 初始x,y,z距离
  camera.position.set(400, 200, 0);

  // 轨道控制器
  controls = new OrbitControls(camera, renderer.domElement);
  // 当.enableDamping设置为true的时候，阻尼惯性有多大。 Default is 0.05.
  // 请注意，要使得这一值生效，你必须在你的动画循环里调用.update()。
  controls.enableDamping = true;
  // 阻尼惯性有多大。 Default is 0.05.
  controls.dampingFactor = 0.05;
  // 定义当平移的时候摄像机的位置将如何移动。如果为true，
  // 摄像机将在屏幕空间内平移。 否则，摄像机将在与摄像机向上方向垂直的平面中平移。
  // 当使用 OrbitControls 时， 默认值为true；当使用 MapControls 时，默认值为false。
  controls.screenSpacePanning = false;
  // 你能够将相机向内移动多少（仅适用于PerspectiveCamera），其默认值为0。
  controls.minDistance = 100;
  // 你能够将相机向外移动多少（仅适用于PerspectiveCamera），其默认值为Infinity。
  controls.maxDistance = 500;
  // 你能够垂直旋转的角度的上限，范围是0到Math.PI，其默认值为Math.PI。
  controls.maxPolarAngle = Math.PI / 2;

  // 立方缓冲几何体
  /* 
  width — X轴上面的宽度，默认值为1。
  height — Y轴上面的高度，默认值为1。
  depth — Z轴上面的深度，默认值为1。 */
  const geometry = new THREE.BoxGeometry(1, 1, 1);
  // 移动几何体。该操作一般在一次处理中完成，不会循环处理。典型的用法是通过调用 Object3D.rotation 实时旋转几何体。
  geometry.translate(0, 0.5, 0);
  // Phong网格材质
  const material = new THREE.MeshPhongMaterial({
    color: 0xeeeeee,
    // 定义材质是否使用平面着色进行渲染。默认值为false。
    flatShading: true
  });

  for (let i = 0; i < 500; i++) {
    // 网格
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.x = Math.random() * 1600 - 800;
    mesh.position.y = 0;
    mesh.position.z = Math.random() * 1600 - 800;
    mesh.scale.x = 20;
    mesh.scale.y = Math.random() * 80 + 10;
    mesh.scale.z = 20;
    // 更新局部变换。
    mesh.updateMatrix();
    // matrixWorld  物体的世界变换。若这个Object3D没有父级，则它将和local transform .matrix（局部变换矩阵）相同。
    // 当这个属性设置了之后，它将计算每一帧的位移、旋转（四元变换）和缩放矩阵，并重新计算matrixWorld属性。
    mesh.matrixAutoUpdate = false;
    scene.add(mesh);
  }

  // 平行光
  const dirLight1 = new THREE.DirectionalLight(0xffffff);
  dirLight1.position.set(1, 1, 1);
  scene.add(dirLight1);
  // 平行光
  const dirLight2 = new THREE.DirectionalLight(0x002288);
  dirLight2.position.set(- 1, - 1, - 1);
  scene.add(dirLight2);
  // 灯光 -- 环境光会均匀的照亮场景中的所有物体。
  const ambientLight = new THREE.AmbientLight(0x222222);
  scene.add(ambientLight);
  // 响应式匹配大小
  window.addEventListener('resize', onWindowResize);
  // GUI
  const gui = new GUI();
  gui.add(controls, 'screenSpacePanning');
}

// 自适应
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);

}

// 帧渲染，控制器更新
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // only required if controls.enableDamping = true, or if controls.autoRotate = true
  render();
}
// 渲染场景
function render() {
  renderer.render(scene, camera);
}
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
