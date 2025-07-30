#!/bin/bash

# 🚀 自动创建PR脚本
# 使用方法: ./create-pr.sh YOUR_GITHUB_USERNAME

if [ -z "$1" ]; then
    echo "❌ 请提供GitHub用户名"
    echo "使用方法: ./create-pr.sh YOUR_GITHUB_USERNAME"
    exit 1
fi

USERNAME=$1
REPO_NAME="rauzy-fractal-workbench"

echo "🔗 添加远程仓库..."
git remote add origin https://github.com/$USERNAME/$REPO_NAME.git 2>/dev/null || echo "远程仓库已存在"

echo "🚀 推送主分支..."
git push -u origin main

echo "🌟 推送功能分支..."
git push -u origin feature/increase-path-limit-to-300

echo "✅ 推送完成！"
echo ""
echo "🎯 下一步：创建Pull Request"
echo "1. 访问: https://github.com/$USERNAME/$REPO_NAME"
echo "2. 点击 'Compare & pull request' 按钮"
echo "3. 使用 CREATE_PR_GUIDE.md 中的PR描述"
echo ""
echo "📋 PR信息："
echo "- Title: ✨ 升级路径分析能力：支持300条路径同时分析"
echo "- Base: main"
echo "- Compare: feature/increase-path-limit-to-300"
echo ""
echo "🌐 仓库地址: https://github.com/$USERNAME/$REPO_NAME"