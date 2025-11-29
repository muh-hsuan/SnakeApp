# **軟體低階設計說明書 (Low-Level Design Document)**

專案名稱：現代貪吃蛇 (Project Modern Snake)  
版本：1.0.0  
參考文件：現代貪吃蛇 HLD v1.1.0  
日期：2025-11-28

## **1\. 簡介 (Introduction)**

本文件依據 HLD 定義的架構，詳細規範系統各模組的實作細節。本設計重點在於利用 TypeScript 強型別特性定義資料結構，並詳述 React Native Reanimated 與 Skia 之間的連動機制。

## **2\. 資料結構與型別定義 (Data Structures & Types)**

### **2.1 核心型別 (src/types/game.ts)**

// 座標點  
export interface Coordinate {  
  x: number;  
  y: number;  
}

// 方向列舉 (避免魔法數字)  
export enum Direction {  
  UP \= 0,  
  DOWN \= 1,  
  LEFT \= 2,  
  RIGHT \= 3,  
}

// 遊戲狀態機  
export enum GameState {  
  IDLE \= 'IDLE',       // 初始畫面  
  PLAYING \= 'PLAYING', // 遊戲進行中  
  PAUSED \= 'PAUSED',   // 暫停  
  GAMEOVER \= 'GAMEOVER' // 遊戲結束  
}

// 遊戲設定介面 (用於持久化儲存)  
export interface GameSettings {  
  soundEnabled: boolean;  
  hapticsEnabled: boolean;  
  highScore: number;  
  skinId: string; // 預留換膚功能  
}

### **2.2 蛇身資料結構**

雖然 HLD 提及 Deque，但在 JavaScript/TypeScript 中，考慮到與 Reanimated SharedValue 的相容性，我們使用 **Array** 實作，並配合 Immutable 更新策略。

* **Type**: Coordinate\[\]  
* **Head**: snake\[0\]  
* **Tail**: snake\[length \- 1\]

## **3\. 模組詳細設計 (Module Detail Design)**

### **3.1 遊戲核心引擎 (src/hooks/useGameLogic.ts)**

此模組運行於 **JS Thread**，負責處理 15Hz 的邏輯更新。

#### **狀態定義**

const \[gameState, setGameState\] \= useState\<GameState\>(GameState.IDLE);  
const snakeBody \= useSharedValue\<Coordinate\[\]\>(\[{ x: 10, y: 10 }\]); // 傳遞給 UI Thread  
const foodPosition \= useSharedValue\<Coordinate\>({ x: 5, y: 5 });  
const currentDirection \= useRef\<Direction\>(Direction.RIGHT); // 使用 Ref 避免重渲染  
const nextDirection \= useRef\<Direction\>(Direction.RIGHT); // 輸入緩衝區

#### **核心 Loop 演算法 (Fixed Timestep)**

為了在 JS Thread 實現穩定的 15Hz，我們不依賴 setInterval，而是使用一個基於 requestAnimationFrame 的累積時間累加器。

// 虛擬代碼邏輯  
const TICK\_RATE \= 15;  
const TICK\_DURATION \= 1000 / TICK\_RATE;  
let lastTime \= performance.now();  
let accumulator \= 0;

const gameLoop \= () \=\> {  
  if (gameState \!== GameState.PLAYING) return;

  const now \= performance.now();  
  const deltaTime \= now \- lastTime;  
  lastTime \= now;  
  accumulator \+= deltaTime;

  // 追趕邏輯 (Catch-up phase)  
  while (accumulator \>= TICK\_DURATION) {  
    updatePhysics(); // 執行一次物理更新  
    accumulator \-= TICK\_DURATION;  
  }

  requestAnimationFrame(gameLoop);  
};

