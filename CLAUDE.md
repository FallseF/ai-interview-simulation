# CLAUDE.md

## プロジェクト概要
AI Interview Simulation - 介護施設の面接シミュレーションアプリ

## 技術スタック
- Node.js + TypeScript
- Express + WebSocket
- OpenAI Realtime API

## 重要な注意事項

### Claude の知識カットオフについて
Claude の学習データは 2025年1月 までのため、それ以降に変更された API 仕様やライブラリのバージョンには対応できない場合がある。

特に以下のような場合は、Claude の提案を鵜呑みにせず公式ドキュメントを確認すること：
- OpenAI API のモデル名やエンドポイント
- 新しいライブラリのAPI
- 最新のフレームワーク仕様

### OpenAI Realtime API
- モデル名: `gpt-realtime` (2024年12月時点)
- WebSocket URL: `wss://api.openai.com/v1/realtime?model=gpt-realtime`

## 開発コマンド
```bash
npm run build    # TypeScriptビルド
npm start        # サーバー起動
npm run dev      # 開発モード
```

## トラブルシューティング

### AIが喋り始めない場合
1. `server.log` を確認
2. `response.done` イベントの `status` を確認
3. よくある原因：
   - `insufficient_quota`: OpenAI APIのクォータ不足 → 課金確認
   - `invalid_api_key`: APIキーが無効
   - セッション未確立: WebSocket接続の問題
