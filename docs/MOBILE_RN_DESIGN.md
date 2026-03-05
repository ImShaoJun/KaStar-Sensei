# 📱 KaStar Sensei Mobile - React Native 改造设计文档

> **版本：** v1.0  
> **创建日期：** 2026-03-04  
> **目标：** 将 Web 版卡五星 AI 教练改造为 React Native 移动应用，实现 AI 教练可插拔架构

---

## 📋 目录

1. [项目背景](#项目背景)
2. [架构设计](#架构设计)
3. [模块结构](#模块结构)
4. [技术选型](#技术选型)
5. [代码复用分析](#代码复用分析)
6. [改造步骤](#改造步骤)
7. [关键代码示例](#关键代码示例)
8. [时间估算](#时间估算)
9. [风险与挑战](#风险与挑战)

---

## 项目背景

### 当前状态

- ✅ 完整的 Web 版麻将对局系统 (Next.js + TypeScript)
- ✅ 游戏引擎完整 (发牌/洗牌/胡牌判定/卡五星检测)
- ✅ AI 教练对接 Claude API
- ✅ AI 教练架构重构，支持插件化 (ICoachProvider)
- ✅ Monorepo 架构搭建完成 (npm workspaces)
- ✅ 核心逻辑抽取为独立包 (@kastar/core-game)
- 🚧 React Native 移动端应用已初始化 (Phase 4)

### 改造目标

1. **跨平台：** React Native 实现 iOS/Android 双端
2. **可插拔教练：** 抽象 AI 教练接口，支持多种提供商
3. **代码复用：** 最大化复用现有 TypeScript 代码
4. **离线支持：** 可选本地 AI 模型 (未来扩展)

---

## 架构设计

### 目标架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native App                             │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                   游戏核心层 (TypeScript)                    ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │ 麻将引擎  │  │ 规则系统  │  │ 状态管理  │  │ 事件总线  │ ││
│  │  │ (移植)    │  │ (移植)    │  │ (Zustand) │  │           │ ││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                 AI 教练插件层 (可插拔)                        ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │              ICoachProvider 接口 (TS Interface)        │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  │           │                    │                    │       ││
│  │           ▼                    ▼                    ▼       ││
│  │  ┌─────────────┐      ┌─────────────┐      ┌─────────────┐  ││
│  │  │ Claude 插件 │      │ 本地 HTTP 插件│      │ 自定义插件  │  ││
│  │  │ (API 调用)   │      │ (可配置端点)│      │ (可扩展)    │  ││
│  │  └─────────────┘      └─────────────┘      └─────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
│                              │                                   │
│                              ▼                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                  UI 渲染层 (React Native)                     ││
│  │  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐ ││
│  │  │ 牌桌视图  │  │ 手牌区域  │  │ 教练反馈  │  │ 设置面板  │ ││
│  │  │ (RN View) │  │ (FlatList)│  │ (Modal)   │  │ (AsyncStorage)││
│  │  └───────────┘  └───────────┘  └───────────┘  └───────────┘ ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### 设计原则

1. **关注点分离：** 游戏逻辑、AI 教练、UI 渲染三层独立
2. **接口抽象：** 教练功能通过接口定义，实现可替换
3. **配置驱动：** 通过配置文件切换教练提供商
4. **最大复用：** 现有 TypeScript 代码尽量直接移植

---

## 模块结构

### Monorepo 目录结构

```
KaStar-Sensei-Mobile/
├── packages/
│   ├── core-game/              # 游戏核心 (纯 TS，可复用)
│   │   ├── src/
│   │   │   ├── engine/
│   │   │   │   ├── GameEngine.ts      # 从 Web 版移植
│   │   │   │   ├── shuffle.ts
│   │   │   │   └── winCheck.ts
│   │   │   ├── models/
│   │   │   │   └── mahjong.ts         # 从 Web 版移植
│   │   │   └── rules/
│   │   │       └── kaWuXing.ts        # 卡五星规则
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── coach-api/              # 教练接口层
│   │   ├── src/
│   │   │   ├── types.ts               # 接口定义
│   │   │   ├── ICoachProvider.ts      # 插件契约
│   │   │   └── CoachFeedback.ts       # 反馈类型
│   │   └── package.json
│   │
│   ├── coach-plugins/          # 插件实现
│   │   ├── src/
│   │   │   ├── ClaudeCoach.ts       # Claude API 调用
│   │   │   ├── HttpCoach.ts         # 通用 HTTP 端点
│   │   │   ├── MockCoach.ts         # 测试用
│   │   │   └── index.ts             # 插件注册表
│   │   └── package.json
│   │
│   └── ui-components/          # 可复用 UI 组件
│       ├── src/
│       │   ├── MahjongTile.tsx        # 麻将牌 (SVG)
│       │   ├── TileBack.tsx           # 牌背
│       │   ├── DiscardPile.tsx        # 弃牌区
│       │   └── HandArea.tsx           # 手牌区
│       └── package.json
│
├── apps/
│   ├── mobile/                 # React Native 主应用
│   │   ├── src/
│   │   │   ├── screens/
│   │   │   │   ├── GameScreen.tsx     # 游戏主界面
│   │   │   │   ├── SettingsScreen.tsx # 设置
│   │   │   │   └── StatsScreen.tsx    # 战绩统计
│   │   │   ├── store/
│   │   │   │   └── gameStore.ts       # Zustand 状态管理
│   │   │   ├── hooks/
│   │   │   │   ├── useGame.ts
│   │   │   │   └── useCoach.ts
│   │   │   ├── config/
│   │   │   │   └── plugins.ts         # 插件配置
│   │   │   └── utils/
│   │   │       └── storage.ts         # AsyncStorage 封装
│   │   ├── App.tsx
│   │   ├── package.json
│   │   └── app.json
│   │
│   └── web/                    # 保留 Web 版 (可选)
│       └── ... (当前 Next.js 项目)
│
├── package.json                # Monorepo 根配置 (pnpm workspaces)
└── tsconfig.base.json          # 共享 TS 配置
```

---

## 技术选型

| 功能 | 推荐方案 | 理由 |
|------|----------|------|
| **RN 框架** | Expo (推荐) / 纯 RN | Expo 开发体验好，真机调试方便 |
| **状态管理** | Zustand | 轻量，类似 React state，比 Redux 简单 |
| **UI 组件** | `react-native-svg` | 完美复用现有 SVG 麻将牌 |
| **导航** | Expo Router / React Navigation | 文件路由，类似 Next.js |
| **存储** | `@react-native-async-storage/async-storage` | 官方存储方案 |
| **HTTP 请求** | `fetch` (内置) / `axios` | 简单场景 fetch 足够 |
| **插件系统** | 工厂模式 + 配置切换 | RN 不支持动态加载，用配置切换 |
| **包管理** | pnpm workspaces | Monorepo 最佳实践 |
| **构建** | EAS Build (Expo) | 云端打包，支持 iOS/Android |

---

## 代码复用分析

| 原文件 | 复用方式 | 改动量 |
|--------|----------|--------|
| `src/engine/GameEngine.ts` | 直接复制 + 微调 | 10% |
| `src/models/mahjong.ts` | 直接复制 | 0% |
| `src/components/MahjongTile.tsx` | 复制 + 适配 RN-SVG | 20% |
| `src/app/api/feedback/route.ts` | 逻辑抽离为 Coach 类 | 40% |
| `src/app/api/feedback/session.ts` | 直接复制为常量 | 0% |
| `src/app/page.tsx` | 参考重写为 RN 组件 | 60% |

**总体复用率：~70%**

---

## 改造步骤

### Phase 1: Monorepo 搭建 (已完成 ✅)

- 使用 npm workspaces 初始化 Monorepo
- 创建 packages 和 apps 目录结构
- 配置 tsconfig.base.json 路径映射

### Phase 2: 核心抽取 (已完成 ✅)

- 创建 `packages/core-game`
- 移植 `GameEngine.ts` 和 `mahjong.ts`
- Web 端已切换至引用共享包

### Phase 3: 教练接口抽象 (已完成 ✅)

- 定义 `ICoachProvider` 接口
- 实现 `ClaudeCoach` 插件
- Web 端 API 已适配新插件架构

### Phase 4: React Native 主应用 (进行中 🚧)

- [x] 使用 Expo 初始化 `apps/mobile`
- [x] 安装核心依赖 (SVG, Zustand, AsyncStorage)
- [x] 成功在 RN 中调用核心引擎并渲染手牌
- [ ] 移植 SVG 牌面组件
- [ ] 实现核心游戏状态管理 (Zustand)

**关键组件移植：**

```typescript
// MahjongTile.tsx (RN 版)
import Svg, { G, Path, Text } from 'react-native-svg';

export default function MahjongTile({ tile, size, onPress }) {
  return (
    <Svg width={size} height={size * 1.4} onPress={onPress}>
      {/* 复用 Web 版 SVG 路径 */}
    </Svg>
  );
}
```

### Phase 5: 插件系统 + 设置 (3-5 天)

```typescript
// 设置界面选择教练
interface CoachConfig {
  providerId: 'claude' | 'http' | 'mock';
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

// 工厂函数
function createCoach(config: CoachConfig): ICoachProvider {
  switch (config.providerId) {
    case 'claude': return new ClaudeCoach(config.apiKey);
    case 'http': return new HttpCoach(config.baseUrl);
    case 'mock': return new MockCoach();
  }
}
```

### Phase 6: 测试 & 打包 (3-5 天)

- 真机调试 (Expo Go)
- EAS Build 打包 APK/IPA
- 性能优化

---

## 关键代码示例

### 教练插件接口

```typescript
// packages/coach-api/src/types.ts
export type Rating = 'S' | 'A' | 'B' | 'C' | 'F';

export interface DiscardContext {
  roundNum: number;
  handBefore: string[];
  discardedTile: string;
  handAfter: string[];
  opponentDiscards: string[];
  elapsedMs: number;
  kaWuXingPotentialBefore: boolean;
  kaWuXingPotentialAfter: boolean;
}

export interface CoachFeedback {
  rating: Rating;
  summary: string;
  analysis: string;
}
```

### 状态管理 (Zustand)

```typescript
// apps/mobile/src/store/gameStore.ts
import { create } from 'zustand';
import { GameState } from '@core-game/engine';

interface GameStore {
  gameState: GameState | null;
  feedback: string | null;
  isAiLoading: boolean;
  coach: ICoachProvider;
  
  startGame: () => void;
  discardTile: (tile: Tile) => Promise<void>;
  setCoach: (coach: ICoachProvider) => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  feedback: null,
  isAiLoading: false,
  coach: new ClaudeCoach(),
  
  startGame: () => {
    const newGame = createGame();
    set({ gameState: newGame, feedback: null });
  },
  
  discardTile: async (tile) => {
    const state = get().gameState;
    if (!state) return;
    
    const nextState = playerDiscard(state, tile);
    set({ gameState: nextState, isAiLoading: true });
    
    const feedback = await get().coach.analyze(context);
    set({ feedback: feedback.analysis, isAiLoading: false });
  },
  
  setCoach: (coach) => set({ coach }),
}));
```

### 设置界面

```typescript
// apps/mobile/src/screens/SettingsScreen.tsx
export default function SettingsScreen() {
  const [config, setConfig] = useCoachConfig();
  
  return (
    <View>
      <Picker
        selectedValue={config.providerId}
        onValueChange={(v) => setConfig({ ...config, providerId: v })}
      >
        <Picker.Item label="Claude 毒舌教练" value="claude" />
        <Picker.Item label="自定义 HTTP 端点" value="http" />
        <Picker.Item label="测试模式 (Mock)" value="mock" />
      </Picker>
      
      {config.providerId === 'claude' && (
        <TextInput
          placeholder="Anthropic API Key"
          value={config.apiKey}
          onChangeText={(v) => setConfig({ ...config, apiKey: v })}
          secureTextEntry
        />
      )}
    </View>
  );
}
```

### 依赖清单

```json
// apps/mobile/package.json
{
  "dependencies": {
    "expo": "~52.0.0",
    "expo-router": "~4.0.0",
    "react": "18.3.1",
    "react-native": "0.76.0",
    "react-native-svg": "^15.0.0",
    "zustand": "^5.0.0",
    "@react-native-async-storage/async-storage": "^2.0.0",
    "axios": "^1.7.0"
  },
  "devDependencies": {
    "@types/react": "~18.3.0",
    "typescript": "^5.5.0",
    "jest": "^29.0.0"
  }
}
```

---

## 时间估算

| 阶段 | 时间 | 交付物 |
|------|------|--------|
| Monorepo 搭建 | 2-3 天 | 可工作的 workspace |
| 核心抽取 | 3-5 天 | `core-game` 包 + 测试 |
| 教练接口 | 2-3 天 | 插件框架 + Claude 实现 |
| RN 主应用 | 1-2 周 | 可玩 Alpha 版 |
| 插件系统 | 3-5 天 | 设置界面 + 配置持久化 |
| 测试打包 | 3-5 天 | APK/IPA |
| **总计** | **4-6 周** | 可发布版本 |

---

## 风险与挑战

| 风险 | 影响 | 缓解方案 |
|------|------|----------|
| **RN-SVG 性能** | 中 | 用 Canvas 预渲染缓存，避免每帧重绘 |
| **API Key 安全存储** | 中 | Expo SecureStore / 加密存储 |
| **多插件维护成本** | 低 | 先做 1-2 个核心插件，社区贡献扩展 |
| **iOS 审核** | 中 | 确保有实际功能，非纯 API 壳 |
| **本地 AI 模型效果** | 高 | 默认用云端 API，本地作为可选降级 |

---

## 附录：教练插件扩展指南

### 添加新教练插件

1. 在 `packages/coach-plugins/src/` 创建新文件
2. 实现 `ICoachProvider` 接口
3. 在 `index.ts` 注册插件
4. 在设置界面添加选项

```typescript
// MyCustomCoach.ts
export class MyCustomCoach implements ICoachProvider {
  name = "我的自定义教练";
  description = "使用自定义 AI 模型";
  
  async analyze(context: DiscardContext): Promise<CoachFeedback> {
    // 你的实现
    return {
      rating: 'A',
      summary: '不错的出牌',
      analysis: '详细分析...'
    };
  }
}
```

---

**文档结束**

> 💡 **提示：** 实现过程中如有问题，参考此设计文档调整。核心原则：**接口抽象、配置驱动、最大复用**。
