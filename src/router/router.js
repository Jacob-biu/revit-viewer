import { createRouter, createWebHistory } from 'vue-router'
import FileUpload from '../components/FileUpload.vue'
import glTFViewer from '../components/glTFViewer.vue'
import { useFileStore } from '../stores/fileStore'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { 
      path: '/', 
      component: FileUpload 
    },
    { 
      path: '/viewer',
      component: glTFViewer,
      beforeEnter: (to, from, next) => {
        const store = useFileStore()
        store.files.length > 0 ? next() : next('/')
      },
    }
  ]
})

export default router