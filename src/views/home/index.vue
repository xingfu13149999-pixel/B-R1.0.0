<template>
  <div class="home-page">
    <div class="content-panel">
      <!-- 公司信息：Figma 上-内容 1:1540 一比一 -->
      <div class="content-header">
        <div class="company-header">
          <div class="company-icon">
            <img class="company-logo-img" :src="companyLogo" alt="公司" />
          </div>
          <div class="company-info">
            <h1 class="company-name">四川晨光博达新材料有限公司</h1>
            <div class="company-metrics">
              <span class="metric"><em class="metric-label">综合授信</em><em class="metric-value">1.2亿</em></span>
              <span class="metric"><em class="metric-label">信用评级</em><em class="metric-value">A</em></span>
              <span class="metric"><em class="metric-label">敞口额度</em><em class="metric-value">0.5亿</em></span>
              <span class="metric"><em class="metric-label">担保方式</em><em class="metric-value metric-value--green">保证担保</em></span>
            </div>
          </div>
          <div class="header-meta">
            <span class="meta-item">
              <img class="meta-icon meta-icon--time" :src="iconMetaTime" alt="" />
              <span class="meta-text">10:38:57</span>
            </span>
            <img class="header-meta-divider" :src="iconMetaDivider" alt="" />
            <span class="meta-item">
              <img class="meta-icon meta-icon--user" :src="iconMetaUser" alt="" />
              <span class="meta-text">李云</span>
            </span>
          </div>
        </div>
      </div>

      <!-- Figma 1:1539 分离-横：公司信息与一页纸之间分隔线 -->
      <div class="content-header-divider" />

      <!-- 一页纸 / 公司资料：Figma 头部 1:1239 一比一 -->
      <div class="tabs-row">
        <div class="onepage-tabs">
          <div class="onepage-title-wrap">
            <span class="onepage-title">一页纸</span>
            <img class="onepage-underline" :src="iconOnepageUnderline" alt="" />
          </div>
          <span class="onepage-progress">
            （ 已完成 <em class="onepage-num">4</em>
            <img class="onepage-progress-sep" :src="iconProgressDivider" alt="" />
            总数 <em class="onepage-num">8</em> ）
          </span>
          <div class="header-actions">
            <button type="button" class="action-btn" aria-label="刷新">
              <img class="action-btn-icon" :src="iconRefresh" alt="" />
            </button>
            <button type="button" class="action-btn action-btn--download" aria-label="下载">
              <img class="action-btn-icon" :src="iconDownload" alt="" />
            </button>
          </div>
        </div>
        <div class="doc-tabs">
          <div class="doc-title-wrap">
            <span class="doc-title">公司资料</span>
            <img class="doc-underline" :src="iconOnepageUnderline" alt="" />
          </div>
        </div>
      </div>

      <!-- 下方内容区：左侧卡片 + 竖条 + 右侧列表 -->
      <div class="content-body">
        <div class="content-left">
          <CustomerOnepage />
        </div>


        <aside class="content-right">
          <div class="right-search">
            <el-input v-model="rightKeyword" placeholder="请输入关键字" class="keyword-input" clearable>
              <template #suffix>
                <img class="search-suffix-icon" :src="iconDocSearch" alt="" />
              </template>
            </el-input>
            <button type="button" class="right-add-btn" aria-label="添加">
              <img class="right-add-icon" :src="iconDocAdd" alt="" />
            </button>
          </div>
          <div class="doc-tree">
            <div class="tree-item" @click="toggleTree('basic')">
              <img class="tree-caret" :src="iconDocArrow" alt="" :class="{ 'tree-caret--down': expandedTree.basic }" />
              <img class="tree-folder" :src="iconDocFolder" alt="" />
              <span class="tree-label">客户基本资料</span>
            </div>
            <div class="tree-item" @click="toggleTree('other')">
              <img class="tree-caret" :src="iconDocArrow" alt="" :class="{ 'tree-caret--down': expandedTree.other }" />
              <img class="tree-folder" :src="iconDocFolder" alt="" />
              <span class="tree-label">其他材料</span>
            </div>
            <div class="tree-item tree-item--license" @click="toggleTree('license')">
              <img class="tree-caret" :src="iconDocArrow" alt="" :class="{ 'tree-caret--down': expandedTree.license }" />
              <img class="tree-folder" :src="iconDocFolder" alt="" />
              <span class="tree-label">企业证照</span>
            </div>
            <div v-show="expandedTree.license" class="tree-children">
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">营业证照</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">组织机构代码证</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">开户许可证</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">环保或其他许可证</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">资质证明</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">税务登记证</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">年审材料/Good Standing</span></div>
              <div class="tree-child"><span class="tree-child-line" /><img class="tree-doc" :src="iconDocFile" alt="" /><span class="tree-child-label">商业登记证/Incumbency</span></div>
            </div>
            <div class="tree-item" @click="toggleTree('finance')">
              <img class="tree-caret" :src="iconDocArrow" alt="" :class="{ 'tree-caret--down': expandedTree.finance }" />
              <img class="tree-folder" :src="iconDocFolder" alt="" />
              <span class="tree-label">财务报表</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import CustomerOnepage from './components/CustomerOnepage.vue'
