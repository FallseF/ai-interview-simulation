# CLAUDE.md - AI面接シミュレーション

## プロジェクト概要
介護施設の面接シミュレーションアプリ。ユーザーは「転職支援エージェント」として、日本語が苦手な外国人求職者（グエン・ミン）の面接をサポートする。

## 技術スタック
- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **AI**: OpenAI API (Chat + TTS + STT)
- **データ保存**: localStorage

## 現在の状態（2026年1月）

### 完成している機能
1. **面接シミュレーション**
   - 面接官（田中部長）と候補者（グエン・ミン）のAI同士の会話
   - ユーザーが「転職支援」として補足を入力可能
   - 音声合成（TTS）で会話を再生
   - 音声入力（STT）で補足を入力可能

2. **面接フロー**
   - 「面接を開始」→ 面接官が質問 → 候補者が自動で回答 → 待機
   - ユーザーが補足を入力（任意）
   - 「次へ」→ 面接官が質問（補足を考慮）→ 候補者が回答 → 待機
   - 繰り返し...
   - 面接終了 or 面接中止

3. **評価機能**
   - 面接終了時にLLMが自動評価
   - 評価項目: コミュニケーション、マナー、サポート力、状況判断（各5点）
   - 総合スコア（100点満点）
   - フィードバック、良かった点、改善点
   - localStorageに履歴保存（最大100件）

4. **人間らしい面接官**
   - 失礼な発言には段階的に対応（冷たく→注意→警告→打ち切り）
   - 【面接中止】マーカーで強制終了可能

### 未実装・今後のTODO
- [ ] 履歴ページ（過去の面接一覧を見る画面）
- [ ] シナリオ選択（施設や職種を変更）
- [ ] 難易度設定

## 重要なファイル

### API Routes
- `/app/api/chat/route.ts` - Chat API（面接官・候補者の応答生成）
- `/app/api/tts/route.ts` - TTS API（音声合成）
- `/app/api/stt/route.ts` - STT API（音声認識）
- `/app/api/evaluate/route.ts` - 評価API（面接評価）

### Hooks
- `/hooks/useInterview.ts` - 面接の状態管理（メインロジック）
- `/hooks/useAudioRecorder.ts` - マイク録音

### プロンプト
- `/lib/prompts/interviewer.ts` - 面接官のシステムプロンプト
- `/lib/prompts/candidate.ts` - 候補者のシステムプロンプト
- `/lib/prompts/scenario.ts` - シナリオ設定

### その他
- `/lib/storage.ts` - localStorage操作
- `/lib/interview/conversation.ts` - 会話履歴の変換
- `/types/index.ts` - 型定義

## OpenAI モデル設定（2026年1月時点）

### 使用中のモデル
- **Chat（面接会話）**: `gpt-5.2-chat-latest`
- **評価**: `gpt-5-nano`（コスト重視）
- **TTS**: OpenAI TTS API
- **STT**: OpenAI Whisper API

### 注意
Claudeの知識は古い可能性があるので、OpenAI APIのモデル名やパラメータは必ず公式ドキュメントで確認すること。

- GPT-5.2では `max_tokens` → `max_completion_tokens`
- GPT-5.2では `temperature` パラメータは非対応（デフォルト1のみ）

## 開発コマンド
```bash
cd next-app
npm run dev      # 開発サーバー起動（localhost:3000）
npm run build    # ビルド
```

## 補足の仕組み（重要）
ユーザーの補足は `role: "system"` メッセージとして面接官に渡される。これにより、`role: "user"` より強い指示として認識され、無視されにくくなる。

```typescript
// /app/api/chat/route.ts
if (humanInput) {
  apiMessages.push({
    role: "system",
    content: `【重要：転職支援エージェントからの補足情報】...`,
  });
}
```
