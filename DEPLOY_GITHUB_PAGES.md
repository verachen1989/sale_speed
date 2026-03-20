# GitHub Pages 部署指南

## 🚀 快速部署步骤

### 1. 初始化 Git 仓库（如果还没有）

```bash
git init
git add .
git commit -m "Initial commit"
```

### 2. 创建 GitHub 仓库

1. 访问 https://github.com/new
2. 创建一个新仓库（例如：greentown-dashboard）
3. **不要**勾选 "Initialize this repository with a README"

### 3. 推送代码到 GitHub

```bash
# 添加远程仓库（替换 YOUR_USERNAME 和 YOUR_REPO）
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# 推送代码
git branch -M main
git push -u origin main
```

### 4. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 **Settings** (设置)
3. 在左侧菜单找到 **Pages**
4. 在 **Source** 下选择：
   - Source: **GitHub Actions**
5. 保存

### 5. 触发部署

代码推送后，GitHub Actions 会自动构建和部署。

查看部署进度：
- 进入仓库的 **Actions** 标签页
- 查看 "Deploy to GitHub Pages" 工作流

### 6. 访问你的网站

部署成功后，你的网站地址是：

```
https://YOUR_USERNAME.github.io/YOUR_REPO/
```

如果仓库名是你的用户名（例如：username.github.io），则地址是：

```
https://YOUR_USERNAME.github.io/
```

## 📝 注意事项

### 如果使用子路径部署

如果你的仓库不是 `username.github.io`，需要修改 `vite.config.ts`：

```typescript
export default defineConfig({
  base: '/YOUR_REPO/', // 改为你的仓库名
  // ...
})
```

然后重新推送代码。

### 更新网站

每次修改代码后，只需：

```bash
git add .
git commit -m "Update"
git push
```

GitHub Actions 会自动重新部署。

## 🔧 故障排查

### 部署失败

1. 检查 Actions 标签页的错误日志
2. 确保 `npm run build` 在本地能成功运行
3. 检查 GitHub Pages 设置是否正确

### 404 错误

1. 确保 `vite.config.ts` 中的 `base` 路径正确
2. 等待几分钟让 DNS 生效
3. 清除浏览器缓存

### 样式丢失

确保 `base` 路径设置正确，所有资源路径都是相对路径。

## 🌐 访问速度

GitHub Pages 在国内访问速度较好，如果需要更快的速度，可以考虑：

1. 使用 CDN 加速
2. 绑定自定义域名
3. 使用 Cloudflare 代理
