<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%; position: relative;">
    <!-- 加载动画 -->
    <div v-if="isLoading" :style="loadingStyle">
      <div class="loading-spinner"></div>
      <div class="loading-progress">{{ loadingProgress }}%</div>
    </div>

    <div v-if="scalePercentage !== 100" @click="resetView" style="
      position: fixed;
      left: 20px;
      bottom: 20px;
      background: rgba(0, 0, 0, 0.85);
      color: #fff;
      padding: 8px 16px;
      border-radius: 5px;
      font-size: 14px;
      font-family: system-ui, sans-serif;
      line-height: 1;
      white-space: nowrap;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      backdrop-filter: blur(3px);
      height:auto;
      width:auto;" @mouseenter="scaleHover = true" @mouseleave="scaleHover = false"
      :style="{ transform: scaleHover ? 'scale(1.05)' : 'none' }">
      当前缩放：{{ scalePercentage }}%
    </div>

    <!-- 悬浮侧边框 -->
    <div :style="sideBarStyle">
      <!-- 亮度调节滑动条 -->
      <div
        style="width: 100%; height:fit-content; margin-bottom:12px; display:flex; flex-direction:row; justify-content: center; align-items: center;">
        <label for="brightness" style="color: white; font-size: 14px;">亮度调节</label>
        <input type="range" id="brightness" v-model="brightness" min="0.1" max="3" step="0.1"
          :style="brightnessSliderStyle" />
      </div>

      <button @click="toggleAutoShow" :style="buttonStyle">
        {{ isAutoShowing ? '停止展示' : '自动展示' }}
      </button>

      <!-- Grid 切换按钮 -->
      <button @click="toggleGrid" :style="buttonStyle">
        {{ showGrid ? '隐藏网格' : '显示网格' }}
      </button>

      <!-- 爆炸图切换按钮 -->
      <button @click="toggleExplodedView" :style="buttonStyle">
        {{ isExploded ? '恢复原图' : '显示爆炸图' }}
      </button>

      <!-- 剖切功能按钮 -->
      <button @click="toggleClipping" :style="buttonStyle">
        {{ isClipping ? '关闭剖切' : '开启剖切' }}
      </button>

      <!--测量-->
      <button @click="measure" :style="buttonStyle">
        {{ isMeasuring ? '关闭测量' : '测量' }}
      </button>

      <button :style="buttonStyle" @click="goToHome">
        重新上传
      </button>
    </div>

    <!-- 剖切滑块 -->
    <!-- 剖切滑块 -->
    <div v-if="isClipping" :style="sliderStyle" ref="clipSlider">
      <input type="range" v-if="currentDirection !== 'Free'" v-model="clipPosition"
        :min="axisRanges[currentDirection].min" :max="axisRanges[currentDirection].max" step="0.1"
        style="width: 100%; margin-bottom:20px;" />
      <div v-if="currentDirection !== 'Free'" style="color: white; font-size: 12px; margin-bottom:10px;">
        当前位置: {{ clipPosition }}
        (范围: {{ axisRanges[currentDirection].min.toFixed(1) }} -
        {{ axisRanges[currentDirection].max.toFixed(1) }})
      </div>
      <div v-if="currentDirection === 'Free'" style="color: white; font-size: 12px; margin-bottom:10px;">
        拖动模型任意位置调整剖切面
      </div>
      <!-- 切换剖切方向按钮 -->
      <button @click="switchClippingDirection" :style="buttonStyle">
        切换剖切方向 ({{ currentDirection }})
      </button>
    </div>

    <!-- 固定显示部件信息 -->
    <div v-if="selectedPart" class="fixed-info" :style="{
      position: 'fixed',
      top: '50%',
      right: '20px',
      transform: 'translateY(-50%)',
      width: 'auto',  // 自适应宽度
      minWidth: '180px',  // 最小宽度限制
      maxWidth: '300px',  // 最大宽度限制
      background: 'rgba(40, 40, 40, 0.9)',
      color: 'white',
      padding: '12px',
      borderRadius: '5px',
      zIndex: 1001,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      display: 'inline-block',  // 改为行内块布局
      height: 'auto',
      minHeight: '120px',
      backdropFilter: 'blur(8px)',
      transition: 'all 0.3s ease'
    }">
      <table style="
        border-collapse: collapse;
        width: 100%;  
        table-layout: auto;  
        margin: -2px;  
      ">
        <thead>
          <tr>
            <th style="
              text-align: left;
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
              white-space: nowrap;  
              font-size: 15px;
            ">Property</th>
            <th style="
              text-align: left;
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
              min-width: 80px;  
              font-size: 15px;
            ">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              white-space: nowrap;  
              font-size: 15px;
              font-family: 'Segoe UI', Arial, 'Microsoft YaHei', sans-serif;

            ">Name</td>
            <td style="
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              word-break: break-word;  
              max-width: 250px;  
              font-size: 15px;
              font-family: 'Segoe UI', Arial, 'Microsoft YaHei', sans-serif;
            ">{{ selectedPart.name }}</td>
          </tr>
          <tr>
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">Type</td>
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); word-break: break-word;">{{
              selectedPart.type }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">Width
            </td>
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); word-break: break-word;">{{
              selectedPart.dimensions.width }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">Height
            </td>
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); word-break: break-word;">{{
              selectedPart.dimensions.height }}</td>
          </tr>
          <tr v-if="selectedPart.dimensions">
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">Depth
            </td>
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); word-break: break-word;">{{
              selectedPart.dimensions.depth }}</td>
          </tr>
          <tr v-if="selectedPart.material">
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap;">Material
              Color</td>
            <td
              style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); white-space: nowrap; text-align: center; display: flex; align-items: center; justify-content: center;">
              <!-- 颜色块 -->
              <div :style="{
                backgroundColor: selectedPart.material.color.getStyle(),
                width: '24px',
                height: '18px',
                borderRadius: '3px',
                border: '1px solid rgba(255,255,255,0.3)',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }"></div>
              <span>
                {{ selectedPart.material.color.getStyle() }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { DragControls } from "three/examples/jsm/controls/DragControls";
import { LoadingManager, SRGBColorSpace } from "three";
import { useFileStore } from '../stores/fileStore'
import { useRouter } from 'vue-router'



export default {
  name: "glTFViewer",

  setup() {
    const sceneContainer = ref(null);
    const clipSlider = ref(null);
    let scene, camera, renderer, model, controls, raycaster, mouse;
    // const hoveredPart = ref(null);  // 用于悬浮时显示的信息
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
    let css2Renderer; // 用于显示标签的渲染器
    let originPoint; // 坐标系原点
    let dragControls; // 拖动控制器
    let axesHelper; // 三维坐标系


    const isMeasuring = ref(false); // 是否处于测量模式
    const measurePoints = ref([]); // 存储测量点
    const measureResult = ref(null); // 测量结果
    let measureLine = null; // 辅助线对象
    let measureLabel = null; // 测量结果标签

    const ambientLight = ref(null); // 用于存储环境光
    const directionalLight = ref(null); // 用于存储平行光
    const directionalLights = ref({
      top: null,
      bottom: null,
      front: null,
      back: null,
      left: null,
      right: null
    });
    const brightness = ref(1); // 亮度值，范围 0 到 2

    const showWireframe = ref(false); // 是否显示线框
    const showGrid = ref(false); // 是否显示网格
    // let gridHelper = null; // 用于存储网格对象

    const isLoading = ref(false); // 是否正在加载
    const loadingProgress = ref(0); // 加载进度

    const partGrids = ref(new Map()) // 声明为响应式对象

    // 在 setup 函数中添加
    const axisRanges = ref({
      X: { min: -100, max: 100 }, // 默认值
      Y: { min: -100, max: 100 },
      Z: { min: -100, max: 100 }
    });
    const fileStore = useFileStore()

    const router = useRouter()

    const goToHome = () => {
      // 在跳转前执行必要的清理
      router.push('/')
    }

    const isAutoShowing = ref(false);
    const originalScale = ref(new THREE.Vector3(1, 1, 1));
    const originalPosition = ref(new THREE.Vector3());
    const originalRotation = ref(new THREE.Euler());

    const scalePercentage = ref(100);
    let initialCameraDistance = 0;

    const scaleHover = ref(false);
    let initialCameraPosition = new THREE.Vector3();
    let initialControlsTarget = new THREE.Vector3();



    // 加载 GLTF/GLB 文件
    const loadModel = async (files) => {
      isLoading.value = true; // 开始加载
      loadingProgress.value = 0; // 初始化加载进度

      // 将 files 数组转换为 fileMap
      const fileMap = new Map();
      files.forEach(file => {
        fileMap.set(file.name, file);
      });

      // 查找根文件（.gltf 或 .glb）
      let rootFile;
      let rootPath;
      Array.from(fileMap).forEach(([path, file]) => {
        if (file.name.match(/\.(gltf|glb)$/)) {
          rootFile = file;
          rootPath = path.replace(file.name, '');
        }
      });

      if (!rootFile) {
        console.error("No .gltf or .glb asset found.");
        return;
      }

      const blobURLs = [];
      const manager = new LoadingManager();

      // 设置 URL 修改器
      manager.setURLModifier((url) => {
        const normalizedURL = rootPath + decodeURI(url).replace(/^.*\//, '');
        if (fileMap.has(normalizedURL)) {
          const blob = fileMap.get(normalizedURL);
          const blobURL = URL.createObjectURL(blob);
          blobURLs.push(blobURL);
          return blobURL;
        }
        return url;
      });

      const loader = new GLTFLoader(manager);

      // 监听加载进度
      loader.load(
        URL.createObjectURL(rootFile),
        (gltf) => {
          setupModel(gltf.scene);
          isLoading.value = false; // 加载完成
          blobURLs.forEach(URL.revokeObjectURL);
        },
        (xhr) => {
          // 更新加载进度
          loadingProgress.value = Math.round((xhr.loaded / xhr.total) * 100);
        },
        (error) => {
          console.error("Error loading model:", error);
          isLoading.value = false; // 加载失败
        }
      );
    };

    // 设置模型
    const setupModel = (modelScene) => {
      if (model) {
        scene.remove(model);
      }
      model = modelScene;
      scene.add(model);

      // 计算初始包围盒并居中模型
      const initialBox = new THREE.Box3().setFromObject(model);
      const center = new THREE.Vector3();
      initialBox.getCenter(center);
      const offset = new THREE.Vector3().subVectors(model.position, center);
      model.position.copy(offset);

      // 重要：更新模型的世界矩阵后重新计算包围盒
      model.updateMatrixWorld(true);
      const worldBox = new THREE.Box3().setFromObject(model);

      // 更新轴范围（使用世界坐标下的包围盒）
      axisRanges.value = {
        X: { min: worldBox.min.x, max: worldBox.max.x },
        Y: { min: worldBox.min.y, max: worldBox.max.y },
        Z: { min: worldBox.min.z, max: worldBox.max.z }
      };

      // 递归遍历所有子对象，并存储它们的原始位置
      const traverseAndStorePositions = (object) => {
        if (object.isMesh || object.isGroup || object.isObject3D) {
          originalPositions.set(object, object.position.clone());
        } else {
          console.log('object:', object);
        }
        if (object.children && object.children.length > 0) {
          object.children.forEach(child => traverseAndStorePositions(child));
        }
      };

      initialCameraDistance = controls.getDistance();
      initialCameraPosition.copy(camera.position);
      initialControlsTarget.copy(controls.target);

      traverseAndStorePositions(model);
    };

    const resetView = () => {
      // 重置相机位置
      camera.position.copy(initialCameraPosition);
      // 重置控制器目标
      controls.target.copy(initialControlsTarget);
      // 重置缩放参数
      controls.maxDistance = 5000;
      controls.minDistance = 1;
      // 立即更新控制器
      controls.update();
      // 重置比例显示
      scalePercentage.value = 100;

      // 触发重计算初始距离
      nextTick(() => {
        initialCameraDistance = controls.getDistance();
      });
    }


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

      camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.01,   // 将 near 值从 0.1 改为 0.01
        10000    // 将 far 值从 1000 改为 10000
      );
      renderer = new THREE.WebGLRenderer({
        antialias: true, // 开启硬件抗锯齿
        powerPreference: "high-performance" // 启用高性能模式
      });
      // 设置像素比（重要！解决移动端和高分屏锯齿问题）
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.physicallyCorrectLights = true;
      renderer.outputColorSpace = SRGBColorSpace;
      renderer.domElement.style.position = 'absolute'; // 确保渲染器定位正确
      renderer.domElement.style.top = '0';
      renderer.domElement.style.left = '0';
      sceneContainer.value.appendChild(renderer.domElement);
      // 监听窗口大小变化，动态调整渲染器尺寸
      window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setSize(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      });

      // 初始化环境光
      ambientLight.value = new THREE.AmbientLight(0x404040, brightness.value * 10);
      scene.add(ambientLight.value);

      // 初始化平行光
      directionalLight.value = new THREE.DirectionalLight(0xffffff, brightness.value * 9);
      directionalLight.value.position.set(50, 50, 50);
      scene.add(directionalLight.value);

      // 六个方向光源
      const createDirectionalLight = (color, position, intensityMultiplier = 1.5) => {
        const light = new THREE.DirectionalLight(color, brightness.value * intensityMultiplier);
        light.position.copy(position);
        return light;
      };

      // 初始化六个方向光
      directionalLights.value = {
        top: createDirectionalLight(0xffffff, new THREE.Vector3(0, 100, 0), 1.5),      // 上方3倍
        bottom: createDirectionalLight(0xffffff, new THREE.Vector3(0, -50, 0), 3),  // 下方8倍，位置更近，添加暖黄色
        front: createDirectionalLight(0xffffff, new THREE.Vector3(0, 0, 100), 1.5),  // 前方3倍
        back: createDirectionalLight(0xffffff, new THREE.Vector3(0, 0, -100), 1.5),  // 后方3倍
        left: createDirectionalLight(0xffffff, new THREE.Vector3(-100, 0, 0), 1.5),  // 左侧3倍
        right: createDirectionalLight(0xffffff, new THREE.Vector3(100, 0, 0), 1.5)  // 右侧3倍
      };


      // 将六个光源加入场景
      Object.values(directionalLights.value).forEach(light => scene.add(light));

      // 设置相机位置，使其居中
      camera.position.set(0, 0, 200); // 将相机放在 Z 轴正方向，距离模型 200 单位
      camera.lookAt(0, 0, 0); // 让相机看向场景中心

      // 初始化 OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;
      controls.minDistance = 1;     // 允许更近距离观察
      controls.maxDistance = 5000;  // 允许更远距离
      controls.enableRotate = true;
      controls.rotateSpeed = 1.0;
      controls.minPolarAngle = -Infinity;
      controls.maxPolarAngle = Infinity;
      controls.minAzimuthAngle = -Infinity;
      controls.maxAzimuthAngle = Infinity;


      // 设置 OrbitControls 的目标点为场景中心
      controls.target.set(0, 0, 0);

      raycaster = new THREE.Raycaster();
      mouse = new THREE.Vector2();

      // 初始化 CSS2DRenderer
      css2Renderer = new CSS2DRenderer();
      css2Renderer.setSize(window.innerWidth, window.innerHeight);
      css2Renderer.domElement.style.position = 'absolute';
      css2Renderer.domElement.style.top = '0';
      css2Renderer.domElement.style.pointerEvents = 'none';
      sceneContainer.value.appendChild(css2Renderer.domElement);

      // 添加三维坐标系
      axesHelper = new THREE.AxesHelper(100); // 调整坐标轴大小为 100
      axesHelper.visible = false; // 默认隐藏
      scene.add(axesHelper);

      // 创建坐标系原点（一个小球）
      const originGeometry = new THREE.SphereGeometry(2, 16, 16);
      const originMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
      originPoint = new THREE.Mesh(originGeometry, originMaterial);
      originPoint.position.set(0, 0, 0); // 初始位置在场景中心
      originPoint.visible = false; // 默认隐藏
      scene.add(originPoint);

      // 添加拖动控制
      dragControls = new DragControls([originPoint], camera, renderer.domElement);
      dragControls.addEventListener('dragStart', () => {
        controls.enabled = false; // 拖动时禁用 OrbitControls
      });
      dragControls.addEventListener('dragEnd', () => {
        controls.enabled = true; // 拖动结束后启用 OrbitControls
      });
      dragControls.addEventListener('drag', () => {
        if (currentDirection.value === "Free") {
          updateClipPlane(originPoint.position); // 拖动时更新剖切平面
        }
      });

      const createGradientBackground = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 增大画布尺寸（避免拉伸模糊）
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        // 调整颜色梯度（增强蓝色可见性）
        const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
        gradient.addColorStop(0, '#B0E0E6'); // PowderBlue（更明显的蓝色）
        gradient.addColorStop(0.7, '#F0F8FF'); // AliceBlue
        gradient.addColorStop(1, '#FFFFFF');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        return new THREE.CanvasTexture(canvas);
      };

      // 设置场景背景
      scene.background = createGradientBackground();

      // 响应窗口尺寸变化
      window.addEventListener('resize', () => {
        scene.background = createGradientBackground();
        scene.background.needsUpdate = true;
      });


      animate();
    };

    // 动画循环
    const animate = () => {
      requestAnimationFrame(animate);

      // 新增：计算缩放比例
      if (initialCameraDistance > 0) {
        const currentDistance = controls.getDistance();
        scalePercentage.value = Math.round((initialCameraDistance / currentDistance) * 100);
      }

      if (isAutoShowing.value) {
        // 自动旋转（Y轴）
        model.rotation.y -= 0.005;
      }
      controls.update();
      renderer.render(scene, camera);

      // 渲染 CSS2D 标签
      if (css2Renderer) {
        css2Renderer.render(scene, camera);
      }
    };

    // 鼠标移动事件
    const handleMouseMove = (event) => {
      // 添加空值检查
      if (!model || !model.children) return; // 新增检查

      // 获取渲染器的边界框
      const rect = renderer.domElement.getBoundingClientRect();

      // 计算鼠标在渲染器中的位置（考虑画布偏移）
      const mouseX = event.clientX - rect.left;
      const mouseY = event.clientY - rect.top;

      // 转换为归一化设备坐标（NDC）
      mouse.x = (mouseX / rect.width) * 2 - 1;
      mouse.y = - (mouseY / rect.height) * 2 + 1;

      // 添加try-catch块
      try {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(model.children, true);

        if (isMeasuring.value && measurePoints.value.length === 1) {
          if (intersects.length > 0) {
            const point = intersects[0].point;

            if (tempLine) {
              scene.remove(tempLine);
            }

            const geometry = new THREE.BufferGeometry().setFromPoints([measurePoints.value[0], point]);
            const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
            tempLine = new THREE.Line(geometry, material);
            scene.add(tempLine);
          }
        }

        if (isClipping.value && currentDirection.value === "XYZ") {
          const point = intersects.length > 0 ? intersects[0].point : null;
          if (point) {
            clipPosition.value = point.dot(clipPlane.normal);
            updateClipPlane();
          }
        }
      } catch (error) {
        console.warn("Mouse move error:", error);
      }
    };

    // 鼠标点击事件
    let tempLine = null; // 临时辅助线


    // 鼠标点击事件
    const handleClick = (event) => {
      // 判断是否是鼠标右键点击
      if (event.button === 2) { // 2 表示鼠标右键
        if (isMeasuring.value) {
          resetMeasurement(); // 取消测量
        }
        return;
      }

      // 阻止事件冒泡，避免点击侧边栏按钮时触发场景中的点击事件
      if (event.target.tagName.toLowerCase() === 'button' || event.target.tagName.toLowerCase() === 'input') {
        return;
      }

      // 判断是否点击了固定部件信息表格
      const fixedInfoDiv = document.querySelector('.fixed-info'); // 获取固定部件信息的表格元素
      if (fixedInfoDiv && fixedInfoDiv.contains(event.target)) {
        // 如果点击的是表格内的内容，不隐藏表格
        return;
      }

      // 左键点击逻辑
      if (isMeasuring.value) {
        // 测量模式下的逻辑
        // 获取渲染器的边界框
        const rect = renderer.domElement.getBoundingClientRect();

        // 计算鼠标在渲染器中的位置
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // 将鼠标坐标转换为归一化设备坐标（NDC）
        mouse.x = (mouseX / rect.width) * 2 - 1;
        mouse.y = -(mouseY / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(model.children, true);

        if (intersects.length > 0) {
          const point = intersects[0].point; // 获取点击的 3D 点

          if (measurePoints.value.length === 2) {
            // 如果测量已经完成，重置测量并开始新的测量
            resetMeasurement();
            measurePoints.value.push(point); // 添加第一个点
            drawMeasureMarker(point); // 绘制第一个点的标记
          } else if (measurePoints.value.length === 1) {
            // 如果已经有一个点，添加第二个点并完成测量
            measurePoints.value.push(point);
            drawMeasureMarker(point); // 绘制第二个点的标记
            drawMeasureLine(measurePoints.value[0], measurePoints.value[1]); // 绘制辅助线

            // 计算距离并显示标签
            const distance = calculateDistance(measurePoints.value[0], measurePoints.value[1]);
            measureResult.value = distance;
            showMeasureLabel(measurePoints.value[1], distance);

            // 重置临时辅助线
            if (tempLine) {
              scene.remove(tempLine);
              tempLine = null;
            }
          } else if (measurePoints.value.length === 0) {
            // 如果没有点，添加第一个点
            measurePoints.value.push(point);
            drawMeasureMarker(point); // 绘制第一个点的标记
          }
        } else {
          // 点击空白区域，取消测量
          resetMeasurement();
        }
      } else {
        // 非测量模式下的逻辑
        const rect = renderer.domElement.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;

        // 将鼠标坐标转换为归一化设备坐标（NDC）
        mouse.x = (mouseX / rect.width) * 2 - 1;
        mouse.y = -(mouseY / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(model.children, true);

        if (intersects.length > 0) {
          const object = intersects[0].object;

          // 判断是否点击了同一个部件
          if (previousClickedObject === object) {
            // 如果点击了同一个部件，取消高亮和固定信息显示
            object.material.emissive.set(0x000000);
            selectedPart.value = null;
            previousClickedObject = null;
          } else {
            // 如果点击了不同的部件，更新高亮和固定信息显示
            object.material.emissive.set(0xff0000);

            if (previousClickedObject && previousClickedObject !== object) {
              previousClickedObject.material.emissive.set(0x000000);
            }

            selectedPart.value = {
              name: object.name,
              type: object.type,
              dimensions: getDimensions(object),
              material: object.material,
            };

            previousClickedObject = object;
          }
        } else {
          // 点击空白区域时，取消高亮和固定信息显示
          if (previousClickedObject) {
            previousClickedObject.material.emissive.set(0x000000);
          }
          selectedPart.value = null;
          previousClickedObject = null;
        }
      }
    };

    // 自动展示切换方法
    const toggleAutoShow = () => {
      isAutoShowing.value = !isAutoShowing.value;

      if (isAutoShowing.value) {
        // 开始展示时保存原始状态
        originalScale.value.copy(model.scale);
        originalPosition.value.copy(model.position);
        originalRotation.value.copy(model.rotation);

        // 缩小模型到80%
        model.scale.set(0.8, 0.8, 0.8);

        // 居中模型
        const box = new THREE.Box3().setFromObject(model);
        const center = new THREE.Vector3();
        box.getCenter(center);
        model.position.sub(center);

        camera.position.set(0, 0, model.scale.x * 200); // 根据缩放比例动态调整相机距离
        controls.target.copy(center); // 确保控制器目标点正确
        controls.update();
      } else {
        // 停止时恢复原始状态
        model.scale.copy(originalScale.value);
        model.position.copy(originalPosition.value);
        model.rotation.copy(originalRotation.value);
      }

      // 禁用用户控制
      controls.enabled = !isAutoShowing.value;
    };

    // 切换 Wireframe 显示
    const toggleWireframe = () => {
      showWireframe.value = !showWireframe.value;
      if (model) {
        model.traverse((child) => {
          if (child.isMesh) {
            child.material.wireframe = showWireframe.value;
          }
        });
      }
    };

    // 切换 Grid 显示
    const toggleGrid = () => {
      showGrid.value = !showGrid.value;

      // 清理旧网格、标记和标签
      scene.children.slice().forEach(child => {
        if (child.isGridHelper || child.isMarker || child.isLabel || child.isAxisLine || child.isBoundingCube) {
          scene.remove(child);
          child.material?.dispose();
          child.geometry?.dispose();
          if (child.element) child.element.remove();
        }
      });
      partGrids.value.clear();

      if (showGrid.value && model) {
        // 获取模型包围盒
        const box = new THREE.Box3().setFromObject(model);
        const modelMin = box.min.clone();
        const modelMax = box.max.clone();
        const size = box.getSize(new THREE.Vector3());

        // 新增：生成包围立方体的8个顶点
        const vertices = [
          new THREE.Vector3(modelMin.x, modelMin.y, modelMin.z), // 0
          new THREE.Vector3(modelMax.x, modelMin.y, modelMin.z), // 1
          new THREE.Vector3(modelMax.x, modelMax.y, modelMin.z), // 2
          new THREE.Vector3(modelMin.x, modelMax.y, modelMin.z), // 3
          new THREE.Vector3(modelMin.x, modelMin.y, modelMax.z), // 4
          new THREE.Vector3(modelMax.x, modelMin.y, modelMax.z), // 5
          new THREE.Vector3(modelMax.x, modelMax.y, modelMax.z), // 6
          new THREE.Vector3(modelMin.x, modelMax.y, modelMax.z)  // 7
        ];

        // 新增：定义立方体12条边
        const edges = [
          [0, 1], [1, 2], [2, 3], [3, 0], // 底面
          [4, 5], [5, 6], [6, 7], [7, 4], // 顶面
          [0, 4], [1, 5], [2, 6], [3, 7]  // 垂直边
        ];

        // 新增：创建虚线材质
        const dashMaterial = new THREE.LineDashedMaterial({
          color: 0x00FFFF,    // 青色虚线
          dashSize: 1,       // 虚线片段长度
          gapSize: 0.5,      // 间隔长度
          linewidth: 1
        });

        // 生成所有虚线边
        edges.forEach(edge => {
          const points = [
            vertices[edge[0]].clone(),
            vertices[edge[1]].clone()
          ];

          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const line = new THREE.Line(geometry, dashMaterial);
          line.computeLineDistances(); // 关键：计算虚线间隔
          line.isBoundingCube = true;  // 添加标识
          scene.add(line);
        });

        // 创建坐标系标记（核心逻辑）
        const createAxisMarkers = (axis) => {
          const xValid = Math.ceil(size.x / 25) * 25;
          const zValid = Math.ceil(size.z / 25) * 25;
          const yValid = Math.ceil(size.y / 25) * 25;
          // 计算有效网格长度
          const validLength = Math.max(xValid, yValid, zValid); // 确保是25的整数倍

          // 修正后的末端位置计算
          const axisMaxPoints = {
            x: new THREE.Vector3(modelMax.x, modelMin.y, modelMin.z),
            y: new THREE.Vector3(modelMin.x, modelMax.y, modelMin.z),
            z: new THREE.Vector3(modelMin.x, modelMin.y, modelMax.z)
          };

          // 创建对应颜色的末端标记
          const maxMarker = new THREE.Mesh(
            new THREE.SphereGeometry(1.2),
            new THREE.MeshBasicMaterial({
              color: {
                x: 0xFF0000, // 红色X轴
                y: 0x00FF00, // 绿色Y轴
                z: 0x0000FF  // 蓝色Z轴
              }[axis]
            })
          );
          maxMarker.position.copy(axisMaxPoints[axis]);
          maxMarker.isMarker = true;
          scene.add(maxMarker);

          // 创建刻度标记
          // const axisLength = size[axis];
          const step = 25; // 每25单位一个刻度
          // const totalSteps = Math.ceil(axisLength / step);
          const totalSteps = validLength / 25; // 保证是整数

          for (let i = 0; i <= totalSteps; i++) {
            const pos = modelMin[axis] + i * step;
            const isMajor = i % 2 === 0; // 每50单位一个粗标记

            // 创建标记点
            const marker = new THREE.Mesh(
              new THREE.SphereGeometry(isMajor ? 0.6 : 0.4),
              new THREE.MeshBasicMaterial({
                color: isMajor ? 0x000000 : 0xFFFF00
              })
            );

            // 设置标记位置（根据当前轴）
            const position = modelMin.clone();
            position[axis] = pos;

            // 偏移到三个轴的交线位置
            if (axis === 'x') {
              position.y = modelMin.y;
              position.z = modelMin.z;
            } else if (axis === 'y') {
              position.x = modelMin.x;
              position.z = modelMin.z;
            } else {
              position.x = modelMin.x;
              position.y = modelMin.y;
            }

            marker.position.copy(position);
            marker.isMarker = true;
            scene.add(marker);

            // 创建文字标签（50单位倍数时显示）
            if (i % 2 === 0) {
              const label = new CSS2DObject(createLabelElement(i * step));
              label.position.copy(position);
              label.isLabel = true;
              scene.add(label);
            }
          }
        };

        // 创建三个轴的标记系统
        createAxisMarkers('x');
        createAxisMarkers('y');
        createAxisMarkers('z');

        // 创建基础灰色网格（保持原有参数）
        // const edgeLength = Math.max(size.x, size.y, size.z) * 1.2;
        // const divisions = Math.ceil(edgeLength / 25);

        // XZ平面网格（底面）灰色
        const xValid = Math.ceil(size.x / 25) * 25;
        const zValid = Math.ceil(size.z / 25) * 25;
        const yValid = Math.ceil(size.y / 25) * 25;

        const xzEdgeLength = Math.max(xValid, yValid, zValid);
        const xzGrid = new THREE.GridHelper(xzEdgeLength, xzEdgeLength / 25, 0x666666, 0x444444); xzGrid.isGridHelper = true; // 新增这行
        xzGrid.position.set(
          modelMin.x + xzEdgeLength / 2,
          modelMin.y - 0.1,
          modelMin.z + xzEdgeLength / 2
        );
        scene.add(xzGrid);

        // XY平面网格（后墙面）灰色
        const xyEdgeLength = Math.max(xValid, yValid, zValid);
        const xyGrid = new THREE.GridHelper(xyEdgeLength, xyEdgeLength / 25, 0x666666, 0x444444);
        xyGrid.rotation.x = Math.PI / 2;
        xyGrid.isGridHelper = true; // 新增这行
        xyGrid.position.set(
          modelMin.x + xyEdgeLength / 2,
          modelMin.y + xyEdgeLength / 2,
          modelMin.z - 0.1
        );
        scene.add(xyGrid);

        // YZ平面网格（左侧墙）灰色
        const yzEdgeLength = Math.max(xValid, yValid, zValid);
        const yzGrid = new THREE.GridHelper(yzEdgeLength, yzEdgeLength / 25, 0x666666, 0x444444);
        yzGrid.isGridHelper = true; // 新增这行
        yzGrid.rotation.z = Math.PI / 2;
        yzGrid.position.set(
          modelMin.x - 0.1,
          modelMin.y + yzEdgeLength / 2,
          modelMin.z + yzEdgeLength / 2
        );
        scene.add(yzGrid);

        // 新增：创建彩色坐标轴线------------------------------------------
        const createAxisLine = (start, end, color) => {
          const points = [
            new THREE.Vector3().copy(start),
            new THREE.Vector3().copy(end)
          ];
          const geometry = new THREE.BufferGeometry().setFromPoints(points);
          const material = new THREE.LineBasicMaterial({
            color,
            linewidth: 3
          });
          const line = new THREE.Line(geometry, material);
          line.isAxisLine = true; // 添加标识

          // 创建箭头（使用圆锥体）
          const arrowHeight = 5;  // 箭头高度
          const arrowRadius = 2; // 箭头底部半径
          const arrowGeometry = new THREE.ConeGeometry(arrowRadius, arrowHeight, 8);
          const arrowMaterial = new THREE.MeshBasicMaterial({ color });
          const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);

          // 计算箭头方向和位置
          const direction = new THREE.Vector3().subVectors(end, start).normalize();
          const arrowPosition = end.clone().addScaledVector(direction, -arrowHeight / 2);

          // 设置箭头旋转（四元数方式更精确）
          const quaternion = new THREE.Quaternion();
          quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
          arrow.applyQuaternion(quaternion);

          arrow.position.copy(arrowPosition);

          // 将箭头作为轴线的子对象
          line.add(arrow);
          return line;
        };

        // X轴（红色）：沿XZ平面中心线
        scene.add(createAxisLine(
          new THREE.Vector3(modelMin.x, modelMin.y, modelMin.z),
          new THREE.Vector3(xzEdgeLength, modelMin.y, modelMin.z),
          0xFF0000
        ));

        // Y轴（绿色）：沿XY平面中心线
        scene.add(createAxisLine(
          new THREE.Vector3(modelMin.x, modelMin.y, modelMin.z),
          new THREE.Vector3(modelMin.x, xzEdgeLength, modelMin.z),
          0x00FF00
        ));

        // Z轴（蓝色）：沿YZ平面中心线
        scene.add(createAxisLine(
          new THREE.Vector3(modelMin.x, modelMin.y, modelMin.z),
          new THREE.Vector3(modelMin.x, modelMin.y, xzEdgeLength),
          0x0000FF
        ));

        // 新增：交汇点标记（直径2单位）
        const originMarker = new THREE.Mesh(
          new THREE.SphereGeometry(1, 16),
          new THREE.MeshBasicMaterial({ color: 0x000000 })
        );
        originMarker.position.set(modelMin.x, modelMin.y, modelMin.z);
        scene.add(originMarker);

        // 存储对象
        partGrids.value.set('xz', xzGrid);
        partGrids.value.set('xy', xyGrid);
        partGrids.value.set('yz', yzGrid);
      }
    };

    // 创建标签DOM元素的辅助函数
    const createLabelElement = (text) => {
      const div = document.createElement('div');
      div.className = 'axis-label';
      div.textContent = text;
      div.style.color = 'white';
      div.style.fontSize = '12px';
      div.style.pointerEvents = 'none';
      return div;
    };

    // 切换爆炸图
    // 在外部作用域中定义缓存和初始化状态
    // const originalPositions = new Map();
    const directionCache = new Map();
    let isCacheInitialized = false;

    const toggleExplodedView = () => {
      isExploded.value = !isExploded.value;

      // 预处理函数（仅在首次调用时执行）
      const preprocess = (object) => {
        if (object.isMesh || object.isGroup) {
          // 存储初始位置（仅在未缓存时）
          if (!originalPositions.has(object)) {
            originalPositions.set(object, object.position.clone());
          }

          // 修改点：反转Y轴方向计算
          if (!directionCache.has(object)) {
            const bbox = new THREE.Box3().setFromObject(object);
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const direction = new THREE.Vector3()
              .subVectors(center, model.position)
              .normalize()
              .multiply(new THREE.Vector3(1, 1, 1)); // 新增Y轴反向
            directionCache.set(object, direction);
          }
        }
        object.children?.forEach(preprocess);
      };

      // 仅在首次触发时预处理整个模型
      if (!isCacheInitialized) {
        preprocess(model);
        isCacheInitialized = true;
      }

      // 执行爆炸/恢复操作
      const traverse = (object) => {
        if (object.isMesh || object.isGroup) {
          const origin = originalPositions.get(object);
          const direction = directionCache.get(object);

          if (!origin || !direction) {
            console.warn('Missing cache for:', object);
            return;
          }

          // 根据状态切换位置
          if (isExploded.value) {
            object.position.copy(origin)
              .add(direction.clone().multiplyScalar(60));
          } else {
            object.position.copy(origin);
          }

          // 更新矩阵确保渲染正确
          object.updateMatrixWorld(true);
        }
        object.children?.forEach(traverse);
      };

      traverse(model);
    };

    // 切换剖切功能
    const toggleClipping = () => {
      isClipping.value = !isClipping.value;

      if (isClipping.value) {
        // 初始化剖切平面
        if (currentDirection.value === "Free") {
          originPoint.visible = true; // 显示坐标系原点
          axesHelper.visible = true; // 显示坐标轴
          if (clipSlider.value) {
            clipSlider.value.style.display = 'none'; // 隐藏 range 滑动条
          }
          updateClipPlane(originPoint.position); // 自由剖切模式
        } else {
          axesHelper.visible = true; // 显示坐标轴
          if (clipSlider.value) {
            clipSlider.value.style.display = 'block'; // 显示 range 滑动条
          }
          updateClipPlane(); // 固定方向剖切模式
        }
      } else {
        // 关闭剖切
        renderer.clippingPlanes = [];
        originPoint.visible = false; // 隐藏坐标系原点
        axesHelper.visible = false; // 隐藏坐标轴
        if (clipSlider.value) {
          clipSlider.value.style.display = 'none'; // 隐藏 range 滑动条
        }
      }
    };

    // 更新剖切平面
    const updateClipPlane = (originPosition = null) => {
      if (!isClipping.value) return;

      let normal;
      if (currentDirection.value === "Free" && originPosition) {
        // 自由剖切模式：法向量指向模型中心
        const modelCenter = new THREE.Vector3(0, 0, 0);
        normal = new THREE.Vector3().subVectors(modelCenter, originPosition).normalize(); // 方向调整为指向中心
        axesHelper.position.copy(originPosition);
      } else {
        // 固定方向剖切模式：法向量调整为负方向
        switch (currentDirection.value) {
          case "X":
            normal = new THREE.Vector3(-1, 0, 0); // 改为负方向
            break;
          case "Y":
            normal = new THREE.Vector3(0, -1, 0); // 改为负方向
            break;
          case "Z":
            normal = new THREE.Vector3(0, 0, -1);
            break;
          default:
            normal = new THREE.Vector3(-1, 0, 0);
        }
        axesHelper.position.set(0, 0, 0);
      }

      // 创建剖切平面（固定方向时直接使用 clipPosition.value）
      const planeConstant = originPosition ? -originPosition.dot(normal) : clipPosition.value;
      clipPlane = new THREE.Plane(normal, planeConstant);
      renderer.clippingPlanes = [clipPlane];
    };

    // 切换剖切方向
    const switchClippingDirection = () => {
      const directions = ["X", "Y", "Z", "Free"];
      const currentIndex = directions.indexOf(currentDirection.value);
      currentDirection.value = directions[(currentIndex + 1) % directions.length];

      if (currentDirection.value === "Free") {
        // 进入自由剖切模式
        originPoint.visible = true; // 显示坐标系原点
        axesHelper.visible = true; // 显示坐标轴
        if (clipSlider.value) {
          clipSlider.value.style.display = 'none'; // 隐藏 range 滑动条
        }
        updateClipPlane(originPoint.position); // 初始化剖切平面
      } else {
        // 进入固定方向剖切模式
        originPoint.visible = false; // 隐藏坐标系原点
        axesHelper.visible = true; // 显示坐标轴
        if (clipSlider.value) {
          clipSlider.value.style.display = 'block'; // 显示 range 滑动条
        }
        updateClipPlane(); // 使用固定方向剖切
      }
    };

    watch(() => fileStore.files, (newFiles) => {
      if (newFiles.length) loadModel(newFiles)
    })

    watch(currentDirection, (newDir) => {
      if (newDir !== 'Free') {
        // 设置初始位置在模型中心
        const range = axisRanges.value[newDir];
        clipPosition.value = (range.min + range.max) / 2;
      }
    });
    // 监听剖切位置的变化
    watch(clipPosition, (newValue) => {
      if (clipPlane) {
        clipPlane.constant = newValue;
      }
    });

    // 监听亮度变化
    watch(brightness, (newValue) => {
      // 更新原有光源
      if (ambientLight.value) {
        ambientLight.value.intensity = newValue * 10;
      }
      if (directionalLight.value) {
        directionalLight.value.intensity = newValue * 9;
      }

      // 更新六个方向光源（单独处理下方光源）
      Object.entries(directionalLights.value).forEach(([key, light]) => {
        if (light) {
          let intensity = newValue * 1.5;
          if (key === 'bottom') {
            intensity = newValue * 3; // 下方单独使用8倍系数
            light.color.setHex(0xffffff); // 设置暖黄色
          }
          light.intensity = intensity;
        }
      });
    });

    // 键盘控制模型的翻转
    const handleKeyDown = (event) => {
      if (!model) return;

      const rotationSpeed = 0.1; // 旋转速度

      switch (event.key) {
        case "ArrowUp": // 上键：向上翻转
          model.rotation.x -= rotationSpeed;
          break;
        case "ArrowDown": // 下键：向下翻转
          model.rotation.x += rotationSpeed;
          break;
        case "ArrowLeft": // 左键：向左翻转
          model.rotation.y -= rotationSpeed;
          break;
        case "ArrowRight": // 右键：向右翻转
          model.rotation.y += rotationSpeed;
          break;
        default:
          break;
      }
    };

    onMounted(() => {
      initScene();
      if (fileStore.files.length) loadModel(fileStore.files)
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("click", handleClick);  // 添加点击事件监听
      window.addEventListener("mousedown", (event) => {
        if (event.button === 2) { // 2 表示鼠标右键
          handleClick(event); // 处理右键点击
        }
      });
      window.addEventListener('resize', () => {
        // 新增代码 ↓↓↓
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3()).length();
        camera.position.z = size * 2;  // 动态调整相机距离
        controls.update();
      });
    });

    // 组件卸载时移除事件监听
    onUnmounted(() => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("mousedown", (event) => {
        if (event.button === 2) {
          handleClick(event);
        }
      });
    });

    const sideBarStyle = {
      position: 'fixed',
      top: '50%',  // 垂直居中
      left: '20px',  // 左侧定位
      transform: 'translateY(-50%)',  // 精确居中
      width: '180px',
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
      height: '40px',
      zIndex: 1001,
      flexDirection: 'column',  // 垂直排列
      justifyContent: 'flex-end', // 使滑动条居于底部
    };

    // 亮度调节滑动条样式
    const brightnessSliderStyle = {
      width: '100%',
    };

    const loadingStyle = {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 1002,
    };



    // 进入/退出测量模式
    const measure = () => {
      // console.log('isMeasuring:', isMeasuring.value);
      isMeasuring.value = !isMeasuring.value;
      // console.log('isMeasuring:', isMeasuring.value);

      if (!isMeasuring.value) {
        resetMeasurement(); // 退出测量模式时重置
      } else {
        measurePoints.value = []; // 进入测量模式时清空测量点
        measureResult.value = null;
      }
    };

    // 重置测量
    const resetMeasurement = () => {
      if (measureLine) {
        scene.remove(measureLine);
        measureLine = null;
      }
      if (tempLine) {
        scene.remove(tempLine);
        tempLine = null;
      }
      if (measureLabel) {
        scene.remove(measureLabel);
        measureLabel = null;
      }
      measureSpheres.forEach(sphere => scene.remove(sphere));
      measureSpheres = [];
      measurePoints.value = [];
      measureResult.value = null;
    };

    // 计算两点之间的距离
    const calculateDistance = (point1, point2) => {
      return {
        total: point1.distanceTo(point2).toFixed(2),
        dx: Math.abs(point2.x - point1.x).toFixed(2),
        dy: Math.abs(point2.y - point1.y).toFixed(2),
        dz: Math.abs(point2.z - point1.z).toFixed(2)
      };
    };

    let measureSpheres = []; // 存储两个端点的正方体标记

    // 绘制辅助线
    const drawMeasureLine = (point1, point2) => {
      // 移除旧的辅助线和标记
      if (measureLine) {
        scene.remove(measureLine);
      }
      measureSpheres.forEach(sphere => scene.remove(sphere));
      measureSpheres = [];

      // 绘制辅助线
      const geometry = new THREE.BufferGeometry().setFromPoints([point1, point2]);
      const material = new THREE.LineBasicMaterial({
        color: 0xff0000,  // 红色线条
        linewidth: 40       // 设置线条宽度为 5
      });
      measureLine = new THREE.Line(geometry, material);
      scene.add(measureLine);

      // 在端点添加正方体标记
      const sphereGeometry = new THREE.SphereGeometry(1, 16, 16); // 小正方体
      const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 }); // 绿色标记
      const sphere1 = new THREE.Mesh(sphereGeometry, sphereMaterial);
      const sphere2 = new THREE.Mesh(sphereGeometry, sphereMaterial);
      sphere1.position.copy(point1);
      sphere2.position.copy(point2);
      scene.add(sphere1);
      scene.add(sphere2);
      measureSpheres.push(sphere1, sphere2);
    };

    const drawMeasureMarker = (position) => {
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // 小方块，大小为 0.5x0.5x0.5
      const material = new THREE.MeshBasicMaterial({ color: 0xffffff }); // 白色
      const marker = new THREE.Mesh(geometry, material);
      marker.position.copy(position);
      scene.add(marker);
      measureSpheres.push(marker); // 存储标记
    };

    // 显示测量结果标签
    const showMeasureLabel = (position, result) => {
      // 移除旧标签
      if (measureLabel) {
        scene.remove(measureLabel);
        measureLabel.element.remove();
      }

      // 创建表格DOM元素
      const labelDiv = document.createElement('div');
      labelDiv.className = 'measure-label';
      labelDiv.style.background = 'rgba(40, 40, 40, 0.9)';
      labelDiv.style.padding = '8px';
      labelDiv.style.borderRadius = '4px';
      labelDiv.style.color = 'white';
      labelDiv.innerHTML = `
    <table style="border-collapse: collapse;">
      <tr>
        <td colspan="2" style="text-align: center; padding-bottom: 4px;">测量结果</td>
      </tr>
      <tr>
        <td style="padding-right: 8px;">总距离:</td>
        <td>${result.total} m</td>
      </tr>
      <tr>
        <td style="color: #ff4444;">X:</td>
        <td>${result.dx} m</td>
      </tr>
      <tr>
        <td style="color: #44ff44;">Y:</td>
        <td>${result.dy} m</td>
      </tr>
      <tr>
        <td style="color: #4444ff;">Z:</td>
        <td>${result.dz} m</td>
      </tr>
    </table>
  `;

      // 创建CSS2D对象
      measureLabel = new CSS2DObject(labelDiv);
      measureLabel.position.copy(position);
      scene.add(measureLabel);
    };

    return {
      sceneContainer,
      isMeasuring,
      selectedPart,
      mouseX,
      mouseY,
      isExploded,
      isClipping,
      showGrid,
      showWireframe,
      clipPosition,
      toggleAutoShow,
      toggleExplodedView,
      toggleClipping,
      toggleGrid,
      toggleWireframe,
      sideBarStyle,
      buttonStyle,
      sliderStyle,
      switchClippingDirection,
      measure,
      brightness,
      brightnessSliderStyle,
      isLoading,
      loadingProgress,
      loadingStyle,
      currentDirection,
      axisRanges,
      goToHome,
      isAutoShowing,
      scalePercentage,
      scaleHover,
      resetView
    };
  },
};
</script>

<style scoped>
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
  background: linear-gradient(135deg, #5a67f2, #5e3ddb);
  /* hover 时背景颜色改变 */
  transform: scale(1.05);
  /* 放大效果 */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  /* hover 时更强的阴影 */
}

/* 滑块样式 */
input[type="range"] {
  appearance: none;
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

.measure-label {
  font-family: Arial, sans-serif;
  font-size: 12px;
  backdrop-filter: blur(2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.measure-label table td {
  padding: 2px 4px;
  white-space: nowrap;
}

.measure-label tr:first-child td {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 4px;
}

.loading-spinner {
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top: 4px solid #ffffff;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.loading-progress {
  margin-top: 10px;
  color: white;
  font-size: 16px;
}
</style>