// 物理更新函式  
const updatePhysics \= () \=\> {  
  // 1\. 讀取緩衝區方向  
  const dir \= nextDirection.current;  
    
  // 2\. 計算蛇頭新位置  
  const head \= snakeBody.value\[0\];  
  const newHead \= calculateNewHead(head, dir);

  // 3\. 碰撞檢測  
  if (checkCollision(newHead, snakeBody.value)) {  
    handleGameOver();  
    return;  
  }

  // 4\. 移動與吃食邏輯  
  let newBody \= \[newHead, ...snakeBody.value\];  
  if (isEatingFood(newHead, foodPosition.value)) {  
    generateNewFood();  
    playEatSound();  
    triggerHaptics();  
    // 不移除尾巴 (變長)  
  } else {  
    newBody.pop(); // 移除尾巴 (移動)  
  }

  // 5\. 更新 SharedValue (觸發 Skia 重繪)  
  snakeBody.value \= newBody;  
  currentDirection.current \= dir;  
};

### **3.2 輸入管理器 (src/managers/InputManager.ts)**

處理手勢並實作「輸入緩衝 (Input Buffer)」以防止自殺式轉向。

// 防止 180 度迴轉  
const isValidTurn \= (current: Direction, next: Direction): boolean \=\> {  
  if (current \=== Direction.UP && next \=== Direction.DOWN) return false;  
  if (current \=== Direction.DOWN && next \=== Direction.UP) return false;  
  if (current \=== Direction.LEFT && next \=== Direction.RIGHT) return false;  
  if (current \=== Direction.RIGHT && next \=== Direction.LEFT) return false;  
  return true;  
};

// 處理滑動手勢  
export const handleSwipe \= (gestureDirection: Direction) \=\> {  
  // 檢查是否與當前移動方向衝突  
  if (isValidTurn(currentDirection.current, gestureDirection)) {  
    // 寫入緩衝區，等待下一個 Tick 讀取  
    nextDirection.current \= gestureDirection;  
  }  
};

### **3.3 渲染引擎 (src/components/game/GameCanvas.tsx)**

運行於 **UI Thread**，使用 Skia 直接繪製。

#### **Canvas 結構**

\<Canvas style={{ flex: 1 }}\>  
  {/\* 背景網格 (可選) \*/}  
  \<Grid /\>   
    
  {/\* 蛇身渲染 \*/}  
  \<SnakeRenderer body={snakeBody} /\>  
    
  {/\* 食物渲染 \*/}  
  \<FoodRenderer position={foodPosition} /\>  
\</Canvas\>

#### **SnakeRenderer 實作細節**

為了效能，不對每個節點使用單獨的組件，而是計算一條完整的 SkPath。

// src/components/game/SnakeRenderer.tsx  
interface Props {  
  body: SharedValue\<Coordinate\[\]\>;  
  cellSize: number;  
}

export const SnakeRenderer \= ({ body, cellSize }: Props) \=\> {  
  // 使用 useDerivedValue 監聽 body 變化並計算 Path  
  const path \= useDerivedValue(() \=\> {  
    const p \= Skia.Path.Make();  
    const currentBody \= body.value;  
      
    currentBody.forEach((segment, index) \=\> {  
      const rect \= Skia.XYWHRect(  
        segment.x \* cellSize,   
        segment.y \* cellSize,   
        cellSize,   
        cellSize  
      );  
      // 可在此處添加圓角邏輯  
      p.addRect(rect);  
    });  
    return p;  
  }, \[body\]);

  return \<Path path={path} color="\#4CAF50" /\>;  
};

### **3.4 儲存模組 (src/utils/storage.ts)**

封裝 MMKV，提供型別安全的存取方法。

import { MMKV } from 'react-native-mmkv';

export const storage \= new MMKV();

const KEYS \= {  
  SETTINGS: 'game.settings',  
};

export const saveSettings \= (settings: GameSettings) \=\> {  
  storage.set(KEYS.SETTINGS, JSON.stringify(settings));  
};

