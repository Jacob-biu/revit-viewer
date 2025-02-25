<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%; position: relative;">
    <!-- 悬浮侧边框 -->
    <div :style="sideBarStyle">
      <!-- 爆炸图切换按钮 -->
      <button @click="toggleExplodedView" :style="buttonStyle">
        {{ isExploded ? '恢复原图' : '显示爆炸图' }}
      </button>
      <!-- 剖切功能按钮 -->
      <button @click="toggleClipping" :style="buttonStyle">
        {{ isClipping ? '关闭剖切' : '开启剖切' }}
      </button>
      <!-- 切换剖切方向按钮 -->
      <button @click="switchClippingDirection" :style="buttonStyle">
        切换剖切方向 ({{ currentDirection }})
      </button>
      <!--测量-->
      <button @click="measure" :style="buttonStyle">
        {{ isMeasuring ? '关闭测量' : '测量' }}
      </button>
    </div>

    <!-- 剖切滑块 -->
    <div v-if="isClipping" :style="sliderStyle">
      <input type="range" v-model="clipPosition" min="-100" max="100" step="1" style="width: 100%;" />
    </div>

    <!-- 鼠标悬浮时显示部件信息 -->
    <div v-if="hoveredPart" :style="{
      position: 'absolute',
      top: mouseY + 'px',
      left: mouseX + 'px',
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      pointerEvents: 'none',
      zIndex: 1000,
      minWidth: '150px',
      maxWidth: '300px',
      minHeight: '100px',
      maxHeight: '300px',
      width: 'auto',
      height: 'auto',
    }">
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

    <!-- 固定显示部件信息 -->
    <div v-if="selectedPart" :style="{
      position: 'absolute',
      bottom: '40px',  /* 将其固定在底部 */
      left: '20px',  /* 距离左边 20px */
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '10px',
      borderRadius: '5px',
      zIndex: 1000,
      minWidth: '150px',
      maxWidth: '300px',
      minHeight: '100px',
      maxHeight: '300px',
      width: 'auto',
      height: 'auto',
    }">
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
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.name }}</td>
          </tr>
          <tr>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Type</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.type }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Width</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.dimensions.width }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Height</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.dimensions.height }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Depth</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.dimensions.depth }}</td>
          </tr>
          <tr v-if="selectedPart.material">
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">Material Color</td>
            <td style="padding: 5px; border-bottom: 1px solid #ccc;">{{ selectedPart.material.color.getStyle() }}</td>
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
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default {
  name: "glTFViewer",
  props: {
    file: {
      type: File,
      default: null,
    },
  },
  setup(props) {
    const sceneContainer = ref(null);
    let scene, camera, renderer, model, controls, raycaster, mouse;
    const hoveredPart = ref(null);  // 用于悬浮时显示的信息
    const selectedPart = ref(null);  // 用于点击时显示的固定信息
    const mouseX = ref(0);
    const mouseY = ref(0);
    const isExploded = ref(false);  // 是否显示爆炸图
    const isClipping = ref(false);  // 是否开启剖切
    const clipPosition = ref(0);  // 剖切位置
    const currentDirection = ref("X");  // 当前剖切方向
    const originalPositions = new Map();  // 存储部件的原始位置
    let previousClickedObject = null;  // 记录上次点击的物体
    let clipPlane = null;  // 剖切平面

    // 加载GLTF文件的函数
    const loadGLTF = (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const contents = e.target.result;
        const loader = new GLTFLoader();
        loader.parse(contents, "", (gltf) => {
          if (model) {
            scene.remove(model);
          }
          model = gltf.scene;
          scene.add(model);
          model.traverse((child) => {
            if (child.isMesh) {
              child.name = child.name || `Unnamed ${child.uuid}`;
              originalPositions.set(child, child.position.clone());  // 保存原始位置
            }
          });
        });
      };
      reader.readAsArrayBuffer(file);
    };

    // 获取部件的尺寸
    const getDimensions = (object) => {
      const box = new THREE.Box3().setFromObject(object);
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
      scene.background = new THREE.Color(0x000000);

      camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      renderer = new THREE.WebGLRenderer();
      renderer.setSize(window.innerWidth, window.innerHeight);
      sceneContainer.value.appendChild(renderer.domElement);

      const ambientLight = new THREE.AmbientLight(0x404040, 10);
      scene.add(ambientLight);

      const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
      directionalLight.position.set(50, 50, 50);
      scene.add(directionalLight);

      camera.position.z = 200;

      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      animate();
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };

    // 鼠标移动事件
    const handleMouseMove = (event) => {
      mouseX.value = event.clientX;
      mouseY.value = event.clientY;

      if (!model) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(model.children, true);

      if (intersects.length > 0) {
        const object = intersects[0].object;
        hoveredPart.value = {
          name: object.name,
          type: object.type,
          dimensions: getDimensions(object),
          material: object.material,
        };
      } else {
        hoveredPart.value = null;
      }
    };

    // 鼠标点击事件
    const handleClick = (event) => {
      // 如果点击的是部件信息区域，不执行隐藏操作
      if (event.target.closest('table')) {
        return;
      }

      if (!hoveredPart.value) {
        selectedPart.value = null;  // 点击空白处时隐藏信息
        if (previousClickedObject) {
          previousClickedObject.material.emissive.set(0x000000);  // 恢复原来的颜色
        }
        return;
      }

      // 高亮当前点击的部件
      const object = model.getObjectByName(hoveredPart.value.name);
      object.material.emissive.set(0xff0000);  // 设置为红色高亮

      // 如果之前有点击的部件，恢复它的颜色
      if (previousClickedObject && previousClickedObject !== object) {
        previousClickedObject.material.emissive.set(0x000000);  // 恢复原来的颜色
      }

      // 更新选中的部件信息
      selectedPart.value = {
        ...hoveredPart.value,
        mouseX: mouseX.value,
        mouseY: mouseY.value,
      };

      previousClickedObject = object;  // 更新记录的点击部件
    };

    // 切换爆炸图
    const toggleExplodedView = () => {
      isExploded.value = !isExploded.value;

      model.traverse((child) => {
        if (child.isMesh) {
          const originalPosition = originalPositions.get(child);
          if (isExploded.value) {
            // 计算爆炸位移
            const direction = new THREE.Vector3().subVectors(child.position, model.position).normalize();
            const distance = 50;  // 爆炸距离
            child.position.add(direction.multiplyScalar(distance));
          } else {
            // 恢复原始位置
            child.position.copy(originalPosition);
          }
        }
      });
    };

    // 切换剖切功能
    const toggleClipping = () => {
      isClipping.value = !isClipping.value;

      if (isClipping.value) {
        // 创建剖切平面
        updateClipPlane();
      } else {
        // 关闭剖切
        renderer.clippingPlanes = [];
      }
    };

    // 更新剖切平面
    const updateClipPlane = () => {
      if (!isClipping.value) return;

      let normal;
      switch (currentDirection.value) {
        case "X":
          normal = new THREE.Vector3(1, 0, 0);
          break;
        case "Y":
          normal = new THREE.Vector3(0, 1, 0);
          break;
        case "Z":
          normal = new THREE.Vector3(0, 0, 1);
          break;
        default:
          normal = new THREE.Vector3(1, 0, 0);
      }

      clipPlane = new THREE.Plane(normal, clipPosition.value);
      renderer.clippingPlanes = [clipPlane];
    };

    // 切换剖切方向
    const switchClippingDirection = () => {
      const directions = ["X", "Y", "Z"];
      const currentIndex = directions.indexOf(currentDirection.value);
      currentDirection.value = directions[(currentIndex + 1) % directions.length];
      updateClipPlane();
    };

    // 监听剖切位置的变化
    watch(clipPosition, (newValue) => {
      if (clipPlane) {
        clipPlane.constant = newValue;
      }
    });

    watch(() => props.file, (newFile) => {
      if (newFile) {
        loadGLTF(newFile);
      }
    });

    onMounted(() => {
      initScene();
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("click", handleClick);  // 添加点击事件监听
    });

    const sideBarStyle = {
      position: 'fixed',
      top: '50%',  // 垂直居中
      left: '20px',  // 左侧定位
      transform: 'translateY(-50%)',  // 精确居中
      width: '150px',
      background: 'transparent',
      color: 'white',
      padding: '10px',  // 为了按钮之间有空隙
      borderRadius: '5px',
      zIndex: 1001,
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',  // 添加阴影效果，提升悬浮感
      display: 'flex',
      flexDirection: 'column',  // 按钮垂直排列
      alignItems: 'center',  // 按钮水平居中
      height: 'auto',  // 高度自适应
      minHeight: '120px',  // 设置最小高度，避免内容过少时太小
    };

    const buttonStyle = {
      width: '100%',
      padding: '14px 20px',  // 增大按钮内边距
      background: 'linear-gradient(135deg, #6e7bff, #7a4fff)',  // 渐变背景
      color: 'white',
      border: 'none',
      borderRadius: '30px',  // 圆角按钮
      cursor: 'pointer',
      fontSize: '16px',  // 调大字体大小
      fontWeight: 'bold',
      marginBottom: '12px',  // 增加按钮之间的间距
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',  // 按钮阴影
      transition: 'all 0.3s ease',  // 平滑过渡效果
    };

    const sliderStyle = {
      position: 'fixed',
      bottom: '20vh',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '200px',
      height:'40px',
      zIndex: 1001,
      flexDirection: 'column',  // 垂直排列
      justifyContent: 'flex-end', // 使滑动条居于底部
    };

    return {
      sceneContainer,
     
      hoveredPart,
      selectedPart,
      mouseX,
      mouseY,
      isExploded,
      isClipping,
      clipPosition,
      toggleExplodedView,
      toggleClipping,
      sideBarStyle,
      buttonStyle,
      sliderStyle,
      switchClippingDirection
    };
  },
};
</script>

<style scoped>
/* 样式部分保持不变 */
div {
  margin: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  width: 100vh;
}

/* 按钮的 hover 状态 */
button:hover {
  background: linear-gradient(135deg, #5a67f2, #5e3ddb);  /* hover 时背景颜色改变 */
  transform: scale(1.05);  /* 放大效果 */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);  /* hover 时更强的阴影 */
}

/* 滑块样式 */
input[type="range"] {
  -webkit-appearance: none;
  width: 100%;
  height: 8px;
  background: #ddd;
  border-radius: 5px;
  outline: none;
  opacity: 0.7;
  transition: opacity .2s;
}
input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
}
</style>