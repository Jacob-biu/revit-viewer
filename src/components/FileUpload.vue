<template>
    <div class="upload-container" @dragOver.prevent @drop.prevent="handleDrop">
      <input 
        type="file" 
        multiple 
        @change="handleFileChange" 
        accept=".gltf, .glb, .bin" 
        id="file-input"
      />
      <div class="file-upload-placeholder">
        拖拽文件到这里或者点击选择文件
      </div>
    </div>
  </template>
  
  <script setup>
  import { useRouter } from 'vue-router'
  import { useFileStore } from '../stores/fileStore'
  
  const router = useRouter()
  const fileStore = useFileStore()
  
  const handleFileChange = async (event) => {
    const selectedFiles = Array.from(event.target.files)
    await processFiles(selectedFiles)
  }
  
  const handleDrop = async (event) => {
    const droppedFiles = Array.from(event.dataTransfer.files)
    await processFiles(droppedFiles)
  }
  
  const processFiles = async (files) => {
    if (files.length) {
      const { isValid, message } = await validateFiles(files)
      if (isValid) {
        fileStore.setFiles(files)
        router.push('/viewer')
      } else {
        alert(message)
      }
    }
  }
  
  const validateFiles = async (files) => {
    const hasGLB = files.some(f => f.name.endsWith('.glb'))
    const gltfFile = files.find(f => f.name.endsWith('.gltf'))
    const binFiles = files.filter(f => f.name.endsWith('.bin'))
  
    if (hasGLB) return { isValid: true }
    
    if (gltfFile) {
      const content = await gltfFile.text()
      try {
        const gltf = JSON.parse(content)
        for (const buffer of gltf.buffers || []) {
          if (buffer.uri && !buffer.uri.startsWith('data:')) {
            if (!binFiles.some(f => f.name === buffer.uri)) {
              return { isValid: false, message: `缺少引用的 .bin 文件: ${buffer.uri}` }
            }
          }
        }
        return { isValid: true }
      } catch {
        return { isValid: false, message: '无效的GLTF文件' }
      }
    }
    return { isValid: false, message: '缺少 .gltf 或 .glb 文件' }
  }
  </script>
  
  <style scoped>
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
    cursor: pointer;
  }
  
  .file-upload-placeholder {
    color: #fff;
    font-size: 1.2em;
    text-align: center;
    padding: 10px;
  }
  </style>