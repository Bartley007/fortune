# Module 2A 实现研究与交付报告

> 角色：Module 2A（问卦与灵签计算）  
> 范围：确定性起卦、卦象计算、观音灵签随机抽取、签文读取与结构化结果输出。  
> 不在本模块范围：自然语言追问、现代中文情境化解释、交互可视化页面、古籍检索与来源知识库。

## 1. 结论与当前可用基础

项目已有两个可直接复用的浏览器端接口：

| 能力 | 接口 | 当前状态 | Module 2A 需要完成的部分 |
| --- | --- | --- | --- |
| 六爻起卦 | `POST /api/divination/cast` | API 契约、路由、Python 转发层已在；未配置 Python 时返回 Mock | 实现真实、可复核的 Python 规则引擎 |
| 观音灵签 | `POST /api/guanyin-lot/draw` | 可用；从 100 支签中使用 Node `crypto.randomInt` 选签 | 保持随机抽签；补足抽签审计字段、签文来源与测试 |

因此，Module 2A 的核心工作不是从零建前端，而是实现 `/divination/cast` 所需的算法服务，并稳定现有灵签结果的契约。页面只能调用 `/api/*`，不能直接导入或调用算法实现；这是团队已约定的边界。

## 2. 已审阅的接口合同

审阅文件：`docs/API_INTEGRATION.md`、`docs/TEAM_HANDOFF.md`、`lib/contracts/divination.ts`、`app/api/divination/cast/route.ts`、`lib/divination/service.ts`、`app/api/guanyin-lot/draw/route.ts`、`lib/guanyin/library.ts`。

### 2.1 易卦接口

浏览器请求：

```http
POST /api/divination/cast
Content-Type: application/json
```

```json
{
  "question": "未来三个月的职业安排？",
  "method": "numbers",
  "numbers": [18, 27],
  "time_range": "未来三个月"
}
```

Next.js 将同一请求转发到 Python：

```http
POST ${PYTHON_ALGORITHM_BASE_URL}/divination/cast
```

Python 必须直接返回 `DivinationCastResult`，**不能自行包裹 `ApiEnvelope`**。Next.js 会统一加上 `result`、`system`、`source_refs`、`warnings`、`error` 与 `meta`。

当前返回字段为：

```ts
interface DivinationCastResult {
  primary: HexagramView;
  moving_lines: number[];
  mutual: HexagramView;
  transformed: HexagramView;
  traditional_meaning: string;
  contextual_interpretation: string;
}

interface HexagramView {
  number: number;
  name: string;
  upper_trigram: string;
  lower_trigram: string;
  lines: Array<6 | 7 | 8 | 9>;
}
```

约定：六爻数组按照**初爻到上爻（下到上）**排列；`6`、`8` 为阴爻，`7`、`9` 为阳爻，`6` 与 `9` 是动爻。`moving_lines` 建议统一使用 1–6 的人类可读位置，1 表示初爻。

### 2.2 观音灵签接口

```http
POST /api/guanyin-lot/draw
Content-Type: application/json
```

```json
{
  "question": "我是否应接受新的工作机会？",
  "domain": "career"
}
```

当前服务端使用 `node:crypto` 的 `randomInt(1, 101)` 均匀选出签号，再从 `sticks/guanyin.json` 读取原始签文和传统字段；问题与领域不会影响随机结果。这符合“模型不生成签号、不改写原文”的要求。

`sticks/guanyin.json` 已经过完整性校验：恰好 100 支、签号 1–100 不重复、每签四句诗、每签包含事业/姻缘/财运/健康/家庭/出行六领域传统解释。现有测试也禁止在 `app/` 和 `lib/` 中使用 `Math.random`。

## 3. 发现的接口缺口与建议先决策项

在开始算法实现前，建议组内确认下面四项；其中前两项会直接影响同一输入是否可复算。

