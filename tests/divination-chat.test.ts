import {describe,expect,it} from "vitest";
import {continueDivinationChat} from "../lib/divination/chat";

describe("问卦 chatbot",()=>{
  it("只在缺少起卦方式时追问",()=>{
    const reply=continueDivinationChat([{role:"user",content:"我想问未来三个月的工作安排"}]);
    expect(reply.status).toBe("clarify");
    expect(reply.message).toContain("六爻");
  });
  it("信息齐全时返回确定性的数字起卦请求",()=>{
    const reply=continueDivinationChat([{role:"user",content:"我想用六爻问未来三个月的工作，数字 18 和 27"}]);
    expect(reply.status).toBe("ready");
    expect(reply.cast_request).toMatchObject({method:"numbers",numbers:[18,27],time_range:"未来三个月"});
  });
  it("灵签信息齐全时只调度抽签，不选择签号",()=>{
    const reply=continueDivinationChat([{role:"user",content:"抽观音灵签问今年的感情"}]);
    expect(reply.status).toBe("ready");
    expect(reply.guanyin_request).toMatchObject({domain:"marriage"});
    expect(reply).not.toHaveProperty("stick_number");
  });
});
