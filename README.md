# MessageIn - 班级消息互动系统

MessageIn是一个轻量级的班级消息互动系统，旨在促进老师与学生之间的实时沟通。该系统允许老师通过电脑端向学生班级大屏幕发送消息，消息以弹幕形式在大屏幕上滚动显示。学生可以通过点击确认消息已读，老师则能够实时查看消息的阅读状态。

## 系统特点

- 轻量级架构，确保系统运行流畅
- 实时消息发送和状态跟踪
- 支持Web访问和多端应用部署
- MongoDB数据存储，确保数据的灵活性
- 使用WebSocket技术实现实时通信

## 技术栈

- **前端**: Vue.js/React、Socket.io客户端、Electron
- **后端**: Node.js、Express.js、Socket.io
- **数据库**: MongoDB
- **认证**: JWT (JSON Web Token)

## 系统组件

- **老师端**: 用于教师发送消息并查看已读状态
- **学生大屏端**: 用于班级显示接收到的消息并进行确认
- **管理员端**: 用于系统管理、用户管理和数据维护

## 安装指南

### 前提条件

- Node.js (v14.0或更高版本)
- MongoDB (v4.4或更高版本)
- npm (v6.0或更高版本)

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/your-username/messagein.git
cd messagein
```

2. 安装依赖

```bash
# 安装项目根依赖
npm install

# 安装服务端依赖
cd server
npm install

# 安装客户端依赖
cd ../client/teacher
npm install

cd ../admin
npm install

cd ../display
npm install
```

3. 配置环境变量

```bash
# 进入服务端目录
cd ../../server

# 复制环境变量示例文件
cp .env.example .env

# 编辑.env文件，配置MongoDB连接和JWT密钥
```

4. 启动开发服务器

```bash
# 启动后端服务器（在server目录内）
npm run dev

# 启动老师客户端（在client/teacher目录内）
npm run serve

# 启动管理员客户端（在client/admin目录内）
npm run serve

# 启动大屏显示客户端（在client/display目录内）
npm run serve
```

5. 构建生产版本

```bash
# 构建老师客户端
cd client/teacher
npm run build

# 构建管理员客户端
cd ../admin
npm run build

# 构建大屏显示客户端
cd ../display
npm run build

# 打包为Electron应用（以老师端为例）
cd ../teacher
npm run electron:build
```

## 使用说明

### 管理员操作

1. 访问管理员端登录页面 (默认: http://localhost:8081)
2. 使用管理员账号登录 (默认: admin/admin123)
3. 创建教师账号和班级
4. 关联教师与班级
5. 配置系统参数

### 老师操作

1. 访问老师端登录页面 (默认: http://localhost:8080)
2. 使用教师账号登录
3. 选择目标班级，编写消息并发送
4. 查看消息已读状态和统计信息

### 学生大屏操作

1. 访问大屏端登录页面 (默认: http://localhost:8082)
2. 使用显示端账号登录，并选择对应班级
3. 观看消息弹幕并点击确认已读
4. 查看历史消息列表

## Electron应用使用

1. 从发布页面下载对应平台的安装包
2. 安装应用程序
3. 启动应用并登录相应账号
4. 使用方式与Web版本相同

## 项目结构

详细的项目结构请参见 [项目结构.md](项目结构.md) 文件。

## 技术架构

系统技术架构请参见 [系统架构图.md](系统架构图.md) 文件。

## 开发指南

### API接口

系统API接口基本格式如下:

```
GET /api/v1/messages - 获取消息列表
POST /api/v1/messages - 创建新消息
PUT /api/v1/messages/:id - 更新消息
DELETE /api/v1/messages/:id - 删除消息

POST /api/v1/messages/read - 标记消息为已读
```

详细API文档请参见docs/api目录。

### WebSocket事件

系统使用以下WebSocket事件进行实时通信:

- `new_message`: 新消息推送
- `message_read`: 消息已读状态更新
- `message_expired`: 消息过期通知

## 贡献指南

1. Fork该仓库
2. 创建您的特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交您的更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开一个Pull Request

## 许可证

该项目采用MIT许可证 - 详情请参见 [LICENSE](LICENSE) 文件。