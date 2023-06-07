<script setup lang="ts">
import { onMounted, nextTick, ref, onBeforeUnmount } from "vue"
// 导入库
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

/* 
  字体转换json文件网址    https://gero3.github.io/facetype.js/
*/

const threeRef = ref<HTMLDivElement | null>()
let gui: any = null

// 要在所有使用FileLoader的加载器上启用缓存， 需设置
THREE.Cache.enabled = true;

// 摄像头 - 透视相机
let camera: any = null
// 三维向量
let cameraTarget: any = null
// 场景
let scene: any = null
// 渲染器
let renderer: any = null
// 分组
let group: any = null
// 正立文本
let textMesh1: any = null
// 倒影文本
let textMesh2: any = null
// 文本缓冲几何体 实例
let textGeo: any = null
// 文本材质
let materials: any = null

let firstLetter = true;
// 文本
let text = '文本缓冲几何体'
// 是否开启斜角，默认为false
let bevelEnabled: any = true
// 字体实例 -- 导入路径后赋值
let font: any = undefined
// 字体文件路径
let fontName: any = 'PangMenZhengDao_Regular' // helvetiker, optimer, gentilis, droid sans, droid serif
// 挤出文本的厚度。默认值为50。
const height: any = 20
// 字体大小，默认值为100。
let size: any = 50
// 字体y轴偏移
let hover: any = 30
// 曲线上点的数量
let curveSegments: any = 4
// 文本上斜角的深度
let bevelThickness: any = 2
// 斜角与原始文本轮廓之间的延伸距离。默认值为8
let bevelSize = 1.5
// 是否需要倒影
const mirror: any = true

// 字体切换用
const fontMap: any = {
  'helvetiker': 0,
  'optimer': 1,
  'gentilis': 2,
  'droid/droid_sans': 3,
  'droid/droid_serif': 4
};

// 字体是用加粗还是默认的切换项
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

// 初始化函数
function init() {
  // 透视相机
  camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
  // 设置相机默认 x,y,z
  camera.position.set(0, 400, 700);
  // 三维向量   一个三维向量表示的是一个有顺序的、三个为一组的数字组合（标记为x、y和z）
  cameraTarget = new THREE.Vector3(0, 150, 0);

  // 场景
  scene = new THREE.Scene();
  // 场景背景色
  scene.background = new THREE.Color(0x000000);
  // 雾 这个类中的参数定义了线性雾。也就是说，雾的密度是随着距离线性增大的。
  /* 
  .color : Color
雾的颜色。比如说，如果将其设置为黑色，远处的物体将被渲染成黑色。
.near : Float
开始应用雾的最小距离。距离小于活动摄像机“near”个单位的物体将不会被雾所影响。
默认值是1。
.far : Float
结束计算、应用雾的最大距离，距离大于活动摄像机“far”个单位的物体将不会被雾所影响。
默认值是1000。 */
  scene.fog = new THREE.Fog(0x000000, 250, 1400);
  // 灯光 -- 平行光   平行光可以投射阴影
  /* 参数：颜色  光照的强度，或者说能量。 */
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
  // .position 表示对象局部位置的Vector3。默认值为(0, 0, 0)。
  // normalize 向量归一化
  dirLight.position.set(0, 0, 1).normalize();
  scene.add(dirLight);
  // 点光源 从一个点向各个方向发射的光源。一个常见的例子是模拟一个灯泡发出的光。
  const pointLight = new THREE.PointLight(0xffffff, 1.5);
  /* 
    .setHSL ( h : Float, s : Float, l : Float, colorSpace : string = LinearSRGBColorSpace ) : this
h — 色相值处于0到1之间。hue value between 0.0 and 1.0
s — 饱和度值处于0到1之间。
l — 亮度值处于0到1之间。
  */
  pointLight.color.setHSL(Math.random(), 1, 0.5);
  pointLight.position.set(0, 100, 90);
  scene.add(pointLight);

  materials = [
    // Phong网格材质   一种用于具有镜面高光的光泽表面的材质。
    // flatShading  定义材质是否使用平面着色进行渲染。默认值为false。
    new THREE.MeshPhongMaterial({ color: 0xffffff, flatShading: true }), // front
    new THREE.MeshPhongMaterial({ color: 0xffffff }) // side
  ];
  // 它几乎和Object3D是相同的，其目的是使得组中对象在语法上的结构更加清晰。
  group = new THREE.Group();
  group.position.y = 100;

  scene.add(group);
  // 导入字体方法
  loadFont();
  // 网格
  const plane = new THREE.Mesh(
    // 平面缓冲几何体  
    /* 
    width — 平面沿着X轴的宽度。默认值是1。
height — 平面沿着Y轴的高度。默认值是1。
widthSegments — （可选）平面的宽度分段数，默认值是1。
heightSegments — （可选）平面的高度分段数，默认值是1。 */
    new THREE.PlaneGeometry(10000, 10000),
    /* 
    基础网格材质   一个以简单着色（平面或线框）方式来绘制几何体的材质。
    这种材质不受光照的影响。
     */
    new THREE.MeshBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true })
  );
  plane.position.y = 100;
  // 角度90
  plane.rotation.x = - Math.PI / 2;
  scene.add(plane);
  // 渲染器
  renderer = new THREE.WebGLRenderer({
    // 是否执行抗锯齿。默认为false.
    antialias: true
  });
  // 像素比
  renderer.setPixelRatio(window.devicePixelRatio);
  // 尺寸
  renderer.setSize(window.innerWidth, window.innerHeight);
  // 添加到dom
  threeRef.value?.appendChild(renderer.domElement);
  // 事件
  threeRef.value && threeRef.value.addEventListener('pointerdown', onPointerDown);
  document.addEventListener('keypress', onDocumentKeyPress);
  document.addEventListener('keydown', onDocumentKeyDown);

  const params = {
    changeColor: function () {
      pointLight.color.setHSL(Math.random(), 1, 0.5);
    },
    changeFont: function () {
      fontIndex++;
      // fontName = reverseFontMap[fontIndex % reverseFontMap.length];
      loadFont();
    },
    changeWeight: function () {
      loadFont();
    },
    changeBevel: function () {
      bevelEnabled = !bevelEnabled;
      refreshText();
    }
  };

  //gui 可视化控制面板
  gui = new GUI();
  // 添加一些功能进去
  gui.add(params, 'changeColor').name('改变字体颜色');
  // gui.add(params, 'changeFont').name('change font');
  // gui.add(params, 'changeWeight').name('change weight');
  gui.add(params, 'changeBevel').name('是否开启斜角');
  // 开启
  gui.open();
  // 监听响应式事件
  window.addEventListener('resize', onWindowResize);
}

