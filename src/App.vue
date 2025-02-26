<template>
  <div id="app">
    <div style="text-align: center; height:auto; width: 100%; padding-top: 20px;">
      <h1>GLTF/GLB 文件加载与展示</h1>
    </div>
    <div>
      <!-- 支持多文件上传 -->
      <input type="file" multiple @change="handleFileChange" accept=".gltf, .glb, .bin" v-show="!files.length" />
      <!-- 使用 glTFViewer 组件，传递文件数据 -->
      <glTFViewer :files="files" v-show="files.length" />
    </div>
  </div>
</template>

<script>
import { ref } from "vue";
import glTFViewer from "./components/glTFViewer.vue";  // 引入 glTFViewer 组件

export default {
  name: "App",
  components: {
    glTFViewer,  // 注册 glTFViewer 组件
  },
  setup() {
    const files = ref([]);  // 存储上传的文件

    // 文件上传处理方法
    const handleFileChange = (event) => {
      const selectedFiles = Array.from(event.target.files);  // 获取选择的文件列表
      if (selectedFiles.length) {
        files.value = selectedFiles;  // 更新文件数据
      }
    };

    return {
      files,  // 返回文件数据
      handleFileChange,  // 返回文件选择事件处理方法
    };
  },
};
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  /* 防止因边距和内边距引起的滚动 */
}

html,
body {
  height: 100%;
  /* 设置html和body的高度为100% */
  width: 100%;
  overflow: hidden;
  /* 禁止页面滚动条 */
}

#app {
  text-align: left;
  background-color: #000;
  color: #fff;
  height: 100%;
  /* 使#app填满整个页面 */
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

input[type="file"] {
  margin: 20px;
  padding: 10px;
  background-color: #333;
  color: #fff;
  border: none;
  border-radius: 5px;
}

/* 调整h1父元素的背景颜色和padding */
#app>div:first-of-type {
  padding-top: 20px;
  /* 给顶部增加一点空间 */
}

h1 {
  color: #fff;
  /* 设置h1文本颜色为白色 */
  font-size: 2em;
  /* 可根据需要调整字体大小 */
}
</style>
