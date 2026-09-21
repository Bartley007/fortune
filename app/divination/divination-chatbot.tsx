"use client";

import { useState } from "react";

import CollectionButton from "@/app/components/collection-button";
import type { ApiEnvelope } from "@/lib/contracts/api";
import type {
  DivinationCastResult,
  DivinationChatMessage,
  DivinationChatReply,
} from "@/lib/contracts/divination";
import type { GuanyinStick } from "@/lib/guanyin/types";

import "./divination-chatbot.module.css";

type LotResult = {
  stick: GuanyinStick;
  question: string;
  domain: string;
  drawn_at: string;
};

const intro =
  "我是问卦助手。先告诉我你要问的一件事；我会在必要时简短追问，再为你起卦或抽取观音灵签。";

export default function DivinationChatbot() {
  const [messages, setMessages] = useState<DivinationChatMessage[]>([
    { role: "assistant", content: intro },
  ]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [reply, setReply] = useState<DivinationChatReply | null>(null);
  const [cast, setCast] = useState<DivinationCastResult | null>(null);
  const [lot, setLot] = useState<LotResult | null>(null);

  async function send(value = input) {
    const content = value.trim();
    if (!content || pending) return;
    const next = [...messages, { role: "user" as const, content }];
    setMessages(next);
    setInput("");
    setPending(true);
    setReply(null);
    setCast(null);
    setLot(null);
    try {
      const response = await fetch("/api/divination/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const payload = (await response.json()) as ApiEnvelope<DivinationChatReply>;
      if (!response.ok || !payload.result) {
        throw new Error(payload.error?.message ?? "聊天服务暂不可用。");
      }
      const bot = payload.result;
      setReply(bot);
      setMessages((current) => [...current, { role: "assistant", content: bot.message }]);

      if (bot.cast_request) {
        const castResponse = await fetch("/api/divination/cast", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(bot.cast_request),
        });
        const castPayload = (await castResponse.json()) as ApiEnvelope<DivinationCastResult>;
        const result = castPayload.result;
        if (!castResponse.ok || !result) {
          throw new Error(castPayload.error?.message ?? "起卦服务暂不可用。");
        }
        setCast(result);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `起卦完成：本卦「${result.primary.name}」，${
              result.moving_lines.length
                ? `动爻为第 ${result.moving_lines.join("、")} 爻`
                : "本次无动爻"
            }，变卦「${result.transformed.name}」。`,
          },
        ]);
      }

      if (bot.guanyin_request) {
        const lotResponse = await fetch("/api/guanyin-lot/draw", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(bot.guanyin_request),
        });
        const lotPayload = (await lotResponse.json()) as ApiEnvelope<LotResult>;
        const result = lotPayload.result;
        if (!lotResponse.ok || !result) {
          throw new Error(lotPayload.error?.message ?? "抽签服务暂不可用。");
        }
        setLot(result);
        setMessages((current) => [
          ...current,
          {
            role: "assistant",
            content: `抽签完成：第 ${result.stick.id} 签「${result.stick.title}」（${result.stick.level}）。`,
          },
        ]);
      }
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          content: error instanceof Error ? error.message : "服务暂不可用。",
        },
      ]);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="panel chat-panel">
      <p className="kicker">对话式问卦</p>
      <h2>先说事，再起卦</h2>
      <p className="panel-intro">
        聊天助手只整理问题和必要信息；六爻结果来自规则引擎，观音签号来自服务端安全随机数。
      </p>
      <div className="chat-history" aria-live="polite">
        {messages.map((message, index) => (
          <p className={`chat-message ${message.role}`} key={`${message.role}-${index}`}>
            {message.content}
          </p>
        ))}
      </div>
      {reply?.suggestions.length ? (
        <div className="chat-suggestions">
          {reply.suggestions.map((suggestion) => (
            <button type="button" key={suggestion} onClick={() => send(suggestion)}>
              {suggestion}
            </button>
          ))}
        </div>
      ) : null}
      <div className="chat-compose">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") void send();
          }}
          placeholder="例如：我想用六爻问未来三个月的工作，数字 18 和 27"
          disabled={pending}
        />
        <button
          className="button button-primary"
          type="button"
          onClick={() => void send()}
          disabled={pending}
        >
          {pending ? "处理中……" : "发送"}
        </button>
      </div>
      {messages.length > 1 ? (
        <CollectionButton
          action="question"
          itemType="divination_chat"
          label="收藏本次问卦对话"
          module="divination"
          sourceId={`divination-chat:${messages.length}:${messages[messages.length - 1]?.content.slice(0, 50) ?? "session"}`}
          step="chat"
          summary={messages.map((message) => message.content).join(" ").slice(0, 500)}
          tags={["易卦", "对话记录"]}
          title="易卦问事对话"
          snapshot={{ messages }}
        />
      ) : null}
      {cast ? (
        <div className="chat-result">
          <strong>六爻计算结果</strong>
          <span>
            本卦：{cast.primary.name} · 互卦：{cast.mutual.name} · 变卦：
            {cast.transformed.name}
          </span>
          {cast.reading ? (
            <span>
              本卦依据：{cast.reading.primary.judgment} · {cast.reading.primary.image}
            </span>
          ) : null}
          <CollectionButton
            action="calculation"
            autoRecord
            evidence={cast.reading?.source_refs.map((source) => source.title) ?? []}
            itemType="divination_record"
            key={`chat-cast-${messages.length}`}
            label="收藏卦象"
            module="divination"
            sourceId={`divination-chat-cast:${messages.length}`}
            step="cast"
            summary={`对话问卦结果：本卦 ${cast.primary.name}，互卦 ${cast.mutual.name}，变卦 ${cast.transformed.name}。`}
            tags={["易卦", cast.primary.name, cast.transformed.name]}
            title={`对话问卦 · ${cast.primary.name} → ${cast.transformed.name}`}
            snapshot={{ messages, cast }}
          />
        </div>
      ) : null}
      {lot ? (
        <div className="chat-result">
          <span>所问：{lot.question}</span>
          <strong>观音灵签 · 第 {lot.stick.id} 签</strong>
          <span>{lot.stick.poem.join("，")}</span>
          <span>{lot.stick.traditional.jieyue}</span>
          <CollectionButton
            action="interpretation"
            autoRecord
            evidence={[
              lot.stick.traditional.jieyue,
              lot.stick.traditional.xianji,
              lot.stick.traditional.diangu,
            ]}
            itemType="sign_record"
            key={`chat-lot-${lot.drawn_at}`}
            label="收藏灵签"
            module="guanyin"
            sourceId={`guanyin-chat:${lot.drawn_at}`}
            step="reading"
            summary={`问：${lot.question}；第 ${lot.stick.id} 签「${lot.stick.title}」${lot.stick.level}。${lot.stick.traditional.jieyue}`}
            tags={["观音灵签", lot.domain, `第${lot.stick.id}签`]}
            title={`观音灵签 · 第${lot.stick.id}签 ${lot.stick.title}`}
            snapshot={lot}
          />
        </div>
      ) : null}
    </section>
  );
}
