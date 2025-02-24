<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%; position: relative;">
    <!-- 在鼠标位置旁边以表格形式显示部件信息 -->
    <div
      v-if="hoveredPart"
      :style="{
        position: 'absolute',
        top: mouseY + 'px',
        left: mouseX + 'px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '5px',
        pointerEvents: 'none', /* 禁用鼠标事件，使得提示不会遮挡交互 */
        zIndex: 1000,
        minWidth: '150px', /* 最小宽度 */
        maxWidth: '300px', /* 最大宽度 */
        minHeight: '100px', /* 最小高度 */
        maxHeight: '300px', /* 最大高度 */
        width: 'auto', /* 宽度自适应 */
        height: 'auto', /* 高度自适应 */
      }"
    >
      <table style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #ccc;">Property</th>
            <th style="text-align: left; padding: 5px; border-bottom: 1px solid #ccc;">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Name</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.name }}</td>
          </tr>
          <tr>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Type</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.type }}</td>
          </tr>
          <tr v-if="hoveredPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Width</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.dimensions.width }}</td>
          </tr>
          <tr v-if="hoveredPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Height</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.dimensions.height }}</td>
          </tr>
          <tr v-if="hoveredPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Depth</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.dimensions.depth }}</td>
          </tr>
          <tr v-if="hoveredPart.material">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Material Color</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ hoveredPart.material.color.getStyle() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
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
    let scene, camera, renderer, model, controls, raycaster, mouse;
    const hoveredPart = ref(null);  // 用来存储悬浮部件的信息
    const mouseX = ref(0);  // 鼠标X坐标
    const mouseY = ref(0);  // 鼠标Y坐标

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
          // 你可以遍历模型的子部件，并保存部件信息
          model.traverse((child) => {
            if (child.isMesh) {
              child.name = child.name || `Unnamed ${child.uuid}`;  // 为每个 mesh 设置一个名称
            }
          });
        });
      };
      reader.readAsArrayBuffer(file);  // 读取文件为二进制
    };

    // 获取部件的长宽高
    const getDimensions = (object) => {
      const box = new THREE.Box3().setFromObject(object);  // 计算包围盒
      const size = new THREE.Vector3();
      box.getSize(size);
      return {
        width: size.x.toFixed(2),
        height: size.y.toFixed(2),
        depth: size.z.toFixed(2),
      };
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
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);  // 设置方向光强度
      directionalLight.position.set(50, 50, 50);  // 设置光源位置
      scene.add(directionalLight);

      camera.position.z = 200;  // 设置相机位置

      // 启用 OrbitControls 使得可以用鼠标拖动旋转
      controls = new OrbitControls(camera, renderer.domElement);  // 创建并启用控制器
      controls.enableDamping = true;  // 开启阻尼效果，平滑过渡
      controls.dampingFactor = 0.25;  // 设置阻尼效果的强度
      controls.screenSpacePanning = false;  // 禁用屏幕空间平移

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      animate();  // 开始动画
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);  // 创建一个动画帧
      controls.update();  // 更新控制器
      renderer.render(scene, camera);  // 渲染场景
    };

    // 鼠标移动事件
    const handleMouseMove = (event) => {
      // 更新鼠标坐标
      mouseX.value = event.clientX;
      mouseY.value = event.clientY;

      // 确保模型已加载
      if (!model) return;

      // 将鼠标坐标转换为 normalized device coordinates
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      // 使用 Raycaster 查找与鼠标位置相交的物体
      raycaster.setFromCamera(mouse, camera);  // 将射线从相机发出
      const intersects = raycaster.intersectObjects(model.children, true);  // 查找模型的所有部件
      if (intersects.length > 0) {
        const object = intersects[0].object;
        hoveredPart.value = {
          name: object.name,
          type: object.type,
          dimensions: getDimensions(object),
          material: object.material,
        };
      } else {
        hoveredPart.value = null;  // 没有相交物体时清空信息
      }
    };

    watch(() => props.file, (newFile) => {
      if (newFile) {
        loadGLTF(newFile);  // 加载新文件
      }
    });

    onMounted(() => {
      initScene();
      window.addEventListener("mousemove", handleMouseMove);  // 监听鼠标移动事件
    });

    return {
      sceneContainer,
      hoveredPart,
      mouseX,
      mouseY,
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
