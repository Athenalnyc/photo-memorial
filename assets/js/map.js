/* ==========================================================================
   map.js —— 地图页逻辑
   使用 Leaflet 世界地图，为每张旅行照片放置一个相机图标 marker，
   点击 marker 弹出 popup：缩略图 + memo + 地点名。
   ========================================================================== */

// 相机图标 marker（小相机 SVG，转为 Leaflet DivIcon）
const CAMERA_ICON = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"
       fill="#B89B7A" stroke="#fff" stroke-width="0.6">
    <path d="M9 3l1.5 2H19a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2.5L9 3z"/>
    <circle cx="12" cy="12.5" r="3.4" fill="#fff"/>
  </svg>`;

let map = null;

/**
 * 初始化 Leaflet 地图。
 */
function initMap() {
  map = L.map('map').setView([30, 20], 2); // 世界视角

  // 地图瓦片：CartoDB（免费、无需 Key、大陆可访问、WGS84 坐标与 GPS 一致不偏移）
  // 备选源（若仍无法加载，可切换）：
  //   Esri 街道图：https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
    subdomains: 'abcd',
    maxZoom: 20
  }).addTo(map);
}

/**
 * 为旅行照片放置 marker。
 */
function addMarkers(data) {
  const travelPhotos = photosByCategory(data, 'travel');

  travelPhotos.forEach(photo => {
    // 仅处理带坐标的照片
    if (!photo.location || photo.location.lat == null || photo.location.lng == null) return;

    const icon = L.divIcon({
      className: 'camera-marker',
      html: CAMERA_ICON,
      iconSize: [30, 30],
      iconAnchor: [15, 28],
      popupAnchor: [0, -26]
    });

    const popupHTML = `
      <div class="map-popup">
        <img src="${photo.file}" alt="${photo.title || ''}" />
        <div class="map-popup__body">
          <div class="map-popup__title">${photo.title || ''}</div>
          <div class="map-popup__place">📍 ${photo.location.name || ''}</div>
          <p class="map-popup__memo">${photo.memo || ''}</p>
          <button class="map-popup__delete" onclick="removeMapPhoto('${photo.id}', '${photo.file}')">删除这张照片</button>
        </div>
      </div>
    `;

    L.marker([photo.location.lat, photo.location.lng], { icon })
      .addTo(map)
      .bindPopup(popupHTML, { maxWidth: 260 });
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
