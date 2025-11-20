# claude code

```shell
npm install -g @anthropic-ai/claude-code
```

1. 配置auth key: ~/.claude/settings.json

```json
{
  "env": {
    "ANTHROPIC_AUTH_TOKEN": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
    "ANTHROPIC_BASE_URL": "https://www.packyapi.com"
  },
  "alwaysThinkingEnabled": false,
  "model": "haiku"
}
```

2. 其他配置路径：~/.claude.json
3. 添加CLAUDE.md，添加模型需要遵守的规则
