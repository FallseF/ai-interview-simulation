# AI Interview Simulation (TTS方式)

介護施設の面接シミュレーションアプリ - Next.js App Router版

## 概要

OpenAI Chat API + TTS APIを使用した面接シミュレーションです。Vercelでサーバーレスデプロイが可能です。

## アーキテクチャ

```
Browser <--HTTP--> Vercel Serverless Functions <--REST--> OpenAI Chat/TTS API
```

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example`をコピーして`.env.local`を作成し、OpenAI APIキーを設定:

```bash
cp .env.local.example .env.local
```

```
OPENAI_API_KEY=your_api_key_here
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## Vercelへのデプロイ

### 1. Vercel CLIでデプロイ

```bash
npm i -g vercel
vercel
```

### 2. 環境変数の設定

Vercelダッシュボードで`OPENAI_API_KEY`を設定

## ディレクトリ構成

```
next-app/
├── app/
│   ├── page.tsx              # メインUI
│   ├── layout.tsx            # レイアウト
│   ├── globals.css           # スタイル
│   └── api/
│       ├── chat/route.ts     # Chat Completions API
│       └── tts/route.ts      # TTS API
├── lib/
│   ├── ai/
│   │   ├── chat-client.ts    # Chat API抽象化
│   │   └── tts-client.ts     # TTS API抽象化 + 音声再生
│   ├── interview/
│   │   ├── turn-manager.ts   # ターン管理
│   │   ├── transcript-store.ts # 発言記録
│   │   └── conversation.ts   # 会話履歴変換
│   └── prompts/
│       ├── interviewer.ts    # 面接官プロンプト
│       ├── candidate.ts      # 求職者プロンプト
│       └── scenario.ts       # シナリオ定義
├── components/               # UIコンポーネント
├── hooks/
│   └── useInterview.ts       # メインフック
└── types/
    └── index.ts              # 型定義
```

## 機能

- **面接官AI**: 介護施設の採用担当者として質問
- **求職者AI**: 日本語N4レベルのベトナム人求職者をロールプレイ
- **転職支援（あなた）**: テキストで補足・通訳
- **ステップモード**: 1ターンずつ確認しながら進行
- **オートモード**: 自動で面接が進行

## 旧バージョンとの違い

| 項目 | 旧（Realtime API） | 新（TTS方式） |
|------|-------------------|--------------|
| 通信 | WebSocket常駐 | REST API |
| サーバー | 常駐サーバー必須 | サーバーレス可 |
| デプロイ | Railway/Render | Vercel無料枠 |
| コスト | 高め | 安め |

## ライセンス

MIT
