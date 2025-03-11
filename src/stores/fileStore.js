import { defineStore } from 'pinia'

export const useFileStore = defineStore('files', {
  state: () => ({
    files: []
  }),
  actions: {
    setFiles(files) {
      this.files = files
    }
  }
})