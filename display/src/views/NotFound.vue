<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-title">页面未找到</h2>
      <p class="error-message">抱歉，您请求的页面不存在或已被移除。</p>
      <router-link to="/" class="go-home-btn">
        返回首页
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'NotFound',
  metaInfo: {
    title: '页面未找到 - MessageIn显示端'
  }
}
</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #f8f9fa;
  padding: 20px;
}

.not-found-content {
  text-align: center;
  max-width: 500px;
  padding: 40px;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.error-code {
  font-size: 6rem;
  font-weight: 700;
  color: #ff6b6b;
  margin: 0;
  line-height: 1;
}

.error-title {
  font-size: 2rem;
  color: #343a40;
  margin: 10px 0;
}

.error-message {
  color: #6c757d;
  font-size: 1.1rem;
  margin-bottom: 30px;
}

.go-home-btn {
  display: inline-block;
  padding: 12px 24px;
  background-color: #4dabf7;
  color: white;
  text-decoration: none;
  border-radius: 4px;
  font-weight: 500;
  transition: background-color 0.3s;
}

.go-home-btn:hover {
  background-color: #339af0;
}
</style> 