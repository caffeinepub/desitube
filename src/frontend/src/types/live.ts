import type { Principal } from "@icp-sdk/core/principal";

export interface LiveStream {
  channel: Principal;
  title: string;
  streamUrl: string;
  startTime: bigint;
  isLive: boolean;
}

export interface LiveChatMessage {
  sender: Principal;
  text: string;
  timestamp: bigint;
}
