# 📷 时光相册 · 个人图片纪念网站

一个纯静态、无后端、无需数据库、**双击即可打开**的本地图片纪念网站。用 **照片 + 文字 memo + 地图点位** 记录生活中的每个瞬间。

---

## 一、项目简介

- 六大相册分类：旅行 / 朋友&情侣 / 家人 / 自拍&人像 / 美食 / 工作
- 核心页面：首页、相册页（通用）、旅行地图页
- 技术栈：Tailwind CSS（CDN） + 原生 JavaScript + Leaflet 地图
- **数据驱动**：所有照片信息只维护 `data/photos.js`，新增照片零改代码

---

## 二、目录结构

```
photo-memorial/
├── index.html               # 首页（双击这个打开网站）
├── album.html               # 相册页（?cat= 参数区分分类）
├── map.html                 # 旅行地图页
├── assets/
│   ├── css/                 # style.css + 各页面样式
│   ├── js/                  # data / index / album / map / lightbox
│   └── photos/              # 照片按分类分子文件夹（travel/friends/...）
├── data/
│   └── photos.js            # ★ 唯一需要你维护的数据文件
└── lib/leaflet/             # 预留：Leaflet 本地化目录
```

---

## 三、如何打开

**直接双击 `index.html` 即可打开网站**，无需装插件、无需启动服务器。

> 唯一例外：**地图页（`map.html`）需要联网**，因为地图瓦片来自 OpenStreetMap（免费、无需 Key）。其余页面即使离线也能正常浏览。

（如果你喜欢，也可以用 VS Code 的 Live Server 或 `python -m http.server` 打开，效果一样。）

---

## 四、★ 新增照片指南（不用改任何代码）

只需两步：**放图片** + **加一条数据**。

### 第 1 步：把图片放进对应分类文件夹

把照片放到 `assets/photos/` 下对应分类的子文件夹里，例如旅行照片放到：

```
assets/photos/travel/tokyo_night.jpg
```

> 建议：文件名用**英文/拼音**，不要中文、不要空格，例如 `tokyo_night.jpg`、`beijing_01.jpg`。

### 第 2 步：在 `data/photos.js` 里加一条记录

打开 `data/photos.js`，在 `"photos": [` 数组里追加一条（注意每两条之间用逗号分隔）：

```js
{
  "id": "t_002",
  "category": "travel",
  "file": "assets/photos/travel/tokyo_night.jpg",
  "title": "东京塔夜景",
  "location": { "name": "东京 · 港区", "lat": 35.6586, "lng": 139.7454 },
  "memo": "第一次去东京，和朋友在塔下吹了很久的风。",
  "date": "2024-03-15"
}
```

刷新页面即可看到，**无需改动任何 HTML / JS**。

### 字段说明

| 字段 | 是否必填 | 说明 |
|------|---------|------|
| `id` | ✅ | 唯一编号，建议按分类前缀，如 `t_001` / `f_001` |
| `category` | ✅ | 分类 id：`travel` / `friends` / `family` / `portrait` / `food` / `work` |
| `file` | ✅ | 图片相对路径，指向 `assets/photos/` 下文件 |
| `title` | 可选 | 照片标题 |
| `memo` | 可选 | 一段简短文字记录 |
| `location` | 仅旅行照片 | 对象：`name`（地点名）+ `lat`（纬度）+ `lng`（经度），用于地图 marker |
| `date` | 可选 | 拍摄日期，格式 `YYYY-MM-DD` |

> `location` 只有 `category: "travel"` 的照片需要；其它分类省略即可。
> 经纬度获取方式：打开 Google 地图 / 高德地图，右键或长按目标地点，复制经纬度即可。

---

## 五、图片压缩建议

为保证打开速度，建议每张照片：

- **长边不超过 1600px**（电脑查看已足够清晰）
- **JPG 质量 75% ~ 85%**（肉眼几乎无差，体积骤降）
- 批量压缩工具：`squoosh.app`（在线）、`Caesium`（桌面）、或手机相册导出时选「高」而非「原图」

---

## 六、优化建议（可选，按需）

1. **发布到网上**：若想生成一个网址分享给朋友，可用免费的 GitHub Pages 托管，需要时告诉我，我帮你配置。
2. **Leaflet 本地化**：若想地图库也离线，可将 `unpkg` 的 Leaflet 下载到 `lib/leaflet/` 后改 `map.html` 引用路径（地图瓦片仍需联网）。
3. **更多分类**：在 `photos.js` 的 `categories` 数组追加一项，首页和导航会自动出现新分类。
4. **隐私提醒**：本站为本地私人使用，未做访问控制，请勿在公开环境放置隐私内容。
