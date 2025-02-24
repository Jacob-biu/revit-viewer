<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%; position: relative;">
    <!-- 鼠标悬浮时显示部件信息 -->
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
        pointerEvents: 'none',
        zIndex: 1000,
        minWidth: '150px',
        maxWidth: '300px',
        minHeight: '100px',
        maxHeight: '300px',
        width: 'auto',
        height: 'auto',
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

    <!-- 固定显示部件信息 -->
    <div
      v-if="selectedPart"
      :style="{
        position: 'absolute',
        top: selectedPart.mouseY + 'px',
        left: selectedPart.mouseX + 'px',
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
    let previousClickedObject = null;  // 记录上次点击的物体

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
    const handleClick = () => {
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

    return {
      sceneContainer,
      hoveredPart,
      selectedPart,
      mouseX,
      mouseY,
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
}
</style>
