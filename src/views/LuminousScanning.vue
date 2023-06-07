<script setup lang="ts">
// @ts-nocheck
import { onMounted, nextTick, ref } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 控制面板
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
// 实时资源趋势
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { uperVertext, uperFragment } from '../../public/LuminousScanning/shader/uperLineShader.js';
import { bloomVertext, bloomFragment } from '../../public/LuminousScanning/shader/bloomShader.js';

// 渲染器
let renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
let scene = new THREE.Scene();
let camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 500);
camera.position.set(0, 0, 100);
camera.lookAt(0, 0, 0);
let controls = new OrbitControls(camera, renderer.domElement);
let threeRef = ref<HTMLDivElement | null>()
// 着色器材质 - 
let scanConfig = {
  value: 1.0,
  start: 0,
  end: 0,
  during: 3,
}


/**
* 场景内部分模型辉光效果
*/
let materials: any = {};
// 基础网格材质  -- 这种材质不受光照的影响
let darkMaterial = new THREE.MeshBasicMaterial({ color: '#000000' });


/**
 * 让模型产生辉光效果
 */
let finalComposer: any = null;
let bloomComposer: any = null;
// 区分辉光与非辉光层
const ENTIRE_SCENE = 0;
const BLOOM_SCENE = 1;
/* Layers 对象为 Object3D 分配 1个到 32 个图层。32个图层从 0 到 31 编号标记。
在内部实现上，每个图层对象被存储为一个 bit mask， 默认的，所有 Object3D 对象都存储在第 0 个图层上。 
图层对象可以用于控制对象的显示。当 camera 的内容被渲染时与其共享图层相同的物体会被显示。每个对象都需要与一个 camera 共享图层。
 */
