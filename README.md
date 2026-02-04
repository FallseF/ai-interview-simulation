# AI Interview Simulation

介護施設の面接シミュレーションアプリ。2つのAI（面接官・求職者）と1人の人間（転職支援エージェント）が参加する面接トレーニングツール。

## 参加者

- **AI面接官**: 日本の介護施設の採用担当者（ペルソナ設定でカスタマイズ可能）
- **AI求職者**: 外国人求職者（日本語レベル N5〜N1 で調整可能）
- **人間（転職支援エージェント）**: UIを操作するユーザー

## 機能

- **3フェーズUI**: 設定 → 面接 → 結果の明確なステップ表示
- **面接パターン選択**:
  - パターン1: 出席確認・自己紹介練習
  - パターン2: 面接本番（推奨）
  - パターン3: ヒアリング・クロージング
- **ペルソナ設定**: 面接官の性格・業種・方言・難易度をカスタマイズ
- **日本語レベル設定**: 求職者の日本語力（N5〜N1）を調整
- **音声/テキスト入力**: 音声録音またはテキスト入力で補足可能
- **自動進行**: カウントダウン付きの自動進行（一時停止可能）
- **評価結果**: 面接終了後にAIによる評価とフィードバック
- **履歴機能**: 過去のセッション履歴を確認可能

## セットアップ

### 必要条件

- Node.js 18+
- OpenAI API Key（Realtime API対応）

### インストール

```bash
# リポジトリをクローン
git clone <repository-url>
cd ai-interview-simulation

# 依存関係をインストール
npm run install:all

# または個別にインストール
cd server && npm install
cd ../frontend && npm install
```

### 環境変数

ルートディレクトリに `.env` ファイルを作成:

```env
OPENAI_API_KEY=your_openai_api_key_here
PORT=3000
```

## 起動方法

### 開発モード

**サーバーのみ（既存のpublicフォルダを使用）:**

```bash
npm run dev
```

**フロントエンド開発（React）:**

```bash
# ターミナル1: サーバー
npm run dev

# ターミナル2: フロントエンド
npm run dev:frontend
```

### プロダクションモード

```bash
# ビルド
npm run build

# 起動
npm start
```

ブラウザで http://localhost:3000 を開く

## プロジェクト構成

```
ai-interview-simulation/
├── server/src/
│   ├── index.ts                    # Express + WSサーバ起動
│   ├── config.ts                   # env/設定読み込み
│   ├── types/
│   │   ├── ws.ts                   # フロント⇄サーバのメッセージ型
│   │   └── roles.ts                # interviewer/candidate/human など
│   ├── prompts/
│   │   ├── scenario.ts             # シナリオ（施設/募集要項/候補者）
│   │   ├── interviewer.ts          # AI面接官プロンプト生成
│   │   └── candidate.ts            # AI求職者プロンプト生成
│   ├── realtime/
│   │   ├── openaiWs.ts             # OpenAI Realtime WS 接続
│   │   ├── events.ts               # Realtimeイベントの正規化
│   │   └── sessionFactory.ts       # AIセッション生成
│   └── orchestrator/
│       ├── InterviewOrchestrator.ts # 2AI + human の状態管理
│       ├── TurnManager.ts          # auto/step ターン制御
│       └── TranscriptStore.ts      # ログ/表示用の蓄積
├── frontend/src/
│   ├── App.tsx
│   ├── types/
│   │   └── ws.ts                   # サーバと共通の型
│   ├── hooks/
│   │   ├── useWebSocket.ts
│   │   └── useAudioRecorder.ts     # 録音処理
│   └── components/
│       ├── phases/
│       │   ├── SetupPhase.tsx      # 設定画面
│       │   ├── InterviewPhase.tsx  # 面接画面
│       │   └── ResultPhase.tsx     # 結果画面
│       ├── StepIndicator.tsx       # フェーズ進行表示
│       ├── PatternSelector.tsx     # 面接パターン選択
│       ├── PersonaSelector.tsx     # ペルソナ設定
│       ├── SessionControls.tsx     # 操作パネル
│       ├── VoiceInput.tsx          # 録音UI
│       ├── TextInput.tsx           # テキスト送信UI
│       ├── TranscriptPanel.tsx     # 発話ログ
│       └── HistoryModal.tsx        # 履歴モーダル
├── public/                         # 既存のフロントエンド（レガシー）
├── src/                            # 既存のサーバー（レガシー）
└── package.json
```

## WebSocketプロトコル

### Client → Server

```typescript
type ClientMessage =
  | { type: "start_session"; mode: "step" | "auto" }
  | { type: "set_mode"; mode: "step" | "auto" }
  | { type: "next_turn" }  // step専用：次に話すAIを進める
  | { type: "human_text"; target: "interviewer" | "candidate" | "both"; text: string }
  | { type: "human_audio_chunk"; target: "interviewer" | "candidate" | "both"; audioBase64: string }
  | { type: "human_audio_commit"; target: "interviewer" | "candidate" | "both" }
  | { type: "end_session" };
```

### Server → Client

```typescript
type ServerMessage =
  | { type: "session_ready" }
  | { type: "turn_state"; currentSpeaker: "interviewer" | "candidate"; waitingForNext: boolean }
  | { type: "transcript_delta"; speaker: "interviewer" | "candidate" | "human"; textDelta: string }
  | { type: "transcript_done"; speaker: "interviewer" | "candidate" | "human"; text: string }
  | { type: "audio_delta"; speaker: "interviewer" | "candidate"; audioBase64: string }
  | { type: "audio_done"; speaker: "interviewer" | "candidate" }
  | { type: "error"; message: string };
```

## トラブルシューティング

### AIが喋り始めない場合

1. サーバーログを確認
2. `response.done` イベントの `status` を確認
3. よくある原因：
   - `insufficient_quota`: OpenAI APIのクォータ不足 → 課金確認
   - `invalid_api_key`: APIキーが無効
   - セッション未確立: WebSocket接続の問題

### 環境変数エラー

```
Error: OPENAI_API_KEY is not set in environment variables
```

→ `.env` ファイルを作成し、有効なAPIキーを設定

## ライセンス

MIT
