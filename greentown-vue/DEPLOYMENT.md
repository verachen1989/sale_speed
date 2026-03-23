# 绿城数据看板 Vue 版本 - 部署指南

## 🚀 快速开始

### 本地开发

```bash
cd greentown-vue
npm install
npm run dev
```

访问：http://localhost:5174

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

## 📦 部署到 GitHub Pages

### 方法一：使用现有仓库（推荐）

如果你想在现有的 `sale_speed` 仓库中添加 Vue 版本：

1. **更新 Vite 配置**

确保 `vite.config.ts` 中的 `base` 路径正确：

```typescript
export default defineConfig({
  base: '/sale_speed/',  // 使用相同的仓库
  // ...
})
```

2. **更新 GitHub Actions**

修改 `.github/workflows/deploy.yml`，添加 Vue 版本的构建：

```yaml
- name: Build Vue Version
  run: |
    cd greentown-vue
    npm ci
    npm run build
    
- name: Copy Vue dist to main dist
  run: |
    mkdir -p dist/vue
    cp -r greentown-vue/dist/* dist/vue/
```

3. **推送代码**

```bash
git add greentown-vue
git commit -m "Add Vue version"
git push
```

4. **访问**

- React 版本：https://verachen1989.github.io/sale_speed/
- Vue 版本：https://verachen1989.github.io/sale_speed/vue/

### 方法二：创建新仓库（独立部署）

1. **创建新的 GitHub 仓库**

访问 https://github.com/new，创建仓库（例如：`sale_speed_vue`）

2. **初始化 Git**

```bash
cd greentown-vue
git init
git add .
git commit -m "Initial commit: Vue version"
```

3. **推送到 GitHub**

```bash
git remote add origin https://github.com/你的用户名/sale_speed_vue.git
git branch -M main
git push -u origin main
```

4. **启用 GitHub Pages**

- 进入仓库 Settings → Pages
- Source 选择：GitHub Actions

5. **访问**

https://你的用户名.github.io/sale_speed_vue/

## 🔧 配置说明

### Base Path 配置

根据部署方式，需要调整 `vite.config.ts` 中的 `base` 配置：

```typescript
// 独立仓库部署
base: '/sale_speed_vue/'

// 子目录部署
base: '/sale_speed/vue/'

// 根域名部署（如 username.github.io）
base: '/'
```

### 环境变量

如果需要配置 API 地址等环境变量，创建 `.env` 文件：

```env
VITE_API_BASE_URL=https://api.example.com
```

在代码中使用：

```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL
```

## 📊 性能优化

### 代码分割

当前配置已经自动进行代码分割，主要分为：

- `index.js` - 主应用代码
- `ProjectDetailView.js` - 项目详情页（懒加载）

### 图表库优化

ECharts 已配置按需引入，只加载使用的组件：

```typescript
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
```

### 构建优化

如果需要进一步优化，可以在 `vite.config.ts` 中配置：

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        'element-plus': ['element-plus'],
        'echarts': ['echarts', 'vue-echarts'],
      },
    },
  },
}
```

## 🐛 故障排查

### 构建失败

1. 清除缓存并重新安装依赖：

```bash
rm -rf node_modules package-lock.json
npm install
```

2. 检查 Node.js 版本（需要 18+）：

```bash
node --version
```

### 部署后页面空白

1. 检查浏览器控制台错误
2. 确认 `base` 路径配置正确
3. 检查 GitHub Pages 设置

### 图表不显示

1. 确认 ECharts 正确引入
2. 检查容器高度是否设置
3. 查看浏览器控制台错误

## 📱 移动端适配

当前版本已针对移动端优化：

- 响应式布局
- 触摸滚动
- 移动端导航栏

如需进一步优化，可以调整 Tailwind 断点：

```javascript
// tailwind.config.js
theme: {
  screens: {
    'sm': '640px',
    'md': '768px',
    'lg': '1024px',
  },
}
```

## 🔄 更新部署

每次修改代码后：

```bash
git add .
git commit -m "更新说明"
git push
```

GitHub Actions 会自动重新构建和部署。

## 📞 技术支持

如遇问题，请检查：

1. GitHub Actions 运行日志
2. 浏览器开发者工具控制台
3. 网络请求状态

## 🎯 下一步

- [ ] 添加单元测试
- [ ] 集成 CI/CD
- [ ] 添加错误监控
- [ ] 性能监控
- [ ] SEO 优化
