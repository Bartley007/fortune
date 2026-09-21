"use client";

import { useState } from "react";

import CollectionButton from "@/app/components/collection-button";
import type { ApiEnvelope } from "@/lib/contracts/api";
import type {
  DivinationCastResult,
  HexagramReading,
  HexagramView,
} from "@/lib/contracts/divination";

const Lines = ({ hexagram }: { hexagram: HexagramView }) => (
  <div aria-label="六爻卦象">
    {hexagram.lines.map((line, index) => (
      <i className={`yao ${line % 2 === 0 ? "broken" : ""}`} key={index} />
    ))}
  </div>
);

function ReadingCard({ reading, title }: { reading: HexagramReading; title: string }) {
  return (
    <article className="reading-card">
      <header>
        <span>{title}</span>
        <strong>{reading.name}</strong>
      </header>
      <dl>
        <dt>卦辞</dt>
        <dd>{reading.judgment}</dd>
        <dt>彖传</dt>
        <dd>{reading.commentary}</dd>
        <dt>象传</dt>
        <dd>{reading.image}</dd>
      </dl>
      {reading.moving_lines.length ? (
        <div className="moving-line-readings">
          <strong>动爻原文</strong>
          {reading.moving_lines.map((line) => (
            <div key={`${reading.number}-${line.line}`}>
              <b>第 {line.line} 爻</b>
              <p>{line.text}</p>
              {line.commentary ? <small>{line.commentary}</small> : null}
            </div>
          ))}
        </div>
      ) : null}
      <a href={reading.source_url}>查看本卦原文与完整注疏</a>
    </article>
  );
}

export default function DivinationForm() {
  const [question, setQuestion] = useState("");
  const [n1, setN1] = useState("");
  const [n2, setN2] = useState("");
  const [result, setResult] = useState<ApiEnvelope<DivinationCastResult> | null>(null);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit() {
    if (!question.trim() || !n1 || !n2) {
      setNotice("请填写问题和两个起卦数字。");
      return;
    }
    setPending(true);
    setNotice("");
    try {
      const response = await fetch("/api/divination/cast", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          question,
          method: "numbers",
          numbers: [Number(n1), Number(n2)],
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "起卦失败");
      setResult(data);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "起卦失败");
    } finally {
      setPending(false);
    }
  }

  const cast = result?.result;
  const reading = cast?.reading;
  const sourceId = `divination-cast:${result?.session_id ?? "local"}`;

  return (
    <section className="panel">
      <h2>请写下此刻所问</h2>
      <p className="panel-intro">
        问题越具体，后续解释越聚焦。避免同时询问多个彼此无关的事项。
      </p>
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="ask">问题</label>
          <textarea
            id="ask"
            rows={4}
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="例如：未来三个月，我应如何安排这次职业转变？"
          />
          {question.trim() ? (
            <CollectionButton
              action="question"
              itemType="divination_question"
              label="收藏所问"
              module="divination"
              sourceId={`divination-question:${question.trim().slice(0, 80)}`}
              step="question"
              summary={`六爻问事：${question.trim()}`}
              tags={["易卦", "问事"]}
              title="易卦问事记录"
              snapshot={{ question: question.trim(), method: "numbers" }}
            />
          ) : null}
        </div>
        <div className="field">
          <label htmlFor="n1">上卦数字</label>
          <input
            id="n1"
            value={n1}
            onChange={(event) => setN1(event.target.value)}
            type="number"
            min="1"
            placeholder="1–99"
          />
        </div>
        <div className="field">
          <label htmlFor="n2">下卦数字</label>
          <input
            id="n2"
            value={n2}
            onChange={(event) => setN2(event.target.value)}
            type="number"
            min="1"
            placeholder="1–99"
          />
        </div>
        {notice && <p className="notice">{notice}</p>}
        <button className="button button-primary" disabled={pending} onClick={submit}>
          {pending ? "推演中……" : "开始起卦"}
        </button>
      </div>

      {cast ? (
        <div className="result-surface">
          <p className="kicker">
            {result.meta.mock ? "模拟卦象 · Python 服务待接入" : "规则引擎计算结果"}
          </p>
          {result.warnings.map((warning) => (
            <p className="notice" key={warning}>
              {warning}
            </p>
          ))}
          <div className="hexagram-row">
            <div className="hex-card">
              <Lines hexagram={cast.primary} />
              <h3>本卦 · {cast.primary.name}</h3>
              <span className="source-badge">第 {cast.primary.number} 卦</span>
            </div>
            <span className="change-arrow">→</span>
            <div className="hex-card">
              <Lines hexagram={cast.transformed} />
              <h3>变卦 · {cast.transformed.name}</h3>
              <span className="source-badge">动爻 {cast.moving_lines.join("、")}</span>
            </div>
          </div>
          <p className="panel-intro">{cast.contextual_interpretation}</p>

          <CollectionButton
            action="calculation"
            autoRecord
            evidence={reading?.source_refs.map((source) => source.title) ?? []}
            itemType="divination_record"
            key={sourceId}
            label="收藏卦象"
            module="divination"
            sourceId={sourceId}
            step="cast"
            summary={`问：${question.trim()}；本卦 ${cast.primary.name}，动爻 ${cast.moving_lines.join("、") || "无"}，变卦 ${cast.transformed.name}。`}
            tags={["易卦", cast.primary.name, cast.transformed.name]}
            title={`易卦记录 · ${cast.primary.name} → ${cast.transformed.name}`}
            snapshot={{ question: question.trim(), numbers: [Number(n1), Number(n2)], cast }}
          />

          {reading ? (
            <>
              <CollectionButton
                action="interpretation"
                evidence={[
                  reading.primary.judgment,
                  reading.primary.commentary,
                  reading.primary.image,
                ]}
                itemType="divination_reading"
                label="收藏阅读依据"
                module="divination"
                sourceId={`divination-reading:${result.session_id ?? "local"}`}
                step="reading-evidence"
                summary={`${reading.method_note} 本卦依据：${reading.primary.judgment}`}
                tags={["易卦", "卦辞", "彖传", "象传"]}
                title={`${cast.primary.name} · 周易原文依据`}
                snapshot={{ reading, moving_lines: cast.moving_lines }}
              />
              <section className="reading-evidence">
                <div className="section-heading">
                  <div>
                    <p className="kicker">ZHOUYI EVIDENCE</p>
                    <h3>周易阅读依据</h3>
                  </div>
                  <p>{reading.method_note}</p>
                </div>
                <div className="reading-grid">
                  <ReadingCard reading={reading.primary} title="本卦" />
                  <ReadingCard reading={reading.mutual} title="互卦" />
                  <ReadingCard reading={reading.transformed} title="变卦" />
                </div>
              </section>
            </>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
