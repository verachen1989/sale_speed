# 🚀 GitHub Pages 部署 - 下一步操作

## ✅ 已完成
- Git 仓库已初始化
- 所有文件已提交
- GitHub Actions 部署配置已就绪

## 📋 接下来你需要做的事情

### 第 1 步：创建 GitHub 仓库

1. 打开浏览器，访问：https://github.com/new
2. 填写仓库信息：
   - Repository name（仓库名）：`greentown-dashboard`（或你喜欢的名字）
   - Description（描述）：绿城数据看板
   - 选择 **Public**（公开）
   - ⚠️ **不要勾选** "Add a README file"
   - ⚠️ **不要勾选** "Add .gitignore"
   - ⚠️ **不要勾选** "Choose a license"
3. 点击 **Create repository**（创建仓库）

### 第 2 步：推送代码到 GitHub

创建仓库后，GitHub 会显示一个页面。复制你的仓库地址（类似 `https://github.com/你的用户名/greentown-dashboard.git`）

然后在终端运行以下命令（替换成你的仓库地址）：

```bash
# 添加远程仓库
git remote add origin https://github.com/你的用户名/greentown-dashboard.git

# 推送代码
git branch -M main
git push -u origin main
```

### 第 3 步：启用 GitHub Pages

1. 在 GitHub 仓库页面，点击 **Settings**（设置）
2. 在左侧菜单找到 **Pages**
3. 在 **Build and deployment** 部分：
   - Source: 选择 **GitHub Actions**
4. 不需要点击保存，会自动保存

### 第 4 步：等待部署完成

1. 回到仓库首页，点击 **Actions** 标签
2. 你会看到 "Deploy to GitHub Pages" 工作流正在运行
3. 等待几分钟，直到显示绿色的 ✓ 表示部署成功

### 第 5 步：访问你的网站

部署成功后，你的网站地址是：

```
https://你的用户名.github.io/greentown-dashboard/
```

⚠️ **重要提示**：如果你的仓库名不是 `greentown-dashboard`，需要修改 `vite.config.ts` 文件中的 `base` 配置：

```typescript
base: '/你的仓库名/',  // 改成你实际的仓库名
```

然后重新提交并推送：

```bash
git add vite.config.ts
git commit -m "Update base path"
git push
```

## 🎉 完成！

部署成功后，你就可以通过 GitHub Pages 地址在国内访问你的网站了！

每次修改代码后，只需要：

```bash
git add .
git commit -m "更新说明"
git push
```

GitHub Actions 会自动重新部署。

## 📞 需要帮助？

如果遇到问题，告诉我具体的错误信息，我会帮你解决！
