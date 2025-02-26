<template>
  <div id="app">
    <!-- 顶部标题 -->
    <div class="header">
      <h1>GLTF/GLB Viewer</h1>
    </div>
    <!-- 文件上传区域 -->
    <div class="upload-container" v-show="!files.length">
      <!-- 支持多文件上传 -->
      <input 
        type="file" 
        multiple 
        @change="handleFileChange" 
        accept=".gltf, .glb, .bin" 
        id="file-input"
      />
      <div 
        v-show="!files.length" 
        class="file-upload-placeholder"
      >
        拖拽文件到这里或者点击选择文件
      </div>
    </div>
    <!-- 使用 glTFViewer 组件，传递文件数据 -->
    <glTFViewer :files="files" v-show="files.length" />
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

    // 处理拖拽事件
    const handleDragOver = (event) => {
      event.preventDefault();
    };

    // 处理文件拖拽上传
    const handleDrop = (event) => {
      const droppedFiles = Array.from(event.dataTransfer.files);  // 获取拖拽的文件
      if (droppedFiles.length) {
        files.value = droppedFiles;  // 更新文件数据
      }
    };

    return {
      files,  // 返回文件数据
      handleFileChange,  // 返回文件选择事件处理方法
      handleDragOver,
      handleDrop,
    };
  },
};
</script>

<style>
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
  /* 将标题放置在顶部 */
}

h1 {
  font-size: 2em;
  margin: 0;
}

.upload-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  border: 2px dashed #fff;
  border-radius: 10px;
  background-color: #333;
  position: relative;
}

#file-input {
  opacity: 0;
  width: 100%;
  height: 100%;
  position: absolute;
}

.file-upload-placeholder {
  color: #fff;
  font-size: 1.2em;
  text-align: center;
  padding: 10px;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.file-upload-container:hover {
  background-color: #444;
}

glTFViewer {
  flex-grow: 1;  /* 使glTFViewer占据剩余的空间 */
  width: 100%;
  height: 100%;
}
</style>
