/* ==========================================================================
   index.js —— 首页逻辑
   渲染 6 个相册分类入口卡片 + 地图入口，显示每个相册的照片数量。
   ========================================================================== */

async function renderHome(data) {
  const grid = document.getElementById('home-categories');
  if (!grid) return;

  grid.innerHTML = '';

  // 6 个相册分类卡片
  data.categories.forEach(c => {
    const count = photosByCategory(data, c.id).length;
    const a = document.createElement('a');
    a.href = 'album.html?cat=' + c.id;
    a.className = 'cat-card hover-lift';
    a.innerHTML = `
      <div class="cat-card__emoji">${c.emoji}</div>
      <div class="cat-card__name">${c.name}</div>
      <div class="cat-card__count">${count} 张照片</div>
      <div class="cat-card__desc">${c.desc || ''}</div>
    `;
    grid.appendChild(a);
  });
}

(async function main() {
  const user = await requireAuth();
  if (!user) return;
  await migrateIfNeeded();
  const data = await loadPhotos();
  renderHome(data);
})();
