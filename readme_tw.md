# IntentPay

**IntentPay** 是一個運行在 **World Mini App** 平台上的USDC智能錢包，專為ETHGlobal Taipei比賽設計。用戶可以將USDC轉入錢包後，無需購買gas token或支付gas費用，即可輕鬆進行轉帳和意圖交易。錢包整合了 **Circle Modular Wallet** 和 **Compliance Engine**，提供動態安全控制，根據交易風險級別自動觸發 **passkey 認證** 等安全措施。

---

## 專案概述
**IntentPay** 是一個基於意圖（intent-based）的USDC智能錢包，旨在提供無縫、安全的加密貨幣交易體驗。用戶可以設定交易意圖（如「用100 USDC購買ETH」），系統將自動執行最佳交易路徑，並從USDC餘額中扣除gas費用。專案結合了Circle的智能錢包技術和1inch的Fusion+ API，實現跨鏈交易和動態安全控制。

---

## 核心功能
- **Circle智能錢包整合**：用戶可創建或連接Circle Modular Wallet，啟用passkey進行身份驗證。
- **動態安全控制**：根據交易風險級別，自動要求passkey認證（高風險交易）或直接執行（低風險交易）。
- **USDC支付Gas費用**：所有交易的gas費用直接從USDC餘額中扣除，無需ETH。
- **Intent-Based Trade**：用戶設定交易意圖，系統自動執行最佳交易路徑，整合1inch Fusion+ API。
- **World Mini App平台**：應用運行在World Mini App上，提供輕量級、易於訪問的體驗。

---

## 技術架構
- **前端**：基於 **Vite + React** 開發，運行在World Mini App框架上。
- **後端**：無需自建後端，依賴智能合約和第三方API。
- **API整合**：
  - **Circle API**：錢包管理、USDC轉帳、Compliance Engine。
  - **1inch Fusion+ API**：意圖交易和跨鏈兌換。

---

## 專案結構
```
IntentPay/
├── public/                     # 靜態資源文件
│   ├── favicon.ico             # 網站圖標
│   └── index.html              # HTML入口文件
├── src/                        # 源代碼目錄
│   ├── assets/                 # 圖片、字體等資源
│   ├── components/             # 可重用組件
│   ├── pages/                  # 頁面組件
│   ├── services/               # API服務和工具函數
│   ├── styles/                 # 全局樣式文件
│   ├── utils/                  # 工具函數
│   ├── App.jsx                 # 應用入口組件
│   ├── main.jsx                # 應用啟動文件
│   └── vite-env.d.ts           # Vite環境類型聲明
├── .gitignore                  # Git忽略文件
├── package.json                # 項目依賴和腳本
├── pnpm-lock.yaml              # PNPM鎖定文件
├── README.md                   # 項目說明文件
└── vite.config.js              # Vite配置文件
```

---

## 安裝與運行

### 前提條件
- **Node.js**（建議版本：v16或更高）
- **PNPM**（建議版本：v7或更高）

### 安裝步驟
1. **Clone專案**：
   ```bash
   git clone https://github.com/your-repo/IntentPay.git
   cd IntentPay
   ```

2. **安裝依賴**：
   ```bash
   pnpm install
   ```

3. **運行開發服務器**：
   ```bash
   pnpm run dev
   ```

4. **構建生產版本**：
   ```bash
   pnpm run build
   ```

5. **預覽生產版本**：
   ```bash
   pnpm run preview
   ```

---

## 操作指令

以下是一些常用的操作指令，幫助你快速管理專案：

- **啟動開發模式**：
  ```bash
  pnpm run dev
  ```
  - 啟動本地開發服務器，支援熱重載，適合開發和測試。

- **構建生產版本**：
  ```bash
  pnpm run build
  ```
  - 將專案打包為生產版本，輸出到`dist`目錄。

- **預覽生產版本**：
  ```bash
  pnpm run preview
  ```
  - 在本地運行構建後的生產版本，檢查最終效果。

- **檢查代碼規範**（可選）：
  ```bash
  pnpm run lint
  ```
  - 使用ESLint檢查代碼風格，確保一致性。

- **清理依賴**：
  ```bash
  pnpm store prune
  ```
  - 清理PNPM的本地緩存，釋放空間。

- **更新依賴**：
  ```bash
  pnpm update
  ```
  - 更新專案中的依賴到最新版本。

---

## 開發指南

### 環境變量
專案使用`.env`文件管理環境變量，例如API密鑰。請在項目根目錄創建`.env`文件，並添加以下內容（示例）：
```
VITE_CIRCLE_API_KEY=your_circle_api_key
VITE_ONEINCH_API_KEY=your_oneinch_api_key
```

### 開發建議
1. 在`src/services/`中封裝API調用邏輯，保持代碼模組化。
2. 使用`src/utils/`存放通用工具函數，提升代碼復用性。
3. 在開發過程中，定期運行`pnpm run lint`檢查代碼規範。

---

## 安全與合規
- **資金安全**：透過passkey和動態安全控制保護用戶資產。
- **法規遵循**：Compliance Engine確保交易符合法規要求。
- **用戶教育**：應用內提供風險提示和操作指引，提升用戶體驗。

---

## 開發計劃
1. **階段1**：整合Circle Modular Wallet和Compliance Engine，實現動態安全控制。
2. **階段2**：實現USDC支付gas功能。
3. **階段3**：整合1inch Fusion+ API，實現意圖交易。
4. **階段4**：優化用戶體驗，進行測試和調試。
5. **階段5**：準備展示和提交材料。

---

## 貢獻
歡迎對專案進行貢獻！請fork專案並提交pull request。

---

## 許可證
本專案採用MIT許可證。詳情見[LICENSE](LICENSE)文件。


