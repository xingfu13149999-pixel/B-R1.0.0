<!--
  客户首页「一页纸」区块（由 CustomerHome 引用，非项目详情页）
  作用：展示客户维度下的多卡片摘要（标题、更新时间、正文、标签）；项目级详情请使用 ProjectHome + ProjectOnepage。
  修改卡片列表与样式请改本文件。
-->
<template>
  <!-- 客户首页「一页纸」：仅客户维度卡片（项目页见独立路由 ProjectHome + ProjectOnepage） -->
  <div class="detail-cards">
    <div v-for="section in detailSections" :key="section.title" class="detail-card">
      <div class="card-top-row">
        <h3 class="card-title">{{ section.title }}</h3>
        <span class="card-update-time">更新时间&ensp;&ensp;{{ section.updateTime }}</span>
      </div>
      <p class="card-content">{{ section.content }}</p>
      <div class="card-tags">
        <span v-for="tag in section.tags" :key="tag.text" class="tag" :class="'tag-' + tag.type">{{
          tag.text
        }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCustomerDetailSections } from '@/views/home/mock/customerViewData'

const props = defineProps<{
  /** 与左侧树选中节点一致，由 AdminLayout + Pinia 同步 */
  customerId: string | null
}>()

const detailSections = computed(() => getCustomerDetailSections(props.customerId))
</script>

<style scoped>
.detail-cards {
  flex: 1;
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.detail-card {
  width: 100%;
  box-sizing: border-box;
  background: #fff;
  border-radius: 6px;
  padding: 15px 17px;
  flex-shrink: 0;
}

.card-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 8px;
}

.card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #21243d;
  letter-spacing: 0.36px;
}

.card-update-time {
  font-size: 14px;
  color: #a6a6a6;
  white-space: pre;
  flex-shrink: 0;
  line-height: 1.75;
  letter-spacing: 0;
}

.card-content {
  margin: 0 0 14px;
  font-size: 14px;
  color: #21243d;
  line-height: 24px;
  letter-spacing: 0.28px;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  align-items: center;
}

.tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  padding: 1px 10px;
  border-radius: 5px;
  font-size: 14px;
  letter-spacing: 0.28px;
  white-space: nowrap;
}

.tag-blue {
  background: #ebefff;
  color: #4f78ff;
}

.tag-yellow {
  background: #fff9e5;
  color: #ff8d1a;
}

.tag-green {
  background: #e5f8f6;
  color: #00baad;
}

.tag-red {
  background: #fcebef;
  color: #fe635d;
}

.tag-gray {
  background: #f5f5f5;
  color: #595959;
}

.tag-blue-solid {
  background: #2036ca;
  color: #fff;
}
</style>
