#!/bin/bash

echo "🚀 开始部署到 Vercel..."
echo ""

# 检查是否安装了 vercel
if ! command -v vercel &> /dev/null
then
    echo "📦 正在安装 Vercel CLI..."
    npm install -g vercel
fi

# 构建项目
echo "🔨 正在构建项目..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ 构建成功！"
    echo ""
    echo "📤 正在部署到 Vercel..."
    echo ""
    
    # 部署到生产环境
    vercel --prod
else
    echo "❌ 构建失败，请检查错误信息"
    exit 1
fi
