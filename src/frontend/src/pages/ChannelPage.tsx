import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Link, useParams } from "@tanstack/react-router";
import { DollarSign, Loader2, Radio, Users, VideoIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { toast } from "sonner";
import MonetizationTab from "../components/MonetizationTab";
import VideoCard from "../components/VideoCard";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useEndLiveStream,
  useGetChannelProfile,
  useGetLiveStream,
  useGetMembershipTiers,
  useGetMonetizationStatus,
  useGetVideosByUploader,
  useStartLiveStream,
  useSubscribeChannel,
  useUnsubscribeChannel,
} from "../hooks/useQueries";

function formatCount(n: bigint): string {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
}

function GoLiveDialog({
  principal,
  subscriberCount,
  isLive,
}: {
  principal: string;
  subscriberCount: bigint;
  isLive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [streamTitle, setStreamTitle] = useState("");
  const [streamUrl, setStreamUrl] = useState("");
  const { mutateAsync: startStream, isPending } = useStartLiveStream();
  const { mutateAsync: endStream, isPending: ending } = useEndLiveStream();
  const canGoLive = Number(subscriberCount) >= 30;

  const handleStartStream = async () => {
    if (!streamTitle.trim()) {
      toast.error("Please enter a stream title");
      return;
    }
    try {
      await startStream({
        title: streamTitle.trim(),
        streamUrl: streamUrl.trim(),
      });
      toast.success("🔴 You are now live!");
      setOpen(false);
    } catch {
      toast.error("Failed to start stream");
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

  if (isLive) {
    return (
      <div className="flex items-center gap-2">
        <Link to="/live/$principal" params={{ principal }}>
          <Button
            size="sm"
            className="bg-red-600 hover:bg-red-700 text-white"
            data-ocid="channel.live.button"
          >
            <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
            View Live
          </Button>
        </Link>
        <Button
          size="sm"
          variant="outline"
          onClick={handleEndStream}
          disabled={ending}
          data-ocid="channel.live.delete_button"
          className="border-red-500 text-red-500 hover:bg-red-50"
        >
          {ending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            "End Stream"
          )}
        </Button>
      </div>
    );
  }

  if (!canGoLive) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span>
              <Button
                size="sm"
                disabled
                className="opacity-60 cursor-not-allowed"
                data-ocid="channel.golive.button"
              >
                <Radio className="w-3.5 h-3.5 mr-1.5" />
                Go Live
              </Button>
            </span>
          </TooltipTrigger>
          <TooltipContent>
            <p>Need 30 subscribers to go live ({Number(subscriberCount)}/30)</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          size="sm"
          className="bg-red-600 hover:bg-red-700 text-white"
          data-ocid="channel.golive.button"
        >
          <Radio className="w-3.5 h-3.5 mr-1.5" />
          Go Live
        </Button>
      </DialogTrigger>
      <DialogContent data-ocid="channel.golive.dialog">
        <DialogHeader>
          <DialogTitle className="font-display">
            Start Live Stream 🔴
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div className="space-y-1.5">
            <Label htmlFor="stream-title">Stream Title *</Label>
            <Input
              id="stream-title"
              data-ocid="channel.golive.input"
              value={streamTitle}
              onChange={(e) => setStreamTitle(e.target.value)}
              placeholder="Aaj ka live show - Cricket Special!"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="stream-url">Stream URL (optional)</Label>
            <Input
              id="stream-url"
              value={streamUrl}
              onChange={(e) => setStreamUrl(e.target.value)}
              placeholder="https://youtube.com/live/... or video URL"
            />
            <p className="text-xs text-muted-foreground">
              Leave blank to show a placeholder stream player.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              data-ocid="channel.golive.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartStream}
              disabled={isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-ocid="channel.golive.submit_button"
            >
              {isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Radio className="w-4 h-4 mr-1.5" />
              )}
              {isPending ? "Starting..." : "Go Live!"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function ChannelPage() {
  const { principal } = useParams({ from: "/channel/$principal" });
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;
  const isOwnChannel = identity?.getPrincipal().toString() === principal;

  const { data: channel, isLoading: channelLoading } =
    useGetChannelProfile(principal);
  const { data: videos, isLoading: videosLoading } =
    useGetVideosByUploader(principal);
  const { mutateAsync: subscribe, isPending: subscribePending } =
    useSubscribeChannel(principal);
  const { mutateAsync: unsubscribe, isPending: unsubscribePending } =
    useUnsubscribeChannel(principal);
  const { data: liveStream } = useGetLiveStream(principal);

  const isLive = !!liveStream?.isLive;

  // For viewer membership tiers section below videos
  const { data: monetizationStatus } = useGetMonetizationStatus(principal);
  const { data: channelTiers } = useGetMembershipTiers(principal);
  const showViewerMemberships =
    !isOwnChannel &&
    monetizationStatus?.enabled &&
    channelTiers &&
    channelTiers.length > 0;

  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribeToggle = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe");
      return;
    }
    try {
      if (subscribed) {
        await unsubscribe();
        setSubscribed(false);
        toast.success("Unsubscribed");
      } else {
        await subscribe();
        setSubscribed(true);
        toast.success("Subscribed! 🔔");
      }
    } catch {
      toast.error("Failed to update subscription");
    }
  };

  if (channelLoading)
    return (
      <div
        className="max-w-[1400px] mx-auto px-4 py-8"
        data-ocid="channel.loading_state"
      >
        <Skeleton className="h-40 rounded-2xl mb-4" />
        <Skeleton className="h-16 w-48" />
      </div>
    );

  const username = channel?.username || `Channel ${principal?.slice(0, 8)}...`;
  const bio = channel?.bio || "Welcome to my DesiTube channel!";
  const subscribers = channel?.subscriberCount || BigInt(0);

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      {/* Channel Header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-8"
      >
        {/* Banner */}
        <div className="h-40 rounded-2xl overflow-hidden mb-0 festive-bar opacity-90" />

        {/* Profile row */}
        <div className="bg-card rounded-2xl -mt-6 mx-4 px-6 pt-4 pb-6 shadow-card">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <Avatar className="w-20 h-20 border-4 border-card -mt-10 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display font-bold text-2xl">{username}</h1>
                {isLive && (
                  <Badge className="bg-red-600 text-white animate-pulse text-xs px-2 py-0.5">
                    🔴 LIVE
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {formatCount(subscribers)} subscribers
                </span>
                <span className="flex items-center gap-1">
                  <VideoIcon className="w-4 h-4" />
                  {videos?.length || 0} videos
                </span>
              </div>
              {bio && (
                <p className="text-sm text-muted-foreground mt-2 max-w-xl">
                  {bio}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {isOwnChannel && (
                <GoLiveDialog
                  principal={principal}
                  subscriberCount={subscribers}
                  isLive={isLive}
                />
              )}
              {!isOwnChannel && (
                <Button
                  data-ocid="channel.subscribe_button"
                  onClick={handleSubscribeToggle}
                  disabled={subscribePending || unsubscribePending}
                  className={
                    subscribed
                      ? "bg-muted text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                      : "bg-primary hover:bg-saffron-dark text-primary-foreground"
                  }
                >
                  {subscribed ? "Unsubscribe" : "Subscribe"}
                </Button>
              )}
              {!isOwnChannel && isLive && (
                <Link to="/live/$principal" params={{ principal }}>
                  <Button
                    size="sm"
                    className="bg-red-600 hover:bg-red-700 text-white"
                    data-ocid="channel.watch_live.button"
                  >
                    <Radio className="w-3.5 h-3.5 mr-1.5 animate-pulse" />
                    Watch Live
                  </Button>
                </Link>
              )}
              {isOwnChannel && (
                <Button
                  variant="outline"
                  className="border-primary text-primary"
                >
                  Edit Channel
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <Separator className="mb-6" />

      {/* Tabs: Videos + Monetization (owner only) */}
      <Tabs defaultValue="videos">
        <TabsList className={`mb-6 ${isOwnChannel ? "" : "hidden"}`}>
          <TabsTrigger value="videos" data-ocid="channel.videos.tab">
            <VideoIcon className="w-4 h-4 mr-1.5" />
            Videos
          </TabsTrigger>
          {isOwnChannel && (
            <TabsTrigger
              value="monetization"
              data-ocid="channel.monetization_tab"
            >
              <DollarSign className="w-4 h-4 mr-1.5" />
              Monetization
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="videos">
          {/* Videos Grid */}
          <h2 className="font-display font-bold text-xl mb-5">Videos</h2>
          {videosLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {["s1", "s2", "s3", "s4", "s5", "s6"].map((k) => (
                <Skeleton key={k} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : videos && videos.length > 0 ? (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
                hidden: {},
              }}
            >
              {videos.map((video, i) => (
                <motion.div
                  key={video.id}
                  variants={{
                    hidden: { opacity: 0, y: 12 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <VideoCard video={video} index={i + 1} />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div
              data-ocid="channel.empty_state"
              className="text-center py-20 text-muted-foreground"
            >
              <VideoIcon className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No videos yet</p>
              {isOwnChannel && (
                <Link to="/upload" className="mt-3 inline-block">
                  <Button className="bg-primary hover:bg-saffron-dark text-primary-foreground mt-3">
                    Upload your first video
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Viewer: Memberships below videos */}
          {showViewerMemberships && (
            <MonetizationTab
              principal={principal}
              isOwnChannel={false}
              videos={videos}
            />
          )}
        </TabsContent>

        {isOwnChannel && (
          <TabsContent value="monetization">
            <MonetizationTab
              principal={principal}
              isOwnChannel={true}
              videos={videos}
            />
          </TabsContent>
        )}
      </Tabs>
    </main>
  );
}
