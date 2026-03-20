# 部署指南

## 方式一：使用 Vercel（推荐，最简单）

### 1. 通过 Vercel 网站部署（无需命令行）

1. 访问 [vercel.com](https://vercel.com)
2. 使用 GitHub/GitLab/Bitbucket 账号登录
3. 点击 "Add New Project"
4. 导入你的 Git 仓库
5. Vercel 会自动检测配置并部署
6. 几分钟后获得部署链接，如：`https://your-project.vercel.app`

### 2. 通过命令行部署

```bash
# 安装 Vercel CLI（首次使用）
npm install -g vercel

# 登录 Vercel
vercel login

# 部署到生产环境
vercel --prod
```

部署成功后会显示：
```
✅  Production: https://your-project.vercel.app
```

### 更新部署

每次修改代码后：
```bash
# 如果使用 Git + Vercel 网站：直接 push 代码，自动部署
git add .
git commit -m "更新"
git push

# 如果使用命令行：重新运行
vercel --prod
```

---

## 方式二：使用 Netlify

### 1. 通过拖拽部署

1. 构建项目：
```bash
npm run build
```

2. 访问 [app.netlify.com/drop](https://app.netlify.com/drop)
3. 将 `dist` 文件夹拖拽到页面
4. 获得部署链接

### 2. 通过命令行部署

```bash
# 安装 Netlify CLI
npm install -g netlify-cli

# 登录
netlify login

# 部署
netlify deploy --prod --dir=dist
```

---

## 方式三：使用 GitHub Pages

1. 修改 `vite.config.ts`，添加 base 路径：
```typescript
export default defineConfig({
  base: '/your-repo-name/', // 替换为你的仓库名
  // ... 其他配置
})
```

2. 安装 gh-pages：
```bash
npm install -g gh-pages
```

3. 构建并部署：
```bash
npm run build
gh-pages -d dist
```

4. 在 GitHub 仓库设置中启用 GitHub Pages
5. 访问：`https://your-username.github.io/your-repo-name/`

---

## 方式四：临时分享（内网穿透）

### 使用 ngrok

```bash
# 1. 启动开发服务器
npm run dev

# 2. 在新终端运行
npx ngrok http 5173
```

会生成临时链接，如：`https://abc123.ngrok.io`

### 使用 localtunnel

```bash
# 1. 启动开发服务器
npm run dev

# 2. 创建隧道
npx localtunnel --port 5173
```

---

## 本地预览生产构建

部署前可以本地测试：

```bash
# 构建
npm run build

# 预览（需要安装 serve）
npx serve dist
```

---

## 常见问题

### Q: 部署后页面空白？
A: 检查浏览器控制台错误，可能是路径问题。确保 `vite.config.ts` 中的 `base` 配置正确。

### Q: 刷新页面 404？
A: 需要配置路由重写。Vercel 已在 `vercel.json` 中配置好了。

### Q: 如何自定义域名？
A: 在 Vercel/Netlify 控制台的项目设置中添加自定义域名。

---

## 推荐方案

**最快速：Vercel 网站部署**
- 无需命令行
- 自动 HTTPS
- 自动 CI/CD
- 免费

**最灵活：Vercel CLI**
- 适合频繁更新
- 命令行控制
- 支持环境变量
