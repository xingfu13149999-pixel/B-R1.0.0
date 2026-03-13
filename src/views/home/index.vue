<template>
  <div class="home-page">
    <div class="content-panel">
      <div class="content-left">
        <div class="content-header">
          <div class="company-header">
            <div class="company-icon">
              <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 4L44 24L24 44L4 24L24 4Z" fill="url(#star-gradient)" />
                <defs>
                  <linearGradient id="star-gradient" x1="4" y1="4" x2="44" y2="44">
                    <stop stop-color="#2036CA" />
                    <stop offset="1" stop-color="#5B7FFF" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div class="company-info">
              <h1 class="company-name">四川晨光博达新材料有限公司</h1>
              <div class="company-metrics">
                <span>综合授信 1.2亿</span>
                <span>信用评级 A</span>
                <span>敞口额度 0.5亿</span>
                <span>担保方式 保证担保</span>
              </div>
            </div>
            <div class="header-meta">
              <span class="time">10:38:57</span>
              <span class="user">李云</span>
            </div>
          </div>
          <div class="onepage-tabs">
            <span class="onepage-title">一页纸</span>
            <span class="onepage-progress">（已完成 <em class="onepage-num">4</em> 总数 <em class="onepage-num">8</em>）</span>
            <div class="header-actions">
              <el-icon class="action-icon"><Refresh /></el-icon>
              <el-icon class="action-icon"><Download /></el-icon>
            </div>
          </div>
        </div>

        <CustomerOnepage />
      </div>

      <div class="content-divider" />

      <aside class="content-right">
        <div class="right-search">
          <el-input v-model="rightKeyword" placeholder="请输入关键字" class="keyword-input" clearable>
            <template #suffix><el-icon><Search /></el-icon></template>
          </el-input>
          <el-button type="primary" circle><el-icon><Plus /></el-icon></el-button>
        </div>
        <div class="doc-tree">
          <div class="tree-item" @click="toggleTree('basic')">
            <el-icon class="tree-caret">
              <component :is="expandedTree.basic ? ArrowDown : ArrowRight" />
            </el-icon>
            <el-icon class="tree-icon"><Folder /></el-icon>
            <span>客户基本资料</span>
          </div>
          <div class="tree-item" @click="toggleTree('other')">
            <el-icon class="tree-caret">
              <component :is="expandedTree.other ? ArrowDown : ArrowRight" />
            </el-icon>
            <el-icon class="tree-icon"><Folder /></el-icon>
            <span>其他材料</span>
          </div>
          <div class="tree-item" @click="toggleTree('license')">
            <el-icon class="tree-caret">
              <component :is="expandedTree.license ? ArrowDown : ArrowRight" />
            </el-icon>
            <el-icon class="tree-icon"><Folder /></el-icon>
            <span>企业证照</span>
          </div>
          <div v-show="expandedTree.license" class="tree-children">
            <div class="tree-child"><el-icon><Document /></el-icon>营业证照</div>
            <div class="tree-child"><el-icon><Document /></el-icon>组织机构代码证</div>
            <div class="tree-child active"><el-icon><Document /></el-icon>开户许可证</div>
            <div class="tree-child"><el-icon><Document /></el-icon>环保或其他许可证</div>
            <div class="tree-child"><el-icon><Document /></el-icon>资质证明</div>
            <div class="tree-child"><el-icon><Document /></el-icon>税务登记证</div>
            <div class="tree-child"><el-icon><Document /></el-icon>年审材料/Good Standing</div>
            <div class="tree-child"><el-icon><Document /></el-icon>商业登记证/Incumbency</div>
          </div>
          <div class="tree-item" @click="toggleTree('finance')">
            <el-icon class="tree-caret">
              <component :is="expandedTree.finance ? ArrowDown : ArrowRight" />
            </el-icon>
            <el-icon class="tree-icon"><Folder /></el-icon>
            <span>财务报表</span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import CustomerOnepage from './components/CustomerOnepage.vue'
import { Search, Plus, ArrowDown, ArrowRight, Folder, Document, Refresh, Download } from '@element-plus/icons-vue'

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
/* 占满当前视口，内容随分辨率自适应 */
.home-page {
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  overflow: hidden;
  background: #fff;
}

.content-panel {
  display: flex;
  width: 100%;
  height: 100%;
  min-height: 100vh;
  box-sizing: border-box;
  background: #fff;
}

.content-left {
  flex: 1;
  min-width: 0;
  padding: clamp(12px, 1.25vw, 24px) clamp(16px, 1.5vw, 24px);
  overflow-y: auto;
  box-sizing: border-box;
}

.content-header {
  margin-bottom: clamp(12px, 1.8vh, 20px);
}

.company-header {
  display: flex;
  align-items: flex-start;
  gap: clamp(12px, 1vw, 16px);
  margin-bottom: clamp(12px, 1.5vh, 16px);
}

.company-icon {
  width: clamp(36px, 2.5vw, 48px);
  height: clamp(36px, 2.5vw, 48px);
  flex-shrink: 0;
}

.company-icon svg {
  width: 100%;
  height: 100%;
}

.company-info {
  flex: 1;
  min-width: 0;
}

.company-name {
  margin: 0 0 clamp(6px, 0.7vh, 8px);
  font-size: clamp(16px, 1.15vw, 22px);
  font-weight: 700;
  color: #21243d;
  line-height: 1.3;
  letter-spacing: 0.02em;
}

.company-metrics {
  display: flex;
  flex-wrap: wrap;
  gap: clamp(12px, 1.2vw, 24px);
  font-size: clamp(12px, 0.73vw, 14px);
  color: #21243d;
}

.header-meta {
  flex-shrink: 0;
  font-size: clamp(12px, 0.68vw, 14px);
  color: #a6a6a6;
  text-align: right;
}

.header-meta .time {
  display: block;
}

.onepage-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 12px;
  border-bottom: 2px solid #2036ca;
}

