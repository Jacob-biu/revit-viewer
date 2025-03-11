<template>
  <div id="app">
    <div class="header">
      <h1>GLTF/GLB Viewer</h1>
    </div>
    <router-view />
  </div>
</template>

<script>
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'App'
})
</script>

<style>
/* 保持原有的全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
}

.header {
  text-align: left;
  background-color: #000;
  color: #fff;
  padding: 20px;
  z-index: 1;
}

h1 {
  font-size: 2em;
  margin: 0;
}
</style>