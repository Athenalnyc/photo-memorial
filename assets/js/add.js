/* ==========================================================================
   add.js —— 添加照片页逻辑（云端版）
   上传图片 → 客户端压缩 → 上传到 Supabase Storage + 写入数据库
   ========================================================================== */

const els = {
  form: document.getElementById('add-form'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  preview: document.getElementById('preview'),
  dropHint: document.getElementById('drop-hint'),
  category: document.getElementById('category'),
  title: document.getElementById('title'),
  place: document.getElementById('place'),
  locateBtn: document.getElementById('locate-btn'),
  lat: document.getElementById('lat'),
  lng: document.getElementById('lng'),
  memo: document.getElementById('memo'),
  date: document.getElementById('date'),
  submitBtn: document.getElementById('submit-btn'),
  msg: document.getElementById('form-msg')
};

let selectedFile = null;
let compressedBlob = null;

function setMsg(text, type) {
  els.msg.textContent = text;
  els.msg.className = 'form-msg ' + (type || '');
}

/** 初始化：填充分类下拉 + 默认日期 */
function init() {
  CATEGORIES.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.emoji + ' ' + c.name;
    els.category.appendChild(opt);
  });
  els.date.value = new Date().toISOString().slice(0, 10);
}

/** 压缩图片，返回 Blob（JPG，长边 1600，质量 82%） */
function compressImage(file, maxDim = 1600, quality = 0.82) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      canvas.getContext('2d').drawImage(img, 0, 0, w, h);
      canvas.toBlob(blob => {
        if (blob) resolve(blob);
        else reject(new Error('图片压缩失败'));
      }, 'image/jpeg', quality);
    };
    img.onerror = () => reject(new Error('图片读取失败'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * 地点名 → 经纬度（Nominatim 免费地理编码，无需 Key）。
 * 返回 { lat, lng }；找不到或网络失败时抛出错误。
 */
async function geocodePlace(name) {
  const url = 'https://nominatim.openstreetmap.org/search'
    + '?format=json&limit=1&q=' + encodeURIComponent(name);
  const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('定位服务不可用（HTTP ' + res.status + '）');
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) {
    throw new Error('没找到这个地点，换个写法或手动填经纬度');
  }
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}

/** 点击「自动定位」：把地点名转成经纬度填入输入框 */
async function onLocate() {
  const name = els.place.value.trim();
  if (!name) {
    setMsg('请先填写地点名，再点自动定位', 'err');
    return;
  }
  els.locateBtn.disabled = true;
  els.locateBtn.textContent = '定位中…';
  try {
    const { lat, lng } = await geocodePlace(name);
    els.lat.value = lat.toFixed(5);
    els.lng.value = lng.toFixed(5);
    setMsg('✅ 已定位：' + lat.toFixed(5) + ', ' + lng.toFixed(5), 'ok');
  } catch (e) {
    setMsg('定位失败：' + (e.message || e), 'err');
  } finally {
    els.locateBtn.disabled = false;
    els.locateBtn.textContent = '🔍 自动定位';
  }
}

/** 选择图片：预览 + 压缩 */
async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    setMsg('请选择图片文件', 'err');
    return;
  }
  selectedFile = file;
  els.preview.src = URL.createObjectURL(file);
  els.preview.classList.add('show');
  els.dropHint.style.display = 'none';
  compressedBlob = await compressImage(file);
}

/** 提交：上传到云端 */
async function onSubmit(e) {
  e.preventDefault();

  if (!selectedFile || !compressedBlob) {
    setMsg('请先选择一张照片', 'err');
    return;
  }

  let lat = parseFloat(els.lat.value);
  let lng = parseFloat(els.lng.value);
  let hasLocation = !isNaN(lat) && !isNaN(lng);

  // 旅行照片：填了地点名但没填经纬度时，自动地理编码（填个地点名就能上地图）
  const placeName = els.place.value.trim();
  if (!hasLocation && placeName) {
    try {
      const geo = await geocodePlace(placeName);
      lat = geo.lat;
      lng = geo.lng;
      hasLocation = true;
      els.lat.value = lat.toFixed(5);
      els.lng.value = lng.toFixed(5);
    } catch (e) {
      console.warn('自动定位失败（照片仍会保存，只是不上地图）：', e.message || e);
    }
  }

  const meta = {
    category: els.category.value,
    title: els.title.value.trim(),
    memo: els.memo.value.trim(),
    location: hasLocation ? { name: placeName, lat: lat, lng: lng } : null,
    date: els.date.value
  };

  els.submitBtn.disabled = true;
  els.submitBtn.textContent = '上传中…';

  try {
    const file = new File([compressedBlob], 'photo.jpg', { type: 'image/jpeg' });
    await uploadPhoto(file, meta);
    setMsg('✅ 已上传！回相册看看这张照片吧～', 'ok');

    // 重置表单
    els.title.value = '';
    els.place.value = '';
    els.lat.value = '';
    els.lng.value = '';
    els.memo.value = '';
    selectedFile = null;
    compressedBlob = null;
    els.preview.classList.remove('show');
    els.preview.src = '';
    els.dropHint.style.display = '';
    els.fileInput.value = '';
  } catch (err) {
    setMsg('上传失败：' + (err.message || err), 'err');
  } finally {
    els.submitBtn.disabled = false;
    els.submitBtn.textContent = '保存这张照片';
  }
}

// 事件绑定
els.dropZone.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', e => handleFile(e.target.files[0]));
els.dropZone.addEventListener('dragover', e => {
  e.preventDefault();
  els.dropZone.classList.add('dragover');
});
els.dropZone.addEventListener('dragleave', () => els.dropZone.classList.remove('dragover'));
els.dropZone.addEventListener('drop', e => {
  e.preventDefault();
  els.dropZone.classList.remove('dragover');
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
els.form.addEventListener('submit', onSubmit);
els.locateBtn.addEventListener('click', onLocate);

// 登录校验 + 初始化
(async function main() {
  const user = await requireAuth();
  if (!user) return;
  init();
})();
