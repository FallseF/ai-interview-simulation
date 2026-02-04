/**
 * モックモードでの面接テスト
 *
 * MOCK_MODE=true で本物のOpenAI APIなしで面接フローをテストできる
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import WebSocket from "ws";

// モックモードを有効化
vi.stubEnv("MOCK_MODE", "true");

describe("Mock Interview Flow", () => {
  let ws: WebSocket;
  let messages: Array<Record<string, unknown>> = [];

  beforeEach(() => {
    messages = [];
  });

  afterEach(() => {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  it("should connect and receive session_ready in mock mode", async () => {
    // テスト用にサーバーが起動していることを前提とする
    // MOCK_MODE=true npm run dev でサーバーを起動しておく

    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket("ws://localhost:3000/ws");

      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for messages"));
      }, 10000);

      ws.on("open", () => {
        console.log("Connected to server");
        // セッション開始
        ws.send(JSON.stringify({ type: "start_session", mode: "step" }));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);
        console.log("Received:", msg.type);

        // session_ready を受信したらテスト成功
        if (msg.type === "session_ready") {
          clearTimeout(timeout);
          expect(msg.type).toBe("session_ready");
          ws.close();
          resolve();
        }
      });

      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  it("should receive transcript from mock interviewer", async () => {
    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket("ws://localhost:3000/ws");

      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for transcript"));
      }, 15000);

      let sessionReady = false;

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "start_session", mode: "auto" }));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);

        if (msg.type === "session_ready") {
          sessionReady = true;
        }

        // 面接官のトランスクリプトを受信したらテスト成功
        if (msg.type === "transcript_done" && msg.speaker === "interviewer") {
          clearTimeout(timeout);
          expect(sessionReady).toBe(true);
          expect(msg.text).toBeTruthy();
          console.log("Interviewer said:", msg.text);
          ws.close();
          resolve();
        }
      });

      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });

  it("should handle human text input and get AI response", async () => {
    return new Promise<void>((resolve, reject) => {
      ws = new WebSocket("ws://localhost:3000/ws");

      const timeout = setTimeout(() => {
        reject(new Error("Timeout waiting for response to human input"));
      }, 20000);

      let receivedInterviewerResponse = false;
      let sentHumanText = false;

      ws.on("open", () => {
        ws.send(JSON.stringify({ type: "start_session", mode: "auto" }));
      });

      ws.on("message", (data) => {
        const msg = JSON.parse(data.toString());
        messages.push(msg);

        // 最初の面接官のトランスクリプト後にヒューマンテキストを送信
        if (
          msg.type === "transcript_done" &&
          msg.speaker === "interviewer" &&
          !sentHumanText
        ) {
          sentHumanText = true;
          console.log("Sending human text...");
          ws.send(
            JSON.stringify({
              type: "human_text",
              target: "both",
              text: "テスト入力です。これはモックテストからの発言です。",
            })
          );
        }

        // ヒューマンのトランスクリプトが記録されたことを確認
        if (msg.type === "transcript_done" && msg.speaker === "human") {
          console.log("Human text recorded:", msg.text);
          expect(msg.text).toContain("テスト入力");
        }

        // 2回目の面接官レスポンスを受信したらテスト成功
        if (
          msg.type === "transcript_done" &&
          msg.speaker === "interviewer" &&
          sentHumanText
        ) {
          if (!receivedInterviewerResponse) {
            receivedInterviewerResponse = true;
            clearTimeout(timeout);
            console.log("Received response after human input:", msg.text);
            ws.close();
            resolve();
          }
        }
      });

      ws.on("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
  });
});
