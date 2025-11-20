# mcp 列表

## sequential-thinking

深度思考

## browser-tools-server

偏向浏览器自动化 +监控：导航、表单填充、日志抓取、截图、自动任务。

步骤 1： 安装 Chrome 扩展程序 – 从 发布页面 下载并将其加载到 Chrome 的扩展程序管理器中。

步骤 2： 启动中间件服务器 (保持此终端打开)

npx -y @agentdeskai/browser-tools-server@latest

npx -y @agentdeskai/browser-tools-mcp@latest

步骤 3： 将 MCP 服务器添加到 Claude Code (在单独的终端中)
claude mcp add browser-tools -s user -- npx -y @agentdeskai/browser-tools-mcp@latest

步骤 4： 打开 Chrome DevTools (F12) 并找到 BrowserTools 标签。

## chrome-devtools-mcp

chrome官方提供，用于测试性能，抓帧，更高级的用法

codex mcp add chrome-devtools -- npx chrome-devtools-mcp@latest

claude mcp add chrome-devtools -s user -- npx chrome-devtools-mcp@latest

## context7 mcp

使用最新的仓库文档

claude mcp add context7 -- npx -y @upstash/context7-mcp --api-key ctx7sk-b3b75701-990b-4c3c-908b-78e82bacd9c5
promote：xxxxxx，使用context7

claude mcp add --transport http context7 https://mcp.context7.com/mcp --header "CONTEXT7_API_KEY: ctx7sk-b3b75701-990b-4c3c-908b-78e82bacd9c5" -s user

## deepwiki

快速熟悉一个github仓库
