<template>
  <div class="message-display">
    <div class="back-button" @click="goBack">
      <span class="arrow">←</span> 返回
    </div>
    
    <div v-if="loading" class="loading-container">
      <div class="spinner"></div>
      <p>正在加载消息...</p>
    </div>
    
    <div v-else-if="error" class="error-container">
      <div class="error-icon">!</div>
      <p>{{ error }}</p>
      <button @click="fetchMessage" class="retry-btn">重试</button>
    </div>
    
    <div v-else-if="message" class="message-container">
      <header class="message-header">
        <h1>{{ message.title }}</h1>
        <div class="message-meta">
          <div class="sender">
            <span class="label">发送者:</span>
            <span class="value">{{ message.sender.name }}</span>
          </div>
          <div class="date">
            <span class="label">时间:</span>
            <span class="value">{{ formatDate(message.createdAt) }}</span>
          </div>
          
          <div class="danmaku-action">
            <el-button 
              type="primary" 
              size="small" 
              @click="sendToDanmaku"
              :disabled="danmakuSent"
            >
              {{ danmakuSent ? '已发送到弹幕' : '发送到弹幕' }}
            </el-button>
          </div>
        </div>
      </header>
      
      <div class="message-content">
        <div v-if="message.contentType === 'text'" class="text-content">
          {{ message.content }}
        </div>
        
        <div v-else-if="message.contentType === 'html'" class="html-content" v-html="message.content"></div>
        
        <div v-else-if="message.contentType === 'image'" class="image-content">
          <img :src="message.content" alt="消息图片" />
        </div>
        
        <div v-else-if="message.contentType === 'mixed'" class="mixed-content">
          <div v-for="(item, index) in message.contentItems" :key="index" class="content-item">
            <div v-if="item.type === 'text'" class="text-item">{{ item.content }}</div>
            <div v-else-if="item.type === 'image'" class="image-item">
              <img :src="item.content" alt="消息图片" />
            </div>
          </div>
        </div>
      </div>
      
      <div v-if="message.attachments && message.attachments.length > 0" class="attachments">
        <h3>附件</h3>
        <ul class="attachment-list">
          <li v-for="attachment in message.attachments" :key="attachment.id" class="attachment-item">
            <span class="attachment-icon">📎</span>
            <span class="attachment-name">{{ attachment.name }}</span>
            <button class="download-btn" @click="downloadAttachment(attachment)">下载</button>
          </li>
        </ul>
      </div>
    </div>
    
    <div v-else class="message-not-found">
      <div class="not-found-icon">?</div>
      <h2>消息未找到</h2>
      <p>请求的消息可能已被删除或您没有查看权限</p>
      <button @click="goBack" class="back-home-btn">返回首页</button>
    </div>
  </div>
</template>

<script>
import { useDanmakuStore } from '@/store/modules/danmaku';

