export interface KnowledgeSearchItem { id:string; title:string; source:string; catalog:string; category:string[]; excerpt:string; url:string }
export interface KnowledgeGraphResult { nodes:Array<{id:string;label:string;type:string}>; edges:Array<{source:string;target:string;relation:string}> }
export interface KnowledgeCompareResult { query:string; viewpoints:Array<{source_id:string;title:string;viewpoint:string;url?:string}> }
