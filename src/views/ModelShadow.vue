<script setup lang="ts">
import { onMounted, nextTick, ref, onBeforeUnmount } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
// 实时资源趋势
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
// 控制面板
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

/* 
  三要素
 */
// 场景
const scene = new THREE.Scene();
// 背景色
scene.background = new THREE.Color(0xa0a0a0);
// 雾 小于10和大于50不影响
scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);
// 渲染器
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
const threeRef = ref<HTMLDivElement | null>()
// 该对象用于跟踪时间。如果performance.now可用，则 Clock 对象通过该方法实现，否则回落到使用略欠精准的Date.now来实现。
const clock = new THREE.Clock();

// 初始化摄像机
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100);
camera.position.set(- 1, 2, 3);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enablePan = false;
controls.enableZoom = false;
controls.target.set(0, 1, 0);
controls.update();
let stats = new Stats();

// dom生成后将渲染器 资源占用加入dom 开启响应式
onMounted(() => {
  nextTick(() => {
    threeRef.value?.appendChild(renderer.domElement);
    threeRef.value?.appendChild(stats.dom);
    window.addEventListener('resize', onWindowResize);
  })
})


// 光 - 半球光  光源直接放置于场景之上，光照颜色从天空光线颜色渐变到地面光线颜色。
const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d);
//三维 y 偏移
hemiLight.position.set(0, 20, 0);
scene.add(hemiLight);
// 平行光  -- 平行光可以投射阴影
const dirLight = new THREE.DirectionalLight(0xffffff);
dirLight.position.set(3, 10, 10);
// 此属性设置为 true 灯光将投射阴影。注意：这样做的代价比较高，需要通过调整让阴影看起来正确
dirLight.castShadow = true;
//shadow 用于计算该平行光产生的阴影。
dirLight.shadow.camera.top = 2;
//camera 在光的世界里。这用于生成场景的深度图;从光的角度来看，其他物体背后的物体将处于阴影中。
dirLight.shadow.camera.bottom = - 2;
dirLight.shadow.camera.left = - 2;
dirLight.shadow.camera.right = 2;
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 40;
scene.add(dirLight);

