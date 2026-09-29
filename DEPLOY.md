# GitHub 上传与在线 Demo 部署指南

本文档将指导你如何将酒店供应链 ERP 系统上传到 GitHub，并部署一个在线演示版本。

---

## 第一部分：上传到 GitHub

### 步骤 1：初始化 Git 仓库

在项目根目录 `d:\hotelERP` 下打开 PowerShell 或 CMD，执行以下命令：

```powershell
cd d:\hotelERP
git init
git add .
git commit -m "Initial commit: Hotel Supply Chain ERP System"
```

> **注意**：如果遇到权限问题，请以管理员身份运行终端，或先关闭所有打开该目录的程序后重试。

### 步骤 2：在 GitHub 上创建新仓库

1. 访问 [GitHub](https://github.com) 并登录
2. 点击右上角 **+** 号 → **New repository**
3. 填写仓库信息：
   - **Repository name**: `hotel-erp`（或你喜欢的名字）
   - **Description**: 酒店供应链管理系统
   - **Visibility**: Public（公开，方便展示）或 Private
4. **不要**勾选 "Initialize this repository with a README"
5. 点击 **Create repository**

### 步骤 3：推送代码到 GitHub

创建仓库后，按照 GitHub 页面上的提示执行：

```powershell
# 替换为你的 GitHub 用户名和仓库名
git remote add origin https://github.com/你的用户名/hotel-erp.git
git branch -M main
git push -u origin main
```

如果使用 SSH：

```powershell
git remote add origin git@github.com:你的用户名/hotel-erp.git
git branch -M main
git push -u origin main
```

---

## 第二部分：在线 Demo 部署方案

由于这是一个全栈项目（前端 + 后端 + MySQL 数据库），推荐以下几种部署方案：

### 方案一：Render 全栈部署（推荐，最简单）

[Render](https://render.com) 支持一站式部署前端、后端和数据库，免费额度足够用于 Demo 展示。

#### 1. 部署 MySQL 数据库

1. 登录 Render 控制台
2. 点击 **New** → **PostgreSQL**（Render 提供 PostgreSQL，我们需要稍作修改兼容）
   - 或者使用 [PlanetScale](https://planetscale.com) 提供的 MySQL 兼容数据库

**推荐使用 PlanetScale（MySQL 兼容）：**
1. 注册 [PlanetScale](https://planetscale.com) 账号
2. 创建新数据库，命名为 `hotel_erp`
3. 获取数据库连接字符串（格式：`mysql://user:password@host:port/database`）

#### 2. 修改后端数据库配置

修改 `backend/db.js`，使用环境变量管理数据库连接：

```javascript
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '123456',
  database: process.env.DB_NAME || 'hotel_erp',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
```

#### 3. 部署后端服务到 Render

1. 在 Render 控制台点击 **New** → **Web Service**
2. 连接你的 GitHub 仓库
3. 配置信息：
   - **Name**: `hotel-erp-backend`
   - **Runtime**: Node
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Root Directory**: 留空或设置为 `backend`
4. 添加环境变量（Advanced → Environment Variables）：
   - `DB_HOST`: 你的数据库主机地址
   - `DB_PORT`: 数据库端口
   - `DB_USER`: 数据库用户名
   - `DB_PASSWORD`: 数据库密码
   - `DB_NAME`: 数据库名
   - `JWT_SECRET`: 随机字符串（用于 JWT 签名）
   - `PORT`: `3001`
5. 点击 **Create Web Service**

#### 4. 初始化数据库

部署完成后，需要初始化数据库表和种子数据：

1. 在 Render 后台进入你的后端服务
2. 点击 **Shell** 标签页
3. 执行：
   ```bash
   cd backend
   node init-db.js
   node seed.js
   ```

#### 5. 部署前端到 Render

1. 点击 **New** → **Static Site**
2. 连接你的 GitHub 仓库
3. 配置信息：
   - **Name**: `hotel-erp-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish directory**: `frontend/dist`
4. 添加环境变量：
   - `VITE_API_BASE_URL`: 你的后端服务地址（如 `https://hotel-erp-backend.onrender.com`）
5. 点击 **Create Static Site**

#### 6. 修改前端 API 地址

修改 `frontend/src/utils/request.js` 或 `frontend/src/api/index.js`，使用环境变量：

```javascript
import axios from 'axios';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000,
});

// ... 其余配置
```

---

### 方案二：Vercel 前端 + Railway 全栈

#### 前端部署到 Vercel

1. 访问 [Vercel](https://vercel.com) 并使用 GitHub 登录
2. 点击 **Add New** → **Project**
3. 选择你的 `hotel-erp` 仓库
4. 配置：
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. 添加环境变量：
   - `VITE_API_BASE_URL`: 你的后端 API 地址
6. 点击 **Deploy**

#### 后端 + 数据库部署到 Railway

1. 访问 [Railway](https://railway.app) 并使用 GitHub 登录
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择你的仓库
4. 添加 MySQL 插件：**New** → **Database** → **Add MySQL**
5. 配置后端服务：
   - **Root Directory**: `/backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. 配置环境变量（Railway 会自动注入 MySQL 连接变量）

---

### 方案三：纯前端 Demo（Mock 数据）

如果你只想快速展示前端界面，可以使用 Mock 数据，无需后端和数据库：

1. 创建 `frontend/src/mock/` 目录，添加模拟数据
2. 修改 API 调用，在没有后端时返回模拟数据
3. 直接部署前端到 Vercel / Netlify / GitHub Pages

---

## 第三部分：部署后的配置

### 配置 CORS

后端需要允许前端域名跨域访问。修改 `backend/server.js`：

```javascript
const cors = require('cors');

const allowedOrigins = [
  'http://localhost:5173',
  'https://你的前端域名.com',  // 添加你的前端部署域名
];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
```

### 安全建议

1. **不要将敏感信息提交到 GitHub**：使用环境变量管理数据库密码、JWT 密钥等
2. **修改默认密码**：部署后修改默认管理员账号密码
3. **使用 HTTPS**：所有部署平台默认提供 HTTPS
4. **限制 CORS 来源**：只允许你的前端域名访问

---

## 第四部分：演示账号

部署完成后，可以使用以下演示账号登录：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 系统管理员 |
| zhangsan | 123456 | 采购专员 |
| lisi | 123456 | 财务人员 |
| wangwu | 123456 | 采购专员（客房部） |
| zhaoliu | 123456 | 采购专员 |

---

## 常见问题

### Q: Render 免费版会休眠怎么办？
A: Render 免费版在 15 分钟无流量后会休眠，首次访问需要等待几十秒唤醒。可以使用 [UptimeRobot](https://uptimerobot.com) 定时 ping 你的服务地址来保持唤醒。

### Q: 数据库数据会丢失吗？
A: PlanetScale 和 Railway 的数据库都是持久化的，数据不会丢失。但建议定期备份。

### Q: 如何更新部署？
A: 只要 push 代码到 GitHub 的 main 分支，Render/Vercel/Railway 都会自动重新部署。

### Q: 可以自定义域名吗？
A: 可以，所有平台都支持绑定自定义域名。

---

## 快速开始 Checklist

- [ ] 初始化 Git 仓库并 push 到 GitHub
- [ ] 注册 PlanetScale 账号，创建 MySQL 数据库
- [ ] 修改后端 db.js 使用环境变量
- [ ] 部署后端到 Render，配置环境变量
- [ ] 在 Render Shell 中执行数据库初始化
- [ ] 修改前端 API baseURL
- [ ] 部署前端到 Render / Vercel
- [ ] 测试登录和各功能模块
- [ ] （可选）绑定自定义域名
