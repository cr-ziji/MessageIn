const path = require('path');
const { Service } = require('node-windows');
const { spawn } = require('child_process');
const fs = require('fs');

const isService = process.argv.includes('--run-service');
const serviceName = 'MessageInProtector';
const serviceScript = path.join(__dirname, 'process-protection.js');
const electronMain = path.join(__dirname, 'electron-danmaku.js');
const electronBin = path.join(__dirname, 'node_modules', '.bin', process.platform === 'win32' ? 'electron.cmd' : 'electron');

if (!isService) {
  // 非服务模式，自动注册并启动服务
  const svc = new Service({
    name: serviceName,
    description: 'MessageIn应用进程守护服务',
    script: serviceScript,
    nodeOptions: [
      '--harmony',
      '--max_old_space_size=4096'
    ],
    scriptOptions: '--run-service',
    wait: 1,
    grow: 0.25,
    maxRestarts: 3
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

  if (!svc.exists) {
    svc.install();
  } else {
    svc.start();
  }
  return;
}

function startApp() {
  console.log('准备启动 electron 主进程:', electronBin, electronMain);
  const child = spawn(electronBin, [electronMain], {
    stdio: 'inherit',
    detached: false,
    shell: true // 关键：让 .cmd 能被正确执行
  });
  child.on('exit', (code) => {
    console.log('主应用退出，2秒后重启，退出码:', code);
    setTimeout(startApp, 2000);
  });
  child.on('error', (err) => {
    console.error('启动 electron 进程失败:', err);
  });
}

startApp(); 