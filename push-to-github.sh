#!/bin/bash

# 🚀 推送到GitHub脚本
# 使用方法: ./push-to-github.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "❌ 请提供GitHub用户名"
    echo "使用方法: ./push-to-github.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="rauzy-fractal-workbench"

echo "🔗 添加远程仓库..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git

echo "🚀 推送到GitHub..."
git branch -M main
git push -u origin main

echo "✅ 推送完成！"
echo "🌐 仓库地址: https://github.com/$USERNAME/$REPO_NAME"