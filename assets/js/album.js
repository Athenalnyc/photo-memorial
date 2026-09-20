/* ==========================================================================
   album.js —— 相册页逻辑
   通过 URL 参数 ?cat=travel 区分分类，渲染瀑布流照片网格。
   ========================================================================== */

// 从 URL 读取当前分类 id，默认 travel
const catId = new URLSearchParams(window.location.search).get('cat') || 'travel';

/**
 * 渲染分类 tab 导航（顶部 6 个分类切换按钮）。
 */
function renderTabs(data) {
  const nav = document.getElementById('album-tabs');
  if (!nav) return;
  nav.innerHTML = '';
  data.categories.forEach(c => {
    const a = document.createElement('a');
    a.href = 'album.html?cat=' + c.id;
    a.className = 'tab' + (c.id === catId ? ' active' : '');
    a.textContent = c.emoji + ' ' + c.name;
    nav.appendChild(a);
  });
}

/**
 * 渲染瀑布流照片卡片。
 */
function renderPhotos(data) {
  const grid = document.getElementById('album-grid');
  const heading = document.getElementById('album-heading');
  const cat = findCategory(data, catId);

  if (!grid) return;

  // 标题区
  if (heading && cat) {
    heading.querySelector('.name').textContent = cat.emoji + ' ' + cat.name;
    heading.querySelector('.desc').textContent = cat.desc || '';
  }

  const photos = photosByCategory(data, catId);
  grid.innerHTML = '';

  if (photos.length === 0) {
    grid.innerHTML = '<p class="empty">这个相册还没有照片，快去 photos.json 添加吧～</p>';
    return;
  }

  photos.forEach(photo => {
    const card = document.createElement('figure');
    card.className = 'album-card hover-lift';
    card.innerHTML = `
      <div class="album-card__media">
        <img class="fade-in-img" src="${photo.file}" alt="${photo.title || ''}" loading="lazy" />
        <div class="album-card__overlay">
          <p class="album-card__memo">${photo.memo || ''}</p>
        </div>
      </div>
      <figcaption class="album-card__title">${photo.title || ''}</figcaption>
    `;

    // 图片淡入
    const img = card.querySelector('img');
    img.addEventListener('load', () => img.classList.add('loaded'));
    if (img.complete) img.classList.add('loaded');

    // 点击打开灯箱
    card.addEventListener('click', () => Lightbox.open(photo));

    grid.appendChild(card);
  });
}

// 页面初始化
(async function main() {
  const data = await loadPhotos();
  renderTabs(data);
  renderPhotos(data);
})();
