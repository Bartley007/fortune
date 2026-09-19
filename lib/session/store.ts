import type {SessionEventRequest,UserNote,UserNoteRequest} from "@/lib/contracts/user";
const events:SessionEventRequest[]=[];const notes=new Map<string,UserNote>();
export function addEvent(event:SessionEventRequest){events.push(event);if(events.length>1000)events.shift();return{accepted:true,event_count:events.length}}
export function saveNote(input:UserNoteRequest){const id=input.note_id??crypto.randomUUID();if(input.action==="delete"){notes.delete(id);return{deleted:true,note_id:id}}const note:UserNote={note_id:id,title:input.title,content:input.content,tags:input.tags??[],source_ref:input.source_ref,updated_at:new Date().toISOString()};notes.set(id,note);return note}
