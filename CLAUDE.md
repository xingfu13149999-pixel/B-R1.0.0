# CLAUDE.md

此文件为 Claude Code (claude.ai/code) 在本仓库工作时提供指导。

## 项目概述

语纪·后台管理 (B端) - 语纪平台的管理系统。与平板端 (ai-admin) 分离部署，共用同一后端 API。

- **设计尺寸**: 1920×1080
- **类型**: Vue 3 + TypeScript 单页应用

## 命令

```bash
npm install   # 安装依赖
npm run dev   # 启动开发服务器
npm run build # 生产构建
```

## 架构

```
src/
├── App.vue              # 根组件 (router-view 容器)
├── main.ts              # 应用入口 (注册 Pinia、Element Plus、Router)
├── router/index.ts      # 路由定义：/ (首页) 和 /login
├── stores/app.ts        # 全局状态 (darkMode、currentUser、customerType、selectedCustomerId)
├── layouts/
│   └── AdminLayout.vue  # 后台布局框架 (含侧边栏/头部)
└── views/
    ├── home/            # 首页 + CustomerOnepage、AddCustomerDialog 组件
    └── login/           # 登录页
```

**路由结构**: Login 路由为顶层路由；其他所有路由 (`/`) 都是 `AdminLayout.vue` 的子路由。

**状态管理**: 使用单一 Pinia store (`useAppStore`)，采用组合式 API 风格 (`ref()`)。

**组件风格**: 全部使用 `<script setup lang="ts">` 语法。
