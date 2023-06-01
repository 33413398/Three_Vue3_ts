<script setup lang="ts">
import { reactive } from "vue"
import { RouterLink } from 'vue-router'

const list = reactive([
  {
    name: '首个场景',
    link: '/LessonOne'
  },
  {
    name: '画线',
    link: '/line'
  },
  {
    name: '创建文本',
    link: '/text'
  },
  {
    name: '载入3D模型',
    link: '/init3D'
  },
  {
    name: '数据中心可视化系统',
    link: '/DataCenterVisualizationSystem'
  },
])
</script>

<template>
  <div class="home-view">
    <div class="home-view-item" v-for="item in list" :key="item.link">
      <router-link :to="item.link">{{ item.name }}</router-link>
    </div>
  </div>
</template>

<style lang="scss">
.home-view {
  width: 100%;
  height: 100%;
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  padding-top: 20%;
  font-size: 20px;
  font-weight: 700;

  .home-view-item {
    padding: 10px 30px;
    border: 1px solid #000;
    border-radius: 8px;
    height: 60px;
    margin-right: 20px;
    margin-bottom: 1%;
  }
}
</style>