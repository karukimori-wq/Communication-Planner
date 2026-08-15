import type { Channel } from "@/lib/types";
import type { ChannelAdapter } from "./types";
import { instagramAdapter } from "./instagram";
import { lineAdapter } from "./line";
import { xAdapter } from "./x";

export const adapters: Record<Exclude<Channel, "unknown">, ChannelAdapter> = {
  line: lineAdapter,
  x: xAdapter,
  instagram: instagramAdapter
};

export function getAdapter(channel: Channel): ChannelAdapter | null {
  if (channel === "unknown") return null;
  return adapters[channel];
}
