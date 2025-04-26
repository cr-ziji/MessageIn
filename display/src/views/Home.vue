<template>
  <div class="home">
    <header class="header">
      <h1>MessageIn 显示端</h1>
      <p>欢迎使用MessageIn消息显示系统</p>
    </header>
    
    <div class="content">
      <div v-if="loading" class="loading">
        <div class="spinner"></div>
        <p>正在加载最新消息...</p>
      </div>
      
      <div v-else-if="error" class="error-container">
        <div class="error-icon">!</div>
        <p>{{ error }}</p>
        <button @click="fetchRecentMessages" class="retry-btn">重试</button>
      </div>
      
      <div v-else class="message-list">
        <h2>最近消息</h2>
        <div v-if="messages.length === 0" class="no-messages">
          <p>暂无消息</p>
        </div>
        <div v-else class="message-grid">
          <div 
            v-for="message in messages" 
            :key="message.id" 
            class="message-card"
            @click="viewMessage(message.id)"
          >
            <h3>{{ message.title }}</h3>
            <p class="message-preview">{{ truncateContent(message.content) }}</p>
            <div class="message-meta">
              <span class="author">发送者: {{ message.sender.name }}</span>
              <span class="date">{{ formatDate(message.createdAt) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeView',
  data() {
    return {
      messages: [],
      loading: true,
      error: null
    }
  },
  created() {
    this.fetchRecentMessages()
  },
  methods: {
    async fetchRecentMessages() {
      this.loading = true
      this.error = null
      
      try {
        // 模拟API调用，实际项目中应替换为真实的API请求
        // const response = await axios.get('/api/messages/recent')
        // this.messages = response.data
        
        // 模拟数据
        setTimeout(() => {
          this.messages = [
            {
              id: '1',
              title: '欢迎使用MessageIn',
              content: '这是一个用于展示实时消息的系统，可以用于课堂互动、会议展示等场景。',
              sender: { name: '系统管理员' },
              createdAt: new Date()
            },
            {
              id: '2',
              title: '如何使用MessageIn',
              content: '教师可以通过教师端发送消息，学生可以在显示端查看消息。',
              sender: { name: '技术支持' },
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000)
            }
          ]
          this.loading = false
        }, 1000)
      } catch (err) {
        this.error = '加载消息失败，请稍后重试'
        this.loading = false
        console.error('Error fetching messages:', err)
      }
    },
    truncateContent(content) {
      return content.length > 100 ? content.substring(0, 100) + '...' : content
    },
    formatDate(date) {
      return new Date(date).toLocaleString('zh-CN')
    },
    viewMessage(id) {
      this.$router.push({ name: 'MessageDisplay', params: { id } })
    }
  }
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.header {
  text-align: center;
  margin-bottom: 40px;
}

.header h1 {
  font-size: 2.5rem;
  color: #2c3e50;
  margin-bottom: 0.5rem;
}

.header p {
  font-size: 1.2rem;
  color: #7f8c8d;
}

.content {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 30px;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.spinner {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px;
}

.error-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: #ff5252;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 30px;
  font-weight: bold;
  margin-bottom: 20px;
}

.retry-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 16px;
}

.retry-btn:hover {
  background: #2980b9;
}

.message-list h2 {
  margin-bottom: 20px;
  color: #2c3e50;
  border-bottom: 2px solid #f0f0f0;
  padding-bottom: 10px;
}

.no-messages {
  text-align: center;
  padding: 40px;
  color: #7f8c8d;
  font-style: italic;
}

.message-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.message-card {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
}

.message-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
  border-color: #3498db;
}

.message-card h3 {
  margin-top: 0;
  color: #2c3e50;
}

.message-preview {
  color: #555;
  margin: 10px 0;
  line-height: 1.5;
}

.message-meta {
  display: flex;
  justify-content: space-between;
  color: #7f8c8d;
  font-size: 0.9rem;
  margin-top: 15px;
}

@media (max-width: 768px) {
  .message-grid {
    grid-template-columns: 1fr;
  }
  
  .home {
    padding: 10px;
  }
  
  .content {
    padding: 20px 15px;
  }
}
</style> 