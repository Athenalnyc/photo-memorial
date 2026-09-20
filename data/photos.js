/* ==========================================================================
   photos.js —— 全站唯一的数据文件
   ⚠️ 新增 / 修改照片只需编辑这个文件，不用动任何 HTML / JS。
   注意：结构保持不变，只是外面包了一层 window.PHOTOS_DATA = ...，
   这样即使双击 index.html（file://）也能直接读取，无需服务器。
   ========================================================================== */
window.PHOTOS_DATA = {
  "categories": [
    { "id": "travel",   "name": "旅行照片",     "emoji": "🌍", "desc": "走过的地方与看过的风景" },
    { "id": "friends",  "name": "朋友&情侣合照", "emoji": "💛", "desc": "陪伴与欢笑的瞬间" },
    { "id": "family",   "name": "家人合照",     "emoji": "🏠", "desc": "亲情与团聚的温暖" },
    { "id": "portrait", "name": "自拍&人像",    "emoji": "📸", "desc": "成长的每一个样子" },
    { "id": "food",     "name": "美食照片",     "emoji": "🍜", "desc": "餐桌上的小确幸" },
    { "id": "work",     "name": "工作照片",     "emoji": "💼", "desc": "认真生活的记录" }
  ],
  "photos": [
    {
      "id": "t_001",
      "category": "travel",
      "file": "assets/photos/travel/marseille.jpg",
      "title": "马赛港口",
      "location": { "name": "法国 · 马赛", "lat": 43.2965, "lng": 5.3698 },
      "memo": "地中海的阳光洒在旧港上，海风里都是咸咸的味道。",
      "date": "2024-06-12"
    }
  ]
};
