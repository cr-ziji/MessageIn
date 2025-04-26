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

eval("// 预加载脚本，用于在渲染进程中安全地暴露Node.js API\nconst { contextBridge, ipcRenderer } = __webpack_require__(/*! electron */ \"electron\")\n\n// 在window对象上暴露API给渲染进程使用\ncontextBridge.exposeInMainWorld('electron', {\n  // 发送消息到主进程\n  send: (channel, data) => {\n    // 白名单channels\n    const validChannels = [\n      'message-event', \n      'app-event', \n      'update-danmaku-region', \n      'danmaku-clicked',\n      'danmaku-mouse-event'\n    ]\n    if (validChannels.includes(channel)) {\n      ipcRenderer.send(channel, data)\n    }\n  },\n  // 从主进程接收消息\n  receive: (channel, func) => {\n    const validChannels = ['message-reply', 'app-update']\n    if (validChannels.includes(channel)) {\n      // 删除旧监听器以避免内存泄漏\n      ipcRenderer.removeAllListeners(channel)\n      // 添加新监听器\n      ipcRenderer.on(channel, (event, ...args) => func(...args))\n    }\n  }\n})\n\n// 向渲染进程暴露API\ncontextBridge.exposeInMainWorld('electronAPI', {\n  // 弹幕控制\n  toggleDanmakuOverlay: (visible) => ipcRenderer.send('toggle-danmaku-overlay', visible),\n  \n  // 更新弹幕区域\n  updateDanmakuRegion: (region) => ipcRenderer.send('update-danmaku-region', region),\n  \n  // 通知主进程弹幕被点击\n  notifyDanmakuClicked: (isClickOnDanmaku) => {\n    ipcRenderer.send('danmaku-clicked', isClickOnDanmaku)\n  },\n  \n  // 发送鼠标事件\n  sendMouseEvent: (eventData) => {\n    ipcRenderer.send('danmaku-mouse-event', eventData)\n  },\n  \n  // 更新弹幕窗口样式\n  updateDanmakuStyle: (style) => ipcRenderer.send('update-danmaku-style', style),\n  \n  // 应用信息\n  getAppInfo: () => {\n    return {\n      isElectron: true,\n      version: process.env.npm_package_version || '1.0.0',\n      platform: process.platform\n    }\n  }\n}) \n\n//# sourceURL=webpack:///./electron/preload.js?");

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