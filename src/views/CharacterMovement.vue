<script setup lang="ts">
import { onMounted, nextTick, ref, onUnmounted, onBeforeUnmount } from "vue"
// 导入整个 three.js核心库
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const domFlag = ref(true)
onBeforeUnmount(() => {
  threeRef.value?.removeChild(stats.dom)
  domFlag.value = false
})

let scene: any = null
let renderer: any = null
let camera: any = null
let stats: any = null
let model: any = null
let skeleton: any = null
let mixer: any = null
let clock: any = null

let crossFadeControls: any = [];


let idleAction: any = null
let walkAction: any = null
let runAction: any = null
let idleWeight: any = null
let walkWeight: any = null
let runWeight: any = null
let actions: any = null
let settings: any = null
let singleStepMode = false;
let sizeOfNextStep = 0;



const threeRef = ref<HTMLDivElement | null>()
onMounted(() => {
  nextTick(() => {
    init();
  })
})


function init() {

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
  camera.position.set(1, 2, - 3);
  camera.lookAt(0, 1, 0);
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xa0a0a0);
  scene.fog = new THREE.Fog(0xa0a0a0, 10, 50);

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x8d8d8d);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff);
  dirLight.position.set(- 3, 10, - 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 2;
  dirLight.shadow.camera.bottom = - 2;
  dirLight.shadow.camera.left = - 2;
  dirLight.shadow.camera.right = 2;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 40;
  scene.add(dirLight);

  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(100, 100), new THREE.MeshPhongMaterial({ color: 0xcbcbcb, depthWrite: false }));
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add(mesh);

  const loader = new GLTFLoader();
  loader.load('gltf/Soldier.glb', function (gltf) {
    model = gltf.scene;
    scene.add(model);
    model.traverse(function (object: any) {
      if (object.isMesh) object.castShadow = true;
    });
    skeleton = new THREE.SkeletonHelper(model);
    skeleton.visible = false;
    scene.add(skeleton);
    createPanel();
    const animations = gltf.animations;
    mixer = new THREE.AnimationMixer(model);
    idleAction = mixer.clipAction(animations[0]);
    walkAction = mixer.clipAction(animations[3]);
    runAction = mixer.clipAction(animations[1]);
    actions = [idleAction, walkAction, runAction];
    activateAllActions();
    animate();
  });
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  threeRef.value?.appendChild(renderer.domElement);
  stats = new Stats();
  threeRef.value?.appendChild(stats.dom);
  window.addEventListener('resize', onWindowResize);

  // 控制器
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1, 0);
  controls.update();
}

function createPanel() {

  const panel = new GUI({ width: 310 });

  const folder1 = panel.addFolder('Visibility');
  const folder2 = panel.addFolder('Activation/Deactivation');
  const folder3 = panel.addFolder('Pausing/Stepping');
  const folder4 = panel.addFolder('Crossfading');
  const folder5 = panel.addFolder('Blend Weights');
  const folder6 = panel.addFolder('General Speed');

  settings = {
    'show model': true,
    'show skeleton': false,
    'deactivate all': deactivateAllActions,
    'activate all': activateAllActions,
    'pause/continue': pauseContinue,
    'make single step': toSingleStepMode,
    'modify step size': 0.05,
    'from walk to idle': function () {

      prepareCrossFade(walkAction, idleAction, 1.0);

    },
    'from idle to walk': function () {

      prepareCrossFade(idleAction, walkAction, 0.5);

    },
    'from walk to run': function () {

      prepareCrossFade(walkAction, runAction, 2.5);

    },
    'from run to walk': function () {

      prepareCrossFade(runAction, walkAction, 5.0);

    },
    'use default duration': true,
    'set custom duration': 3.5,
    'modify idle weight': 0.0,
    'modify walk weight': 1.0,
    'modify run weight': 0.0,
    'modify time scale': 1.0
  };

  folder1.add(settings, 'show model').onChange(showModel);
  folder1.add(settings, 'show skeleton').onChange(showSkeleton);
  folder2.add(settings, 'deactivate all');
  folder2.add(settings, 'activate all');
  folder3.add(settings, 'pause/continue');
  folder3.add(settings, 'make single step');
  folder3.add(settings, 'modify step size', 0.01, 0.1, 0.001);
  crossFadeControls.push(folder4.add(settings, 'from walk to idle'));
  crossFadeControls.push(folder4.add(settings, 'from idle to walk'));
  crossFadeControls.push(folder4.add(settings, 'from walk to run'));
  crossFadeControls.push(folder4.add(settings, 'from run to walk'));
  folder4.add(settings, 'use default duration');
  folder4.add(settings, 'set custom duration', 0, 10, 0.01);
  folder5.add(settings, 'modify idle weight', 0.0, 1.0, 0.01).listen().onChange(function (weight: any) {

    setWeight(idleAction, weight);

  });
  folder5.add(settings, 'modify walk weight', 0.0, 1.0, 0.01).listen().onChange(function (weight: any) {

    setWeight(walkAction, weight);

  });
  folder5.add(settings, 'modify run weight', 0.0, 1.0, 0.01).listen().onChange(function (weight: any) {

    setWeight(runAction, weight);

  });
  folder6.add(settings, 'modify time scale', 0.0, 1.5, 0.01).onChange(modifyTimeScale);

  folder1.open();
  folder2.open();
  folder3.open();
  folder4.open();
  folder5.open();
  folder6.open();

}


