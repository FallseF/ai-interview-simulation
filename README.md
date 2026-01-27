# AI Interview Simulation

介護施設の面接シミュレーションアプリ。2つのAI（面接官・求職者）と1人の人間（転職支援エージェント）が参加する面接デモ。

## 参加者

- **AI面接官（田中部長）**: 日本の介護施設の採用担当者
- **AI求職者（グエン・ミン）**: 日本語が拙い外国人求職者（ベトナム出身）
- **人間（転職支援）**: UIを操作する転職エージェント

## 機能

- **target選択**: 人間の入力を「面接官のみ」「求職者のみ」「両方」から選択可能
- **step/autoモード**: ステップモード（手動で次へ進む）とオートモード（自動進行）を切替可能
- **音声/テキスト入力**: 音声録音またはテキスト入力で補足可能
- **発話ログ**: 話者ラベル付きで時系列表示

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
│       ├── SessionControls.tsx     # Start/Pause/End, Step/Auto切替
│       ├── TargetSelector.tsx      # interviewer/candidate/both
│       ├── VoiceInput.tsx          # 録音UI
│       ├── TextInput.tsx           # テキスト送信UI
│       ├── TranscriptPanel.tsx     # 発話ログ
│       └── CoachPanel.tsx          # 状態表示・参加者バー
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
