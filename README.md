# 酒店供应链 ERP 系统

一个功能完整的酒店供应链管理系统，涵盖供应商管理、采购需求、采购订单、审批流程、合同管理、付款管理、库存管理和报表分析等核心模块。

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 前端框架 | React | 19.x |
| 构建工具 | Vite | 5.x |
| 路由 | React Router DOM | 7.x |
| UI 图标 | Ant Design Icons | 6.x |
| 图表 | Recharts | 3.x |
| 后端框架 | Express.js | 5.x |
| 数据库 | MySQL | - |
| 认证 | JWT | 9.x |
| 密码加密 | bcryptjs | 3.x |

## 功能模块

- **仪表盘** - 数据概览、待办事项、采购趋势图表
- **供应商管理** - 供应商信息维护、分级管理
- **物料管理** - 物料分类、库存管理
- **采购需求** - 需求申请、需求汇总
- **采购订单** - 订单创建、订单跟踪
- **审批管理** - 多级审批流程、审批历史
- **合同管理** - 合同档案、合同到期提醒
- **付款管理** - 付款申请、付款记录
- **库存管理** - 入库、出库、库存盘点
- **报表中心** - 采购报表、供应商分析

## 快速开始

### 环境要求

- Node.js >= 18.x
- MySQL >= 5.7 或 8.x

### 数据库配置

默认数据库连接配置（可在 `backend/db.js` 中修改）：

```
主机: localhost
端口: 3306
用户: root
密码: 123456
数据库: hotel_erp
```

### 安装与启动

#### 1. 启动后端服务

```bash
cd backend
npm install
npm run init    # 初始化数据库表 + 填充演示数据（仅首次运行）
npm run dev     # 开发模式启动
```

后端服务地址: `http://localhost:3001`

#### 2. 启动前端服务

```bash
cd frontend
npm install
npm run dev
```

前端访问地址: `http://localhost:5173`

### 演示账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | 123456 | 系统管理员 |
| zhangsan | 123456 | 采购专员 |
| lisi | 123456 | 财务人员 |
| wangwu | 123456 | 采购专员（客房部） |
| zhaoliu | 123456 | 采购专员 |

## 项目结构

```
hotelERP/
├── backend/              # 后端服务
│   ├── server.js         # 服务入口
│   ├── db.js             # 数据库配置
│   ├── init-db.js        # 数据库初始化脚本
│   ├── seed.js           # 演示数据脚本
│   └── package.json
├── frontend/             # 前端应用
│   ├── src/
│   │   ├── pages/        # 页面组件
│   │   ├── layouts/      # 布局组件
│   │   ├── api/          # API 接口
│   │   ├── utils/        # 工具函数
│   │   └── main.jsx      # 入口文件
│   └── package.json
└── README.md
```

## 部署

### 前端部署

推荐使用以下平台部署前端：

- **Vercel** - 自动检测 Vite 项目，一键部署
- **Netlify** - 支持从 GitHub 自动部署
- **GitHub Pages** - 免费静态托管

构建命令：
```bash
cd frontend
npm run build
```

构建产物位于 `frontend/dist/` 目录。

### 后端部署

推荐使用以下平台部署后端：

- **Render** - 支持 Node.js 服务和 MySQL 数据库
- **Railway** - 全栈部署平台
- **Fly.io** - 容器化部署

启动命令：
```bash
cd backend
npm start
```

### 数据库

推荐使用以下云数据库服务：

- **PlanetScale** - MySQL 兼容的 Serverless 数据库
- **Aiven** - 托管 MySQL 服务
- **Railway MySQL** - 一体化部署

部署时需要修改 `backend/db.js` 中的数据库连接配置，使用环境变量管理敏感信息。

## 许可证

MIT License