export default {
  name: 'MessageDisplay',
  data() {
    return {
      message: null,
      loading: true,
      error: null,
      danmakuSent: false
    }
  },
  computed: {
    messageId() {
      return this.$route.params.id
    }
  },
  created() {
    this.fetchMessage()
  },
  methods: {
    async fetchMessage() {
      this.loading = true
      this.error = null
      this.danmakuSent = false
      
      try {
        // 模拟API调用，实际项目中应替换为真实的API请求
        // const response = await axios.get(`/api/messages/${this.messageId}`)
        // this.message = response.data
        
        // 模拟数据
        setTimeout(() => {
          if (this.messageId === '1') {
            this.message = {
              id: '1',
              title: '欢迎使用MessageIn',
              content: '这是一个用于展示实时消息的系统，可以用于课堂互动、会议展示等场景。这个系统的主要功能包括：\n\n1. 实时消息推送\n2. 多种消息类型支持\n3. 附件上传与下载\n4. 用户权限管理\n\n我们希望这个系统能够提升您的沟通和展示效率！',
              contentType: 'text',
              sender: { 
                id: 'admin1',
                name: '系统管理员',
                avatar: ''
              },
              createdAt: new Date(),
              attachments: []
            }
          } else if (this.messageId === '2') {
            this.message = {
              id: '2',
              title: '如何使用MessageIn',
              content: '教师可以通过教师端发送消息，学生可以在显示端查看消息。系统支持多种消息类型，包括文本、图片和混合内容。',
              contentType: 'text',
              sender: { 
                id: 'support1',
                name: '技术支持',
                avatar: ''
              },
              createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              attachments: [
                {
                  id: 'att1',
                  name: '用户手册.pdf',
                  size: '2.5MB',
                  url: '#'
                }
              ]
            }
          } else {
            this.message = null
          }
          this.loading = false
        }, 1000)
      } catch (err) {
        this.error = '加载消息失败，请稍后重试'
        this.loading = false
        console.error('Error fetching message:', err)
      }
    },
    formatDate(date) {
      return new Date(date).toLocaleString('zh-CN')
    },
    downloadAttachment(attachment) {
      // 实际项目中应实现下载逻辑
      console.log('Downloading attachment:', attachment)
      alert(`正在下载: ${attachment.name}`)
    },
    goBack() {
      this.$router.push({ name: 'Home' })
    },
    sendToDanmaku() {
      if (!this.message || this.danmakuSent) return;
      
      const danmakuStore = useDanmakuStore();
      
      // 如果消息内容太长，分段显示
      const content = this.message.content;
      const title = this.message.title;
      
      // 先发送标题
      danmakuStore.addMessage({
        content: `${title} (来自: ${this.message.sender.name})`,
        bgColor: '#1976d2', // 使用深蓝色背景
        fontSize: 16 // 调整字体大小
      });
      
      // 如果内容较短，直接发送
      if (content.length < 100) {
        setTimeout(() => {
          danmakuStore.addMessage({
            content: content,
            bgColor: '#2196f3', // 使用蓝色
            fontSize: 16
          });
        }, 1500);
      } else {
        // 内容过长，分段发送
        // 按句号或换行符分割
        const segments = content.split(/(?:\.\s+|\n+)/);
        const filteredSegments = segments.filter(seg => seg.trim().length > 0);
        
        // 使用不同的蓝色调
        const colors = ['#1976d2', '#2196f3', '#42a5f5', '#64b5f6', '#0d47a1', '#1565c0'];
        
        // 每段延迟1.5秒发送
        filteredSegments.forEach((segment, index) => {
          setTimeout(() => {
            danmakuStore.addMessage({
              content: segment.trim(),
              bgColor: colors[index % colors.length], // 循环使用颜色
              fontSize: 16
            });
          }, 1500 * (index + 1));
        });
      }
      
      // 标记已发送
      this.danmakuSent = true;
      
      // 提示发送成功
      this.$message({
        message: '消息已发送到弹幕',
        type: 'success',
        duration: 2000
      });
    }
  }
}
</script>

<style scoped>
.message-display {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
}

.back-button {
  display: inline-flex;
  align-items: center;
  color: #3498db;
  font-weight: 600;
  cursor: pointer;
  padding: 10px 0;
  margin-bottom: 20px;
}

.back-button:hover {
  color: #2980b9;
}

.arrow {
  margin-right: 8px;
  font-size: 1.2em;
}

.loading-container, .error-container, .message-not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3498db;
  animation: spin 1s linear infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.message-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.message-header {
  padding: 25px 30px;
  border-bottom: 1px solid #eaeaea;
  background: #f9f9f9;
}

.message-header h1 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 1.8rem;
}

.message-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  color: #7f8c8d;
  font-size: 0.95rem;
}

.sender, .date {
  display: flex;
  align-items: center;
}

.label {
  font-weight: 600;
  margin-right: 5px;
}

.message-content {
  padding: 30px;
  line-height: 1.6;
  color: #34495e;
}

.text-content {
  white-space: pre-line;
}

.html-content {
  max-width: 100%;
  overflow: hidden;
}

.image-content img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.mixed-content .content-item {
  margin-bottom: 20px;
}

.mixed-content .image-item img {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
  margin-top: 10px;
}

.attachments {
  padding: 20px 30px 30px;
  border-top: 1px solid #eaeaea;
  background: #f9f9f9;
}

.attachments h3 {
  margin-top: 0;
  color: #2c3e50;
}

.attachment-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.attachment-item {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  border: 1px solid #eaeaea;
  border-radius: 4px;
  margin-bottom: 10px;
  background: white;
}

.attachment-icon {
  font-size: 1.2rem;
  margin-right: 10px;
}

.attachment-name {
  flex-grow: 1;
}

.download-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 5px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.download-btn:hover {
  background: #2980b9;
}

.error-icon, .not-found-icon {
  width: 70px;
  height: 70px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  font-weight: bold;
  margin-bottom: 20px;
}

.error-icon {
  background: #ff5252;
  color: white;
}

.not-found-icon {
  background: #7f8c8d;
  color: white;
}

.retry-btn, .back-home-btn {
  background: #3498db;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 20px;
  font-size: 16px;
}

.retry-btn:hover, .back-home-btn:hover {
  background: #2980b9;
}

@media (max-width: 768px) {
  .message-display {
    padding: 10px;
  }
  
  .message-header {
    padding: 20px;
  }
  
  .message-content {
    padding: 20px;
  }
  
  .attachments {
    padding: 20px;
  }
}

.danmaku-action {
  margin-left: auto;
}
</style> 