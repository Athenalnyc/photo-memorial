/* ==========================================================================
   lightbox.js —— 全屏灯箱组件（相册页 / 地图页共用）
   打开后：大图居中，memo 文字显示在图片下方，可关闭。
   ========================================================================== */

const Lightbox = (function () {
  let el = null;

  /** 初始化：动态创建灯箱 DOM（避免每个 HTML 重复书写） */
  function init() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.innerHTML = `
      <button class="lightbox__close" aria-label="关闭">✕</button>
      <div class="lightbox__panel">
        <img class="lightbox__img" alt="" />
        <div class="lightbox__caption">
          <div class="title"></div>
          <div class="memo"></div>
        </div>
      </div>
    `;

    // 关闭事件：点关闭按钮 / 点空白区域 / 按 Esc
    el.querySelector('.lightbox__close').addEventListener('click', close);
    el.addEventListener('click', (e) => {
      if (e.target === el) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    document.body.appendChild(el);
  }

  /**
   * 打开灯箱并显示某张照片。
   * @param {object} photo 照片对象（含 file / title / memo）
   */
  function open(photo) {
    init();
    el.querySelector('.lightbox__img').src = photo.file;
    el.querySelector('.lightbox__img').alt = photo.title || '';
    el.querySelector('.lightbox__caption .title').textContent = photo.title || '';
    el.querySelector('.lightbox__caption .memo').textContent = photo.memo || '';
    el.classList.add('active');
    document.body.style.overflow = 'hidden'; // 锁定背景滚动
  }

  function close() {
    if (!el) return;
    el.classList.remove('active');
    el.querySelector('.lightbox__img').src = ''; // 释放大图
    document.body.style.overflow = '';
  }

  return { init, open, close };
})();
