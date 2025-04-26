/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ({

/***/ "./electron/preload.js":
/*!*****************************!*\
  !*** ./electron/preload.js ***!
  \*****************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("// 预加载脚本，用于在渲染进程中安全地暴露Node.js API\r\nconst { contextBridge, ipcRenderer } = __webpack_require__(/*! electron */ \"electron\")\r\n\r\n// 在window对象上暴露API给渲染进程使用\r\ncontextBridge.exposeInMainWorld('electron', {\r\n  // 发送消息到主进程\r\n  send: (channel, data) => {\r\n    // 白名单channels\r\n    const validChannels = [\r\n      'message-event', \r\n      'app-event', \r\n      'update-danmaku-regions', \r\n      'danmaku-mouse-position',\r\n      'toggle-danmaku',\r\n      'danmaku-ready',\r\n      'set-danmaku-always-on-top'\r\n    ]\r\n    if (validChannels.includes(channel)) {\r\n      ipcRenderer.send(channel, data)\r\n    }\r\n  },\r\n  // 从主进程接收消息\r\n  receive: (channel, func) => {\r\n    const validChannels = [\r\n      'message-reply', \r\n      'app-update', \r\n      'toggle-danmaku',\r\n      'danmaku-status'\r\n    ]\r\n    if (validChannels.includes(channel)) {\r\n      // 删除旧监听器以避免内存泄漏\r\n      ipcRenderer.removeAllListeners(channel)\r\n      // 添加新监听器\r\n      ipcRenderer.on(channel, (event, ...args) => func(...args))\r\n    }\r\n  },\r\n  // 发送弹幕开关状态\r\n  toggleDanmaku: (enabled) => {\r\n    ipcRenderer.send('toggle-danmaku', enabled);\r\n  },\r\n  \r\n  // 监听弹幕开关变化\r\n  onToggleDanmaku: (callback) => {\r\n    ipcRenderer.removeAllListeners('toggle-danmaku');\r\n    ipcRenderer.on('toggle-danmaku', (event, enabled) => {\r\n      callback(enabled);\r\n    });\r\n  },\r\n  \r\n  // 监听弹幕状态信息\r\n  onDanmakuStatus: (callback) => {\r\n    ipcRenderer.removeAllListeners('danmaku-status');\r\n    ipcRenderer.on('danmaku-status', (event, status) => {\r\n      callback(status);\r\n    });\r\n  },\r\n  \r\n  // 更新可点击区域\r\n  updateDanmakuRegions: (regions) => {\r\n    ipcRenderer.send('update-danmaku-regions', regions);\r\n  },\r\n  \r\n  // 发送鼠标位置信息\r\n  sendMousePosition: (position) => {\r\n    ipcRenderer.send('danmaku-mouse-position', position);\r\n  },\r\n  \r\n  // 通知主进程弹幕覆盖层就绪\r\n  sendDanmakuReady: () => {\r\n    ipcRenderer.send('danmaku-ready');\r\n  },\r\n  \r\n  // 切换弹幕覆盖层的显示/隐藏\r\n  toggleDanmakuOverlay: (visible) => {\r\n    ipcRenderer.send('toggle-danmaku-overlay', visible);\r\n  },\r\n  \r\n  // 设置弹幕窗口始终置顶\r\n  setDanmakuAlwaysOnTop: (alwaysOnTop) => {\r\n    ipcRenderer.send('set-danmaku-always-on-top', alwaysOnTop);\r\n  },\r\n  \r\n  // 移除所有监听器\r\n  removeAllListeners: (channel) => {\r\n    ipcRenderer.removeAllListeners(channel);\r\n  }\r\n})\r\n\r\n// 向渲染进程暴露API\r\ncontextBridge.exposeInMainWorld('electronAPI', {\r\n  // 应用信息\r\n  getAppInfo: () => {\r\n    return {\r\n      isElectron: true,\r\n      version: process.env.npm_package_version || '1.0.0',\r\n      platform: process.platform\r\n    }\r\n  },\r\n  \r\n  // 同样暴露弹幕相关API到electronAPI对象\r\n  toggleDanmakuOverlay: (visible) => {\r\n    ipcRenderer.send('toggle-danmaku-overlay', visible);\r\n  },\r\n  \r\n  toggleDanmaku: (enabled) => {\r\n    ipcRenderer.send('toggle-danmaku', enabled);\r\n  },\r\n  \r\n  setDanmakuAlwaysOnTop: (alwaysOnTop) => {\r\n    ipcRenderer.send('set-danmaku-always-on-top', alwaysOnTop);\r\n  }\r\n}) \n\n//# sourceURL=webpack:///./electron/preload.js?");

/***/ }),

/***/ 0:
/*!***********************************!*\
  !*** multi ./electron/preload.js ***!
  \***********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("module.exports = __webpack_require__(/*! D:\\GitHub\\MessageIn\\display\\electron\\preload.js */\"./electron/preload.js\");\n\n\n//# sourceURL=webpack:///multi_./electron/preload.js?");

/***/ }),

/***/ "electron":
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports = require(\"electron\");\n\n//# sourceURL=webpack:///external_%22electron%22?");

/***/ })

/******/ });