import companyLogo from '@/assets/images/home/company-logo.png'
import iconOnepageUnderline from '@/assets/images/home/icon-onepage-underline.svg'
import iconProgressDivider from '@/assets/images/home/icon-progress-divider.svg'
import iconRefresh from '@/assets/images/home/icon-refresh.svg'
import iconDownload from '@/assets/images/home/icon-download.svg'
import iconMetaTime from '@/assets/images/home/icon-meta-time.svg'
import iconMetaDivider from '@/assets/images/home/icon-meta-divider.svg'
import iconMetaUser from '@/assets/images/home/icon-meta-user.svg'
import iconDocSearch from '@/assets/images/home/doc-search.svg'
import iconDocAdd from '@/assets/images/home/doc-add.svg'
import iconDocArrow from '@/assets/images/home/doc-arrow-right.svg'
import iconDocFolder from '@/assets/images/home/doc-folder.svg'
import iconDocFile from '@/assets/images/home/doc-file.svg'

const rightKeyword = ref('')
const expandedTree = reactive({
  basic: false,
  other: false,
  license: true,
  finance: false,
})

function toggleTree(key: keyof typeof expandedTree) {
  expandedTree[key] = !expandedTree[key]
}
</script>

<style scoped>
/* 填满布局主内容区，一屏展示；Figma 94:68 内容板块 x=341 width=1540，左右留白 61px/39px，上下 13px/43px */
.home-page {
  width: 100%;
  height: 100%;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: transparent;
  padding: 13px 30px 30px 12px;
}

/* Figma 1:1181 内容板块背景色：浅蓝白色块、6px 圆角、柔和投影 */
.content-panel {
  display: flex;
  flex-direction: column;
  width: 100%;
  flex: 1;
  min-height: 0;
  max-height: 100%;
  box-sizing: border-box;
  padding: 20px 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #eef2ff 0%, #f5f7ff 40%, #f5f7ff 30%);
  border-radius: 6px;
  box-shadow: 0 0 20px hwb(226 28% 19% / 0.15);
}

/* 公司信息：独立板块 */
.content-header {
  flex-shrink: 0;
  margin-bottom: 0;
}

/* Figma 1:1539 分离-横：公司信息与一页纸之间的横线 */
.content-header-divider {
  width: 100%;
  height: 0;
  border: none;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
  margin: 28px 0 20px 0;
}

.company-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 0;
  min-height: 86px;
}

/* 一页纸 / 公司资料：与下方内容区左右对齐，参考列表栏留白 */
.tabs-row {
  display: flex;
  align-items: stretch;
  width: 100%;
  flex-shrink: 0;
  margin-bottom: 0;
  padding-left: 10px;
  padding-right: 10px;
  box-sizing: border-box;
}

.tabs-row .onepage-tabs {
  flex: 1;
  min-width: 0;
  margin-bottom: 0;
  margin-right: 40px;
}

.tabs-row-divider {
  width: 6px;
  flex-shrink: 0;
  background: #c2c7e8;
  border-radius: 100px;
  align-self: stretch;
}

/* 公司资料顶部栏：与一页纸顶部栏样式一致 */
.doc-tabs {
  flex: 0 0 556px;
  min-width: 280px;
  display: flex;
  align-items: center;
  padding-bottom: 20px;
  box-sizing: border-box;
  /* padding-left: 10px; */
}

.doc-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.doc-title {
  font-size: 20px;
  font-weight: 700;
  color: #2036ca;
  letter-spacing: 0.4px;
  line-height: normal;
}

.doc-underline {
  width: 55px;
  height: 6px;
  object-fit: contain;
  object-position: left center;
  margin-top: 2px;
}

