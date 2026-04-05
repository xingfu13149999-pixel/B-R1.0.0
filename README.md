# 语纪 · 后台管理（B 端）

管理员使用的后台管理系统，与平板端项目分离、独立仓库部署。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.5.25 | 渐进式 JavaScript 框架 |
| Vite | ^7.3.1 | 下一代前端构建工具 |
| Element Plus | ^2.13.2 | Vue 3 UI 组件库 |
| Pinia | ^3.0.4 | 状态管理 |
| Vue Router | ^4.6.4 | 路由管理 |
| TypeScript | ~5.9.3 | 类型系统 |

## 开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 代码检查
npm run lint

# 自动修复
npm run lint:fix
```

## 构建

```bash
npm run build
```

## 设计规范

- **设计尺寸**: 1920×1080
- **Figma**: [语纪后台管理系统](https://www.figma.com)
- **主色调**: `#2036ca`（蓝）
- **辅色调**: `#00baad`（绿）、`#ff8d1a`（橙）、`#fe635d`（红）

## 路由

| 路径 | 名称 | 说明 |
|------|------|------|
| `/login` | Login | 登录页 |
| `/` | Home | 客户首页 |
| `/project/:projectId` | HomeProject | 项目详情页 |

## 项目结构

```
src/
├── api/                 # API 封装（待接入后端）
├── assets/images/       # 静态图片资源
│   ├── header/         # 顶部导航图标
│   ├── home/           # 首页相关图标
│   ├── login/          # 登录页图标
│   └── sidebar/        # 侧边栏图标
├── components/          # 公共组件（待扩展）
├── layouts/
│   └── AdminLayout.vue # 主布局组件
├── router/
│   └── index.ts        # 路由配置
├── stores/
│   └── app.ts         # Pinia 状态管理
├── types/              # TypeScript 类型定义（待扩展）
├── utils/              # 工具函数（待扩展）
├── views/
│   ├── home/
│   │   ├── index.vue           # 客户首页
│   │   ├── ProjectHome.vue     # 项目详情页
│   │   └── components/
│   │       ├── AddCustomerDialog.vue    # 新增客户弹窗
│   │       ├── AddProjectDialog.vue     # 新增项目弹窗
│   │       ├── CustomerOnepage.vue      # 客户一页纸
│   │       └── ProjectOnepage.vue       # 项目一页纸
│   └── login/
│       └── index.vue   # 登录页
├── App.vue             # 根组件
├── main.ts             # 应用入口
└── style.css           # 全局样式
```

## 登录账号

| 账号 | 密码 |
|------|------|
| admin | 123 |

## 功能模块

### 登录页
- 三种认证方式：密码认证、指纹认证、接口认证
- 账号密码验证
- 语纪品牌展示

### 主布局
- **顶部导航栏**：Logo、AI助手、设备管理、用户管理、主题切换
- **左侧边栏**：
  - 集团客户/单一客户切换
  - 客户搜索
  - 客户树形列表（展开/折叠、右键菜单）
  - 底部快捷入口（我的报告、开始访谈）

### 客户首页
- 公司信息头部（Logo、名称、授信、评级等）
- 一页纸内容（企业概况、股权结构、经营分析、核心竞争力）
- 公司资料文件树

### 项目详情页
- 项目信息头部
- 项目概览（申报方式、授信额度、敞口/缓释、担保方式、授信期限等）
- 风险评估（风险等级、尽调进度、资产负债率）

## 与平板端关系

- **ai-admin**：平板端（工作台、客户、项目、访谈等），面向一线
- **本仓库**：B 端后台，面向管理员，管理数据/统计等

两者共用同一后端 API，部署与代码完全独立

## 待接入

- [ ] 后端 API 封装层
- [ ] 真实登录认证（token 验证）
- [ ] 路由权限守卫
- [ ] 客户/项目 CRUD API
- [ ] 暗黑模式实现
- [ ] AI 助手功能
- [ ] 单元测试
- [ ] E2E 测试