const bloomLayer = new THREE.Layers();
// 删除图层对象已有的所有对应关系，增加与参数指定的图层的对应关系。
bloomLayer.set(BLOOM_SCENE);
const bloomParams = {
  exposure: 1,
  bloomThreshold: 0,
  bloomStrength: 1,
  bloomRadius: 0.2,
  scene: 'Scene with Glow',
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 10000);
  camera.position.set(5, 5, 5);
  camera.layers.enable(1);
  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  threeRef.value?.appendChild(renderer.domElement);
  controls = new OrbitControls(camera, renderer.domElement);
  var light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.setScalar(1000);
  scene.add(light);
  scene.add(new THREE.AmbientLight(0xffffff, .5));
  renderBloom();
  loadDRACO('/LuminousScanning/racingCar2-processed.glb').then(function (obj) {
    scene.add(obj)
    renderEffect(obj)
  })
}
const renderBloom = function () {
  // 添加基本的渲染通道
  const renderPass = new RenderPass(scene, camera);
// 辉光通道
  const bloomPass = new UnrealBloomPass(
    // 二维向量
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.5,
    0.4,
    0.85
  );
  bloomPass.threshold = bloomParams.bloomThreshold;
  bloomPass.strength = bloomParams.bloomStrength;
  bloomPass.radius = bloomParams.bloomRadius;

  bloomComposer = new EffectComposer(renderer);
  bloomComposer.renderToScreen = false;
  bloomComposer.addPass(renderPass);
  // 把通道加入到组合器
  bloomComposer.addPass(bloomPass);
  const finalPass = new ShaderPass(
    new THREE.ShaderMaterial({
      uniforms: {
        baseTexture: { value: null },
        bloomTexture: { value: bloomComposer.renderTarget2.texture },
      },
      vertexShader: bloomVertext,
      fragmentShader: bloomFragment,
      defines: {},
    }),
    'baseTexture'
  );
  finalPass.needsSwap = true;
  // 初始化实际效果合成器
  finalComposer = new EffectComposer(renderer);

  finalComposer.addPass(renderPass);
  finalComposer.addPass(finalPass);
}
const loadGLTF = async function (path: any) {
  var loader = new GLTFLoader();
  var obj = await loader.loadAsync(path);
  return obj.scene;
}
const loadDRACO = async function (path: any) {
  let loader = new GLTFLoader();
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('/LuminousScanning/draco/');
  loader.setDRACOLoader(dracoLoader);
  const obj = await loader.loadAsync(path);
  return obj.scene;

}
function renderEffect(model: any) {
  let edgeGroup = new THREE.Group();
  model.traverse((obj: any) => {
    if (obj.name == '立方体') {
      // 将扫描框转为辉光材质
      obj.layers.toggle(BLOOM_SCENE);
      /* 
      着色器材质
      要实现内置 materials 之外的效果。
      将许多对象组合成单个BufferGeometry以提高性能。
       */
      let shaderMaterial = new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        uniforms: {
          height: scanConfig,
          uFlowColor: {
            value: new THREE.Vector4(0.0, 1.0, 1.0, 1.0),
          },
          uModelColor: {
            // Vector4 四维向量  一个四维向量表示的是一个有顺序的、四个为一组的数字组合（标记为x、y和z）， 可被用来表示很多事物
            /* 
              一个位于四维空间中的点。
              一个在四维空间中的方向与长度的定义。在three.js中，长度总是从(0, 0, 0, 0)到(x, y, z, w)的 
              Euclidean distance（欧几里德距离，即直线距离）， 方向也是从(0, 0, 0, 0)到(x, y, z, w)的方向。
              任意的、有顺序的、四个为一组的数字组合。
              x - 向量的x值，默认为0。
              y - 向量的y值，默认为0。
              z - 向量的z值，默认为0。
              w - 向量的w值，默认为1。
            */
            value: new THREE.Vector4(0.0, 0.0, 0.0, 0.0),
          },
        },
        // 顶点着色器的GLSL代码。这是shader程序的实际代码。  它也可以作为一个字符串直接传递或者通过AJAX加载。
        vertexShader: uperVertext,
        // 片元着色器的GLSL代码。这是shader程序的实际代码.  它也可以作为一个字符串直接传递或者通过AJAX加载。
        fragmentShader: uperFragment,
      })
      obj.material = shaderMaterial;
      let boundingBox = obj.geometry.boundingBox;
      // 初始化扫描配置,y轴上下需留出一定空间，防止把上下平面扫描出来
      scanConfig.start = boundingBox.min.y + 0.1 || 0;
      scanConfig.end = boundingBox.max.y - 0.1 || 0;
      scanConfig.value = scanConfig.start;
    }
    // 设置样式
    else
      if (obj.type === 'Mesh') edgeGroup.add(_renderFrameMesh(obj));
  });
  scene.add(edgeGroup);
  // 重置变换
  function _renderFrameMesh(obj: any) {

    const edges = new THREE.EdgesGeometry(obj.geometry);
    let color = new THREE.Color(0.1, 0.3, 1);
    var lineBasematerial = new THREE.LineBasicMaterial({
      color: color,
      side: THREE.FrontSide,
      linecap: 'round', //ignored by WebGLRenderer
      linejoin: 'round', //ignored by WebGLRenderer
    });
    const line = new THREE.LineSegments(edges, lineBasematerial);
    // 将外框转为辉光材质
    line.layers.toggle(BLOOM_SCENE);
    return line;
  }
}

function calcHeight() {
  let length = scanConfig.end - scanConfig.start;
  // 扫光判断逻辑
  scanConfig.value += length / scanConfig.during / 60;
  if (scanConfig.value >= scanConfig.end) {
    scanConfig.value = scanConfig.start;
  }
}
function render() {
  renderer.render(scene, camera);
  calcHeight()
  controls.update()
  requestAnimationFrame(render);
}
// 将材质转为黑色材质
function darkenNonBloomed(obj: any) {
  if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
    materials[obj.uuid] = obj.material;
    obj.material = darkMaterial;
  }
}
// 还原材质
function restoreMaterial(obj: any) {
  if (materials[obj.uuid]) {
    obj.material = materials[obj.uuid];
    delete materials[obj.uuid];
  }
}
function bloomRender() {
  scene.traverse((obj) => darkenNonBloomed(obj));
  bloomComposer.render();
  scene.traverse((obj) => restoreMaterial(obj));
  finalComposer.render();
  requestAnimationFrame(() => {
    calcHeight()
    bloomRender();
  });
}
onMounted(() => {
  nextTick(() => {
    init()
    // render()
    bloomRender()
  })
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