// 自适应事件
function onWindowResize() {
  windowHalfX = window.innerWidth / 2;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}


function onDocumentKeyDown(event: any) {
  if (firstLetter) {
    firstLetter = false;
    text = '';
  }
  const keyCode = event.keyCode;
  if (keyCode == 8) {
    event.preventDefault();
    text = text.substring(0, text.length - 1);
    refreshText();
    return false;
  }

}

function onDocumentKeyPress(event: any) {
  const keyCode = event.which;
  if (keyCode == 8) {
    event.preventDefault();
  } else {
    const ch = String.fromCharCode(keyCode);
    text += ch;
    refreshText();
  }

}
// 加载字体函数
function loadFont() {
  const loader = new FontLoader();
  loader.load('fonts/' + fontName + '.json', function (response) {
    font = response;
    refreshText();
  });

}
// 创建 文本缓冲几何体
function createText() {
  // 文本缓冲几何体 - 一个用于将文本生成为单一的几何体的类。 它是由一串给定的文本，以及由加载的font（字体）和该几何体ExtrudeGeometry父类中的设置所组成的参数来构造的。 请参阅FontLoader页面来查看更多详细信息。
  textGeo = new TextGeometry(text, {
    font: font, // THREE.Font的实例
    size: size, // 字体大小，默认值为100
    height: height, // 挤出文本的厚度。默认值为50。
    curveSegments: curveSegments,// 曲线上点的数量。默认值为12
    bevelThickness: bevelThickness,// 文本上斜角的深度，默认值为20。
    bevelSize: bevelSize,// 斜角与原始文本轮廓之间的延伸距离。默认值为8。
    bevelEnabled: bevelEnabled// 是否开启斜角，默认为false
  });

  /* 计算当前几何体的的边界矩形，该操作会更新已有 [param:.boundingBox]。
     边界矩形不会默认计算，需要调用该接口指定计算边界矩形，否则保持默认值 null。 */
  textGeo.computeBoundingBox();
  //boundingBox： 当前 bufferGeometry 的外边界矩形。可以通过 .computeBoundingBox() 计算。默认值是 null。
  const centerOffset = - 0.5 * (textGeo.boundingBox.max.x - textGeo.boundingBox.min.x);
  // 网格 表示基于以三角形为polygon mesh（多边形网格）的物体的类。 同时也作为其他类的基类
  textMesh1 = new THREE.Mesh(textGeo, materials);

  textMesh1.position.x = centerOffset;
  textMesh1.position.y = hover;
  textMesh1.position.z = 0;
  // 旋转
  textMesh1.rotation.x = 0;
  textMesh1.rotation.y = Math.PI * 2;
  // 添加到分组
  group.add(textMesh1);
  // 倒影文本几何体参数配置
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

// 刷新字体
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

// 渲染帧动画
function animate() {
  requestAnimationFrame(animate);
  render();
}
// 更新渲染
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
// 销毁gui实例
onBeforeUnmount(() => {
  gui.domElement.remove()
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
