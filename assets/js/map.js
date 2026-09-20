/* ==========================================================================
   map.js —— 地图页逻辑
   使用 Leaflet 世界地图，为每个旅行地点放置一个相机图标 marker。
   同一地点的多张照片会合并成一个 marker，弹窗内自动轮播（每 3 秒切一张）。
   ========================================================================== */

// 相机图标 marker（小相机 SVG，转为 Leaflet DivIcon）
const CAMERA_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
       fill="#B89B7A" stroke="#fff" stroke-width="0.6">
    <path d="M9 3l1.5 2H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.5L9 3z"/>
    <circle cx="12" cy="12.5" r="3.4" fill="#fff"/>
  </svg>`;

const CAROUSEL_INTERVAL = 3000; // 轮播间隔（毫秒）

let map = null;

/**
 * 初始化 Leaflet 地图。
 */
function initMap() {
  map = L.map('map').setView([30, 20], 2); // 世界视角

  // 地图瓦片：CartoDB（免费、无需 Key、大陆可访问、WGS84 坐标与 GPS 一致不偏移）
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

/** 生成相机图标 DivIcon */
function cameraIcon() {
  return L.divIcon({
    className: 'camera-marker',
    html: CAMERA_ICON,
    iconSize: [30, 30],
    iconAnchor: [15, 28],
    popupAnchor: [0, -26]
  });
}

/** 单张照片的 popup HTML */
function singlePopup(photo) {
  return `
    <div class="map-popup">
      <img src="${photo.file}" alt="${photo.title || ''}" />
      <div class="map-popup__body">
        <div class="map-popup__title">${photo.title || ''}</div>
        <div class="map-popup__place">📍 ${photo.location.name || ''}</div>
        <p class="map-popup__memo">${photo.memo || ''}</p>
        <button class="map-popup__delete" onclick="removeMapPhoto('${photo.id}', '${photo.file}')">删除这张照片</button>
      </div>
    </div>`;
}

/**
 * 同一地点多张照片 → 可轮播的 popup DOM。
 * 返回的元素上挂载了 _start() / _stop() 用于控制自动轮播。
 */
function carouselPopup(photos) {
  const el = document.createElement('div');
  el.className = 'map-popup map-popup--carousel';
  el.innerHTML = `
    <img class="carousel__img" alt="" />
    <div class="map-popup__body">
      <div class="map-popup__title"></div>
      <div class="map-popup__place"></div>
      <p class="map-popup__memo"></p>
      <button class="map-popup__delete"></button>
    </div>
    <div class="carousel__nav">
      <button class="carousel__btn" data-dir="-1" aria-label="上一张">‹</button>
      <span class="carousel__count"></span>
      <button class="carousel__btn" data-dir="1" aria-label="下一张">›</button>
    </div>`;

  const img = el.querySelector('.carousel__img');
  const title = el.querySelector('.map-popup__title');
  const place = el.querySelector('.map-popup__place');
  const memo = el.querySelector('.map-popup__memo');
  const del = el.querySelector('.map-popup__delete');
  const count = el.querySelector('.carousel__count');

  let idx = 0;
  let timer = null;

  function render(i) {
    const p = photos[i];
    img.src = p.file;
    img.alt = p.title || '';
    title.textContent = p.title || '';
    place.textContent = p.location.name ? '📍 ' + p.location.name : '';
    memo.textContent = p.memo || '';
    del.textContent = '删除这张照片';
    del.onclick = () => removeMapPhoto(p.id, p.file);
    count.textContent = (i + 1) + ' / ' + photos.length;
  }

  function go(i) {
    idx = (i + photos.length) % photos.length;
    render(idx);
  }

  el.querySelectorAll('.carousel__btn').forEach(btn => {
    btn.addEventListener('click', () => go(idx + parseInt(btn.dataset.dir, 10)));
  });

  render(0);

  el._start = () => { el._stop(); timer = setInterval(() => go(idx + 1), CAROUSEL_INTERVAL); };
  el._stop = () => { if (timer) { clearInterval(timer); timer = null; } };

  return el;
}

/**
 * 为旅行照片放置 marker。按地点分组：同一地点的多张照片合并成一个 marker 并轮播。
 */
function addMarkers(data) {
  const travelPhotos = photosByCategory(data, 'travel').filter(p =>
    p.location && p.location.lat != null && p.location.lng != null
  );

  // 按地点分组（优先地点名，其次坐标，避免同名照片各自重叠）
  const groups = new Map();
  travelPhotos.forEach(photo => {
    const name = (photo.location.name || '').trim();
    const key = name
      ? 'n:' + name
      : 'c:' + photo.location.lat.toFixed(5) + ',' + photo.location.lng.toFixed(5);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(photo);
  });

  groups.forEach(photos => {
    const first = photos[0];
    const marker = L.marker([first.location.lat, first.location.lng], { icon: cameraIcon() }).addTo(map);

    if (photos.length === 1) {
      marker.bindPopup(singlePopup(photos[0]), { maxWidth: 260 });
    } else {
      const carousel = carouselPopup(photos);
      marker.bindPopup(carousel, { maxWidth: 260 });
      // 打开时开始轮播，关闭时停止，避免后台空转
      marker.on('popupopen', () => carousel._start());
      marker.on('popupclose', () => carousel._stop());
    }
  });
}

/** 地图弹窗里的删除：二次确认 → 删除 → 刷新 */
window.removeMapPhoto = async function (id, fileUrl) {
  if (!confirm('确定要删除这张照片吗？删除后不可恢复。')) return;
  try {
    await deletePhoto(id, fileUrl);
    window.location.reload();
  } catch (e) {
    alert('删除失败：' + (e.message || e));
  }
};

// 页面初始化
(async function main() {
  const user = await requireAuth();
  if (!user) return;
  await migrateIfNeeded();
  initMap();
  const data = await loadPhotos();
  addMarkers(data);
})();
