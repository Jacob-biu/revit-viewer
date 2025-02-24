<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%;"></div> <!-- 设置容器占满父容器 -->
</template>

<script>
import { ref, watch, onMounted } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";  // 引入 OrbitControls

export default {
  name: "glTFViewer",
  props: {
    file: {  // 接收来自父组件传递的文件数据
      type: File,
      default: null,
    },
  },
  setup(props) {
    const sceneContainer = ref(null);  // 引用容器，用于展示3D场景
    let scene, camera, renderer, model, controls;

    // 加载GLTF或GLB文件的函数
    const loadGLTF = (file) => {
      const reader = new FileReader();  // 使用FileReader读取文件
      reader.onload = (e) => {
        const contents = e.target.result;
        const loader = new GLTFLoader();  // 创建GLTFLoader实例
        loader.parse(contents, "", (gltf) => {
          if (model) {
            scene.remove(model);  // 如果已有模型，先移除
          }
          model = gltf.scene;  // 获取加载的模型
          scene.add(model);  // 将模型加入场景
        });
      };
      reader.readAsArrayBuffer(file);  // 读取文件为二进制
    };

    // 初始化Three.js场景
    const initScene = () => {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);  // 设置场景背景为黑色

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);  // 设置渲染器大小
      sceneContainer.value.appendChild(renderer.domElement);  // 将渲染器的DOM元素添加到页面中

      // 增强环境光亮度（使得模型更亮）
      const ambientLight = new THREE.AmbientLight(0x404040, 10);  // 增加环境光强度
      scene.add(ambientLight);

      // 添加一个方向光源（更好的模拟阳光照射）
      const directionalLight = new THREE.DirectionalLight(0xffffff, 2);  // 设置方向光强度
      directionalLight.position.set(50, 50, 50);  // 设置光源位置
      scene.add(directionalLight);

      camera.position.z = 200;  // 设置相机位置

      // 启用 OrbitControls 使得可以用鼠标拖动旋转
      controls = new OrbitControls(camera, renderer.domElement);  // 创建并启用控制器
      controls.enableDamping = true;  // 开启阻尼效果，平滑过渡
      controls.dampingFactor = 0.25;  // 设置阻尼效果的强度
      controls.screenSpacePanning = false;  // 禁用屏幕空间平移

      animate();  // 开始动画
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);  // 创建一个动画帧
      controls.update();  // 更新控制器
      renderer.render(scene, camera);  // 渲染场景
    };

    // 监听文件变化，加载新的模型
    watch(() => props.file, (newFile) => {
      if (newFile) {
        loadGLTF(newFile);  // 加载新文件
      }
    });

    // 在组件挂载后初始化场景
    onMounted(() => {
      initScene();
    });

    return {
      sceneContainer,  // 返回容器引用
    };
  },
};
</script>

<style scoped>
/* 给 glTFViewer 组件的样式添加必要的布局 */
div {
  margin: 0;  /* 去除默认的边距 */
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;  /* 使容器填满整个视口 */
}
</style>