export const getSettings \= (): GameSettings \=\> {  
  const data \= storage.getString(KEYS.SETTINGS);  
  if (data) return JSON.parse(data);  
  // Default Settings  
  return {  
    soundEnabled: true,  
    hapticsEnabled: true,  
    highScore: 0,  
    skinId: 'default',  
  };  
};

### **3.5 音效管理 (src/managers/AudioManager.ts)**

使用 Singleton 模式管理 expo-av 實例，避免重複載入。

class AudioManager {  
  private static instance: AudioManager;  
  private eatSound: Audio.Sound | null \= null;  
  private dieSound: Audio.Sound | null \= null;

  // 預載入  
  async loadAssets() {  
    const { sound: s1 } \= await Audio.Sound.createAsync(  
      require('@assets/sounds/eat.mp3')  
    );  
    this.eatSound \= s1;  
    // ... load dieSound  
  }

  async playEat() {  
    // 使用 replayAsync 確保快速觸發時能重播  
    await this.eatSound?.replayAsync();  
  }  
}

## **4\. 檔案與目錄結構 (Directory Structure)**

/  
├── app/                      \# Expo Router Pages  
│   ├── index.tsx             \# Splash Screen  
│   ├── home.tsx              \# Main Menu  
│   └── game/                   
│       └── index.tsx         \# Game Container  
├── assets/  
│   ├── images/  
│   └── sounds/  
├── src/  
│   ├── components/           \# UI Components  
│   │   ├── game/             \# Skia Renderers  
│   │   │   ├── GameCanvas.tsx  
│   │   │   ├── SnakeRenderer.tsx  
│   │   │   └── FoodRenderer.tsx  
│   │   └── ui/               \# React Native UI (HUD, Modals)  
│   ├── hooks/  
│   │   ├── useGameLoop.ts    \# 核心邏輯 Loop  
│   │   └── useGestures.ts    \# 手勢處理  
│   ├── managers/             \# 業務邏輯單例  
│   │   ├── AudioManager.ts  
│   │   └── HapticsManager.ts  
│   ├── types/                \# TS Interfaces  
│   │   └── index.ts  
│   └── utils/  
│       ├── constants.ts      \# GRID\_SIZE, TICK\_RATE  
│       └── storage.ts        \# MMKV wrapper  
├── app.json                  \# Expo Config (Plugins)  
└── package.json

## **5\. 整合與配置 (Integration Configuration)**

### **5.1 app.json 配置關鍵點**

確保原生依賴正確注入。

{  
  "expo": {  
    "plugins": \[  
      "expo-router",  
      \[  
        "react-native-google-mobile-ads",  
        {  
          "androidAppId": "ca-app-pub-xxxxxxxx\~xxxxxxxx",  
          "iosAppId": "ca-app-pub-xxxxxxxx\~xxxxxxxx"  
        }  
      \],  
      "react-native-mmkv"  
    \]  
  }  
}

### **5.2 效能優化策略 (Performance Optimization)**

1. **Reanimated runOnJS**: 雖然主要邏輯在 JS Thread，但在處理 Gesture Handler (UI Thread) 的回調時，若需修改 JS 端的 Ref，需注意線程切換成本。本設計建議 Gesture 直接修改 SharedValue 或 Worklet 變數，或者由 JS Loop 主動輪詢手勢狀態。  
2. **Memoization**: SnakeRenderer 中的 SkPath 計算必須使用 useDerivedValue，避免每次 Render 都重新分配記憶體。  
3. **Lazy Loading**: 音效資源在 App 啟動時異步加載 (app/index.tsx)，避免遊戲開始時卡頓。

## **6\. 測試計畫 (Unit Testing Strategy)**

* **Logic Layer**: 針對 calculateNewHead, checkCollision 等純函式編寫 Jest 測試。  
* **Integration**: 使用 React Native Testing Library 測試 GameCanvas 是否在 SharedValue 改變時正確觸發重繪 (需 Mock Skia)。