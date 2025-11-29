# **軟體高階設計說明書 (High-Level Design Document)**

**專案名稱**：現代貪吃蛇 (Project Modern Snake)

**版本**：1.1.0 (Expo Edition)

**日期**：2025-11-28

**技術棧**：React Native, Expo (Dev Client), Skia, Reanimated, TypeScript

## **1\. 簡介 (Introduction)**

### **1.1 目的**

本文件旨在將《現代貪吃蛇 SRS v1.0.0》中的需求轉化為高階系統架構設計。本文將定義系統模組、數據流向、關鍵技術決策以及如何在 **React Native \+ Expo** 環境下實現高效能遊戲循環（Game Loop）。

### **1.2 設計範圍**

本設計涵蓋前端架構、渲染管線、狀態管理、數據持久化以及第三方服務（廣告）的整合策略。重點在於解決跨平台（iOS/Android）的效能一致性，並利用 Expo 生態系簡化開發與發布流程。

## **2\. 系統架構 (System Architecture)**

### **2.1 架構概觀**

為了達成 SRS 設定的 **60 FPS** 目標，我們採用 **Expo Managed Workflow (配合 Config Plugins)** 的混合架構：

1. **Expo 基礎層**：使用 expo-dev-client 取代傳統 RN CLI，透過 EAS Build 處理 Native 依賴（如 Skia 的 C++ 庫）。  
2. **UI 層**：處理選單、HUD、設定（使用標準 React Components）。  
3. **遊戲引擎層**：處理物理邏輯、碰撞判定（運行於 JS Thread）。  
4. **渲染層**：直接操作 GPU 繪圖（使用 Skia 與 Reanimated 運行於 UI Thread）。

### **2.2 架構圖 (Mermaid)**

graph TD  
    User\[使用者 Input\] \--\> InputMgr\[輸入管理器 (Input Manager)\]  
    InputMgr \--\> GameLoop\[遊戲主循環 (Game Loop)\]  
      
    subgraph "Expo Runtime (Dev Client)"  
        subgraph "JS Thread (邏輯層)"  
            GameLoop \-- Tick (15Hz) \--\> GameLogic\[遊戲核心邏輯\]  
            GameLogic \--\> SnakeModel\[蛇身資料結構 (Deque)\]  
            GameLogic \--\> Collision\[碰撞檢測系統\]  
            GameLogic \-- 更新座標 \--\> SharedValues\[Reanimated Shared Values\]  
        end

        subgraph "UI Thread (渲染層)"  
            SharedValues \-- 驅動 \--\> SkiaCanvas\[Skia Canvas 畫布\]  
            SkiaCanvas \--\> RenderSnake\[繪製蛇身\]  
            SkiaCanvas \--\> RenderFood\[繪製食物/特效\]  
            InputMgr \-- Gesture Handler \--\> SharedValues  
        end

        subgraph "Native Modules (Expo SDK)"  
            Audio\[expo-av\]  
            Haptics\[expo-haptics\]  
            FileSystem\[expo-file-system\]  
            Storage\[react-native-mmkv (Config Plugin)\]  
        end  
    end

    subgraph "React Native Bridge"  
        GameLogic \-- 遊戲結束/分數 \--\> UIState\[React UI State\]  
        UIState \--\> HUD\[HUD 介面\]  
        UIState \--\> GameOver\[結算畫面\]  
    end

    Ads\[AdMob (Google Mobile Ads)\] \<--\> GameOver

## **3\. 模組設計 (Module Design)**

### **3.1 渲染引擎模組 (Rendering Engine)**

* **技術選型**：@shopify/react-native-skia  
* **Expo 配置**：  
  * 需在 app.json 中配置 Config Plugin。  
  * **注意**：無法在標準 Expo Go 中運行高效能模式，必須使用 npx expo run:ios 或 npx expo run:android 建立 Development Build。  
* **核心組件**：  
  * GameCanvas: 全螢幕畫布。  
  * SnakeRenderer: 讀取 SharedValues 陣列並繪製 Path。

### **3.2 遊戲核心模組 (Game Core Module)**