// 地面投影容器
// 基础网格 - 三角形为polygon mesh（多边形网格）
const mesh = new THREE.Mesh(
  // 平面缓冲几何体 
  new THREE.PlaneGeometry(100, 100),
  // 网格材质  - 镜面高光的光泽表面的材质
  new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
  mesh.rotation.x = - Math.PI / 2; // 180度
/* 
因为阴影要投射到“地面”上，所以“地面”这个物体的receiveShadow属性为true；
因为想要物体要产生阴影，那么该物体的castShadow属性为true； */
mesh.receiveShadow = true;
scene.add(mesh);

// 导入模型
let mixer: any = null
let numAnimations: any = null

const baseActions: any = {
  idle: { weight: 1 },
  walk: { weight: 0 },
  run: { weight: 0 }
};
const allActions: any = [];
const additiveActions: any = {
  sneak_pose: { weight: 0 },
  sad_pose: { weight: 0 },
  agree: { weight: 0 },
  headShake: { weight: 0 }
};
let panelSettings: any = null
// 用于载入glTF 2.0资源的加载器。
const loader = new GLTFLoader();
// 路径  加载成功的回调函数
loader.load('gltf/Xbot.glb', function (gltf) {
  let model = gltf.scene;
  // 添加到场景
  scene.add(model);
  // 开启模型投影
  model.traverse(function (object: any) {
    if (object.isMesh) object.castShadow = true;
  });
// 用来模拟骨骼 Skeleton 的辅助对象. 该辅助对象使用 LineBasicMaterial 材质.
  const skeleton = new THREE.SkeletonHelper(model);
  // 不可见
  skeleton.visible = false;
  scene.add(skeleton);
  // 模型动画
  const animations = gltf.animations;
  // 动画混合器是用于场景中特定对象的动画的播放器。当场景中的多个对象独立动画时，每个对象都可以使用同一个动画混合器。
  mixer = new THREE.AnimationMixer(model);
  numAnimations = animations.length;
  for (let i = 0; i !== numAnimations; ++i) {
    let clip = animations[i];
    const name = clip.name;
    if (baseActions[name]) {
      /* clipAction
      返回所传入的剪辑参数的AnimationAction, 根对象参数可选，默认值为混合器的默认根对象。
      第一个参数可以是动画剪辑(AnimationClip)对象或者动画剪辑的名称。
      如果不存在符合传入的剪辑和根对象这两个参数的动作, 该方法将会创建一个。
      传入相同的参数多次调用将会返回同一个剪辑实例。 */
      const action = mixer.clipAction(clip);
      activateAction(action);
      baseActions[name].action = action;
      allActions.push(action);
    } else if (additiveActions[name]) {
      //AnimationUtils 一个提供各种动画辅助方法的对象，内部使用。
      //makeClipAdditive 将给定动画剪辑的关键帧转换为附加格式
      THREE.AnimationUtils.makeClipAdditive(clip);
      if (clip.name.endsWith('_pose')) {
        //subclip 创建一个新的片段，仅包含所给定帧之间的原始剪辑片段。
        clip = THREE.AnimationUtils.subclip(clip, clip.name, 2, 3, 30);
      }
      const action = mixer.clipAction(clip);
      activateAction(action);
      additiveActions[name].action = action;
      allActions.push(action);
    }
  }
  createPanel();
  animate();
});
// 动画相关方法
function activateAction(action: any) {
  const clip = action.getClip();
  const settings = baseActions[clip.name] || additiveActions[clip.name];
  setWeight(action, settings.weight);
  // 播放动画
  action.play();
}

function modifyTimeScale(speed: any) {
  mixer.timeScale = speed;
}

let currentBaseAction = 'idle';
const crossFadeControls: any = [];
function prepareCrossFade(startAction: any, endAction: any, duration: any) {
  if (currentBaseAction === 'idle' || !startAction || !endAction) {
    executeCrossFade(startAction, endAction, duration);
  } else {
    synchronizeCrossFade(startAction, endAction, duration);
  }
  if (endAction) {
    const clip = endAction.getClip();
    currentBaseAction = clip.name;
  } else {
    currentBaseAction = 'None';
  }

  crossFadeControls.forEach(function (control: any) {
    const name = control.property;
    if (name === currentBaseAction) {
      control.setActive();
    } else {
      control.setInactive();
    }
  });

}

function synchronizeCrossFade(startAction: any, endAction: any, duration: any) {
  mixer.addEventListener('loop', onLoopFinished);
  function onLoopFinished(event: any) {
    if (event.action === startAction) {
      mixer.removeEventListener('loop', onLoopFinished);
      executeCrossFade(startAction, endAction, duration);
    }
  }
}

function executeCrossFade(startAction: any, endAction: any, duration: any) {
  if (endAction) {
    setWeight(endAction, 1);
    endAction.time = 0;
    if (startAction) {
      startAction.crossFadeTo(endAction, duration, true);
    } else {
      endAction.fadeIn(duration);
    }
  } else {
    startAction.fadeOut(duration);
  }

}
// 设置宽
function setWeight(action: any, weight: any) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}
// 响应式
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
// 每帧要做的事情，让画面动起来
function animate() {
  requestAnimationFrame(animate);
  for (let i = 0; i !== numAnimations; ++i) {
    const action = allActions[i];
    const clip = action.getClip();
    const settings = baseActions[clip.name] || additiveActions[clip.name];
    settings.weight = action.getEffectiveWeight();

  }
  const mixerUpdateDelta = clock.getDelta();
  mixer.update(mixerUpdateDelta);
  stats.update();
  renderer.render(scene, camera);
}

// 控制面板相关
let panel: any = null
function createPanel() {
  panel = new GUI({ width: 310 });
  const folder1 = panel.addFolder('Base Actions');
  const folder2 = panel.addFolder('Additive Action Weights');
  const folder3 = panel.addFolder('General Speed');
  panelSettings = {
    'modify time scale': 1.0
  };
  const baseNames = ['None', ...Object.keys(baseActions)];
  for (let i = 0, l = baseNames.length; i !== l; ++i) {
    const name = baseNames[i];
    const settings = baseActions[name];
    panelSettings[name] = function () {
      const currentSettings = baseActions[currentBaseAction];
      const currentAction = currentSettings ? currentSettings.action : null;
      const action = settings ? settings.action : null;
      if (currentAction !== action) {
        prepareCrossFade(currentAction, action, 0.35);
      }
    };
    crossFadeControls.push(folder1.add(panelSettings, name));
  }

  for (const name of Object.keys(additiveActions)) {
    const settings = additiveActions[name];
    panelSettings[name] = settings.weight;
    folder2.add(panelSettings, name, 0.0, 1.0, 0.01).listen().onChange(function (weight: any) {
      setWeight(settings.action, weight);
      settings.weight = weight;
    });
  }

  folder3.add(panelSettings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);
  folder1.open();
  folder2.open();
  folder3.open();
  crossFadeControls.forEach(function (control: any) {
    control.setInactive = function () {
      control.domElement.classList.add('control-inactive');
    };
    control.setActive = function () {
      control.domElement.classList.remove('control-inactive');
    };
    const settings = baseActions[control.property];
    if (!settings || !settings.weight) {
      control.setInactive();
    }
  });
}
// 组件卸载时销毁控制面板
onBeforeUnmount(() => {
  panel.domElement.remove()
})
</script>

<template>
  <div ref="threeRef" class="three-box"></div>
</template>
