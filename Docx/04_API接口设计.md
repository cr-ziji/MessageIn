# MessageIn - API接口设计

## 基本信息

- 基础URL: `/api/v1`
- 数据格式: JSON
- 认证方式: JWT (JSON Web Token)
- 状态码:
  - `200`: 成功
  - `201`: 创建成功
  - `400`: 请求错误
  - `401`: 未授权
  - `403`: 禁止访问
  - `404`: 资源不存在
  - `500`: 服务器错误

## 认证接口

### 用户登录

```
POST /auth/login
```

**请求参数:**

```json
{
  "username": "string",
  "password": "string",
  "role": "admin|teacher|display"
}
```

**响应:**

```json
{
  "success": true,
  "token": "jwt_token_string",
  "user": {
    "id": "string",
    "username": "string",
    "name": "string",
    "role": "admin|teacher|display",
    "email": "string",
    "phone": "string",
    "avatar": "string"
  }
}
```

### 退出登录

```
POST /auth/logout
```

**响应:**

```json
{
  "success": true,
  "message": "退出成功"
}
```

### 刷新令牌

```
POST /auth/refresh
```

**请求头:**

```
Authorization: Bearer <token>
```

**响应:**

```json
{
  "success": true,
  "token": "new_jwt_token_string"
}
```

## 用户管理接口

### 获取用户列表

```
GET /users
```

**查询参数:**

```
role: admin|teacher|display
status: active|inactive
page: 1
limit: 20
sort: username|name|role
order: asc|desc
```

**响应:**

```json
{
  "success": true,
  "total": 25,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "string",
      "username": "string",
      "name": "string",
      "role": "admin|teacher|display",
      "email": "string",
      "phone": "string",
      "avatar": "string",
      "status": "active|inactive",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### 创建用户

```
POST /users
```

**请求参数:**

```json
{
  "username": "string",
  "password": "string",
  "name": "string",
  "role": "admin|teacher|display",
  "email": "string",
  "phone": "string",
  "avatar": "string"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "name": "string",
    "role": "admin|teacher|display",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "status": "active",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 获取单个用户

```
GET /users/:id
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "name": "string",
    "role": "admin|teacher|display",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "status": "active|inactive",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 更新用户

```
PUT /users/:id
```

**请求参数:**

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "avatar": "string",
  "status": "active|inactive"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "username": "string",
    "name": "string",
    "role": "admin|teacher|display",
    "email": "string",
    "phone": "string",
    "avatar": "string",
    "status": "active|inactive",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 删除用户

```
DELETE /users/:id
```

**响应:**

```json
{
  "success": true,
  "message": "用户删除成功"
}
```

### 修改密码

```
PUT /users/:id/password
```

**请求参数:**

```json
{
  "oldPassword": "string",
  "newPassword": "string",
  "confirmPassword": "string"
}
```

**响应:**

```json
{
  "success": true,
  "message": "密码修改成功"
}
```

## 班级管理接口

### 获取班级列表

```
GET /classes
```

**查询参数:**

```
grade: string
page: 1
limit: 20
sort: name|grade|studentCount
order: asc|desc
```

**响应:**

```json
{
  "success": true,
  "total": 10,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "string",
      "name": "string",
      "grade": "string",
      "studentCount": 45,
      "teachers": [
        {
          "id": "string",
          "name": "string"
        }
      ],
      "displayId": "string",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

### 创建班级

```
POST /classes
```

**请求参数:**

```json
{
  "name": "string",
  "grade": "string",
  "studentCount": 45,
  "teachers": ["teacher_id1", "teacher_id2"],
  "displayId": "display_id"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "grade": "string",
    "studentCount": 45,
    "teachers": [
      {
        "id": "string",
        "name": "string"
      }
    ],
    "displayId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 获取单个班级

```
GET /classes/:id
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "grade": "string",
    "studentCount": 45,
    "teachers": [
      {
        "id": "string",
        "name": "string"
      }
    ],
    "displayId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 更新班级

```
PUT /classes/:id
```

**请求参数:**

```json
{
  "name": "string",
  "grade": "string",
  "studentCount": 45,
  "teachers": ["teacher_id1", "teacher_id2"],
  "displayId": "display_id"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "name": "string",
    "grade": "string",
    "studentCount": 45,
    "teachers": [
      {
        "id": "string",
        "name": "string"
      }
    ],
    "displayId": "string",
    "createdAt": "date",
    "updatedAt": "date"
  }
}
```

### 删除班级

```
DELETE /classes/:id
```

**响应:**

```json
{
  "success": true,
  "message": "班级删除成功"
}
```

### 获取教师关联的班级

```
GET /teachers/:id/classes
```

**响应:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "name": "string",
      "grade": "string",
      "studentCount": 45,
      "displayId": "string"
    }
  ]
}
```

## 消息管理接口

### 获取消息列表

```
GET /messages
```

**查询参数:**

```
classId: string
senderId: string
priority: normal|important|urgent
status: active|expired
page: 1
limit: 20
sort: createdAt|priority
order: asc|desc
```

**响应:**

```json
{
  "success": true,
  "total": 100,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "senderName": "string",
      "classId": "string",
      "className": "string",
      "priority": "normal|important|urgent",
      "status": "active|expired",
      "displayDuration": 60,
      "readCount": 12,
      "totalCount": 45,
      "createdAt": "date",
      "expiresAt": "date"
    }
  ]
}
```

### 创建消息

```
POST /messages
```

**请求参数:**

```json
{
  "content": "string",
  "classId": "string",
  "priority": "normal|important|urgent",
  "displayDuration": 60
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "senderName": "string",
    "classId": "string",
    "className": "string",
    "priority": "normal|important|urgent",
    "status": "active",
    "displayDuration": 60,
    "readCount": 0,
    "totalCount": 45,
    "createdAt": "date",
    "expiresAt": "date"
  }
}
```

### 获取单个消息

```
GET /messages/:id
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "senderName": "string",
    "classId": "string",
    "className": "string",
    "priority": "normal|important|urgent",
    "status": "active|expired",
    "displayDuration": 60,
    "readCount": 12,
    "totalCount": 45,
    "readRecords": [
      {
        "id": "string",
        "readAt": "date"
      }
    ],
    "createdAt": "date",
    "expiresAt": "date"
  }
}
```

### 更新消息

```
PUT /messages/:id
```

**请求参数:**

```json
{
  "content": "string",
  "priority": "normal|important|urgent",
  "displayDuration": 60,
  "status": "active|expired"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "id": "string",
    "content": "string",
    "senderId": "string",
    "senderName": "string",
    "classId": "string",
    "className": "string",
    "priority": "normal|important|urgent",
    "status": "active|expired",
    "displayDuration": 60,
    "readCount": 12,
    "totalCount": 45,
    "createdAt": "date",
    "expiresAt": "date"
  }
}
```

### 删除消息

```
DELETE /messages/:id
```

**响应:**

```json
{
  "success": true,
  "message": "消息删除成功"
}
```

### 标记消息为已读

```
POST /messages/:id/read
```

**请求参数:**

```json
{
  "classId": "string"
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "messageId": "string",
    "readCount": 13,
    "totalCount": 45,
    "readAt": "date"
  }
}
```

### 获取班级未读消息

```
GET /classes/:id/messages/unread
```

**响应:**

```json
{
  "success": true,
  "data": [
    {
      "id": "string",
      "content": "string",
      "senderId": "string",
      "senderName": "string",
      "priority": "normal|important|urgent",
      "status": "active",
      "createdAt": "date",
      "expiresAt": "date"
    }
  ]
}
```

## WebSocket事件

除了REST API外，系统还使用WebSocket进行实时通信。以下是主要的WebSocket事件:

### 连接

客户端连接WebSocket时需要提供JWT令牌:

```javascript
const socket = io('ws://server-url', {
  query: {
    token: 'jwt_token_string',
    classId: 'class_id' // 仅显示端需要
  }
});
```

### 事件列表

#### 服务器发送事件

```
new_message - 新消息推送
{
  "id": "string",
  "content": "string",
  "senderId": "string",
  "senderName": "string",
  "classId": "string",
  "className": "string",
  "priority": "normal|important|urgent",
  "createdAt": "date"
}

