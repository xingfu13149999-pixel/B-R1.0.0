# AGENTS.md

This file provides guidance to Codex (Codex.ai/code) when working with code in this repository.

## 项目概述

语纪·后台管理系统 (B端)，管理员使用的后台系统，与平板端项目分离独立部署。主要功能包括客户管理、项目管理、访谈录音、授信报告等。

## 常用命令

```bash
# 安装依赖
npm install

# 开发服务器
npm run dev

# 类型检查 + 构建
npm run build

# 代码检查
npm run lint

# 自动修复 lint 问题
npm run lint:fix

# 预览构建结果
npm run preview
```

## 技术栈

- **Vue 3** + **TypeScript** + **Vite**
- **Element Plus** UI 组件库
- **Pinia** 状态管理
- **Vue Router** 路由
- **DeepSeek API** AI 功能

## 架构要点

### 路由结构

| 路径 | 组件 | 说明 |
|------|------|------|
| `/login` | Login | 登录页 |
| `/interview` | InterviewStart | 全屏访谈页（无侧栏） |
| `/` | CustomerHome | 客户首页 |
| `/project/:projectId` | ProjectHome | 项目详情页 |
| `/project/:projectId/interview-records` | InterviewRecordsPage | 访谈记录页 |
| `/project/:projectId/credit-report` | CreditReport | 授信报告页 |

**重要**：客户首页、项目页、访谈记录、授信报告都包裹在 `AdminLayout` 下，共用顶栏和侧栏。

### 状态管理

`useAppStore` (src/stores/app.ts) 管理全局状态：
- `darkMode` 主题模式
- `currentUser` 当前用户
- `customerType` 客户类型（集团/单一）
- `selectedCustomerId` 侧栏选中的客户ID（持久化到 localStorage）

### 访谈模块

位于 `src/views/home/composables/`：
- `useInterviewRecorder` - 录音功能（MediaRecorder + 波形可视化）
- `useInterviewTranscription` - 实时语音转写（Web SpeechRecognition + DeepSeek 补标点）

访谈记录存储在 `src/views/home/utils/interviewRecordsStorage.ts`

### Mock 数据

客户树数据使用 mock 文件：
- `src/views/home/mock/customerTree.ts` - 树结构定义和工具函数
- `src/views/home/mock/liveCustomerTree.ts` - 可动态增删改的响应式客户树
- 其他 mock 文件提供项目、客户、授信报告的模拟数据

### AI 功能

`src/api/ai.ts` 封装 DeepSeek API 调用，需要配置 `VITE_DEEPSEEK_API_KEY` 环境变量。

### 环境变量

复制 `.env.example` 为 `.env` 并配置：
```
VITE_API_BASE_URL=http://localhost:3000/api
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

## 设计规范

- 设计尺寸：1920×1080
- 主色调：`#2036ca`（蓝）
- 辅色调：`#00baad`（绿）、`#ff8d1a`（橙）、`#fe635d`（红）
- 字体：OPPO Sans（src/assets/font/）

## 待接入功能

- [ ] 后端 API 封装层
- [ ] 真实登录认证（token 验证）
- [ ] 路由权限守卫
- [ ] 客户/项目 CRUD API
- [ ] 暗黑模式实现
- [ ] AI 助手功能
- [ ] 单元测试
- [ ] E2E 测试

## 相关项目

- **ai-admin**：平板端项目，面向一线人员，共用同一后端 API
