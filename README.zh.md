# dsh-official-group-guard

[English](README.md) | 中文

默认隐藏 dsh 界面里的「官方（DeepSeek）」模型分组，按下 **↑↑↓↓←→←→BA** 才显示。

## 它解决什么

在内网部署里，DeepSeek 官方模型往往是一条**个人通路**（例如经本机中转出网）：

- 同事不该在模型选择器里看到/选中它们；
- 但本人需要随时能用。

这个插件把官方分组默认为隐藏，只在你按过 Konami 码的那个浏览器里显示。不改 `node_modules`、不动服务端，与 `dsh-download-button` / `dsh-force-motion` 同一套注入手法。

## 覆盖的界面

| 界面 | 处理 |
|---|---|
| 会话里的模型选择器 | 隐藏官方分组；**当前会话正在用官方模型时该组保持可见**（否则你会看不到自己选中的东西） |
| 设置 → 模型页 | 隐藏官方提供方那一行 |

## 安装

```sh
dsh plugin --profile web add github:maxesisnclaw/dsh-official-group-guard
```

然后重启 dsh。

## 使用

1. 默认：官方分组不出现。
2. 在页面上按 **↑ ↑ ↓ ↓ ← → ← → B A** → 显示（右下角有一行提示），状态存在该浏览器的 `localStorage`（键 `dsh.official-group.visible`）。
3. 再按一次 → 隐藏。
4. 想跳过按键直接显示：控制台执行 `localStorage.setItem('dsh.official-group.visible','1')` 后刷新。

## 实现要点（为什么能扛升级）

- dsh 的 CSS-module 类名形如 `<hash>_group` / `<hash>_rowCard`：**哈希会变，键名后缀不会**，所以选择器一律按后缀匹配（`[class*="_group"]` + `classList` 精确结尾判断）。
- 菜单是点开才渲染的 → 用 `MutationObserver` 持续重新应用。
- 判定"官方"：分组标题或选项文案命中 `/deepseek|official|官方/i`。


## 迭代方式（重要）

注入的样式与脚本放在**外部文件 `client.html`**，插件每次首页请求按 mtime 读一次：

```bash
vi ~/claw-work/dsh-plugins/dsh-official-group-guard/client.html   # 改样式/逻辑
# 浏览器 Ctrl+Shift+R 即可生效 —— 不需要重启 dsh
```

只有**插件代码本身**（`index.js` / `cordis.patch.yml`）改动才需要重启。可用环境变量
`DSH_OFFICIAL_GROUP_GUARD_CLIENT` 指定其它路径。

## 已知时序问题与处理

模型选择器的菜单坐标是组件**测量后写进 state** 的（`style: menuPos ?? MEASURE_STYLE`），
而选项数据（`title`）可能晚于首帧到达 —— 隐藏若发生在测量之后就表现为"菜单浮空"。
因此：CSS 有两条路径（按 `title` 匹配 + 按 JS 打的 `data-dsh-ogg` 标记），并且**隐藏集合一变就派发
`resize`** 让组件重新测量（组件监听 `resize`/`scroll`），菜单出现后还会在若干帧上各测一次。

## 边界（重要）

这是**可见性遮挡，不是权限隔离**。模型清单仍会下发到浏览器（打开开发者工具能看到），服务端也没有变化。要真正限制使用，得从服务端下手（例如让出网中转只在特定条件下接受请求）。

## License

MIT
