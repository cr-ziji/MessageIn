<template>
  <div class="app-container">
    <router-view v-if="$route.name === 'Class'"></router-view>
    <div v-else class="class-selector">
      <h1>MessageIn - 弹幕显示系统</h1>
      <el-select v-model="selectedClass" placeholder="选择班级">
        <el-option
          v-for="item in classes"
          :key="item.id"
          :label="item.name"
          :value="item.id">
        </el-option>
      </el-select>
      <el-button type="primary" @click="startDanmaku" :disabled="!selectedClass">
        开始显示弹幕
      </el-button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

export default {
  name: 'App',
  setup() {
    const router = useRouter()
    const classes = ref([
      { id: '1', name: '计算机科学1班' },
      { id: '2', name: '软件工程2班' },
      { id: '3', name: '人工智能3班' }
    ])
    const selectedClass = ref('')
    
    const startDanmaku = () => {
      if (selectedClass.value) {
        router.push(`/class/${selectedClass.value}`)
        ElMessage.success('弹幕显示已启动')
      }
    }
    
    onMounted(() => {
      // 在实际应用中，这里应该调用API获取班级列表
      console.log('App组件已加载')
    })
    
    return {
      classes,
      selectedClass,
      startDanmaku
    }
  }
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
  width: 100%;
}

.app-container {
  height: 100vh;
  width: 100vw;
  display: flex;
  align-items: center;
  justify-content: center;
}

.class-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background-color: white;
}

h1 {
  margin-bottom: 20px;
  color: #409EFF;
}
</style> 