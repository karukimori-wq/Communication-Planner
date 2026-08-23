import type { ChannelAdapter, ProviderInboundEvent, ProviderSendRequest } from "./types";

const LINE_PUSH_URL="https://api.line.me/v2/bot/message/push";
export const lineAdapter: ChannelAdapter = {
  channel: "line",
  normalizeInbound(event: ProviderInboundEvent) {
    return {workspaceId:event.workspaceId,channel:"line",externalUserId:event.externalUserId,externalThreadId:event.externalThreadId,externalMessageId:event.providerEventId,displayName:event.displayName,direction:"inbound",body:event.body};
  },
  async send(request: ProviderSendRequest) {
    if(request.deliveryMode!=="live")return{accepted:true,deliveryMode:"dry_run",adapterReference:"Shudesu/line-harness-oss",idempotencyKey:request.idempotencyKey,externalMessageId:`line-dry-run:${request.replyDraftId}`,reason:"LINE provider delivery remains dry-run until the live readiness gate passes."};
    const token=process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if(!token)return{accepted:false,deliveryMode:"live",adapterReference:"LINE Messaging API",idempotencyKey:request.idempotencyKey,reason:"LINE credential is not configured",providerCode:"LINE_CREDENTIAL_MISSING"};
    try{
      const response=await fetch(LINE_PUSH_URL,{method:"POST",headers:{authorization:`Bearer ${token}`,"content-type":"application/json","x-line-retry-key":request.idempotencyKey},body:JSON.stringify({to:request.externalUserId,messages:[{type:"text",text:request.body}]})});
      const requestId=response.headers.get("x-line-request-id")??undefined;
      if(!response.ok)return{accepted:false,deliveryMode:"live",adapterReference:"LINE Messaging API",idempotencyKey:request.idempotencyKey,externalMessageId:requestId,reason:`LINE provider rejected request with HTTP ${response.status}`,providerStatus:response.status,providerCode:"LINE_PROVIDER_REJECTED"};
      return{accepted:true,deliveryMode:"live",adapterReference:"LINE Messaging API",idempotencyKey:request.idempotencyKey,externalMessageId:requestId,providerStatus:response.status};
    }catch(error){return{accepted:false,deliveryMode:"live",adapterReference:"LINE Messaging API",idempotencyKey:request.idempotencyKey,reason:error instanceof Error?error.message:"LINE provider request failed",providerCode:"LINE_PROVIDER_NETWORK_ERROR"};}
  }
};
