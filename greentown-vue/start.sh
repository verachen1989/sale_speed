#!/bin/bash

echo "🚀 启动绿城数据看板 Vue 版本..."
echo ""

# 检查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    echo ""
fi

echo "✨ 启动开发服务器..."
echo "📱 访问地址: http://localhost:5174"
echo "🌐 外网访问: http://你的IP:5174"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

npm run dev
