# MessageIn - 班级消息互动系统

MessageIn是一款轻量级、跨平台的班级消息互动系统。老师可通过电脑端实时向班级大屏发送消息，消息以弹幕形式美观滚动显示，学生可点击弹幕确认已读，老师可实时查看阅读状态。系统支持Web和Electron多端，适配多显示器，界面美观流畅。

## 主要特性

- 实时弹幕消息推送与已读统计
- 支持老师、管理员、学生（大屏）多角色
- 大屏端弹幕美观，支持交互打勾、鼠标穿透、全透明
- 多显示器全屏、窗口始终置顶
- 控制面板支持弹幕速度、透明度、清空、测试等
- HTTP + AJAX，易于二次开发

## 快速开始

### 后端

```bash
cd server
python run main_app.py
```

Tip:后端需要MongoDB和flask,pymongo,pyttsx3,uuid, time, random

### 前端/大屏端

```bash
cd display
npm install
npm start
```

### 打包桌面端

```bash
cd display
npm run build
```

## 文档

[01_功能文档](Docx\01_功能文档.md)

## 许可证

GNU V3
