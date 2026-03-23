# 🚀 GitHub 仓库设置指南

## 第 1 步：创建 GitHub 仓库

请访问以下链接创建新仓库：

**👉 https://github.com/new**

### 仓库设置：
- **Repository name**: `sale_speed_vue`
- **Description**: `绿城数据看板 Vue 3 版本 - Greentown Real Estate Sales Dashboard`
- **Visibility**: Public（公开）
- ⚠️ **不要勾选** "Add a README file"
- ⚠️ **不要勾选** "Add .gitignore"
- ⚠️ **不要勾选** "Choose a license"

点击 **Create repository** 按钮

## 第 2 步：推送代码

创建仓库后，在终端运行以下命令：

```bash
cd greentown-vue
git remote add origin https://github.com/verachen1989/sale_speed_vue.git
git push -u origin main
```

## 第 3 步：启用 GitHub Pages

1. 进入仓库页面：https://github.com/verachen1989/sale_speed_vue
2. 点击 **Settings**（设置）
3. 在左侧菜单找到 **Pages**
4. 在 **Build and deployment** 部分：
   - **Source**: 选择 **GitHub Actions**
5. 保存（自动保存）

## 第 4 步：等待部署

1. 回到仓库首页
2. 点击 **Actions** 标签
3. 等待 "Deploy to GitHub Pages" 工作流完成（约 2-3 分钟）
4. 看到绿色 ✓ 表示部署成功

## 第 5 步：访问网站

部署成功后，你的 Vue 版本地址是：

**🌐 https://verachen1989.github.io/sale_speed_vue/**

## 📝 注意事项

### 如果推送失败

可能需要配置 Git 凭据：

```bash
# 使用 HTTPS（推荐）
git remote set-url origin https://github.com/verachen1989/sale_speed_vue.git

# 或使用 SSH
git remote set-url origin git@github.com:verachen1989/sale_speed_vue.git
```

### 如果部署失败

1. 检查 Actions 标签页的错误日志
2. 确保 GitHub Pages 设置正确
3. 确认 `vite.config.ts` 中的 `base` 路径是 `/sale_speed_vue/`

## 🎉 完成！

现在你有两个版本：

- **React 版本**: https://verachen1989.github.io/sale_speed/
- **Vue 版本**: https://verachen1989.github.io/sale_speed_vue/

## 🔄 后续更新

每次修改代码后：

```bash
git add .
git commit -m "更新说明"
git push
```

GitHub Actions 会自动重新部署。
