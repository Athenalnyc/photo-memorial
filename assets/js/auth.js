/* ==========================================================================
   auth.js —— 认证与 Supabase 客户端（全站共用）
   负责：初始化 Supabase、登录/注册/退出、会话检查、读取/写入照片数据。
   ========================================================================== */

// 初始化 Supabase 客户端
const supabase = window.supabase.createClient(
  window.SUPABASE_CONFIG.url,
  window.SUPABASE_CONFIG.anonKey
);

// 固定的 6 大分类（保留在前端，不存数据库）
const CATEGORIES = [
  { "id": "travel",   "name": "旅行照片",     "emoji": "🌍", "desc": "走过的地方与看过的风景" },
  { "id": "friends",  "name": "朋友&情侣合照", "emoji": "💛", "desc": "陪伴与欢笑的瞬间" },
  { "id": "family",   "name": "家人合照",     "emoji": "🏠", "desc": "亲情与团聚的温暖" },
  { "id": "portrait", "name": "自拍&人像",    "emoji": "📸", "desc": "成长的每一个样子" },
  { "id": "food",     "name": "美食照片",     "emoji": "🍜", "desc": "餐桌上的小确幸" },
  { "id": "work",     "name": "工作照片",     "emoji": "💼", "desc": "认真生活的记录" }
];

/* ---- 会话 / 用户 ---- */

/** 获取当前登录用户，未登录返回 null */
async function currentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user || null;
}

/** 要求已登录，否则跳转登录页。返回 user 或 null */
async function requireAuth() {
  const user = await currentUser();
  if (!user) {
    window.location.href = 'login.html';
    return null;
  }
  return user;
}

/* ---- 登录 / 注册 / 退出 ---- */

async function signIn(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

async function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

async function signOut() {
  await supabase.auth.signOut();
  window.location.href = 'login.html';
}

/* ---- 照片数据（云端） ---- */

/**
 * 读取当前用户的所有照片，并转换成前端统一的格式。
 * 返回 { categories, photos }，photos 的字段与之前 photos.js 一致。
 */
async function loadPhotos() {
  const user = await currentUser();
  if (!user) return { categories: CATEGORIES, photos: [] };

  const { data, error } = await supabase
    .from('photos')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('读取照片失败：', error);
    return { categories: CATEGORIES, photos: [] };
  }

  // 数据库字段 → 前端字段
  const photos = (data || []).map(p => ({
    id: p.id,
    category: p.category,
    file: p.file_url,
    title: p.title || '',
    memo: p.memo || '',
    location: (p.lat != null && p.lng != null)
      ? { name: p.location_name || '', lat: p.lat, lng: p.lng }
      : undefined,
    date: p.date || ''
  }));

  return { categories: CATEGORIES, photos };
}

/**
 * 上传一张照片到云端（图片进 Storage，信息进数据库）。
 * @param {File} file 图片文件
 * @param {object} meta { category, title, memo, location:{name,lat,lng}, date }
 */
async function uploadPhoto(file, meta) {
  const user = await currentUser();
  if (!user) throw new Error('未登录');

  // 1. 上传图片到 Storage，路径：{user_id}/{时间戳}.jpg
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const filePath = `${user.id}/${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from('photos')
    .upload(filePath, file, { contentType: file.type });

  if (uploadError) throw uploadError;

  // 2. 拿到图片公开 URL
  const { data: urlData } = supabase.storage.from('photos').getPublicUrl(filePath);

  // 3. 写入数据库
  const { error: dbError } = await supabase.from('photos').insert({
    user_id: user.id,
    category: meta.category,
    file_url: urlData.publicUrl,
    title: meta.title || '',
    memo: meta.memo || '',
    location_name: (meta.location && meta.location.name) || '',
    lat: (meta.location && meta.location.lat) || null,
    lng: (meta.location && meta.location.lng) || null,
    date: meta.date || ''
  });

  if (dbError) throw dbError;
}

/* ---- 工具函数（原 data.js 中的） ---- */

/** 按分类 id 获取照片 */
function photosByCategory(data, catId) {
  return (data.photos || []).filter(p => p.category === catId);
}

/** 按分类 id 查找分类信息 */
function findCategory(data, catId) {
  return (data.categories || []).find(c => c.id === catId);
}

/* ---- 首登迁移：把本地 photos.js 里的老照片导入到当前账号 ---- */

async function migrateIfNeeded() {
  const user = await currentUser();
  if (!user) return;

  const flagKey = 'migrated_' + user.id;
  if (localStorage.getItem(flagKey)) return; // 已迁移过

  const local = (window.PHOTOS_DATA && window.PHOTOS_DATA.photos) || [];
  for (const p of local) {
    try {
      const res = await fetch(p.file);
      const blob = await res.blob();
      const file = new File([blob], 'migrated.jpg', { type: blob.type || 'image/jpeg' });
      await uploadPhoto(file, {
        category: p.category,
        title: p.title,
        memo: p.memo,
        location: p.location,
        date: p.date
      });
    } catch (e) {
      console.error('迁移照片失败：', p.id, e);
    }
  }
  localStorage.setItem(flagKey, '1');
}

/* ---- 导航栏：显示用户邮箱 + 退出按钮 ---- */

async function initUserNav() {
  const user = await currentUser();
  const emailEl = document.getElementById('user-email');
  if (emailEl && user) emailEl.textContent = user.email;

  const logoutEl = document.getElementById('logout-btn');
  if (logoutEl) {
    logoutEl.addEventListener('click', (e) => {
      e.preventDefault();
      signOut();
    });
  }
}

// 各页面脚本在 body 末尾加载，此时 DOM 已就绪，直接初始化导航
initUserNav();