.onepage-title {
  font-size: 20px;
  font-weight: 700;
  color: #2036ca;
  letter-spacing: 0.4px;
}

.onepage-progress {
  font-size: 18px;
  color: #a6a6a6;
  line-height: 1.75;
}

.onepage-progress .onepage-num {
  font-style: normal;
  color: #2036ca;
  font-weight: 400;
}

.header-actions {
  margin-left: auto;
  display: flex;
  gap: 12px;
}

.action-icon {
  font-size: 18px;
  color: #595959;
  cursor: pointer;
}

.action-icon:hover {
  color: #2036ca;
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

.content-divider {
  width: 6px;
  flex-shrink: 0;
  background: #c2c7e8;
  border-radius: 100px;
  margin: 0;
  align-self: stretch;
}

/* 右侧栏按视口比例适配，约 1920 下 556px，小屏有最小宽度 */
.content-right {
  flex: 0 0 min(556px, 29vw);
  min-width: 280px;
  padding: 8px 11px 24px;
  overflow-y: auto;
  border: 1px solid #cedbfa;
  border-radius: 6px;
  margin: 0;
  box-sizing: border-box;
  background: #fff;
}

.right-search {
  display: flex;
  gap: 10px;
  margin-bottom: 0;
  align-items: center;
  padding: 8px 11px;
  border-bottom: 1px solid #f0f0f0;
}

.keyword-input {
  flex: 1;
  min-width: 0;
}

.keyword-input :deep(.el-input__wrapper) {
  border-radius: 4px;
  border-color: #bac2d7;
  box-shadow: 0 0 0 1px #bac2d7;
}

.doc-tree {
  font-size: 14px;
  color: #21243d;
}

.tree-item {
  display: flex;
  align-items: center;
  padding: 9px 10px;
  min-height: 46px;
  cursor: pointer;
  border-radius: 0;
  box-sizing: border-box;
}

.tree-item:hover {
  background: #fafafa;
}

.tree-caret {
  font-size: 12px;
  margin-right: clamp(6px, 0.5vw, 8px);
  color: #8c8c8c;
}

.tree-icon {
  font-size: clamp(14px, 0.83vw, 16px);
  margin-right: clamp(6px, 0.5vw, 8px);
  color: #595959;
}

.tree-children {
  padding-left: 12px;
}

.tree-child {
  display: flex;
  align-items: center;
  padding: 0 12px;
  min-height: 44px;
  font-size: 14px;
  color: #21243d;
  cursor: pointer;
  border-radius: 0;
  box-sizing: border-box;
}

.tree-child .el-icon {
  font-size: 14px;
  margin-right: 7px;
}

.tree-child:hover {
  background: #fafafa;
  color: #21243d;
}

.tree-child.active {
  background: #e4f0ff;
  color: #21243d;
}
</style>
