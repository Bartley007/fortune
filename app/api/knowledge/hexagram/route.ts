import { failure, success } from "@/lib/contracts/api";
import { getHexagramEvidence, hexagramKnowledgeStats } from "@/lib/knowledge/hexagram";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const numberValue = params.get("number");
  const name = params.get("name")?.trim().slice(0, 30);
  const lineValue = params.get("line");
  const number = numberValue ? Number(numberValue) : undefined;
  const line = lineValue ? Number(lineValue) : undefined;

  if (!number && !name) {
    return failure("knowledge-hexagram-v1", "VALIDATION_ERROR", "请提供卦序 number 或卦名 name。", undefined, 400);
  }
  if (number !== undefined && (!Number.isInteger(number) || number < 1 || number > 64)) {
    return failure("knowledge-hexagram-v1", "VALIDATION_ERROR", "卦序 number 必须是 1–64 的整数。", undefined, 400);
  }
  if (line !== undefined && (!Number.isInteger(line) || line < 1 || line > 6)) {
    return failure("knowledge-hexagram-v1", "VALIDATION_ERROR", "爻位 line 必须是 1–6 的整数。", undefined, 400);
  }

  const result = getHexagramEvidence({ number, name, line });
  if (!result) {
    return failure("knowledge-hexagram-v1", "HEXAGRAM_NOT_FOUND", "现有知识库中未找到对应卦象资料，系统不会生成替代原文。", undefined, 404);
  }
  if (line !== undefined && !result.selected_line) {
    return failure("knowledge-hexagram-v1", "LINE_NOT_FOUND", `现有知识库缺少第 ${line} 爻资料，系统不会生成替代原文。`, undefined, 404);
  }

  return Response.json({
    ...success(result, {
      system: "knowledge-hexagram-v1",
      sources: result.sources,
      warnings: result.coverage.complete ? [] : ["该卦资料不完整；缺失部分未生成替代内容。"],
      mock: false,
    }),
    stats: hexagramKnowledgeStats,
  });
}
