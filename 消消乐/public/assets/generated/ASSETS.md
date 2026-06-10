# AI 生成素材说明

本目录保存第一批 AI 生成的原创游戏素材，主题参考 README 中的“律政恋爱推理 / 未名市调查档案”方向，不直接使用官方素材、官方 logo 或官方角色图。

## 文件清单

| 文件 | 用途 | 建议处理 |
| --- | --- | --- |
| `tiles-basic-sheet.png` | 6 种基础棋子图标母图 | 按 `3 x 2` 网格切分，导出透明 PNG |
| `tiles-special-sheet.png` | 4 种特殊棋子图标母图 | 按 `2 x 2` 网格切分，导出透明 PNG |
| `background-menu.png` | 主菜单背景 | 作为 16:9 背景图使用 |
| `background-gameplay.png` | 游戏内棋盘背景 | 作为 16:9 背景图使用，中心叠加棋盘 |
| `effects-sheet.png` | 消除与连锁特效母图 | 按 `3 x 2` 网格切分，建议去绿幕后使用 |

## 基础棋子顺序

`tiles-basic-sheet.png` 为 `3 x 2` 排列，建议按从左到右、从上到下命名：

1. `tile-law-badge`
2. `tile-evidence-bag`
3. `tile-rose-letter`
4. `tile-magnifier`
5. `tile-case-file`
6. `tile-crystal-scales`

## 特殊棋子顺序

`tiles-special-sheet.png` 为 `2 x 2` 排列，建议按从左到右、从上到下命名：

1. `special-pen-horizontal`
2. `special-courtroom-vertical`
3. `special-evidence-bomb`
4. `special-investigation-chip`

## 特效顺序

`effects-sheet.png` 为 `3 x 2` 排列，建议按从左到右、从上到下命名：

1. `vfx-sparkle-burst`
2. `vfx-rose-gold-glint`
3. `vfx-scan-ring`
4. `vfx-paper-pop`
5. `vfx-justice-flash`
6. `vfx-victory-glow`

## 后续处理建议

- 图标母图使用纯色背景生成，正式接入前建议切图并移除背景。
- Phaser 中推荐最终使用独立 PNG 或 Texture Atlas。
- 棋子实际显示尺寸建议从 `96 x 96` 或 `128 x 128` 开始测试。
- 背景图可直接接入，但需要在游戏中叠加半透明棋盘底板保证可读性。
- 若后续需要更统一的生产质量，可以基于本批素材继续生成第二版精修素材。
