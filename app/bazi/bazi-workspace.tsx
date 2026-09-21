"use client";

import { useState } from "react";
import type { ApiEnvelope } from "@/lib/contracts/api";
import type { BaziChartRequest, BaziChartResult, BirthPlace } from "@/lib/contracts/bazi";
import { CITY_OPTIONS } from "@/lib/bazi/cities";
import {
  BRANCH_LABEL,
  DISPOSITION_LABEL,
  DOMAIN_LABEL,
  ELEMENT_LABEL,
  FACTOR_LABEL,
  PATTERN_LABEL,
  PILLAR_LABEL,
  QI_LABEL,
  STEM_LABEL,
  STRENGTH_LABEL,
  TEN_GOD_LABEL,
} from "@/lib/bazi/display";

type PlaceMode = "dropdown" | "manual_coordinates";

const STEPS = [
  { id: 1, label: "出生信息" },
  { id: 2, label: "四柱排盘" },
  { id: 3, label: "五行十神" },
  { id: 4, label: "大运流年" },
  { id: 5, label: "方向推荐" },
] as const;

const MINUTES = Array.from({ length: 60 }, (_, i) => i);

/**
 * Compact segmented control for binary choices.
 *
 * Styled with border weight and opacity rather than a fill colour, so it sits
 * correctly in any theme without hardcoding brand colours.
 */
function Toggle<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (next: T) => void;
}) {
  return (
    <span style={{ display: "inline-flex", gap: 2, verticalAlign: "middle" }}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            style={{
              padding: "1px 9px",
              fontSize: "0.8em",
              fontWeight: selected ? 600 : 400,
              lineHeight: 1.7,
              cursor: "pointer",
              background: "transparent",
              color: "inherit",
              border: "1px solid",
              borderColor: selected ? "currentColor" : "transparent",
              borderRadius: 3,
              opacity: selected ? 1 : 0.45,
            }}
          >
            {option.label}
          </button>
        );
      })}
    </span>
  );
}

/**
 * Degrees-and-minutes coordinate entry.
 *
 * Bounding each part separately keeps the value valid by construction — there
 * is no way to type a nonsense coordinate the way a free-text field allows.
 */
function DmsField({
  id,
  label,
  hemispheres,
  maxDegrees,
  hemisphere,
  degrees,
  minutes,
  onHemisphere,
  onDegrees,
  onMinutes,
}: {
  id: string;
  label: string;
  hemispheres: Array<{ value: string; label: string }>;
  maxDegrees: number;
  hemisphere: string;
  degrees: string;
  minutes: string;
  onHemisphere: (v: string) => void;
  onDegrees: (v: string) => void;
  onMinutes: (v: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={`${id}-deg`}>{label}</label>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
        <select
          aria-label={`${label}半球`}
          value={hemisphere}
          onChange={(e) => onHemisphere(e.target.value)}
          style={{ width: "auto" }}
        >
          {hemispheres.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          id={`${id}-deg`}
          // type="number" only enforces min/max on submit — it happily accepts
          // "+", "-", "e", decimals and arbitrarily large values while typing.
          // A filtered text input keeps the value valid at every keystroke.
          type="text"
          inputMode="numeric"
          maxLength={3}
          value={degrees}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            if (digits === "") {
              onDegrees("");
              return;
            }
            onDegrees(String(Math.min(Number(digits), maxDegrees)));
          }}
          style={{ width: "5em", textAlign: "center" }}
        />
        <span>度</span>
        <select
          aria-label={`${label}分`}
          value={minutes}
          onChange={(e) => onMinutes(e.target.value)}
          style={{ width: "auto" }}
        >
          {MINUTES.map((m) => (
            <option key={m} value={String(m)}>
              {m}
            </option>
          ))}
        </select>
        <span>分</span>
      </span>
    </div>
  );
}

