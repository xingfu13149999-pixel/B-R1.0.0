<!--
  应用根组件：全屏视口容器，仅渲染 router-view（具体页面由路由决定）。
-->
<template>
  <div class="app-viewport">
    <router-view v-slot="{ Component }">
      <!-- 缓存全屏访谈页：返回项目等页面时不断开录音与转写 -->
      <keep-alive include="Interview">
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </div>
</template>

<style>
html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}

.app-viewport {
  --primary-color: #2036ca;
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
