/**
 * dsh-official-group-guard — 默认隐藏模型选择器/设置页里的「官方（DeepSeek）」分组，
 * 只有按过 Konami 码（↑↑↓↓←→←→BA）的浏览器才看得到。
 *
 * 为什么：内网部署里 DeepSeek 官方模型是经本机中转出去的个人通路，不希望同事在界面上
 * 看到或选中它们；但本人需要能用。所以做成"视线遮挡 + 按键解锁"，不改 vendor、不动服务端。
 *
 * 覆盖两处界面：
 *   1. 会话里的模型选择器（dsh-client-ui-model-selection）：按 provider 分组渲染，
 *      组容器类名以 `_group` 结尾，标题 `_groupTitle`，选项按钮 `_option`，当前项额外带 `_selected`。
 *   2. 设置 → 模型页（dsh-client-ui-settings-models）：每个提供方一行，行容器 `_rowCard`，行名 `_rowName`。
 *   类名的哈希前缀会随构建变，但键名后缀稳定——所以一律按"后缀匹配"，与 dsh-download-button 同一套手法。
 *
 * 例外：当前会话如果正在用官方模型（选项带 `_selected`），该分组保持可见——否则本人会看不到自己
 * 正选中的东西，界面反而变得不可解释。
 *
 * 注意：这是**可见性遮挡**，不是权限。模型清单仍会下发到浏览器；要真隔离得动服务端。
 */
export const name = 'dsh-official-group-guard'

const SCRIPT = `<script>
(() => {
  if (window.__dshOfficialGroupGuard) return;
  window.__dshOfficialGroupGuard = true;

  const STORAGE_KEY = 'dsh.official-group.visible';
  const KONAMI = ['arrowup','arrowup','arrowdown','arrowdown','arrowleft','arrowright','arrowleft','arrowright','b','a'];
  // 判定"官方分组"：分组标题或选项文案命中即算。模型 id 是主要依据，标题是兜底。
  const OFFICIAL = /deepseek|official|官方/i;

  if (window.__dshOfficialGroup === undefined) window.__dshOfficialGroup = null;
  const isVisible = () => window.__dshOfficialGroup === true || localStorage.getItem(STORAGE_KEY) === '1';

  const suffixes = (el) => Array.from(el.classList || []);
  const hasSuffix = (el, suffix) => suffixes(el).some((c) => c.endsWith(suffix));
  const label = (el) => ((el && (el.getAttribute('title') || el.textContent)) || '').trim();

  function toast(message) {
    const box = document.createElement('div');
    box.textContent = message;
    box.style.cssText = 'position:fixed;right:16px;bottom:16px;z-index:2147483647;padding:10px 14px;border-radius:8px;' +
      'background:rgba(20,20,24,.92);color:#fff;font:13px/1.4 system-ui,sans-serif;box-shadow:0 4px 16px rgba(0,0,0,.35)';
    document.body.appendChild(box);
    setTimeout(() => box.remove(), 1800);
  }

  function hide(el, hidden) {
    if (hidden) {
      if (el.style.display !== 'none') el.dataset.dshOggHidden = '1';
      el.style.display = 'none';
    } else if (el.dataset.dshOggHidden === '1') {
      el.style.display = '';
      delete el.dataset.dshOggHidden;
    }
  }

  function officialGroup(group) {
    const title = Array.from(group.children).find((c) => hasSuffix(c, '_groupTitle'));
    if (title && OFFICIAL.test(label(title))) return true;
    return Array.from(group.querySelectorAll('button')).some((b) => OFFICIAL.test(label(b)));
  }

  function applyToPicker(show) {
    document.querySelectorAll('[class*="_group"]').forEach((group) => {
      if (!hasSuffix(group, '_group')) return;
      if (!officialGroup(group)) return;
      const selected = Array.from(group.querySelectorAll('button')).some((b) => hasSuffix(b, '_selected'));
      hide(group, !show && !selected);
    });
  }

  function applyToSettings(show) {
    document.querySelectorAll('[class*="_rowCard"]').forEach((row) => {
      if (!hasSuffix(row, '_rowCard')) return;
      const name = Array.from(row.querySelectorAll('*')).find((el) => hasSuffix(el, '_rowName'));
      if (!name || !OFFICIAL.test(label(name))) return;
      hide(row, !show);
    });
  }

  function apply() {
    const show = isVisible();
    applyToPicker(show);
    applyToSettings(show);
  }

  // Konami 码：命中即翻转，状态只存在本浏览器
  let progress = 0;
  window.addEventListener('keydown', (event) => {
    const key = String(event.key || '').toLowerCase();
    if (key === KONAMI[progress]) {
      progress += 1;
      if (progress === KONAMI.length) {
        progress = 0;
        const now = isVisible();
        window.__dshOfficialGroup = !now;
        try { localStorage.setItem(STORAGE_KEY, String(!now)); } catch {}
        toast(!now ? '官方分组：已显示（本浏览器）' : '官方分组：已隐藏');
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
      return page.includes('<head>')
        ? page.replace('<head>', `<head>\n    <!-- dsh-official-group-guard -->\n    ${SCRIPT}`)
        : `${SCRIPT}\n${page}`
    })
  })
}