export default function BaziWorkspace() {
  const [step, setStep] = useState(1);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [gender, setGender] = useState<BaziChartRequest["gender"]>("unspecified");
  const [calendar, setCalendar] = useState<"solar" | "lunar">("solar");
  const [isLeapMonth, setIsLeapMonth] = useState(false);

  const [placeMode, setPlaceMode] = useState<PlaceMode>("dropdown");
  const [cityId, setCityId] = useState(CITY_OPTIONS[0].id);
  const [latHemisphere, setLatHemisphere] = useState("N");
  const [latDegrees, setLatDegrees] = useState("");
  const [latMinutes, setLatMinutes] = useState("0");
  const [lngHemisphere, setLngHemisphere] = useState("E");
  const [lngDegrees, setLngDegrees] = useState("");
  const [lngMinutes, setLngMinutes] = useState("0");

  const [result, setResult] = useState<ApiEnvelope<BaziChartResult> | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  const chart = result?.result ?? null;
  const unlocked = chart !== null;

  // The envelope's mock flag is set by the Next.js service wrapper, which only
  // knows whether it reached Python — not whether Python actually computed
  // anything. The chart's own meta.mock is the authoritative one. Same for
  // warnings: Python puts them on the chart, the envelope carries its own.
  const isMock = chart?.meta?.mock ?? result?.meta.mock ?? false;
  const warnings = [...(result?.warnings ?? []), ...(chart?.meta?.warnings ?? [])];

  /** Builds the structured birth_place the contract expects, or explains why it can't. */
  function buildBirthPlace(): { ok: true; value: BirthPlace } | { ok: false; message: string } {
    if (placeMode === "dropdown") {
      const city = CITY_OPTIONS.find((option) => option.id === cityId);
      if (!city) return { ok: false, message: "请选择出生城市。" };
      return {
        ok: true,
        value: {
          country_code: city.country_code,
          country: city.country,
          city: city.city,
          latitude: city.latitude,
          longitude: city.longitude,
          source: "dropdown",
        },
      };
    }

    const latDeg = Number(latDegrees);
    const lngDeg = Number(lngDegrees);

    if (latDegrees.trim() === "" || !Number.isInteger(latDeg) || latDeg < 0 || latDeg > 90) {
      return { ok: false, message: "纬度的「度」必须是 0 到 90 之间的整数。" };
    }
    if (latDeg === 90 && Number(latMinutes) !== 0) {
      return { ok: false, message: "纬度 90 度时，分必须为 0。" };
    }
    if (lngDegrees.trim() === "" || !Number.isInteger(lngDeg) || lngDeg < 0 || lngDeg > 180) {
      return { ok: false, message: "经度的「度」必须是 0 到 180 之间的整数。" };
    }
    if (lngDeg === 180 && Number(lngMinutes) !== 0) {
      return { ok: false, message: "经度 180 度时，分必须为 0。" };
    }

    const latitude = (latHemisphere === "N" ? 1 : -1) * (latDeg + Number(latMinutes) / 60);
    const longitude = (lngHemisphere === "E" ? 1 : -1) * (lngDeg + Number(lngMinutes) / 60);

    return {
      ok: true,
      value: {
        // Rounded to avoid trailing float noise; well below the precision that
        // would shift true solar time by even a second.
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        source: "manual_coordinates",
      },
    };
  }

  async function submit() {
    if (!date || !time) {
      setNotice("请填写出生日期和时间。");
      return;
    }

    const place = buildBirthPlace();
    if (!place.ok) {
      setNotice(place.message);
      return;
    }

    // Some browsers return "HH:mm:ss" from a time input; the contract wants "HH:mm".
    const payload: BaziChartRequest = {
      birth_date: date,
      birth_time: time.slice(0, 5),
      birth_place: place.value,
      gender,
      calendar,
      ...(calendar === "lunar" ? { is_leap_month: isLeapMonth } : {}),
    };

    setPending(true);
    setNotice("");
    try {
      const response = await fetch("/api/bazi/chart", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error?.message ?? "排盘失败");
      setResult(data);
      setStep(2);
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "排盘失败");
    } finally {
      setPending(false);
    }
  }

  function goto(target: number) {
    if (target !== 1 && !unlocked) return;
    setStep(target);
  }

  /** Shown at the foot of every step so the sidebar isn't the only way through. */
  function Nav() {
    const onLastStep = step === STEPS.length;
    return (
      <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
        {step > 1 && (
          <button className="button" type="button" onClick={() => goto(step - 1)}>
            上一步
          </button>
        )}
        {step < STEPS.length && unlocked && (
          <button className="button button-primary" type="button" onClick={() => goto(step + 1)}>
            下一步
          </button>
        )}
        {/* Nothing follows the last step, so offer the way back to the start. */}
        {onLastStep && (
          <button className="button button-primary" type="button" onClick={() => setStep(1)}>
            重新排盘
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="page-shell workspace">
      <aside className="side-steps">
        {STEPS.map((item) => {
          const locked = item.id !== 1 && !unlocked;
          return (
            <span
              key={item.id}
              className={step === item.id ? "active" : undefined}
              onClick={() => goto(item.id)}
              role="button"
              tabIndex={locked ? -1 : 0}
              aria-disabled={locked}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  goto(item.id);
                }
              }}
              style={{ cursor: locked ? "default" : "pointer", opacity: locked ? 0.4 : 1 }}
            >
              {String(item.id).padStart(2, "0")}　{item.label}
            </span>
          );
        })}
      </aside>

      <section className="panel">
        {/* ---------------------------------------------------------- */}
        {/* 01 出生信息                                                  */}
        {/* ---------------------------------------------------------- */}
        {step === 1 && (
          <>
            <h2>出生信息</h2>
            <p className="panel-intro">
              仅用于本次排盘演示，不要求填写真实姓名。出生时间与地点共同决定时柱，请尽量准确。
            </p>

            <div className="form-grid">
              <div className="field">
                <label
                  htmlFor="date"
                  style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                >
                  出生日期
                  <Toggle
                    value={calendar}
                    onChange={setCalendar}
                    options={[
                      { value: "solar", label: "公历" },
                      { value: "lunar", label: "农历" },
                    ]}
                  />
                </label>
                <input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
                {calendar === "lunar" && (
                  /* Deliberately not .form-note — that class is styled for
                     full-width notes in the grid and stretches this row. */
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "flex-start",
                      gap: 6,
                      marginTop: 8,
                      fontSize: "0.82em",
                      fontWeight: 400,
                      opacity: 0.65,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isLeapMonth}
                      onChange={(e) => setIsLeapMonth(e.target.checked)}
                      style={{ margin: 0, flex: "0 0 auto", width: "auto" }}
                    />
                    <span>出生于闰月（不确定可不勾选）</span>
                  </label>
                )}
              </div>

              <div className="field">
                <label htmlFor="time">出生时间</label>
                <input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
              </div>

              <div className="field">
                <label
                  htmlFor="city"
                  style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}
                >
                  出生地点
                  <Toggle
                    value={placeMode}
                    onChange={setPlaceMode}
                    options={[
                      { value: "dropdown", label: "选城市" },
                      { value: "manual_coordinates", label: "填经纬度" },
                    ]}
                  />
                </label>
                <select
                  id="city"
                  value={cityId}
                  onChange={(e) => setCityId(e.target.value)}
                  disabled={placeMode === "manual_coordinates"}
                >
                  {CITY_OPTIONS.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.country} · {option.city}
                    </option>
                  ))}
                </select>
              </div>

              <div className="field">
                <label htmlFor="gender">性别（用于大运顺逆）</label>
                <select
                  id="gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value as BaziChartRequest["gender"])}
                >
                  <option value="female">女</option>
                  <option value="male">男</option>
                  <option value="unspecified">不便说明</option>
                </select>
              </div>

              {placeMode === "manual_coordinates" && (
                <>
                  <DmsField
                    id="lng"
                    label="经度"
                    maxDegrees={180}
                    hemispheres={[
                      { value: "E", label: "东经" },
                      { value: "W", label: "西经" },
                    ]}
                    hemisphere={lngHemisphere}
                    degrees={lngDegrees}
                    minutes={lngMinutes}
                    onHemisphere={setLngHemisphere}
                    onDegrees={setLngDegrees}
                    onMinutes={setLngMinutes}
                  />
                  <DmsField
                    id="lat"
                    label="纬度"
                    maxDegrees={90}
                    hemispheres={[
                      { value: "N", label: "北纬" },
                      { value: "S", label: "南纬" },
                    ]}
                    hemisphere={latHemisphere}
                    degrees={latDegrees}
                    minutes={latMinutes}
                    onHemisphere={setLatHemisphere}
                    onDegrees={setLatDegrees}
                    onMinutes={setLatMinutes}
                  />
                </>
              )}

              <p className="form-note">
                提示：真太阳时、节气交界与历法校准会影响专业排盘。演示结果不用于现实决策。
              </p>
              {notice && <p className="notice">{notice}</p>}
              <button className="button button-primary" disabled={pending} onClick={submit}>
                {pending ? "排盘中……" : "生成命盘"}
              </button>
            </div>
          </>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 02 四柱排盘                                                  */}
        {/* ---------------------------------------------------------- */}
        {step === 2 && chart && (
          <>
            <h2>四柱排盘</h2>
            <p className="kicker">{isMock ? "模拟命盘" : "规则引擎计算结果"}</p>
            {warnings.map((warning) => (
              <p className="notice" key={warning}>
                {warning}
              </p>
            ))}

            <div className="pillars">
              {chart.pillars.map((pillar) => (
                <div className="pillar" key={pillar.label}>
                  <small>{PILLAR_LABEL[pillar.label]}</small>
                  <strong>
                    {STEM_LABEL[pillar.stem]}
                    {BRANCH_LABEL[pillar.branch]}
                  </strong>
                  <small>
                    {ELEMENT_LABEL[pillar.element]} ·{" "}
                    {pillar.ten_god ? TEN_GOD_LABEL[pillar.ten_god] : "日主"}
                  </small>
                  <small>
                    藏干：
                    {pillar.hidden_stems
                      .map((hidden) => `${STEM_LABEL[hidden.stem]}(${QI_LABEL[hidden.qi]})`)
                      .join("、")}
                  </small>
                </div>
              ))}
            </div>

            <p className="panel-intro">{chart.overview}</p>

            <details>
              <summary>时间校准</summary>
              <p className="form-note">
                公历 {chart.resolved_time.solar_date} {chart.resolved_time.civil_time}
                （{chart.resolved_time.timezone}
                {/* "UTC（UTC+0.0）" reads as a stutter; show the offset only
                    when the zone name isn't already UTC. */}
                {chart.resolved_time.timezone !== "UTC" && (
                  <>
                    ，UTC
                    {chart.resolved_time.utc_offset_minutes >= 0 ? "+" : "−"}
                    {Math.abs(chart.resolved_time.utc_offset_minutes / 60).toFixed(1)}
                  </>
                )}
                {chart.resolved_time.dst_applied && "，已应用夏令时"}）
                <br />
                经度修正 {chart.resolved_time.longitude_correction_minutes.toFixed(1)} 分，
                均时差 {chart.resolved_time.equation_of_time_minutes.toFixed(1)} 分 → 真太阳时{" "}
                {chart.resolved_time.true_solar_time}
                {chart.resolved_time.crossed_pillar_boundary && "（校正后跨越了时柱边界）"}
              </p>
            </details>

            <Nav />
          </>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 03 五行十神                                                  */}
        {/* ---------------------------------------------------------- */}
        {step === 3 && chart && (
          <>
            <h2>五行十神</h2>

            <p className="panel-intro">
              五行分布：
              {(Object.keys(chart.elements) as Array<keyof typeof chart.elements>)
                .map((key) => `${ELEMENT_LABEL[key]} ${chart.elements[key]}`)
                .join("　")}
            </p>

            <p className="panel-intro">
              日主：{STEM_LABEL[chart.day_master.stem]}
              {ELEMENT_LABEL[chart.day_master.element]} ·{" "}
              {STRENGTH_LABEL[chart.day_master.strength]}
              {chart.disposition.useful.length > 0 && (
                <>　用神：{chart.disposition.useful.map((e) => ELEMENT_LABEL[e]).join("、")}</>
              )}
              {chart.disposition.unfavourable.length > 0 && (
                <>
                  　忌神：{chart.disposition.unfavourable.map((e) => ELEMENT_LABEL[e]).join("、")}
                </>
              )}
            </p>

            <p className="panel-intro">
              十神：
              {chart.ten_gods
                .map(
                  (relation) =>
                    `${PILLAR_LABEL[relation.pillar]}${
                      relation.position === "hidden" ? "藏干" : ""
                    } ${TEN_GOD_LABEL[relation.ten_god]}`,
                )
                .join("　")}
            </p>

            {/* The explainability deliverable: the arbitration made inspectable. */}
            <details>
              <summary>判断依据</summary>
              <ul>
                {chart.reasoning_trace.factors.map((factor) => (
                  <li key={factor.key}>
                    {FACTOR_LABEL[factor.key] ?? factor.key}：{factor.score} × {factor.weight} ={" "}
                    {factor.weighted_score.toFixed(2)}
                    {factor.evidence.length > 0 && <>（{factor.evidence.join("；")}）</>}
                  </li>
                ))}
              </ul>
              <p className="panel-intro">
                加权合计 {chart.reasoning_trace.fused_score.toFixed(2)} →{" "}
                {STRENGTH_LABEL[chart.reasoning_trace.provisional_strength]}
                {chart.reasoning_trace.near_threshold && "（接近临界，建议人工复核）"}
              </p>
              {chart.reasoning_trace.override && (
                <p className="panel-intro">
                  格局判定：{PATTERN_LABEL[chart.reasoning_trace.override.pattern]}
                  {chart.reasoning_trace.override.triggered ? " 成立" : " 不成立"} ——{" "}
                  {chart.reasoning_trace.override.rationale}
                  {chart.reasoning_trace.override.ruled_out.length > 0 && (
                    <>
                      <br />
                      已排除：
                      {chart.reasoning_trace.override.ruled_out
                        .map((item) => `${PATTERN_LABEL[item.pattern]}（${item.reason}）`)
                        .join("；")}
                    </>
                  )}
                </p>
              )}
              <p className="panel-intro">
                最终判定：{STRENGTH_LABEL[chart.reasoning_trace.final_strength]}
              </p>
            </details>

            <Nav />
          </>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 04 大运流年 — display only, no interpretation                */}
        {/* ---------------------------------------------------------- */}
        {step === 4 && chart && (
          <>
            <h2>大运流年</h2>
            <p className="panel-intro">以下为推算结果展示，不含有利与否的判断。</p>

            <div className="pillars">
              {chart.luck_cycles.map((cycle) => (
                <div className="pillar" key={cycle.start_age}>
                  <small>
                    {cycle.start_age}–{cycle.end_age} 岁
                  </small>
                  <strong>
                    {STEM_LABEL[cycle.stem]}
                    {BRANCH_LABEL[cycle.branch]}
                  </strong>
                  <small>
                    {cycle.start_year}–{cycle.end_year}
                  </small>
                </div>
              ))}
            </div>

            <p className="panel-intro">
              当前：{chart.current_period.year.year} 年{" "}
              {STEM_LABEL[chart.current_period.year.stem]}
              {BRANCH_LABEL[chart.current_period.year.branch]}　
              {STEM_LABEL[chart.current_period.month.stem]}
              {BRANCH_LABEL[chart.current_period.month.branch]} 月　
              {STEM_LABEL[chart.current_period.day.stem]}
              {BRANCH_LABEL[chart.current_period.day.branch]} 日
            </p>

            <Nav />
          </>
        )}

        {/* ---------------------------------------------------------- */}
        {/* 05 方向推荐                                                  */}
        {/* ---------------------------------------------------------- */}
        {step === 5 && chart && (
          <>
            <h2>方向推荐</h2>
            <p className="panel-intro">
              以下为传统命理体系下的结构契合度参考，并非对现实结果的预测。
            </p>

            {chart.advisory
              .filter((domain) => domain.domain === "career")
              .map((domain) => (
                <div key={domain.domain}>
                  <p className="kicker">{DOMAIN_LABEL[domain.domain]}</p>
                  <ul>
                    {domain.categories.map((category) => (
                      <li key={category.category} style={{ marginBottom: 12 }}>
                        <strong>
                          {category.rank}. {category.display_name}
                        </strong>
                        （契合度 {category.fit_score}）
                        {category.strengths.length > 0 && (
                          <div>优点：{category.strengths.join("；")}</div>
                        )}
                        {category.considerations.length > 0 && (
                          <div>可留意：{category.considerations.join("；")}</div>
                        )}
                        <small>
                          依据：
                          {category.citations
                            .map(
                              (citation) =>
                                `${TEN_GOD_LABEL[citation.ten_god]}（${
                                  DISPOSITION_LABEL[citation.disposition]
                                } +${citation.points}）`,
                            )
                            .join("、")}
                        </small>
                      </li>
                    ))}
                  </ul>
                  <p className="panel-intro">{domain.narrative}</p>
                </div>
              ))}

            {chart.source_refs.length > 0 && (
              <p className="form-note">
                参考文献：
                {chart.source_refs
                  .map((ref) => [ref.title, ref.edition, ref.chapter].filter(Boolean).join(" · "))
                  .join("；")}
              </p>
            )}

            <Nav />
          </>
        )}
      </section>
    </div>
  );
}