function showModel(visibility: any) {
  model.visible = visibility;
}


function showSkeleton(visibility: any) {
  skeleton.visible = visibility;
}


function modifyTimeScale(speed: any) {
  mixer.timeScale = speed;
}


function deactivateAllActions() {
  actions.forEach(function (action: any) {
    action.stop();
  });
}

function activateAllActions() {
  setWeight(idleAction, settings['modify idle weight']);
  setWeight(walkAction, settings['modify walk weight']);
  setWeight(runAction, settings['modify run weight']);
  actions.forEach(function (action: any) {
    action.play();
  });

}

function pauseContinue() {
  if (singleStepMode) {
    singleStepMode = false;
    unPauseAllActions();
  } else {
    if (idleAction.paused) {
      unPauseAllActions();
    } else {
      pauseAllActions();
    }
  }
}

function pauseAllActions() {
  actions.forEach(function (action: any) {
    action.paused = true;
  });
}

function unPauseAllActions() {
  actions.forEach(function (action: any) {
    action.paused = false;
  });
}

function toSingleStepMode() {
  unPauseAllActions();
  singleStepMode = true;
  sizeOfNextStep = settings['modify step size'];
}

function prepareCrossFade(startAction: any, endAction: any, defaultDuration: any) {
  const duration = setCrossFadeDuration(defaultDuration);
  singleStepMode = false;
  unPauseAllActions();
  if (startAction === idleAction) {
    executeCrossFade(startAction, endAction, duration);
  } else {
    synchronizeCrossFade(startAction, endAction, duration);
  }
}

function setCrossFadeDuration(defaultDuration: any) {
  if (settings['use default duration']) {
    return defaultDuration;
  } else {
    return settings['set custom duration'];
  }
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
  setWeight(endAction, 1);
  endAction.time = 0;
  startAction.crossFadeTo(endAction, duration, true);
}

function setWeight(action: any, weight: any) {
  action.enabled = true;
  action.setEffectiveTimeScale(1);
  action.setEffectiveWeight(weight);
}

function updateWeightSliders() {
  settings['modify idle weight'] = idleWeight;
  settings['modify walk weight'] = walkWeight;
  settings['modify run weight'] = runWeight;
}

function updateCrossFadeControls() {
  if (idleWeight === 1 && walkWeight === 0 && runWeight === 0) {
    crossFadeControls[0].disable();
    crossFadeControls[1].enable();
    crossFadeControls[2].disable();
    crossFadeControls[3].disable();
  }

  if (idleWeight === 0 && walkWeight === 1 && runWeight === 0) {
    crossFadeControls[0].enable();
    crossFadeControls[1].disable();
    crossFadeControls[2].enable();
    crossFadeControls[3].disable();
  }

  if (idleWeight === 0 && walkWeight === 0 && runWeight === 1) {
    crossFadeControls[0].disable();
    crossFadeControls[1].disable();
    crossFadeControls[2].disable();
    crossFadeControls[3].enable();
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);
  idleWeight = idleAction.getEffectiveWeight();
  walkWeight = walkAction.getEffectiveWeight();
  runWeight = runAction.getEffectiveWeight();
  updateWeightSliders();
  updateCrossFadeControls();
  let mixerUpdateDelta = clock.getDelta();
  if (singleStepMode) {
    mixerUpdateDelta = sizeOfNextStep;
    sizeOfNextStep = 0;
  }
  mixer.update(mixerUpdateDelta);
  stats.update();
  renderer.render(scene, camera);
}

</script>

<template>
  <div ref="threeRef" class="three-box" v-if="domFlag"></div>
</template>
