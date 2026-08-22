import type { DashboardConversation, DashboardSnapshot } from "../dashboard";
import { dashboardOperations } from "../dashboard";
import { contentHash } from "../hash";
import type { D1DatabaseLike, PersistedChannel } from "./d1";

type InboxRow={conversationId:string;personId:string;displayName:string;channel:PersistedChannel;lastMessagePreview?:string;lastMessageAt?:string};
type ContextRow={summary:string;promises_json:string;next_actions_json:string};
type DraftRow={id:string;body:string;status:string;created_at:string;updated_at:string};
type SafetyRow={id:string;status:string;checked_content_hash:string;checked_at:string};
type DecisionRow={id:string;safety_check_id:string;message_id:string;channel:PersistedChannel;content_hash:string;delivery_mode:"dry_run"|"live";adapter_reference:string;decided_at:string};
function jsonStrings(value:string|undefined){try{const parsed=JSON.parse(value??"[]");return Array.isArray(parsed)?parsed.filter((x):x is string=>typeof x==="string"):[]}catch{return[]}}
export async function getD1DashboardSnapshot(db:D1DatabaseLike,workspaceId:string):Promise<DashboardSnapshot>{
 const inbox=(await db.prepare("SELECT c.id AS conversationId,c.person_id AS personId,p.display_name AS displayName,c.channel,m.body AS lastMessagePreview,c.last_message_at AS lastMessageAt FROM conversations c JOIN communication_persons p ON p.workspace_id=c.workspace_id AND p.id=c.person_id LEFT JOIN messages m ON m.id=(SELECT m2.id FROM messages m2 WHERE m2.workspace_id=c.workspace_id AND m2.conversation_id=c.id ORDER BY m2.created_at DESC LIMIT 1) WHERE c.workspace_id=? ORDER BY c.last_message_at DESC").bind(workspaceId).all<InboxRow>()).results;
 const conversations:DashboardConversation[]=[];
 for(const item of inbox){
  const context=await db.prepare("SELECT summary,promises_json,next_actions_json FROM conversation_contexts WHERE workspace_id=? AND person_id=? LIMIT 1").bind(workspaceId,item.personId).first<ContextRow>();
  const topics=(await db.prepare("SELECT label FROM topics WHERE workspace_id=? AND person_id=? ORDER BY created_at DESC LIMIT 20").bind(workspaceId,item.personId).all<{label:string}>()).results.map(x=>x.label);
  const draft=await db.prepare("SELECT id,body,status,created_at,updated_at FROM reply_drafts WHERE workspace_id=? AND person_id=? AND conversation_id=? ORDER BY created_at DESC LIMIT 1").bind(workspaceId,item.personId,item.conversationId).first<DraftRow>();
  const safety=draft?await db.prepare("SELECT id,status,checked_content_hash,checked_at FROM safety_checks WHERE workspace_id=? AND person_id=? AND conversation_id=? AND reply_draft_id=? ORDER BY checked_at DESC LIMIT 1").bind(workspaceId,item.personId,item.conversationId,draft.id).first<SafetyRow>():null;
  const hash=draft?await contentHash(draft.body):"";
  const fresh=!!(draft&&safety&&safety.status==="passed"&&safety.checked_content_hash===hash&&draft.status!=="sent");
  const decisions=draft?(await db.prepare("SELECT id,safety_check_id,message_id,channel,content_hash,delivery_mode,adapter_reference,decided_at FROM reply_send_decisions WHERE workspace_id=? AND person_id=? AND conversation_id=? AND reply_draft_id=? ORDER BY decided_at DESC").bind(workspaceId,item.personId,item.conversationId,draft.id).all<DecisionRow>()).results:[];
  conversations.push({conversationId:item.conversationId,personId:item.personId,displayName:item.displayName,channel:item.channel,lastMessagePreview:item.lastMessagePreview??"",waitingState:!draft?"draft needed":draft.status==="sent"?"sent":!safety?"safety check needed":!fresh?"safety blocked":`ready on ${item.channel}`,context:{summary:context?.summary??"",topics,promises:jsonStrings(context?.promises_json),nextActions:jsonStrings(context?.next_actions_json)},replyDraft:draft?{replyDraftId:draft.id,body:draft.body,purpose:"reply",contentHash:hash,status:draft.status==="safety_checked"?"checked":draft.status==="sent"?"sent":"draft"}:null,safety:{latestSafetyCheckId:safety?.id,latestSafetyCheckStatus:safety?.status==="passed"?"passed":safety?"failed":undefined,sendReady:fresh,blockedReason:fresh?undefined:!safety?"SAFETY_CHECK_REQUIRED":safety.checked_content_hash!==hash?"STALE_SAFETY_CHECK":safety.status!=="passed"?"SAFETY_CHECK_FAILED":draft?.status==="sent"?"REPLY_DRAFT_ALREADY_SENT":undefined},sendDecisions:decisions.map(d=>({sendDecisionId:d.id,safetyCheckId:d.safety_check_id,messageId:d.message_id,channel:d.channel,contentHash:d.content_hash,deliveryMode:d.delivery_mode,adapterReference:d.adapter_reference,decidedAt:d.decided_at}))});
 }
 return{workspaceId,contractStatus:"success",conversations,adapterStates:dashboardOperations.adapterStates,aiTasks:dashboardOperations.aiTasks};
}
