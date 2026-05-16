<!--
  瀹㈡埛棣栭〉銆屼竴椤电焊銆嶅尯鍧楋紙鐢?CustomerHome 寮曠敤锛岄潪椤圭洰璇︽儏椤碉級
  浣滅敤锛氬睍绀哄鎴风淮搴︿笅鐨勫鍗＄墖鎽樿锛堟爣棰樸€佹洿鏂版椂闂淬€佹鏂囥€佹爣绛撅級锛涢」鐩骇璇︽儏璇蜂娇鐢?ProjectHome + ProjectOnepage銆?  淇敼鍗＄墖鍒楄〃涓庢牱寮忚鏀规湰鏂囦欢銆?-->
<template>
  <!-- 瀹㈡埛棣栭〉銆屼竴椤电焊銆嶏細浠呭鎴风淮搴﹀崱鐗囷紙椤圭洰椤佃鐙珛璺敱 ProjectHome + ProjectOnepage锛?-->
  <el-scrollbar class="detail-cards-scroll">
    <div class="detail-cards">
      <div v-for="section in detailSections" :key="section.title" class="detail-card">
        <div class="card-top-row">
          <h3 class="card-title">{{ section.title }}</h3>
          <span class="card-update-time">鏇存柊鏃堕棿&ensp;&ensp;{{ section.updateTime }}</span>
        </div>
        <p class="card-content">{{ section.content }}</p>
        <div class="card-tags">
          <span v-for="tag in section.tags" :key="tag.text" class="tag" :class="'tag-' + tag.type">{{
            tag.text
          }}</span>
        </div>
      </div>
    </div>
  </el-scrollbar>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { getCustomerDetailSections } from '@/views/home/mock/customerViewData'

const props = defineProps<{
  /** 涓庡乏渚ф爲閫変腑鑺傜偣涓€鑷达紝鐢?AdminLayout + Pinia 鍚屾 */
  customerId: string | null
}>()

const detailSections = computed(() => getCustomerDetailSections(props.customerId))
</script>

<style scoped>
.detail-cards-scroll {
  width: 100%;
  height: 100%;
}

.detail-cards-scroll :deep(.el-scrollbar__wrap) {
  overflow-x: hidden;
  scrollbar-width: none;
}

.detail-cards-scroll :deep(.el-scrollbar__wrap::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

.detail-cards-scroll :deep(.el-scrollbar__bar) {
  opacity: 0;
  transition: opacity 0.2s ease;
}

.detail-cards-scroll:hover :deep(.el-scrollbar__bar),
.detail-cards-scroll :deep(.el-scrollbar__bar:hover) {
  opacity: 1;
}

.detail-cards-scroll :deep(.el-scrollbar__bar.is-vertical) {
  width: var(--scrollbar-size);
  right: 0;
}

.detail-cards-scroll :deep(.el-scrollbar__thumb) {
  background: var(--scrollbar-thumb);
  border-radius: 100px;
}

.detail-cards {
  width: 100%;
  box-sizing: border-box;
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
