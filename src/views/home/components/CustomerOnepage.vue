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
const detailSections = [
  {
    title: '企业概况',
    updateTime: '10:38:57',
    content:
      '四川晨光博达新材料有限公司是成都晨光博达新材料股份有限公司(国家级专精特新\"小巨人\")的全资子公司，专注于氟硅高分子新材料研发制造，专注于氟硅高分子新材料研发制造，专注于氟硅高分子新材料研发制造，专注于氟硅高分子。该公司成立于2019年01月25日..',
    tags: [
      { text: '国家专精特新\"小巨人\"', type: 'blue' },
      { text: '省级企业技术中心', type: 'yellow' },
      { text: '核心技术国产替代', type: 'green' },
      { text: 'MQ硅树脂销量翻倍', type: 'red' }
    ]
  },
  {
    title: '股权结构',
    updateTime: '08:38:46',
    content:
      '四川晨光博达新材料有限公司是成都晨光博达新材料股份有限公司的全资子公司(持股100%)，母公司股权结构分散，主要股东包括自然人刘皓(持股约17.54%)、机构投资...',
    tags: [
      { text: '股权结构清晰', type: 'yellow' },
      { text: '法人独资子公司', type: 'blue' },
      { text: '无实际控制', type: 'red' }
    ]
  },
  {
    title: '经营状况分析',
    updateTime: '07:38:52',
    content:
      '四川晨光博达新材料有限公司的氟硅高端精细化学品项目在产业政策符合性、园区选址、环境准入及危险化学品经营资质等关键环节符合行业准入条件。公司核心产品包括打破国外...',
    tags: [
      { text: '冰芯冷却液', type: 'green' },
      { text: '销量增长显著', type: 'yellow' },
      { text: '智改数转', type: 'blue' }
    ]
  },
  {
    title: '核心竞争力',
    updateTime: '05:28:23',
    content:
      '公司主要生产全氟聚醚油(E)、环保型含氣表面活性剂(FSA)、MQ硅树脂(MQ)。全氟聚醚油(PEPF)设计产能300吨/年，该产品每年可为企业带来的收入为:8t*65w/t*12月=6240W年...',
    tags: [{ text: 'MQ硅树脂(MQ)', type: 'green' }]
  }
]
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
