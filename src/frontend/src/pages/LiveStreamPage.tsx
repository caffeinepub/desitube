import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Send, Users, Video, VideoOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useEndLiveStream,
  useGetChannelProfile,
  useGetLiveChatMessages,
  useGetLiveStream,
  useSendLiveChatMessage,
} from "../hooks/useQueries";

function abbreviatePrincipal(p: string): string {
  if (p.length <= 12) return p;
  return `${p.slice(0, 6)}...${p.slice(-4)}`;
}

function formatTime(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const d = new Date(ms);
  return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

function StreamPlayer({ streamUrl }: { streamUrl: string }) {
  const isYoutube =
    streamUrl.includes("youtube.com") || streamUrl.includes("youtu.be");

  if (!streamUrl || streamUrl.trim() === "") {
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden flex flex-col items-center justify-center bg-gradient-to-br from-saffron-dark via-primary to-orange-800 relative">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 50%, oklch(0.9 0.18 55 / 0.4) 0%, transparent 60%), radial-gradient(circle at 70% 30%, oklch(0.7 0.15 30 / 0.3) 0%, transparent 50%)",
          }}
        />
        <Video className="w-16 h-16 text-white/70 mb-4" />
        <p className="text-white font-display font-bold text-2xl">
          Live Stream
        </p>
        <p className="text-white/60 text-sm mt-2">
          Namaste! Aaj ka show shuru ho gaya 🎉
        </p>
        <div className="mt-4 flex gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full bg-white/60 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  if (isYoutube) {
    let embedUrl = streamUrl;
    const ytMatch = streamUrl.match(
      /(?:youtube\.com\/(?:watch\?v=|live\/)|youtu\.be\/)([\w-]+)/,
    );
    if (ytMatch) {
      embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&mute=1`;
    }
    return (
      <div className="w-full aspect-video rounded-xl overflow-hidden">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Live Stream"
        />
      </div>
    );
  }

  return (
    <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
      {/* biome-ignore lint/a11y/useMediaCaption: live stream does not have captions */}
      <video
        src={streamUrl}
        autoPlay
        controls
        className="w-full h-full object-contain"
      />
    </div>
  );
}

export default function LiveStreamPage() {
  const { principal } = useParams({ from: "/live/$principal" });
  const { identity } = useInternetIdentity();
  const isOwner = identity?.getPrincipal().toString() === principal;

  const { data: liveStream, isLoading: streamLoading } =
    useGetLiveStream(principal);
  const { data: channel } = useGetChannelProfile(principal);
  const { data: chatMessages, isLoading: chatLoading } = useGetLiveChatMessages(
    liveStream?.isLive ? principal : undefined,
  );
  const { mutateAsync: endStream, isPending: endingStream } =
    useEndLiveStream();
  const { mutateAsync: sendMessage, isPending: sendingMessage } =
    useSendLiveChatMessage(principal);

  const [chatInput, setChatInput] = useState("");
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const msgCount = chatMessages?.length ?? 0;

  // biome-ignore lint/correctness/useExhaustiveDependencies: scroll when new messages arrive
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgCount]);

  const handleSendMessage = async () => {
    const text = chatInput.trim();
    if (!text) return;
    if (!identity) {
      toast.error("Please sign in to chat");
      return;
    }
    try {
      await sendMessage(text);
      setChatInput("");
    } catch {
      toast.error("Failed to send message");
    }
  };

  const handleEndStream = async () => {
    try {
      await endStream();
      toast.success("Stream ended");
    } catch {
      toast.error("Failed to end stream");
    }
  };

  const channelName = channel?.username || abbreviatePrincipal(principal);

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Back nav */}
      <div className="mb-4">
        <Link
          to="/channel/$principal"
          params={{ principal }}
          data-ocid="live.link"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Channel
        </Link>
      </div>

      {streamLoading ? (
        <div data-ocid="live.loading_state" className="space-y-4">
          <Skeleton className="w-full aspect-video rounded-xl" />
          <Skeleton className="h-8 w-64" />
        </div>
      ) : !liveStream || !liveStream.isLive ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-ocid="live.empty_state"
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <VideoOff className="w-16 h-16 text-muted-foreground/40 mb-4" />
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">
            {channelName} is not live right now
          </h2>
          <p className="text-muted-foreground text-sm max-w-sm">
            Come back later when they start streaming. Subscribe to get
            notified!
          </p>
          <Link
            to="/channel/$principal"
            params={{ principal }}
            className="mt-6"
          >
            <Button variant="outline" className="border-primary text-primary">
              Visit Channel
            </Button>
          </Link>
        </motion.div>
      ) : (
        <div
          className="flex flex-col lg:flex-row gap-4"
          style={{ minHeight: "70vh" }}
        >
          {/* Stream Panel */}
          <div className="flex-1 lg:w-2/3 flex flex-col gap-4">
            {/* Stream header */}
            <div className="flex items-center gap-3">
              <span
                className="inline-flex items-center gap-1.5 bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full animate-pulse"
                data-ocid="live.toggle"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-white" />
                LIVE
              </span>
              <h1 className="font-display font-bold text-lg md:text-xl text-foreground line-clamp-1">
                {liveStream.title}
              </h1>
            </div>

            {/* Video player */}
            <StreamPlayer streamUrl={liveStream.streamUrl} />

            {/* Channel info + actions */}
            <div className="flex items-center justify-between bg-card rounded-xl px-4 py-3 shadow-card">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {channelName.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{channelName}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {Number(
                      channel?.subscriberCount || BigInt(0),
                    ).toLocaleString("en-IN")}{" "}
                    subscribers
                  </p>
                </div>
              </div>
              {isOwner && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleEndStream}
                  disabled={endingStream}
                  data-ocid="live.delete_button"
                >
                  {endingStream ? "Ending..." : "End Stream"}
                </Button>
              )}
            </div>
          </div>

          {/* Live Chat Panel */}
          <div
            className="lg:w-1/3 flex flex-col bg-card rounded-xl shadow-card overflow-hidden"
            style={{ height: "70vh" }}
          >
            <div className="px-4 py-3 border-b border-border flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <h2 className="font-display font-semibold text-sm">Live Chat</h2>
              <Badge variant="secondary" className="ml-auto text-xs">
                Live
              </Badge>
            </div>

            <ScrollArea className="flex-1 px-3 py-2">
              {chatLoading ? (
                <div
                  data-ocid="live.chat.loading_state"
                  className="space-y-2 p-2"
                >
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-10 rounded-lg" />
                  ))}
                </div>
              ) : !chatMessages || chatMessages.length === 0 ? (
                <div
                  data-ocid="live.chat.empty_state"
                  className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground"
                >
                  <p className="text-2xl mb-2">💬</p>
                  <p className="text-xs">
                    Namaste! Aaj ka show shuru ho gaya 🎉
                  </p>
                  <p className="text-xs mt-1 opacity-60">
                    Be the first to chat!
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {chatMessages.map((msg, i) => (
                    <motion.div
                      key={`${msg.sender.toString()}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex gap-2 py-1.5"
                      data-ocid={`live.chat.item.${i + 1}`}
                    >
                      <Avatar className="w-6 h-6 shrink-0 mt-0.5">
                        <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                          {msg.sender.toString().slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xs font-semibold text-primary truncate">
                            {abbreviatePrincipal(msg.sender.toString())}
                          </span>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTime(msg.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground break-words">
                          {msg.text}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              <div ref={chatBottomRef} />
            </ScrollArea>

            {/* Chat input */}
            <div className="px-3 py-3 border-t border-border flex gap-2">
              <Input
                data-ocid="live.chat.input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                placeholder="Apna message likho..."
                className="flex-1 text-sm"
                disabled={!identity}
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={sendingMessage || !chatInput.trim() || !identity}
                className="bg-primary hover:bg-saffron-dark text-primary-foreground shrink-0"
                data-ocid="live.chat.submit_button"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
            {!identity && (
              <p className="text-center text-xs text-muted-foreground pb-2">
                Sign in to participate in live chat
              </p>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
