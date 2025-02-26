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

      <!--测量-->
      <button @click="measure" :style="buttonStyle">
        {{ isMeasuring ? '关闭测量' : '测量' }}
      </button>
    </div>

    <!-- 剖切滑块 -->
    <div v-if="isClipping" :style="sliderStyle">
      <input type="range" v-model="clipPosition" min="-100" max="100" step="1"
        style="width: 100%; margin-bottom:20px;" />
      <!-- 切换剖切方向按钮 -->
      <button @click="switchClippingDirection" :style="buttonStyle">
        切换剖切方向 ({{ currentDirection }})
      </button>
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
import { CSS2DObject, CSS2DRenderer } from "three/examples/jsm/renderers/CSS2DRenderer";
import { LoadingManager } from "three";

export default {
  name: "glTFViewer",
  props: {
    files: {
      type: Array,
      default: () => [],
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
    let css2Renderer; // 用于显示标签的渲染器


    const isMeasuring = ref(false); // 是否处于测量模式
    const measurePoints = ref([]); // 存储测量点
    const measureResult = ref(null); // 测量结果
    let measureLine = null; // 辅助线对象
    let measureLabel = null; // 测量结果标签


    // 加载 GLTF/GLB 文件

    // 加载 GLTF/GLB 文件
    // 加载 GLTF/GLB 文件
    const loadModel = async (files) => {
      // 将 files 数组转换为 fileMap
      const fileMap = new Map();
      files.forEach(file => {
        // 使用文件名称作为路径（确保路径是相对路径）
        fileMap.set(file.name, file);
      });
      // console.log('fileMap:', fileMap);

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
        // 将相对路径转换为绝对路径
        const normalizedURL = rootPath + decodeURI(url)
          .replace(/^.*\//, '');  // 去除协议和路径，只保留文件名
        // console.log('Resolving URL:', url, 'Normalized URL:', normalizedURL);

        if (fileMap.has(normalizedURL)) {
          const blob = fileMap.get(normalizedURL);
          const blobURL = URL.createObjectURL(blob);
          blobURLs.push(blobURL);
          console.log('Resolved URL to Blob:', blobURL);
          return blobURL;
        }

        console.warn('File not found in fileMap:', normalizedURL);
        return url; // 返回原始 URL
      });

      const loader = new GLTFLoader(manager); // 将 manager 传递给 GLTFLoader
      const fileURL = typeof rootFile === 'string' ? rootFile : URL.createObjectURL(rootFile);

      loader.load(
        fileURL,
        (gltf) => {
          setupModel(gltf.scene);
          blobURLs.forEach(URL.revokeObjectURL);
          if (typeof rootFile === 'object') URL.revokeObjectURL(fileURL);
        },
        undefined,
        (error) => {
          console.error("Error loading model:", error);
        }
      );
    };

    // 读取文件为 ArrayBuffer
    // const readFileAsArrayBuffer = (file) => {
    //   return new Promise((resolve, reject) => {
    //     const reader = new FileReader();
    //     reader.onload = () => resolve(reader.result);
    //     reader.onerror = () => reject(reader.error);
    //     reader.readAsArrayBuffer(file);
    //   });
    // };

    // 读取文件为文本
    // const readFileAsText = (file) => {
    //   return new Promise((resolve, reject) => {
    //     const reader = new FileReader();
    //     reader.onload = () => resolve(reader.result);
    //     reader.onerror = () => reject(reader.error);
    //     reader.readAsText(file);
    //   });
    // };

    // 设置模型
    const setupModel = (modelScene) => {
      if (model) {
        scene.remove(model);
      }
      model = modelScene;
      scene.add(model);
      model.traverse((child) => {
        if (child.isMesh) {
          child.name = child.name || `Unnamed ${child.uuid}`;
          originalPositions.set(child, child.position.clone());
        }
      });
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

      // 初始化 CSS2DRenderer
      css2Renderer = new CSS2DRenderer();
      css2Renderer.setSize(window.innerWidth, window.innerHeight);
      css2Renderer.domElement.style.position = 'absolute';
      css2Renderer.domElement.style.top = '0';
      css2Renderer.domElement.style.pointerEvents = 'none'; // 防止标签拦截鼠标事件
      sceneContainer.value.appendChild(css2Renderer.domElement);

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
      mouseX.value = event.clientX;
      mouseY.value = event.clientY;

      if (!model) return;

      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(model.children, true);

      if (isMeasuring.value && measurePoints.value.length === 1) {
        // 如果正在测量且已经点击了一个点，动态绘制临时辅助线
        if (intersects.length > 0) {
          const point = intersects[0].point;

          // 移除旧的临时辅助线
          if (tempLine) {
            scene.remove(tempLine);
          }

          // 绘制新的临时辅助线
          const geometry = new THREE.BufferGeometry().setFromPoints([measurePoints.value[0], point]);
          const material = new THREE.LineBasicMaterial({ color: 0xff0000 });
          tempLine = new THREE.Line(geometry, material);
          scene.add(tempLine);
        }
      }

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
    let tempLine = null; // 临时辅助线
    // let tempSphere = null; // 临时标记

    const handleClick = (event) => {
      if (isMeasuring.value) {
        // 获取点击的 3D 坐标
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
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
        // 非测量模式下，显示部件信息
        if (!hoveredPart.value) {
          selectedPart.value = null;
          if (previousClickedObject) {
            previousClickedObject.material.emissive.set(0x000000);
          }
          return;
        }

        const object = model.getObjectByName(hoveredPart.value.name);
        object.material.emissive.set(0xff0000);

        if (previousClickedObject && previousClickedObject !== object) {
          previousClickedObject.material.emissive.set(0x000000);
        }

        selectedPart.value = {
          ...hoveredPart.value,
          mouseX: mouseX.value,
          mouseY: mouseY.value,
        };

        previousClickedObject = object;
      }
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

    // 监听 files 的变化
    watch(() => props.files, (newFiles) => {
      if (newFiles.length) {
        loadModel(newFiles);
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
      height: '40px',
      zIndex: 1001,
      flexDirection: 'column',  // 垂直排列
      justifyContent: 'flex-end', // 使滑动条居于底部
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
      return point1.distanceTo(point2).toFixed(2); // 保留两位小数
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
    const showMeasureLabel = (position, text) => {
      // 移除旧的标签
      if (measureLabel) {
        scene.remove(measureLabel);
      }

      // 创建新的标签
      const labelDiv = document.createElement('div');
      labelDiv.className = 'measure-label';
      labelDiv.textContent = `${text} m`; // 显示距离和单位
      labelDiv.style.color = 'white';
      labelDiv.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
      labelDiv.style.padding = '5px';
      labelDiv.style.borderRadius = '3px';
      labelDiv.style.pointerEvents = 'none'; // 防止标签拦截鼠标事件

      measureLabel = new CSS2DObject(labelDiv);
      measureLabel.position.copy(position);
      scene.add(measureLabel);
    };

    return {
      sceneContainer,
      isMeasuring,
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
      switchClippingDirection,
      measure,
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
  background: linear-gradient(135deg, #5a67f2, #5e3ddb);
  /* hover 时背景颜色改变 */
  transform: scale(1.05);
  /* 放大效果 */
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
  /* hover 时更强的阴影 */
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

.measure-label {
  position: absolute;
  pointer-events: none;
  font-size: 14px;
  white-space: nowrap;
}
</style>