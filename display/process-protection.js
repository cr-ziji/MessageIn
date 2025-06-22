const path = require('path');
const { Service } = require('node-windows');
const { spawn, execSync } = require('child_process');
const fs = require('fs');

const isService = process.argv.includes('--run-service');
const serviceName = 'MessageInProtector';
const serviceScript = path.join(__dirname, 'process-protection.js');
const electronMain = path.resolve(__dirname, 'electron-danmaku.js');
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

function isElectronRunning() {
  try {
    const result = execSync('tasklist | findstr electron', { encoding: 'utf8' });
    return result && result.includes('electron');
  } catch (e) {
    return false;
  }
}

function startApp() {
  if (isElectronRunning()) {
    console.log('检测到 electron 进程已存在，跳过本轮重启');
    setTimeout(startApp, 2000);
    return;
  }
  console.log('准备启动 electron 主进程:', electronBin, electronMain);
  const child = spawn(electronBin, [electronMain], {
    stdio: 'inherit',
    detached: false,
    shell: true,
    cwd: path.dirname(electronMain)
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