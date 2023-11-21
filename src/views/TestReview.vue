<script setup lang="ts">
import { onMounted, nextTick, ref } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import WebGL from 'three/addons/capabilities/WebGL.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const threeRef = ref()
const scene = new THREE.Scene()
// 透视摄像机  第一个参数是视野角度（FOV）   第二个参数是长宽比（aspect ratio） 接下来的两个参数是近截面（near）和远截面（far）。
// 当物体某些部分比摄像机的远截面远或者比近截面近的时候，该这些部分将不会被渲染到场景中。
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)

const renderer = new THREE.WebGL1Renderer();
// 如果你希望保持你的应用程序的尺寸，但是以较低的分辨率来渲染，你可以在调用 setSize 时，
// 将 updateStyle（第三个参数）设为 false。例如，假设你的 <canvas> 标签现在已经具有了 100% 的宽和高，
// 调用 setSize(window.innerWidth/2, window.innerHeight/2, false) 将使得你的应用程序以四分之一的大小来进行渲染。
renderer.setSize(window.innerWidth, window.innerHeight)


// 控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.update();

// // BoxGeometry（立方体）对象. 这个对象包含了一个立方体中所有的顶点（vertices）和面（faces）。
// const geometry = new THREE.BoxGeometry(1, 1, 1)
// // 所有的材质都存有应用于他们的属性的对象
// const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 })
// // Mesh（网格）。 网格包含一个几何体以及作用在此几何体上的材质，我们可以直接将网格对象放入到我们的场景中，并让它在场景中自由移动。
// const cube = new THREE.Mesh(geometry, material)
// scene.add(cube)
// 默认情况下，当我们调用 scene.add() 的时候，物体将会被添加到 (0,0,0) 坐标。
// 但将使得摄像机和立方体彼此在一起。为了防止这种情况的发生，我们只需要将摄像机稍微向外移动一些即可。
camera.position.z = 100


// 平行光
const dirLight1 = new THREE.DirectionalLight(0xffffff);
dirLight1.position.set(1, 1, 1);
scene.add(dirLight1);

// 载入3D模型
// 一个用于加载经过Draco压缩的图形库。
const dracoLoader = new DRACOLoader();
// — 包含JS和WASM解压缩库的文件夹路径。
dracoLoader.setDecoderPath('jsm/libs/draco/gltf/');

const loader = new GLTFLoader();
// — THREE.DRACOLoader的实例，用于解码使用KHR_draco_mesh_compression扩展压缩过的文件。
loader.setDRACOLoader(dracoLoader);
loader.load('gltf/Parrot.glb', function (gltf) {
  const model = gltf.scene;
  scene.add(model);
  animate();
}, undefined, function (error) {
  console.error(error);
});

function animate() {
  // requestAnimationFrame 有很多的优点。最重要的一点或许就是当用户切换到其它的标签页时，它会暂停
  requestAnimationFrame(animate);
  // 控制器更新
  controls.update();
  // cube.rotation.x += 0.01;
  // cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

onMounted(() => {
  nextTick(() => {
    // 兼容性检查
    if (WebGL.isWebGLAvailable()) {
      console.log('浏览器兼容！');
      threeRef.value?.appendChild(renderer.domElement)
      animate();
    } else {
      const warning = WebGL.getWebGLErrorMessage();
      threeRef.value?.appendChild(warning)
    }
  })
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