* **遊戲循環 (Game Loop)**：  
  * 使用 react-native-reanimated 的 useFrameCallback 作為驅動核心，確保與 UI 線程同步。  
  * **Tick Rate**：邏輯更新鎖定在 15Hz。  
  * **Frame Rate**：渲染更新鎖定在 60Hz (透過插值算法補間)。

### **3.3 輸入管理模組 (Input Manager)**

* **技術選型**：react-native-gesture-handler (Expo SDK 內建支援)  
* **功能**：  
  * **輸入緩衝 (Input Buffer)**：解決 SRS FR-02 提到的快速轉向問題。  
  * **手勢識別**：使用 Gesture.Pan() 處理滑動，Gesture.Tap() 處理點擊。

### **3.4 數據存儲模組 (Storage Module)**

* **技術選型**：react-native-mmkv  
* **Expo 配置**：使用 @react-native-mmkv/react-native-mmkv 的 Config Plugin 進行自動連結。  
* **設計理由**：同步讀寫，速度遠快於 AsyncStorage，適合遊戲存檔。  
* **儲存 Schema**：(維持不變，儲存設定與高分)。

### **3.5 音效與震動模組 (Audio & Haptics)**

* **音效 (BGM/SFX)**：  
  * **技術選型**：expo-av  
  * **實作**：使用 Audio.Sound.createAsync 預載入 "吃東西"、"死亡" 音效。  
  * **優化**：對於高頻觸發的音效（如連續吃豆），需實作 Sound Pool 機制，避免單一音軌切斷或延遲。  
* **震動回饋**：  
  * **技術選型**：expo-haptics  
  * **實作**：  
    * 進食：Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)  
    * 死亡：Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)

## **4\. 介面流程設計 (Interface Design)**

### **4.1 畫面流轉 (Navigation Flow)**

使用 expo-router (推薦) 或 react-navigation。  
若選擇 expo-router，則利用資料夾結構 (File-based routing) 管理頁面。

1. **app/index.js**: Splash & Loading (載入 Expo Fonts, Assets)。  
2. **app/home.js**: 主選單。  
3. **app/game.js**: 遊戲主畫面 (隱藏 Header)。

### **4.2 資產管理 (Assets)**

* 使用 expo-asset 與 expo-font 進行預加載。  
* 圖片資源放置於 assets/images，音效於 assets/sounds。

## **5\. 技術難點與 Expo 解決方案**

### **5.1 本地代碼依賴 (Native Dependencies)**

* **問題**：Skia 和 MMKV 需要連結原生 C++ 庫，傳統 RN 需要手動 pod install。  
* **Expo 解法**：使用 **EAS Build** (Expo Application Services)。  
  * 在 app.json 定義 plugins。  
  * 執行 npx expo prebuild 自動生成原生專案，或直接使用 npx expo run:ios 進行編譯測試。

### **5.2 廣告整合 (AdMob)**

* **技術選型**：react-native-google-mobile-ads  
* **Expo 配置**：需設定 react-native-google-mobile-ads plugin，並在 app.json 中填入 AdMob App ID。  
* **注意**：廣告 ID 需區分測試版 (Test ID) 與正式版。

## **6\. 開發與發布流程 (DevOps)**

### **6.1 開發環境**

* **Development Client**：因為使用了 MMKV 和 Skia，**不能**只用 App Store 下載的 "Expo Go" App。  
* **指令**：  
  * iOS: npx expo run:ios (需要 Mac \+ Xcode)  
  * Android: npx expo run:android (需要 Android Studio)  
  * 真機調試：使用 npx expo start \--dev-client。

### **6.2 發布 (Production)**

* 使用 **EAS Build** 進行雲端打包：  
  * eas build \--profile production \--platform all  
* 使用 **EAS Update** 進行熱更新 (OTA)：  
  * 僅限 JS 層的邏輯修改（如調整蛇的速度、UI 顏色），若修改了 Native Config (如新增套件)，則需重新 Build。

## **7\. 結論**

採用 **React Native \+ Expo (Dev Client)** 架構，我們能在保留高效能渲染 (Skia/Reanimated) 的同時，享受 Expo 帶來的開發便利性（如 EAS Build、expo-av、OTA 更新）。這是在 2025 年開發高效能 RN 遊戲的最現代化路徑。