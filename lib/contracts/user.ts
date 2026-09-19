export interface SessionEventRequest { session_id:string; event_type:"question"|"supplement"|"calculation"|"interpretation"|"visualization"|"knowledge_read"|"feedback"; module:"bazi"|"divination"|"guanyin"|"knowledge"; payload?:Record<string,unknown>; occurred_at?:string }
export interface UserNoteRequest { note_id?:string; user_id?:string; title:string; content:string; tags?:string[]; source_ref?:string; action?:"create"|"update"|"delete" }
export interface UserNote { note_id:string; title:string; content:string; tags:string[]; source_ref?:string; updated_at:string }
