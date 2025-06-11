import { createApp } from 'vue'
import App from './App.vue'

console.log('🔥 main.js开始执行')

const app = createApp(App)

// 添加全局错误捕获
app.config.errorHandler = (err, vm, info) => {
  console.error('‼️ 全局错误:', err, '\n组件:', vm, '\n位置:', info)
}

// 手动验证挂载
const rootEl = document.getElementById('app')
if (!rootEl) {
  console.error('❌ 未找到#app元素')
  document.body.innerHTML = '<h1 style="color:red">未找到挂载节点</h1>'
} else {
  console.log('✅ 找到挂载节点:', rootEl)
  app.mount('#app').$nextTick(() => {
    console.log('🚀 App组件挂载完成')
  })
}