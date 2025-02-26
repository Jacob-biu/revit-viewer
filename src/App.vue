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
    const handleFileChange = async (event) => {
      const selectedFiles = Array.from(event.target.files);  // 获取选择的文件列表
      if (selectedFiles.length) {
        const { isValid, message } = await validateFiles(selectedFiles);
        if (isValid) {
          files.value = selectedFiles;  // 更新文件数据
        } else {
          alert(message);  // 弹出提示框
        }
      }
    };

    // 验证文件是否匹配
    const validateFiles = async (files) => {
      const hasGLB = files.some(file => file.name.endsWith('.glb'));  // 检查是否有 .glb 文件
      const gltfFile = files.find(file => file.name.endsWith('.gltf'));  // 查找 .gltf 文件
      const binFiles = files.filter(file => file.name.endsWith('.bin'));  // 查找所有 .bin 文件

      if (hasGLB) {
        // 如果有 .glb 文件，则不需要检查 .gltf 和 .bin 文件
        return { isValid: true, message: '' };
      } else if (gltfFile) {
        // 如果有 .gltf 文件，检查其内容
        const gltfContent = await gltfFile.text();
        const gltfJson = JSON.parse(gltfContent);

        // 检查 .gltf 文件的 buffers 字段
        if (gltfJson.buffers && gltfJson.buffers.length > 0) {
          for (const buffer of gltfJson.buffers) {
            if (buffer.uri && !buffer.uri.startsWith('data:')) {
              // 如果 uri 是路径而不是 data:，则需要检查对应的 .bin 文件是否存在
              const binFileExists = binFiles.some(binFile => binFile.name === buffer.uri);
              if (!binFileExists) {
                return { isValid: false, message: `缺少引用的 .bin 文件: ${buffer.uri}` };
              }
            }
          }
        }
        return { isValid: true, message: '' };
      } else {
        // 如果没有 .gltf 文件，则提示
        return { isValid: false, message: '缺少 .gltf 文件' };
      }
    };

    // 处理拖拽事件
    const handleDragOver = (event) => {
      event.preventDefault();
    };

    // 处理文件拖拽上传
    const handleDrop = async (event) => {
      event.preventDefault();
      const droppedFiles = Array.from(event.dataTransfer.files);  // 获取拖拽的文件
      if (droppedFiles.length) {
        const { isValid, message } = await validateFiles(droppedFiles);
        if (isValid) {
          files.value = droppedFiles;  // 更新文件数据
        } else {
          alert(message);  // 弹出提示框
        }
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