message_read - 消息已读状态更新
{
  "messageId": "string",
  "readCount": 13,
  "totalCount": 45
}

message_expired - 消息过期通知
{
  "messageId": "string"
}
```

#### 客户端发送事件

```
read_message - 通知服务器消息已读
{
  "messageId": "string",
  "classId": "string"
}
```

## 系统设置接口

### 获取系统设置

```
GET /settings
```

**响应:**

```json
{
  "success": true,
  "data": {
    "systemName": "MessageIn",
    "systemLogo": "url_to_logo",
    "defaultLanguage": "zh-CN",
    "messageDisplayDuration": 60,
    "messageHistoryDays": 90,
    "danmakuSpeed": "medium",
    "allowHtmlContent": false,
    "sessionTimeout": 30,
    "allowMultipleLogin": true,
    "passwordMinLength": 8,
    "enforcePasswordComplexity": true
  }
}
```

### 更新系统设置

```
PUT /settings
```

**请求参数:**

```json
{
  "systemName": "MessageIn",
  "systemLogo": "url_to_logo",
  "defaultLanguage": "zh-CN",
  "messageDisplayDuration": 60,
  "messageHistoryDays": 90,
  "danmakuSpeed": "medium",
  "allowHtmlContent": false,
  "sessionTimeout": 30,
  "allowMultipleLogin": true,
  "passwordMinLength": 8,
  "enforcePasswordComplexity": true
}
```

**响应:**

```json
{
  "success": true,
  "data": {
    "systemName": "MessageIn",
    "systemLogo": "url_to_logo",
    "defaultLanguage": "zh-CN",
    "messageDisplayDuration": 60,
    "messageHistoryDays": 90,
    "danmakuSpeed": "medium",
    "allowHtmlContent": false,
    "sessionTimeout": 30,
    "allowMultipleLogin": true,
    "passwordMinLength": 8,
    "enforcePasswordComplexity": true
  }
}
```

## 系统日志接口

### 获取系统日志

```
GET /logs
```

**查询参数:**

```
userId: string
action: string
startDate: date
endDate: date
page: 1
limit: 20
```

**响应:**

```json
{
  "success": true,
  "total": 1000,
  "page": 1,
  "limit": 20,
  "data": [
    {
      "id": "string",
      "userId": "string",
      "username": "string",
      "action": "string",
      "description": "string",
      "ipAddress": "string",
      "createdAt": "date"
    }
  ]
}
``` 