| 决策项 | 当前情况 | 建议 |
| --- | --- | --- |
| 数字起卦规则 | API 只要求至少两个数字，未定义取模、动爻算法或第三数字含义 | 固化为书面规则与单元测试。例如：第 1 数取上卦、第 2 数取下卦、第 3 数取动爻；无第 3 数时由前两数按明确公式导出动爻。|
| 随机/三币起卦 | 类型声明有 `random`、`coins`，但路由只把 `numbers` 传给服务，完全丢弃 `coins` | MVP 先只公开 `numbers`；或补齐 `coins` 校验与转发，并明确定义每一掷硬币的编码。|
| 互卦定义 | 契约要求 `mutual`，没有说明取法 | 使用标准取法：本卦第 2–4 爻为下互卦、第 3–5 爻为上互卦；在接口与文档明确。|
| 无动爻策略 | 契约总要求 `transformed`，但常规三币法可能无动爻 | 建议返回与本卦相同的 `transformed`，`moving_lines: []`，另通过 `warnings` 说明“本次无动爻，变卦与本卦相同”。|

另有两个实现问题应在联调前处理：

1. `app/api/divination/cast/route.ts` 对数值缺少范围和整数校验，且只保留前三个数。建议限定为正整数、最大位数/绝对值，拒绝 `NaN`、小数、负数与超长输入。
2. `DivinationCastResult` 的 `traditional_meaning` 与 `contextual_interpretation` 混合了 Module 2A 和 2B 的职责。Module 2A 应只提供基于规则或来源 ID 的传统解释线索；现代情境化解释由 Module 2B 根据问题和 Module 3 证据生成。MVP 可保留字段以兼容页面，但填入明确的占位说明，不由算法自行编造现代建议。

## 4. Module 2A 目标设计

```text
用户数字 / 三币记录
        ↓
Next.js 输入校验（/api/divination/cast）
        ↓
Python：纯函数规则引擎（Module 2A）
        ↓
六爻值 → 本卦 → 动爻 → 互卦 → 变卦
        ↓
结构化 DivinationCastResult
        ↓
Next.js 统一响应封装 → Module 2B 展示、解释与可视化
```

### 4.1 Python 规则引擎应包含的组件

| 组件 | 输入 | 输出 | 关键要求 |
| --- | --- | --- | --- |
| `normalize_numbers` | 数字数组 | 合法、规范化数字 | 同一输入规范化后必须不变 |
| `cast_lines` | 方法、数字或硬币记录 | 六个 `6/7/8/9` | 不读取系统时间、不调用随机数（数字法） |
| `to_trigram` | 三条爻 | 八卦名称/编码 | 统一采用下到上的二进制编码 |
| `lookup_hexagram` | 上、下卦 | 卦序、卦名 | 使用冻结的 64 卦映射表 |
| `derive_mutual` | 本卦六爻 | 互卦 | 固定取二三四、三四五爻 |
| `derive_transformed` | 本卦、动爻 | 变卦 | 仅翻转动爻的阴阳 |
| `build_result` | 上述结果 | API 契约对象 | 不生成自由文本占断 |

八卦与 64 卦映射表应作为受版本控制的静态数据（例如 Python 常量或 JSON），不要由大语言模型、外部搜索结果或数据库随机拼接。每个结果可额外在 Python 日志中记录 `rule_version` 与规范化输入，便于复核。

### 4.2 灵签实现设计

灵签无需经过 Python。保持服务端抽签即可：

```text
有效签号 1–100 → crypto.randomInt(1, 101) → getGuanyinStick(id) → API Envelope
```

建议将当前响应从“页面刚好可用”升级为稳定的 `GuanyinDrawResult`，至少返回：

```ts
{
  draw_id: string,
  stick: GuanyinStick,
  question: string,
  domain: QuestionDomain | null,
  drawn_at: string,
  oracle_version: "0.1.0",
  random_method: "server-crypto-random-int",
  source: { source_id: "guanyin-100", title: "观音灵签百签结构化签库" }
}
```

