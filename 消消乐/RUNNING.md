# 运行说明

当前版本是无依赖 Canvas 初版，不需要安装 npm 包即可运行。

## 直接打开

可以直接用浏览器打开：

```text
消消乐/index.html
```

也可以双击：

```text
消消乐/start-game.bat
```

它会启动本地静态服务并打开浏览器。

## 本地服务运行

也可以在 `消消乐` 目录下启动内置静态服务：

```powershell
& 'C:\Users\10504\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' .\tools\static-server.js 5173
```

然后访问：

```text
http://localhost:5173
```

如果你的系统 PATH 中已有 Node，也可以直接运行：

```powershell
node .\tools\static-server.js 5173
```

## 当前已实现

- 主菜单、继续案件、重开、下一关。
- `8 x 8` 三消棋盘。
- 相邻棋子交换。
- 非法交换回退。
- 3 连消除。
- 4 连生成横向或纵向特殊棋子。
- 5 连生成同色清除特殊棋子。
- 消除、下落、补位和自动连锁。
- 分数、步数、目标和胜负结算。
- AI 生成背景、棋子素材和舒缓 BGM 接入。
- 点击、选择、交换、消除等短音效使用 Web Audio 合成。

## 后续可增强

- 将母图切成独立 Texture Atlas。
- 追加 T 型和 L 型爆炸棋子判定。
- 增加障碍格、指定证据收集目标。
- 使用 Phaser 3 重构渲染层。
