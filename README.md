# 语纪 B 端后台

语纪后台管理系统，面向管理端使用，负责客户、项目、访谈、设备、用户、笔记等后台页面与交互能力。

## 技术栈

| 技术 | 版本 | 说明 |
| --- | --- | --- |
| Vue 3 | ^3.5.25 | 前端框架 |
| Vite | ^7.3.1 | 构建工具 |
| TypeScript | ~5.9.3 | 类型系统 |
| Vue Router | ^4.6.4 | 路由管理 |
| Pinia | ^3.0.4 | 状态管理 |
| Element Plus | ^2.13.2 | UI 组件库 |

## 本地开发

```bash
npm install
npm run dev
```

默认开发地址：

- [http://localhost:5173](http://localhost:5173)

## 构建

```bash
npm run build
```

## 环境变量

根目录可参考 `.env.example` 新建 `.env`。

当前项目会用到：

- `VITE_API_BASE_URL`
- `VITE_APP_TITLE`
- `VITE_DEEPSEEK_API_KEY`

说明：

- `.env` 已被 `.gitignore` 忽略，不会提交到仓库。
- AI 助手真实对话功能依赖 `VITE_DEEPSEEK_API_KEY`。

## 设计基准

- 设计稿基准尺寸：`1920 x 1080`
- 主色：`#2036CA`
- 辅助色：
  - `#00BAAD`
  - `#FF8D1A`
  - `#FE635D`

## 主要页面

### 登录

- 账号登录入口
- 品牌展示与背景视觉

### 首页 / 客户页

- 集团客户 / 单一客户切换
- 客户树搜索与右键菜单
- 客户一页纸
- 公司资料区

### 项目页

- 项目概览
- 授信报告入口
- 访谈记录入口

### 开始访谈

- 录音控制
- 实时字幕
- 热词提取
- 实时总结
- 结束访谈确认

### 访谈记录

- 记录列表
- 记录详情
- 摘要 / 字幕 / 脑图切换

### 设备管理

- 设备列表
- 搜索与筛选
- 分页
- UI 对齐管理后台风格

### 用户管理

- 用户列表
- 搜索与筛选
- 状态开关
- 编辑用户弹窗

### 我的笔记

- 笔记卡片列表
- 搜索
- 更多操作菜单
- 添加标签 / 重命名 / 置顶 / 删除

### AI 助手

- 右侧抽屉式助手面板
- 历史记录弹窗
- 复制 / 修改 / 刷新 / 置顶 / 置底交互
- 语音 / 发送 / 新建对话入口

## 路由概览

| 路径 | 名称 | 说明 |
| --- | --- | --- |
| `/login` | `Login` | 登录页 |
| `/` | `Home` | 首页 |
| `/project/:projectId` | `HomeProject` | 项目页 |
| `/interview` | `Interview` | 开始访谈 |
| `/device-management` | `DeviceManagement` | 设备管理 |
| `/user-management` | `UserManagement` | 用户管理 |
| `/my-notes` | `MyNotes` | 我的笔记 |

## 目录结构

```text
src/
├─ api/                         # 接口封装
├─ assets/
│  ├─ font/                     # 字体资源
│  └─ images/                   # 图片与图标资源
├─ router/                      # 路由配置
├─ stores/                      # Pinia 状态
├─ views/
│  ├─ device/                   # 设备管理
│  ├─ home/                     # 首页、项目页、访谈页、访谈记录
│  ├─ layouts/                  # 后台主布局、头部、侧栏、AI 助手
│  ├─ login/                    # 登录页
│  ├─ notes/                    # 我的笔记
│  └─ user/                     # 用户管理
├─ App.vue
├─ main.ts
└─ style.css
```

## 默认登录信息

| 账号 | 密码 |
| --- | --- |
| `admin` | `123` |

## 当前已完成的重点能力

- 后台布局与首页结构整理
- 设备管理页面
- 用户管理页面
- 我的笔记页面与更多操作菜单
- AI 助手抽屉与历史弹窗
- 访谈记录与访谈页交互优化
- 多处 Figma 1:1 风格还原

## 待继续完善

- 后端真实接口接入
- 登录鉴权与权限控制
- 笔记、设备、用户的真实数据联调
- AI 助手服务稳定性与异常处理增强
- 单元测试与 E2E 测试

## 仓库说明

- 当前仓库为 B 端后台项目
- 已与 GitHub 仓库同步：
  - [https://github.com/xingfu13149999-pixel/B-R1.0.0.git](https://github.com/xingfu13149999-pixel/B-R1.0.0.git)
