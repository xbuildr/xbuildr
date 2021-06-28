import { createApp, h } from 'vue'

const app = createApp({
  setup() {
    return () => h('h1', 'Hello world')
  },
})

app.mount('#app')
