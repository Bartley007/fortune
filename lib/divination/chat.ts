import type {DivinationChatMessage,DivinationChatReply} from "@/lib/contracts/divination";

const domainKeywords:ReadonlyArray<[string,string[]]>=[
  ["career",["事业","工作","职业","升职","求职","学业","考试","学习"]],
  ["marriage",["感情","姻缘","婚姻","恋爱","对象","复合"]],
  ["wealth",["财运","财富","收入","投资","钱","生意"]],
  ["health",["健康","疾病","身体","病"]],
  ["family",["家庭","家人","父母","孩子"]],
  ["travel",["出行","旅行","搬家","迁移"]],
];
const intentOf=(text:string)=>/灵签|观音|抽签/.test(text)?"guanyin":/六爻|起卦|卦象|数字起卦|三币/.test(text)?"divination":null;
const timeOf=(text:string)=>text.match(/(?:未来|近|在)?(?:[0-9一二三四五六七八九十]+\s*(?:天|周|个月|月|年)|今年|明年|本周|下周|近期)/)?.[0]??"";
const numbersOf=(text:string)=>[...text.matchAll(/(?<!\d)(\d{1,6})(?!\d)/g)].map(match=>Number(match[1]));
const domainOf=(text:string)=>domainKeywords.find(([,keywords])=>keywords.some(keyword=>text.includes(keyword)))?.[0]??"";
const userText=(messages:DivinationChatMessage[])=>messages.filter(message=>message.role==="user").map(message=>message.content.trim()).filter(Boolean).join(" ");

export function continueDivinationChat(messages:DivinationChatMessage[]):DivinationChatReply{
  const text=userText(messages);
  if(!text)return{status:"clarify",message:"想问哪一件事？你可以先说“我想用六爻问工作”，或“我想抽观音灵签问感情”。",suggestions:["六爻问事业","观音灵签问感情"]};
  const intent=intentOf(text);
  if(!intent)return{status:"clarify",message:"这件事可以用六爻起卦或观音灵签。你想选哪一种？",suggestions:["用六爻起卦","抽观音灵签"]};
  const question=text.replace(/(?:我想|请|帮我)?(?:用)?(?:六爻起卦|六爻|起卦|观音灵签|灵签|抽签)/g,"").trim();
  if(question.length<4)return{status:"clarify",message:"请用一句话说明所问事件，例如“我是否应接受新的工作机会”。",suggestions:["我是否应接受新的工作机会？"]};
  const timeRange=timeOf(text);
  if(!timeRange)return{status:"clarify",message:"这个问题希望看哪个时间范围？例如“未来三个月”或“今年内”。",suggestions:["未来三个月","今年内"]};
  if(intent==="guanyin"){
    const domain=domainOf(text);
    if(!domain)return{status:"clarify",message:"这支签主要想看哪个领域？",suggestions:["事业","感情","财运","健康","家庭","出行"]};
    return{status:"ready",message:"信息齐全。我现在为你抽取一支观音灵签；签号由服务端安全随机生成。",suggestions:[],guanyin_request:{question,domain}};
  }
  const numbers=numbersOf(text).filter(value=>value>0&&value<=999_999).slice(-3);
  if(numbers.length<2)return{status:"clarify",message:"请给我两个正整数作为上卦和下卦数字（可选第三个数字决定动爻），例如“18 和 27”。",suggestions:["18 和 27","18、27、9"]};
  return{status:"ready",message:"信息齐全。我将按固定规则计算本卦、动爻、互卦和变卦。",suggestions:[],cast_request:{question,method:"numbers",numbers,time_range:timeRange}};
}
