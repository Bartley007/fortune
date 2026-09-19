export type CastingMethod="numbers"|"random"|"coins";
export interface DivinationCastRequest { question:string; method:CastingMethod; numbers?:number[]; coins?:number[][]; time_range?:string }
export interface HexagramView { number:number; name:string; upper_trigram:string; lower_trigram:string; lines:Array<6|7|8|9> }
export interface DivinationCastResult { primary:HexagramView; moving_lines:number[]; mutual:HexagramView; transformed:HexagramView; traditional_meaning:string; contextual_interpretation:string }
