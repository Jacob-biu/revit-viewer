<template>
  <div ref="sceneContainer" style="width: 100%; height: 100%; position: relative;">
    <!-- 加载动画 -->
    <div v-if="isLoading" :style="loadingStyle">
      <div class="loading-spinner"></div>
      <div class="loading-progress">{{ loadingProgress }}%</div>
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
              font-size: 14px;
            ">Property</th>
            <th style="
              text-align: left;
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.2);
              min-width: 80px;  
              font-size: 14px;
            ">Value</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td style="
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              white-space: nowrap;  
              font-size: 13px;
            ">Name</td>
            <td style="
              padding: 6px 8px;
              border-bottom: 1px solid rgba(255,255,255,0.1);
              word-break: break-word;  
              max-width: 200px;  
              font-size: 13px;
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
            <td style="padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); word-break: break-word;">{{
              selectedPart.material.color.getStyle() }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import { ref, watch, onMounted, onUnmounted } from "vue";
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
    const brightness = ref(1.5); // 亮度值，范围 0 到 2

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

      // 计算模型的包围盒，并调整模型位置使其居中
      const box = new THREE.Box3().setFromObject(model);
      // 更新轴范围（世界坐标系）
      axisRanges.value = {
        X: { min: box.min.x, max: box.max.x },
        Y: { min: box.min.y, max: box.max.y },
        Z: { min: box.min.z, max: box.max.z }
      };
      const center = new THREE.Vector3();
      box.getCenter(center);
      model.position.sub(center); // 将模型移动到场景中心

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

      traverseAndStorePositions(model);
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
      directionalLight.value = new THREE.DirectionalLight(0xffffff, brightness.value * 1.5);
      directionalLight.value.position.set(50, 50, 50);
      scene.add(directionalLight.value);

      // 设置相机位置，使其居中
      camera.position.set(0, 0, 200); // 将相机放在 Z 轴正方向，距离模型 200 单位
      camera.lookAt(0, 0, 0); // 让相机看向场景中心

      // 初始化 OrbitControls
      controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.25;
      controls.screenSpacePanning = false;
      controls.minDistance = 10;
      controls.maxDistance = 1000;
      controls.enableRotate = true;
      controls.rotateSpeed = 1.0;
      controls.minPolarAngle = 0;
      controls.maxPolarAngle = Math.PI;
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

      // 在 initScene() 函数中添加
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

      scene.children.slice().forEach(child => { // 使用副本遍历
        if (child.isGridHelper) { // 添加网格标识
          scene.remove(child);
          // 移除材质和几何体（安全操作）
          if (child.material) child.material.dispose();
          if (child.geometry) child.geometry.dispose();
        }
      });
      partGrids.value.clear();

      // 空间分区配置
      const gridConfig = {
        cellSize: 50,         // 分区单元尺寸
        clusterThreshold: 3,  // 集群最小部件数
        maxObjectSize: 20     // 单独生成网格的最大尺寸
      };

      // 空间分区存储
      const spatialGrid = new Map();

      if (showGrid.value) {
        // 第一阶段：空间分区
        model.traverse(obj => {
          if (obj.isMesh || obj.isGroup) {
            const bbox = new THREE.Box3().setFromObject(obj);
            const size = new THREE.Vector3();
            bbox.getSize(size);

            // 判断是否属于大型物体
            if (size.length() > gridConfig.maxObjectSize) {
              createIndividualGrid(obj, bbox);
              return;
            }

            // 计算所属网格单元
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const cellX = Math.floor(center.x / gridConfig.cellSize);
            const cellZ = Math.floor(center.z / gridConfig.cellSize);
            const cellKey = `${cellX},${cellZ}`;

            if (!spatialGrid.has(cellKey)) {
              spatialGrid.set(cellKey, {
                objects: [],
                bbox: new THREE.Box3()
              });
            }

            const cell = spatialGrid.get(cellKey);
            cell.objects.push(obj);
            cell.bbox.union(bbox);
          }
        });

        // 第二阶段：生成集群网格
        spatialGrid.forEach((cell) => {
          if (cell.objects.length >= gridConfig.clusterThreshold) {
            createClusterGrid(cell.bbox);
          } else {
            cell.objects.forEach(obj => createIndividualGrid(obj));
          }
        });
      }
    };

    // 创建独立部件网格
    const createIndividualGrid = (obj, bbox = new THREE.Box3().setFromObject(obj)) => {
      const size = bbox.getSize(new THREE.Vector3());
      const grid = new THREE.GridHelper(
        Math.max(size.x, size.z) * 1.2,
        Math.ceil(Math.max(size.x, size.z) / 5),
        0x666666,
        0x444444
      );
      grid.isGridHelper = true; // 添加标识 <<< 新增这行


      const center = new THREE.Vector3();
      bbox.getCenter(center);
      grid.position.set(center.x, bbox.min.y - 0.1, center.z);

      partGrids.value.set(obj.uuid, grid);
      scene.add(grid);
    };

    // 创建集群网格
    const createClusterGrid = (clusterBbox) => {
      const size = clusterBbox.getSize(new THREE.Vector3());
      const grid = new THREE.GridHelper(
        Math.max(size.x, size.z) * 1.1,
        Math.ceil(Math.max(size.x, size.z) / 10),
        0x888888,  // 集群网格使用高亮颜色
        0x666666
      );
      grid.isGridHelper = true; // 添加标识 <<< 新增这行


      const center = new THREE.Vector3();
      clusterBbox.getCenter(center);
      grid.position.set(center.x, clusterBbox.min.y - 0.2, center.z);

      const gridId = THREE.MathUtils.generateUUID();
      partGrids.value.set(gridId, grid);
      scene.add(grid);
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

          // 计算方向向量（仅在未缓存时）
          if (!directionCache.has(object)) {
            const bbox = new THREE.Box3().setFromObject(object);
            const center = new THREE.Vector3();
            bbox.getCenter(center);
            const direction = new THREE.Vector3()
              .subVectors(center, model.position)
              .normalize();
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
              .add(direction.clone().multiplyScalar(50));
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
      if (ambientLight.value) {
        ambientLight.value.intensity = newValue * 10; // 调整环境光强度
      }
      if (directionalLight.value) {
        directionalLight.value.intensity = newValue * 1.5; // 调整平行光强度
      }
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