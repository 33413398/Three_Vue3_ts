<script setup lang="ts">
import { onMounted, nextTick, ref,onBeforeUnmount } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import WebGL from "three/examples/jsm/capabilities/WebGL.js"
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import gsap from "gsap";
import * as dat from "dat.gui";


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

const renderer = new THREE.WebGLRenderer({
  // alpha: true,// 默认情况下为黑色场景，此处设置为透明（即白色场景）
});
renderer.setSize(window.innerWidth, window.innerHeight);
const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    threeRef.value?.appendChild(renderer.domElement);
  })
})

const geometry = new THREE.BoxGeometry(1, 1, 1);
// 纹理材质
const textureLoader = new THREE.TextureLoader();
const floorColor = textureLoader.load('/IntelligentPark/hongqi.png');
// # 基础网格材质(MeshBasicMaterial)
const material = new THREE.MeshBasicMaterial({
  color: 0x00ff00, // 材质的颜色
  map: floorColor, // 颜色贴图
  transparent: true // 设置黑透白显
});

const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

camera.position.z = 5;

const controls = new OrbitControls(camera, renderer.domElement);// 初始化控制器
controls.target.set(0, 0, 0);// 设置控制器的焦点，使控制器围绕这个焦点进行旋转
// controls.minDistance = 80;// 设置移动的最短距离（默认为零）
// controls.maxDistance = 400;// 设置移动的最长距离（默认为无穷）
controls.maxPolarAngle = Math.PI / 3;//绕垂直轨道的距离（范围是0-Math.PI,默认为Math.PI）
controls.update();// 照相机转动时，必须更新该控制器

const axesHelper = new THREE.AxesHelper(5);
scene.add(axesHelper);
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}
// 将几何体位置移动
gsap.to(cube.position, {
x: 5, // 沿x轴移动5个像素
ease: 'power1.out', // 使用power1.out模式进行移动
duration: 5, // 持续时间5秒
repeat: -1, // 循环执行
yoyo: true // 动画流畅度优化
});
// 将几何体旋转
gsap.to(cube.rotation, { x: 2 * Math.PI, duration: 5, repeat: -1 });


if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  console.log('您的浏览器支持webgl，将为您载入项目！');
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById('container')?.appendChild(warning);
}

// 监听画面变化（放置代码末尾）
window.addEventListener("resize", () => {
  const iwidth = window.innerWidth;
  const iheigt = window.innerHeight;
  //更新摄像头
  camera.aspect = iwidth / iheigt;
  // 更新摄像机投影矩阵
  camera.updateProjectionMatrix();
  // 更新渲染器
  renderer.setSize(iwidth, iheigt);
  // 设置渲染器像素比
  renderer.setPixelRatio(window.devicePixelRatio);
});

// 图形界面
// 应用图形界面更改变量
const gui = new dat.GUI();
gui.add(cube.position, "x")
  .min(0) // 最小值
  .max(5) // 最大值
  .step(0.05) // 调节的精度
  .name("移动x坐标") // 属性名
  .onChange((value:any) => {
     //监听回调
    console.log("值被修改了：", value);
  });

// 修改物体的颜色
const params = {
  color: "#fff",
  fn: () => {
    gsap.to(cube.position, {
      x: 5,
      ease: "power1.out",
      duration: 5,
      repeat: -1,
      yoyo: true,
    });
  },
};
gui.addColor(params, "color").onChange((value:any) => {
  cube.material.color.set(value)
});

// 设置是否显示目标物
gui.add(cube, "visible").name("是否显示");

// 添加文件夹
var folder = gui.addFolder("设置立方体");
// 将配置材质的属性加入folder文件夹
folder.add(cube.material, "wireframe");
// 将点击触发某个事件的方法加入到folder文件夹
folder.add(params, "fn").name("立方体运动");

onBeforeUnmount(() => {
  gui.domElement.remove()
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
