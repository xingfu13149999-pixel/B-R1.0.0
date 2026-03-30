<template>
  <div class="app-viewport">
    <router-view />
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
