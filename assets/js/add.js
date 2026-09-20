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

  const lat = parseFloat(els.lat.value);
  const lng = parseFloat(els.lng.value);
  const hasLocation = !isNaN(lat) && !isNaN(lng);

  const meta = {
    category: els.category.value,
    title: els.title.value.trim(),
    memo: els.memo.value.trim(),
    location: hasLocation ? { name: els.place.value.trim(), lat: lat, lng: lng } : null,
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

// 登录校验 + 初始化
(async function main() {
  const user = await requireAuth();
  if (!user) return;
  init();
})();