这不会改变签号和签文逻辑，却会让 Module 2B 能展示“签文原文 / 传统解释 / 后续现代解释 / 来源”四个明确层级。尤其应避免在客户端通过 `getGuanyinStick()` 再次读库，而应直接渲染 API 返回的 `stick`，以确保展示内容就是本次服务端抽到的结果。

## 5. 推荐实施顺序

### Phase 0：接口冻结（半天）

1. 与 Module 2B、Module 3 确认数字起卦、三币编码、无动爻、互卦与动爻编号规则。
2. 在 `docs/API_INTEGRATION.md` 写入这些规则和成功/失败样例。
3. 将 `coins` 是否纳入 MVP 写清；若不纳入，就从前端可选项与契约中暂时移除，避免“宣称支持但无法计算”。

### Phase 1：确定性算法（1–2 天）

1. 建立独立 Python/FastAPI 服务，并实现 `POST /divination/cast`。
2. 内置八卦、64 卦查表和纯函数推演。
3. 为固定输入写黄金测试：每一项断言六爻、本卦、动爻、互卦和变卦都完全一致。
4. 用 `.env.local` 中的 `PYTHON_ALGORITHM_BASE_URL=http://127.0.0.1:8000` 接入，不改 React 直接调用路径。

### Phase 2：灵签结果稳定化（半天）

1. 定义灵签返回类型，加入抽签 ID、版本、随机方法、来源。
2. 将页面改为使用 API 返回的签文，删除客户端重新查询的依赖。
3. 增加 API 级测试：响应签号在 1–100，签文不为空，问题不影响随机函数的输入。

### Phase 3：交接 Module 2B / Module 3（半天）

1. Module 2A 交付 `primary/mutual/transformed/moving_lines` 与 `source_id`/卦象索引。
2. Module 3 根据卦名、卦序、动爻等返回古籍原文、翻译、出处和可信来源。
3. Module 2B 负责识别问题主题/时间/对象、必要追问、现代解释生成和动态图形；不得更改 Module 2A 的计算结果或原始签诗。

## 6. 验收标准

### 易卦

- 同一个 `numbers` 请求重复 100 次，六爻、本卦、动爻、互卦、变卦逐字段一致。
- 64 卦映射表覆盖完整且无重复；所有卦序范围为 1–64。
- 每个卦固定有六条爻，爻值只可能为 `6/7/8/9`；动爻只可能来自值 `6/9` 的位置。
- Python 服务不可用时，浏览器 API 返回 `meta.mock: true` 与清楚 warning；服务可用时 `meta.mock: false`。
- 非法 JSON、空问题、无效方法、缺失数字、非法硬币输入返回统一错误 envelope，不抛出未处理异常。

### 观音灵签

- 签库严格为 1–100 的完整无重复集合，且每支签都具有诗文、吉凶、解曰、仙机、典故和来源字段。
- 随机选择使用密码学安全随机数，不使用 `Math.random`，且问题、领域和模型输出不参与签号选择。
- API 和页面展示同一支服务端返回的签；签诗原文不可被后续解释层改写。
- 数据读取失败时返回明确错误；如签已抽出但补充资料失败，保留签号与原文并提示缺少资料。

## 7. 你可以向团队说明的边界

“Module 2A 只负责把输入稳定地算成可复核的卦象和随机抽出的观音签，并返回结构化结果；Module 2B 不重新计算卦或签，而是解释和可视化；Module 3 不参与起卦，只提供古籍原文、译文和出处。这样同一个输入永远得到同一个卦，签文原文也不会被模型改写。”

## 8. 下一步

开始编码前，最需要团队确认的是数字起卦的具体公式。确认后即可先实现 Python 纯规则引擎和测试，再做 Next.js 路由校验与灵签结果类型的最小修改；不需要先改前端页面。
