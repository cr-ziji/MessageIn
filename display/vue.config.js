const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  // 生产环境不生成sourcemap
  productionSourceMap: false,
  // 设置为相对路径，确保Electron环境能正确加载资源
  publicPath: './',
  // Electron配置
  pluginOptions: {
    electronBuilder: {
      preload: 'electron/preload.js',
      // 主进程配置
      mainProcessFile: 'electron/background.js',
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
        ],
        // 指定文件复制
        extraResources: [
          {
            from: 'electron',
            to: 'electron',
            filter: ['**/*']
          }
        ],
        // 确保正确的入口点
        directories: {
          output: 'dist_electron',
          buildResources: 'build'
        },
        files: [
          "**/*",
          "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
          "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
          "!**/node_modules/*.d.ts",
          "!**/node_modules/.bin",
          "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
          "!.editorconfig",
          "!**/._*",
          "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
          "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
          "!**/{appveyor.yml,.travis.yml,circle.yml}",
          "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}"
        ]
      }
    }
  },
  // 禁用eslint
  lintOnSave: false
}) 