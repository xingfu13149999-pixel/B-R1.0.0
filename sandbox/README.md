# 语音模块优化沙箱

## 目录结构

```
sandbox/
├── src/
│   ├── api/
│   │   ├── ai.ts                      # DeepSeek API 调用
│   │   └── transcriptPolish.ts         # 标点补全
│   ├── composables/
│   │   ├── useInterviewRecorder.ts     # 录音 composable
│   │   └── useInterviewTranscription.ts # 转写 composable
│   ├── types/
│   │   └── interviewSummary.ts         # 类型定义
│   └── utils/
│       ├── interviewHotKeywordsFromAi.ts    # AI 关键词
│       ├── interviewKeywordExtract.ts        # 本地关键词提取
│       ├── interviewRecordsStorage.ts        # localStorage 持久化
│       ├── interviewSessionCache.ts          # sessionStorage 缓存
│       ├── interviewSummaryFromSegments.ts   # AI 总结生成
│       └── interviewTranscript.ts            # 转写文本处理
├── index.html    # 测试页面
├── package.json
└── vite.config.js
```

## 启动沙箱

```bash
cd sandbox
npm install
npm run dev
```

访问 http://localhost:5174

## 测试功能

1. **录音测试** - 初始化麦克风，开始/暂停/停止录音
2. **转写测试** - 模拟实时字幕生成
3. **AI 功能测试** - 标点补全、总结生成、关键词提取
4. **存储测试** - localStorage / sessionStorage

## 优化任务清单

### Phase 1: 代码重构

- [ ] 抽取 `useHotKeywords` composable
- [ ] 抽取 `useInterviewPersist` composable
- [ ] 抽取 `useInterviewSession` composable
- [ ] 拆分 InterviewStart.vue 为小组件

### Phase 2: 体验增强

- [ ] 录音质量指示器
- [ ] 离线支持
- [ ] 导出格式增强

### Phase 3: AI 能力

- [ ] 实时访谈建议
- [ ] 情感分析
- [ ] 多语言翻译

## 注意事项

1. 所有优化在 `sandbox/src/` 下进行
2. 原文件在 `src/views/home/` 下保持不变
3. 优化完成后可手动合并到主项目