/* 下方内容区：左侧卡片 + 竖条 + 右侧列表 */
.content-body {
  flex: 1;
  min-height: 0;
  display: flex;
  width: 100%;
  overflow: hidden;
}

/* 一页纸内容区：可滚动并显示滚动条 */
.content-left {
  flex: 1;
  min-width: 0;
  padding: 10px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* Figma 公司LOGO：86×86 白底圆角 6px，内 70×70 暂位图（已下载） */
.company-icon {
  width: 86px;
  height: 86px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  padding: 8px;
  box-sizing: border-box;
}

.company-logo-img {
  width: 70px;
  height: 70px;
  object-fit: cover;
  display: block;
}

.company-info {
  flex: 1;
  min-width: 0;
}

.company-name {
  margin: 0 0 8px;
  font-size: 24px;
  font-weight: 700;
  color: #21243d;
  line-height: 1.3;
  letter-spacing: 0.48px;
}

/* Figma 标签：每项 label #21243d + value #2036ca，担保方式 value #00baad；gap 28px，项内 gap 10px，p 10px */
.company-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: 28px;
  padding: 10px 0 0;
  font-size: 16px;
  line-height: 1.75;
  letter-spacing: 0.32px;
}

.company-metrics .metric {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.company-metrics .metric-label {
  font-style: normal;
  color: #21243d;
}

.company-metrics .metric-value {
  font-style: normal;
  color: #2036ca;
}

.company-metrics .metric-value--green {
  color: #00baad;
}

/* Figma 1:1563 灰色：时间/姓名在公司信息块底部，14px #a6a6a6 */
.header-meta {
  flex-shrink: 0;
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
  color: #a6a6a6;
  line-height: 1.75;
}

.header-meta .meta-item {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.header-meta .meta-icon {
  flex-shrink: 0;
  object-fit: contain;
}

.header-meta .meta-icon--time {
  width: 14px;
  height: 14px;
}

.header-meta .meta-icon--user {
  width: 11px;
  height: 14px;
}

.header-meta .meta-text {
  font-size: 14px;
  color: #a6a6a6;
  line-height: 1.75;
}

.header-meta-divider {
  width: 1px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

/* Figma 头部 1:1239：一页纸 + 进度 + 功能图标 */
.onepage-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 12px;
}

.onepage-title-wrap {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
}

.onepage-title {
  font-size: 20px;
  font-weight: 700;
  color: #2036ca;
  letter-spacing: 0.4px;
  line-height: normal;
}

/* Figma 线条样式 1:1257：仅在一页纸标题下 55px 宽蓝渐变线 */
.onepage-underline {
  width: 55px;
  height: 6px;
  object-fit: contain;
  object-position: left center;
  margin-top: 2px;
}

.onepage-progress {
  font-size: 16px;
  color: #a6a6a6;
  line-height: 1.75;
  letter-spacing: 0.32px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.onepage-progress .onepage-num {
  font-style: normal;
  color: #2036ca;
  font-weight: 400;
}

.onepage-progress-sep {
  width: 1px;
  height: 18px;
  object-fit: contain;
  flex-shrink: 0;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 10px;
}

/* Figma 功能图标 1:1241/1:1244：40×36 白底 #c4c4c4 边圆角 5px，图标 16px */
.action-btn {
  width: 40px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #c4c4c4;
  border-radius: 5px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
}

.action-btn-icon {
  width: 16px;
  height: 16px;
  object-fit: contain;
}

.action-btn--download .action-btn-icon {
  height: 14px;
}

.action-btn:hover {
  border-color: #2036ca;
}

.action-btn:hover .action-btn-icon {
  filter: brightness(0) saturate(100%) invert(25%) sepia(80%) saturate(1500%) hue-rotate(220deg);
}

.content-cards {
  display: flex;
  flex-direction: column;
  gap: clamp(12px, 1.8vh, 20px);
}

.info-card {
  background: #fff;
  border-radius: clamp(6px, 0.4vw, 8px);
  padding: clamp(12px, 1.2vw, 16px) clamp(12px, 1vw, 17px);
  border: 1px solid #f0f0f0;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
  box-sizing: border-box;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: clamp(8px, 1vh, 12px);
}

.card-title {
  margin: 0;
  font-size: clamp(14px, 0.83vw, 16px);
  font-weight: 600;
  color: #262626;
}

.card-time {
  font-size: clamp(12px, 0.68vw, 13px);
  color: #8c8c8c;
}

.card-text {
  margin: 0 0 clamp(8px, 1vh, 12px);
  font-size: clamp(12px, 0.73vw, 14px);
  line-height: 1.6;
  color: #595959;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(6px, 0.5vw, 8px);
}

.tag {
  padding: clamp(3px, 0.3vw, 4px) clamp(8px, 0.6vw, 10px);
  font-size: clamp(11px, 0.6vw, 12px);
  color: #595959;
  background: #f5f5f5;
  border-radius: 4px;
}

/* Figma 分离竖条：6px 圆角条 #c2c7e8 */
.content-divider {
  width: 6px;
  flex-shrink: 0;
  background: #c2c7e8;
  border-radius: 100px;
  margin: 0;
  align-self: stretch;
}

/* 公司资料内容区：556px 白底 #cedbfa 边框，可滚动并显示滚动条 */
.content-right {
  flex: 0 0 556px;
  min-width: 280px;
  padding: 0;
  overflow-y: auto;
  border: 1px solid #cedbfa;
  border-radius: 6px;
  margin: 0;
  box-sizing: border-box;
  background: #fff;
}

/* Figma 1:1278 上部搜索区：高 66px，padding 8px 11px，gap 10px */
.right-search {
  display: flex;
  gap: 10px;
  align-items: center;
  min-height: 66px;
  padding: 8px 11px;
  border-bottom: 1px solid #f0f0f0;
  box-sizing: border-box;
}

.keyword-input {
  flex: 1;
  min-width: 0;
}

.keyword-input :deep(.el-input__wrapper) {
  height: 38px;
  min-height: 38px;
  padding: 0 12px;
  border-radius: 4px;
  border: 1px solid #bac2d7;
  box-shadow: none;
  box-sizing: border-box;
  align-items: center;
}

.keyword-input :deep(.el-input__inner) {
  font-size: 14px;
  line-height: 1.5;
  height: auto;
}

.keyword-input :deep(.el-input__inner::placeholder) {
  color: #bfbfbf;
  font-size: 14px;
}

.search-suffix-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

/* Figma 添加按钮：38×38 白底灰边，图标 14px，与搜索框同高 */
.right-add-btn {
  width: 38px;
  height: 38px;
  min-height: 38px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 1px solid #bac2d7;
  border-radius: 4px;
  background: #fff;
  cursor: pointer;
  flex-shrink: 0;
  box-sizing: border-box;
}

.right-add-icon {
  width: 14px;
  height: 14px;
  object-fit: contain;
}

.right-add-btn:hover {
  border-color: #2036ca;
  background: #f5f7ff;
}

.doc-tree {
  font-size: 14px;
  color: #21243d;
}

/* Figma 树父级：高 46px，左 pl 10px py 16px，箭头 12×12，文件夹 22×16，gap 10px，右侧文字 pl 8px、14px #21243d */
.tree-item {
  display: flex;
  align-items: center;
  min-height: 46px;
  padding: 16px 10px 16px 10px;
  cursor: pointer;
  border-radius: 0;
  box-sizing: border-box;
  gap: 10px;
}

.tree-item--license {
  min-height: 48px;
}

.tree-item:hover {
  background: #e4f0ff;
}

.tree-caret {
  width: 12px;
  height: 12px;
  object-fit: contain;
  flex-shrink: 0;
  transition: transform 0.2s;
}

.tree-caret--down {
  transform: rotate(90deg);
}

.tree-folder {
  width: 22px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.tree-label {
  padding-left: 8px;
  font-size: 14px;
  color: #21243d;
  line-height: 1.5;
}

.tree-children {
  padding-left: 12px;
}

/* Figma 子列表项：高 44px，pl 12px，28px 竖线列 + 文档 22×16 + 文字 pl 7px/10px，14px #21243d */
.tree-child {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding-left: 12px;
  font-size: 14px;
  color: #21243d;
  cursor: pointer;
  border-radius: 0;
  box-sizing: border-box;
  gap: 0;
}

.tree-child-line {
  width: 28px;
  min-width: 28px;
  flex-shrink: 0;
  align-self: stretch;
}

.tree-doc {
  width: 22px;
  height: 16px;
  object-fit: contain;
  flex-shrink: 0;
}

.tree-child-label {
  padding-left: 7px;
  font-size: 14px;
  color: #21243d;
  line-height: 1.5;
}

/* 子项鼠标悬停样式 #e4f0ff */
.tree-child:hover {
  background: #e4f0ff;
}

.tree-child:hover .tree-child-label {
  color: #21243d;
}
</style>
