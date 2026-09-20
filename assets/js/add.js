/* ==========================================================================
   add.js —— 添加照片页逻辑
   上传图片 → 客户端压缩 → 存 localStorage → 相册/地图/首页自动生效
   ========================================================================== */

const STORAGE_KEY = 'photo-memorial-custom';

const els = {
  form: document.getElementById('add-form'),
  dropZone: document.getElementById('drop-zone'),
  fileInput: document.getElementById('file-input'),
  preview: document.getElementById('preview'),
  dropHint: document.getElementById('drop-hint'),
  category: document.getElementById('category'),
  title: document.getElementById('title'),
  place: document.getElementById('place'),
  lat: document.getElementById('lat'),
  lng: document.getElementById('lng'),
  memo: document.getElementById('memo'),
  date: document.getElementById('date'),
  submitBtn: document.getElementById('submit-btn'),
  msg: document.getElementById('form-msg')
};

let selectedFile = null;
let compressedDataUrl = '';

/** 初始化：填充分类下拉 + 默认日期 */
function init() {
  const cats = (window.PHOTOS_DATA && window.PHOTOS_DATA.categories) || [];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.emoji + ' ' + c.name;
    els.category.appendChild(opt);
  });
  els.date.value = new Date().toISOString().slice(0, 10); // 默认今天
}

/** 读取并压缩图片，返回 base64 Data URL */
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
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => reject(new Error('图片读取失败'));
    img.src = URL.createObjectURL(file);
  });
}

/** 选择图片后：预览 + 压缩 */
async function handleFile(file) {
  if (!file || !file.type.startsWith('image/')) {
    setMsg('请选择图片文件', 'err');
    return;
  }
  selectedFile = file;
  // 预览
  els.preview.src = URL.createObjectURL(file);
  els.preview.classList.add('show');
  els.dropHint.style.display = 'none';
  // 压缩
  compressedDataUrl = await compressImage(file);
}

/** 从 localStorage 读取已有自定义照片 */
function readCustom() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

/** 写入 localStorage */
function writeCustom(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function setMsg(text, type) {
  els.msg.textContent = text;
  els.msg.className = 'form-msg ' + (type || '');
}

/** 提交表单 */
async function onSubmit(e) {
  e.preventDefault();

  if (!selectedFile || !compressedDataUrl) {
    setMsg('请先选择一张照片', 'err');
    return;
  }

  const category = els.category.value;
  const lat = parseFloat(els.lat.value);
  const lng = parseFloat(els.lng.value);
  const hasLocation = !isNaN(lat) && !isNaN(lng);

  const photo = {
    id: 'c_' + Date.now(),
    category: category,
    file: compressedDataUrl,
    title: els.title.value.trim(),
    memo: els.memo.value.trim(),
    date: els.date.value
  };
  // 仅当填写了经纬度才加 location（旅行照片）
  if (hasLocation) {
    photo.location = { name: els.place.value.trim(), lat: lat, lng: lng };
  }

  // 存入 localStorage
  const list = readCustom();
  list.push(photo);
  writeCustom(list);

  setMsg('✅ 已保存！回相册看看这张照片吧～', 'ok');

  // 重置表单（保留分类和日期）
  els.title.value = '';
  els.place.value = '';
  els.lat.value = '';
  els.lng.value = '';
  els.memo.value = '';
  selectedFile = null;
  compressedDataUrl = '';
  els.preview.classList.remove('show');
  els.preview.src = '';
  els.dropHint.style.display = '';
  els.fileInput.value = '';
}

// 事件绑定
els.dropZone.addEventListener('click', () => els.fileInput.click());
els.fileInput.addEventListener('change', e => handleFile(e.target.files[0]));

// 拖拽支持
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

init();
