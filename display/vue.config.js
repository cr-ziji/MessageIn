const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 生产环境不生成sourcemap
  productionSourceMap: false,
  // 设置保持嵌套的路由路径
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  // Electron配置
  pluginOptions: {
    electronBuilder: {
      preload: 'electron/preload.js',
      // 主进程配置
      mainProcessFile: 'electron/background.js',
      // 渲染进程配置
      rendererProcessFile: 'src/main.js',
      // 构建配置
      builderOptions: {
        appId: 'com.messagein.display',
        productName: 'MessageIn显示端',
        // 设置打包后的应用名称
        artifactName: 'MessageIn显示端-${version}.${ext}',
        // Windows配置
        win: {
          icon: 'public/favicon.ico'
        },
        // 文件关联
        fileAssociations: [
          {
            ext: 'msg',
            name: 'MessageIn文件',
            description: 'MessageIn消息文件'
          }
        ]
      }
    }
  },
  // 禁用eslint
  lintOnSave: false
}) 