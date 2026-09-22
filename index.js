/**
 * dsh-official-group-guard — 默认隐藏模型选择器/设置页里的「官方（DeepSeek）」分组，
 * 只有按过 Konami 码（↑↑↓↓←→←→BA）的浏览器才看得到。
 *
 * 为什么：内网部署下 DeepSeek 官方模型往往是个人通路（经本机中转过网），同事不该在界面上
 * 看到或选中它们，但本人需要能用。做成"视线遮挡 + 按键解锁"，不改 vendor、不动服务端。
 *
 * 实现要点（v0.1.2 起）：
 *   - **选择器用纯 CSS 隐藏**：菜单坐标是组件测量后写进 `menuPos` 的（`style: menuPos ?? MEASURE_STYLE`），
 *     若在测量之后再隐藏，坐标会留在旧值 → 选项"浮空"。CSS 在样式计算阶段生效，早于测量，
 *     所以用 CSS 规则隐藏分组，菜单高度从一开始就是对的。
 *   - 设置页的行用 JS 隐藏（普通文档流、无测量，异步隐藏不会错位）。
 *   - 浏览器不支持 `:has()` 时退回 JS 隐藏并派发 resize 让组件重新测量。
 *   - 判定"官方"：选项按钮的 `title`（模型名，如 DeepSeek-V41-Flash）命中 /deepseek|official|官方/i；
 *     当前会话正在用的模型（`aria-checked="true"`）所在分组保持可见。
 *   - 类名按 CSS-module **键名后缀**匹配（`_group`/`_rowCard`/`_rowName`），哈希前缀随构建变但后缀稳定。
 *
 * 注意：这是**可见性遮挡**，不是权限。模型清单仍会下发到浏览器；要真隔离得动服务端。
 */
export const name = 'dsh-official-group-guard'

const STYLE = `<style id="dsh-official-group-guard-style">
  /* 模型选择器：隐藏官方分组（整组）；当前选中的那一项所在分组例外，保持可见 */
  html.dsh-ogg-hide [class$="_group"]:has(button[title*="deepseek" i]):not(:has(button[aria-checked="true"])) {
    display: none;
  }
</style>`

const SCRIPT = `<script>
(() => {
  if (window.__dshOfficialGroupGuard) return;
  window.__dshOfficialGroupGuard = true;

  const STORAGE_KEY = 'dsh.official-group.visible';
  const HIDE_CLASS = 'dsh-ogg-hide';
  const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  const OFFICIAL = /deepseek|official|官方/i;
  const SUPPORTS_HAS = (() => { try { return CSS.supports('selector(:has(*))'); } catch { return false; } })();

  if (window.__dshOfficialGroup === undefined) window.__dshOfficialGroup = null;
  const isVisible = () => window.__dshOfficialGroup === true || localStorage.getItem(STORAGE_KEY) === '1';

  const hasSuffix = (el, suffix) => Array.from(el.classList || []).some((c) => c.endsWith(suffix));
  const label = (el) => ((el && (el.getAttribute('title') || el.textContent)) || '').trim();

  function toast(message) {
    const box = document.createElement('div');
    box.textContent = message;
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:10px 14px;border-radius:8px;' +
      'background:rgba(20,20,24,.92);color:#fff;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35)';
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1800);
  }

  function applyFlag(show) {
    document.documentElement.classList.toggle(HIDE_CLASS, !show);
  }

  // 设置页：提供方行（普通流，异步隐藏安全）
  function applyToSettings(show) {
    document.querySelectorAll('[class*="_rowCard"]').forEach((row) => {
      if (!hasSuffix(row, '_rowCard')) return;
      const name = Array.from(row.querySelectorAll('*')).find((el) => hasSuffix(el, '_rowName'));
      if (!name || !OFFICIAL.test(label(name))) return;
      const hide = !show;
      if (hide) { row.style.display = 'none'; row.dataset.dshOggHidden = '1'; }
      else if (row.dataset.dshOggHidden === '1') { row.style.display = ''; delete row.dataset.dshOggHidden; }
    });
  }

  // 兜底：浏览器不支持 :has() 时，用 JS 隐藏选择器分组 + 派发 resize 让组件重新测量
  function applyToPickerFallback(show) {
    let changed = false;
    document.querySelectorAll('[class$="_group"]').forEach((group) => {
      const buttons = Array.from(group.querySelectorAll('button'));
      if (!buttons.some((b) => OFFICIAL.test(label(b)))) return;
      const selected = buttons.some((b) => b.getAttribute('aria-checked') === 'true');
      const hide = !show && !selected;
      if (hide && group.style.display !== 'none') { group.style.display = 'none'; group.dataset.dshOggHidden = '1'; changed = true; }
      else if (!hide && group.dataset.dshOggHidden === '1') { group.style.display = ''; delete group.dataset.dshOggHidden; changed = true; }
    });
    // 菜单坐标是测量结果，隐藏后必须让它重新测一次
    if (changed) { try { window.dispatchEvent(new Event('resize')); } catch {} }
  }

  function apply() {
    const show = isVisible();
    applyFlag(show);
    applyToSettings(show);
    if (!SUPPORTS_HAS) applyToPickerFallback(show);
  }

  let progress = 0;
  window.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    if (key === KONAMI[progress]) {
      progress += 1;
      if (progress === KONAMI.length) {
        progress = 0;
        const next = !isVisible();
        window.__dshOfficialGroup = next;
        try { localStorage.setItem(STORAGE_KEY, String(next)); } catch {}
        toast(next ? '官方分组：已显示（本浏览器）' : '官方分组：已隐藏');
        apply();
      }
      return;
    }
    progress = key === KONAMI[0] ? 1 : 0;
  }, true);

  new MutationObserver(() => apply()).observe(document.documentElement, { childList: true, subtree: true });
  document.addEventListener('DOMContentLoaded', apply);
  apply();
  console.log('dsh-official-group-guard: enabled (', isVisible() ? 'official group visible' : 'official group hidden', ')');
})();
</script>`

export function apply(ctx) {
  ctx.inject(['webServer'], (cctx) => {
    cctx.webServer.tapIndex((page) => {
      if (page.includes('dsh-official-group-guard')) return page
      const markup = `${STYLE}\n    <!-- dsh-official-group-guard -->\n    ${SCRIPT}`
      return page.includes('<head>') ? page.replace('<head>', `<head>\n    ${markup}`) : `${markup}\n${page}`
    })
  })
}
