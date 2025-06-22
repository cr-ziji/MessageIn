const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');

class ProcessProtector {
  constructor() {
    this.appPath = path.join(__dirname, 'electron-danmaku.js');
    this.process = null;
    this.restartCount = 0;
    this.maxRestarts = 10;
    this.restartDelay = 3000;
    this.isShuttingDown = false;
  }

  start() {
    console.log('启动进程保护器...');
    this.spawnProcess();
  }

  spawnProcess() {
    if (this.isShuttingDown) return;

    console.log(`启动应用进程 (尝试 ${this.restartCount + 1}/${this.maxRestarts})`);
    
    this.process = spawn('electron', [this.appPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      detached: false
    });

    this.process.stdout.on('data', (data) => {
      console.log(`应用输出: ${data}`);
    });

    this.process.stderr.on('data', (data) => {
      console.error(`应用错误: ${data}`);
    });

    this.process.on('close', (code) => {
      console.log(`应用进程退出，代码: ${code}`);
      
      if (!this.isShuttingDown && this.restartCount < this.maxRestarts) {
        this.restartCount++;
        console.log(`等待 ${this.restartDelay}ms 后重启应用...`);
        setTimeout(() => {
          this.spawnProcess();
        }, this.restartDelay);
      } else if (this.restartCount >= this.maxRestarts) {
        console.log('达到最大重启次数，停止保护');
        this.shutdown();
      }
    });

    this.process.on('error', (error) => {
      console.error(`进程启动错误: ${error}`);
      
      if (!this.isShuttingDown && this.restartCount < this.maxRestarts) {
        this.restartCount++;
        setTimeout(() => {
          this.spawnProcess();
        }, this.restartDelay);
      }
    });

    process.on('SIGINT', () => {
      console.log('收到SIGINT信号，关闭保护器...');
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      console.log('收到SIGTERM信号，关闭保护器...');
      this.shutdown();
    });

    process.on('SIGQUIT', () => {
      console.log('收到SIGQUIT信号，关闭保护器...');
      this.shutdown();
    });
  }

  shutdown() {
    console.log('正在关闭进程保护器...');
    this.isShuttingDown = true;
    
    if (this.process) {
      this.process.kill('SIGTERM');

      setTimeout(() => {
        if (this.process) {
          this.process.kill('SIGKILL');
        }
        process.exit(0);
      }, 5000);
    } else {
      process.exit(0);
    }
  }

  restart() {
    console.log('手动重启应用...');
    this.restartCount = 0;
    
    if (this.process) {
      this.process.kill('SIGTERM');
    }
    
    setTimeout(() => {
      this.spawnProcess();
    }, 1000);
  }
}

const protector = new ProcessProtector();
protector.start();

module.exports = ProcessProtector; 