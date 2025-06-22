const path = require('path');
const { Service } = require('node-windows');
const { spawn } = require('child_process');

const svc = new Service({
  name: 'MessageInProtector',
  description: 'MessageIn应用进程守护服务',
  script: path.join(__dirname, 'process-protection.js'),
  nodeOptions: [
    '--harmony',
    '--max_old_space_size=4096'
  ]
});

svc.on('install', () => {
  svc.start();
  console.log('服务已安装并启动');
});
svc.on('alreadyinstalled', () => {
  svc.start();
  console.log('服务已存在，已启动');
});
svc.on('start', () => {
  console.log('服务已启动');
});
svc.on('error', (err) => {
  console.error('服务错误:', err);
});

// 检查并注册服务
if (!svc.exists) {
  svc.install();
} else {
  svc.start();
}

// 仅在服务模式或直接运行时守护主进程
if (process.argv[2] === '--run' || process.env.__daemon) {
  function startApp() {
    const child = spawn('electron', [path.join(__dirname, 'electron-danmaku.js')], {
      stdio: 'inherit',
      detached: false
    });
    child.on('exit', (code) => {
      console.log('主应用退出，2秒后重启，退出码:', code);
      setTimeout(startApp, 2000);
    });
  }
  startApp();
} 