/* ==========================================================================
   data.js —— 数据加载核心
   负责读取 data/photos.json 并暴露给各页面使用。
   ========================================================================== */

/**
 * 加载照片数据。
 * 注意：浏览器直接以 file:// 打开时，fetch 本地 JSON 会被 CORS 安全策略拦截，
 * 此时需通过本地静态服务器访问（见 README.md「如何启动」）。
 * 此处做了降级处理：加载失败时给出清晰提示。
 */
async function loadPhotos() {
  // 优先读取内嵌数据（photos.js 里的 window.PHOTOS_DATA），双击打开也可用
  if (window.PHOTOS_DATA) {
    return window.PHOTOS_DATA;
  }
  // 降级：服务器环境下尝试 fetch
  try {
    const res = await fetch('data/photos.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    return data;
  } catch (err) {
    showLoadError(err);
    return { categories: [], photos: [] };
  }
}

/**
 * 按分类 id 获取该分类下的所有照片。
 * @param {object} data  loadPhotos 返回的完整数据
 * @param {string} catId 分类 id（如 'travel'）
 */
function photosByCategory(data, catId) {
  return (data.photos || []).filter(p => p.category === catId);
}

/**
 * 根据分类 id 查找分类信息。
 */
function findCategory(data, catId) {
  return (data.categories || []).find(c => c.id === catId);
}

/**
 * 照片加载失败时的友好提示（渲染到页面顶部）。
 */
function showLoadError(err) {
  console.error('照片数据加载失败：', err);
  const bar = document.createElement('div');
  bar.style.cssText = [
    'position:fixed', 'top:0', 'left:0', 'right:0', 'z-index:9999',
    'background:#B89B7A', 'color:#fff', 'padding:12px 20px',
    'font-size:14px', 'text-align:center', 'line-height:1.6'
  ].join(';');
  bar.textContent =
    '照片数据读取失败：请勿直接双击打开 HTML 文件，请用本地服务器访问（详见 README.md「如何启动」）。';
  document.body.prepend(bar);
}
