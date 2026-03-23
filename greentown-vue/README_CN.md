# 绿城数据看板 - Vue 3 版本

这是绿城数据看板的 Vue 3 + TypeScript 版本。

## 技术栈

- Vue 3 (Composition API)
- TypeScript
- Pinia (状态管理)
- Vue Router (路由)
- Element Plus (UI 组件库)
- Tailwind CSS (样式)
- Lucide Vue Next (图标)
- Vite (构建工具)

## 功能特性

- ✅ 集团层级仪表板
- ✅ 项目详情页面
- ✅ 多维度数据筛选（周期、物业类型、指标类型）
- ✅ 趋势图表展示
- ✅ 项目明细表格
- ✅ 响应式设计

## 开发

### 安装依赖

\`\`\`bash
cd greentown-vue
npm install
\`\`\`

### 启动开发服务器

\`\`\`bash
npm run dev
\`\`\`

访问 http://localhost:5174

### 构建生产版本

\`\`\`bash
npm run build
\`\`\`

构建产物在 `dist` 目录。

## 部署到 GitHub Pages

1. 创建新的 GitHub 仓库（例如：`sale_speed_vue`）

2. 推送代码：

\`\`\`bash
cd greentown-vue
git init
git add .
git commit -m "Initial commit: Vue version"
git remote add origin https://github.com/你的用户名/sale_speed_vue.git
git branch -M main
git push -u origin main
\`\`\`

3. 在 GitHub 仓库设置中启用 Pages：
   - Settings → Pages
   - Source: GitHub Actions

4. 访问：`https://你的用户名.github.io/sale_speed_vue/`

## 项目结构

\`\`\`
greentown-vue/
├── src/
│   ├── components/          # 可复用组件
│   │   ├── HeaderFilter.vue
│   │   ├── OverviewCards.vue
│   │   ├── TrendChart.vue
│   │   └── ProjectTable.vue
│   ├── views/              # 页面组件
│   │   ├── DashboardView.vue
│   │   └── ProjectDetailView.vue
│   ├── stores/             # Pinia 状态管理
│   │   └── dashboard.ts
│   ├── mock/               # Mock 数据
│   │   └── dashboardData.ts
│   ├── types/              # TypeScript 类型定义
│   │   └── index.ts
│   ├── router/             # 路由配置
│   │   └── index.ts
│   ├── App.vue
│   └── main.ts
├── public/
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
\`\`\`

## 与 React 版本的区别

| 特性 | React 版本 | Vue 版本 |
|------|-----------|---------|
| 框架 | React 18 | Vue 3 |
| 状态管理 | useState/useEffect | Pinia |
| UI 库 | Radix UI | Element Plus |
| 样式 | Tailwind CSS | Tailwind CSS |
| 图表 | Recharts | Recharts (待集成) |
| 路由 | React Router | Vue Router |

## 待完善功能

- [ ] 集成 Recharts 图表库
- [ ] 添加更多项目数据
- [ ] 实现搜索功能
- [ ] 添加数据导出功能
- [ ] 优化移动端体验
- [ ] 添加单元测试

## 许可证

MIT
