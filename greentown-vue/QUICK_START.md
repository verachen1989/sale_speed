# 🚀 快速开始指南

## ✨ Vue 版本已成功启动！

### 📱 访问地址

**本地访问：**
```
http://localhost:5175/sale_speed_vue/
```

**外网访问：**
```
http://199.20.83.58:5175/sale_speed_vue/
```

**Vue DevTools：**
```
http://localhost:5175/sale_speed_vue/__devtools__/
```

## 🎯 功能演示

### 1. Dashboard 页面（首页）

访问：http://localhost:5175/sale_speed_vue/

**功能：**
- 顶部绿色导航栏
- 筛选器：周期、物业类型、指标类型
- 概览卡片：显示总套数和总金额
- 趋势图表：目标vs实际对比
- 项目列表：点击项目名称可跳转详情

**操作：**
1. 选择不同的周期（当日/当月/当年）
2. 切换物业类型（住宅/商办/车储）
3. 切换指标类型（协议/合同）
4. 点击项目名称查看详情

### 2. ProjectDetail 页面（项目详情）

点击任意项目进入详情页

**功能：**
- 多维度筛选器
- 户型卡片滚动选择
- 趋势图表（含来访组数）
- 会议版本切换
- 明细数据表格

**操作：**
1. 选择周期、分期、物业类型、指标类型
2. 横向滚动选择户型
3. 切换"套数"/"金额"查看不同维度
4. 选择会议版本查看目标调整
5. 查看明细数据表格

## 🎨 核心功能测试

### 测试 1：来访组数功能

1. 进入任意项目详情页
2. 确保选择"套数"指标
3. 确保选择"全部已售"户型
4. 观察图表中的蓝色柱子（来访组数）
5. 切换到单个户型，来访组数消失 ✓
6. 切换到"金额"指标，来访组数消失 ✓

### 测试 2：会议版本功能

1. 进入项目详情页
2. 选择"当年"周期
3. 点击"对比"下拉框
4. 切换不同会议版本
5. 观察目标值变化：
   - 年度经营计划版：目标 × 1.1
   - 首开定价会版：目标 × 1.05
   - 全景会版：目标 × 1.0
   - 经营策划会版：目标 × 0.95
   - 交底会版：目标 × 0.9

### 测试 3：户型筛选功能

1. 进入项目详情页
2. 横向滚动户型卡片
3. 点击不同户型
4. 观察图表数据变化
5. 观察明细表格数据变化
6. 来访组数保持不变 ✓

### 测试 4：响应式设计

1. 调整浏览器窗口大小
2. 测试移动端视图
3. 测试横向滚动
4. 测试触摸操作

## 📊 数据说明

### Mock 数据
当前使用的是 Mock 数据，包含：

- **住宅项目**：15个
- **商办项目**：5个
- **车储项目**：5个

### 数据周期
- **当日**：近7日数据
- **当月**：近6周数据
- **当年**：近6个月数据（从2026年3月往前推）

### 数据指标
- **协议**：协议签约数据
- **合同**：合同签约数据
- **套数**：销售套数
- **金额**：销售金额（万元）
- **来访组数**：客户来访组数

## 🔧 开发调试

### 热更新
修改代码后自动刷新，无需手动重启

### Vue DevTools
按 `Option + Shift + D` 打开 Vue DevTools

### 控制台
按 `F12` 打开浏览器开发者工具

### 查看日志
```bash
# 在终端查看服务器日志
# 已经在运行中
```

## 🛠️ 常用命令

### 停止服务器
```bash
# 按 Ctrl + C
```

### 重新启动
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

## 📝 代码结构

### 修改页面
```bash
# Dashboard 页面
src/views/DashboardView.vue

# 项目详情页
src/views/ProjectDetailView.vue
```

### 修改组件
```bash
# 筛选器
src/components/HeaderFilter.vue

# 趋势图
src/components/TrendChart.vue
src/components/ProjectTrendChart.vue

# 项目表格
src/components/ProjectTable.vue
```

### 修改数据
```bash
# Mock 数据
src/mock/dashboardData.ts

# 类型定义
src/types/index.ts
```

### 修改样式
```bash
# 全局样式
src/assets/main.css

# Tailwind 配置
tailwind.config.js
```

## 🎯 下一步

### 1. 测试所有功能
- [ ] Dashboard 页面
- [ ] ProjectDetail 页面
- [ ] 筛选器功能
- [ ] 图表交互
- [ ] 数据表格

### 2. 部署到生产环境
```bash
# 构建
npm run build

# 部署到 GitHub Pages
# 参考 DEPLOYMENT.md
```

### 3. 添加真实数据
```bash
# 修改 src/mock/dashboardData.ts
# 或接入真实 API
```

## 💡 提示

### 性能优化
- 图表已配置按需加载
- 路由已配置懒加载
- 构建已优化代码分割

### 浏览器兼容
- 支持现代浏览器
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### 移动端
- 已优化触摸操作
- 已适配小屏幕
- 支持横向滚动

## 🐛 常见问题

### Q: 端口被占用？
A: Vite 会自动尝试其他端口（5175, 5176...）

### Q: 图表不显示？
A: 检查浏览器控制台错误，确认 ECharts 正确加载

### Q: 样式不生效？
A: 清除浏览器缓存，重新加载页面

### Q: 热更新不工作？
A: 重启开发服务器

## 📞 获取帮助

### 文档
- README_CN.md - 项目说明
- DEPLOYMENT.md - 部署指南
- VUE_VERSION_COMPLETE.md - 完整功能说明

### 在线资源
- Vue 3 文档：https://cn.vuejs.org/
- Element Plus：https://element-plus.org/zh-CN/
- ECharts：https://echarts.apache.org/zh/index.html

## 🎉 开始使用

现在你可以：

1. ✅ 访问 http://localhost:5175/sale_speed_vue/
2. ✅ 测试所有功能
3. ✅ 修改代码并查看实时更新
4. ✅ 准备部署到生产环境

**祝你使用愉快！** 🚀
