/**
 * dsh-official-group-guard — 默认隐藏模型选择器/设置页里的「官方（DeepSeek）」分组，
 * 只有按过 Konami 码（↑↑↓↓←→←→BA）的浏览器才看得到。
 *
 * 注入的样式与脚本放在 **外部文件 `client.html`**，每次首页请求时按 mtime 读一次：
 * 于是调样式/逻辑只需改那个文件 + 浏览器硬刷新，**不需要重启 dsh**（插件代码本身才需要重启）。
 * 可用环境变量 `DSH_OFFICIAL_GROUP_GUARD_CLIENT` 指定其它路径。
 *
 * 为什么这样隐藏（详见 client.html 注释）：
 *   - 选择器菜单坐标是组件测量后写进 state 的，隐藏若发生在测量之后就会"浮空"；
 *   - 数据（选项 title）可能晚于首帧到达，所以 CSS 有两条路径（title 匹配 + JS 标记），
 *     并在隐藏集合变化时派发 resize 让组件重新测量。
 *   - 类名按 CSS-module 键名后缀匹配（`_group`/`_rowCard`/`_rowName`），不依赖哈希前缀。
 *
 * 语义（与使用方约定一致）：没按过码的浏览器**看不到官方分组**（因此无法主动切过去），
 * 但**已经在用官方模型的会话保持可用**，不会被打断或强制切走。
 *
 * 边界：这是可见性遮挡，不是权限；服务端与模型清单都没有变化。
 */
import { readFileSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const name = 'dsh-official-group-guard'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLIENT_FILE = process.env.DSH_OFFICIAL_GROUP_GUARD_CLIENT ?? join(HERE, 'client.html')
const MARKER = 'dsh-official-group-guard'

let cache = { mtimeMs: -1, markup: '' }

function clientMarkup() {
  try {
    const { mtimeMs } = statSync(CLIENT_FILE)
    if (mtimeMs !== cache.mtimeMs) cache = { mtimeMs, markup: readFileSync(CLIENT_FILE, 'utf8') }
    return cache.markup
  } catch {
    return ''
  }
}

export function apply(ctx) {
  ctx.inject(['webServer'], (cctx) => {
    cctx.webServer.tapIndex((page) => {
      if (page.includes(MARKER)) return page
      const body = clientMarkup()
      if (!body) return page
      const block = `${body}\n    <!-- ${MARKER} -->`
      return page.includes('<head>') ? page.replace('<head>', `<head>\n    ${block}`) : `${block}\n${page}`
    })
  })
}
