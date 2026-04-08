import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Link, useParams } from "@tanstack/react-router";
import { Eye, Send, Share2, ThumbsUp, User } from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../blob-storage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAddComment,
  useGetChannelProfile,
  useGetComments,
  useGetVideo,
  useIncrementView,
  useSubscribeChannel,
  useToggleLike,
} from "../hooks/useQueries";

const SAMPLE_THUMB: Record<string, string> = {
  "sample-1": "/assets/generated/thumb-bollywood.dim_640x360.jpg",
  "sample-2": "/assets/generated/thumb-cricket.dim_640x360.jpg",
  "sample-3": "/assets/generated/thumb-food.dim_640x360.jpg",
  "sample-4": "/assets/generated/thumb-comedy.dim_640x360.jpg",
  "sample-5": "/assets/generated/thumb-music.dim_640x360.jpg",
  "sample-6": "/assets/generated/thumb-devotional.dim_640x360.jpg",
};

function formatCount(n: bigint) {
  const num = Number(n);
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString("en-IN");
}

export default function VideoPlayerPage() {
  const { id } = useParams({ from: "/video/$id" });
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: video, isLoading } = useGetVideo(id);
  const { data: comments, isLoading: commentsLoading } = useGetComments(id);
  const { data: channel } = useGetChannelProfile(video?.uploader?.toString());
  const { mutateAsync: addComment, isPending: commentPending } =
    useAddComment(id);
  const { mutateAsync: toggleLike, isPending: likePending } = useToggleLike(id);
  const { mutateAsync: incrementView } = useIncrementView(id);
  const { mutateAsync: subscribe, isPending: subscribePending } =
    useSubscribeChannel(video?.uploader?.toString() || "");

  const [commentText, setCommentText] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally run only on video id change
  useEffect(() => {
    if (video?.id && !id.startsWith("sample")) {
      incrementView();
    }
  }, [video?.id]);

  const videoUrl = video?.videoBlobId
    ? ExternalBlob.fromURL(video.videoBlobId).getDirectURL()
    : null;
  const thumbUrl = video?.thumbnailBlobId
    ? ExternalBlob.fromURL(video.thumbnailBlobId).getDirectURL()
    : SAMPLE_THUMB[id] || null;

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to like videos");
      return;
    }
    try {
      await toggleLike();
      toast.success("Liked! 👍");
    } catch {
      toast.error("Failed to like");
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error("Please sign in to comment");
      return;
    }
    if (!commentText.trim()) return;
    try {
      await addComment(commentText.trim());
      setCommentText("");
      toast.success("Comment added!");
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to subscribe");
      return;
    }
    try {
      await subscribe();
      setSubscribed(true);
      toast.success("Subscribed! 🔔");
    } catch {
      toast.error("Failed to subscribe");
    }
  };

  if (isLoading)
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-8"
        data-ocid="video.loading_state"
      >
        <Skeleton className="aspect-video w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-3/4 mb-3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );

  // Use sample data for sample IDs
  const isSample = id.startsWith("sample");
  const SAMPLE_DATA: Record<string, any> = {
    "sample-1": {
      title: "Pathaan Full Movie Review - Shah Rukh Khan is Back!",
      description:
        "Complete review of the blockbuster Pathaan featuring SRK at his finest performance in years. Don't miss this epic comeback!",
      category: "Bollywood",
      viewCount: BigInt(2400000),
      likeCount: BigInt(145000),
    },
    "sample-2": {
      title: "India vs Australia - Epic Last Over Finish | Cricket Highlights",
      description:
        "India's stunning victory in the final over against Australia. Virat Kohli's century and the breathtaking last over finish.",
      category: "Cricket",
      viewCount: BigInt(5600000),
      likeCount: BigInt(320000),
    },
    "sample-3": {
      title: "Mumbai Street Food Tour - Best Chaat, Vada Pav & More!",
      description:
        "Join us as we explore the legendary street food lanes of Mumbai - from Juhu Beach bhel puri to Dadar's famous vada pav.",
      category: "Food",
      viewCount: BigInt(890000),
      likeCount: BigInt(67000),
    },
    "sample-4": {
      title: "Zakir Khan Live - Sakht Launda Stand Up Comedy 2024",
      description:
        "Hilarious 45-minute stand-up set by India's favourite comedian Zakir Khan. Recorded live in Mumbai.",
      category: "Comedy",
      viewCount: BigInt(3200000),
      likeCount: BigInt(201000),
    },
    "sample-5": {
      title: "Raga Yaman - Pt. Ravi Shankar Sitar Masterclass",
      description:
        "A beautiful evening recital of Raga Yaman on sitar. Perfect for meditation and classical music lovers.",
      category: "Music",
      viewCount: BigInt(430000),
      likeCount: BigInt(38000),
    },
    "sample-6": {
      title: "Shri Ram Bhajan - Jai Shri Ram | Diwali Special",
      description:
        "Beautiful devotional bhajan celebrating Diwali with Ram's return to Ayodhya.",
      category: "Devotional",
      viewCount: BigInt(1700000),
      likeCount: BigInt(124000),
    },
  };

  const displayVideo = isSample ? SAMPLE_DATA[id] : video;
  if (!displayVideo)
    return (
      <div
        className="max-w-4xl mx-auto px-4 py-20 text-center"
        data-ocid="video.error_state"
      >
        <div className="text-5xl mb-4">😕</div>
        <h2 className="font-display text-xl font-bold mb-2">Video not found</h2>
        <p className="text-muted-foreground">
          This video may have been removed or doesn't exist.
        </p>
      </div>
    );

  const categoryBadgeClass: Record<string, string> = {
    Bollywood: "badge-bollywood",
    Cricket: "badge-cricket",
    Music: "badge-music",
    Comedy: "badge-comedy",
    Food: "badge-food",
    Devotional: "badge-devotional",
    News: "badge-news",
    Education: "badge-education",
    Entertainment: "badge-entertainment",
  };

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Video Player */}
          <div className="rounded-xl overflow-hidden bg-black aspect-video mb-4">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="w-full h-full"
                poster={thumbUrl || undefined}
              >
                <track kind="captions" />
              </video>
            ) : (
              <div
                className="w-full h-full flex items-center justify-center bg-foreground/90 relative"
                style={{
                  backgroundImage: thumbUrl ? `url(${thumbUrl})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
              >
                <div className="absolute inset-0 bg-black/50" />
                <div className="relative text-center text-white/70">
                  <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-3">
                    <div className="w-0 h-0 border-l-[24px] border-l-white border-t-[14px] border-t-transparent border-b-[14px] border-b-transparent ml-1" />
                  </div>
                  <p className="text-sm">Sample Preview</p>
                </div>
              </div>
            )}
          </div>

          {/* Video Info */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <h1 className="font-display font-bold text-xl leading-tight">
                {displayVideo.title}
              </h1>
              <span
                className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full border ${categoryBadgeClass[displayVideo.category] || "badge-entertainment"}`}
              >
                {displayVideo.category}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" />
                {formatCount(displayVideo.viewCount)} views
              </span>
              <Button
                data-ocid="video.like_button"
                variant="outline"
                size="sm"
                onClick={handleLike}
                disabled={likePending}
                className="flex items-center gap-1.5 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <ThumbsUp className="w-4 h-4" />
                {formatCount(displayVideo.likeCount)}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <Share2 className="w-4 h-4 mr-1" />
                Share
              </Button>
            </div>

            {/* Channel info */}
            <div className="flex items-center justify-between bg-muted/40 rounded-xl p-4 mb-4">
              <Link
                to="/channel/$principal"
                params={{ principal: video?.uploader?.toString() || "sample" }}
                className="flex items-center gap-3"
              >
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-secondary text-secondary-foreground font-bold">
                    {(channel?.username || "Ch").slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">
                    {channel?.username || "DesiTube Channel"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatCount(channel?.subscriberCount || BigInt(0))}{" "}
                    subscribers
                  </p>
                </div>
              </Link>
              <Button
                data-ocid="video.subscribe_button"
                onClick={handleSubscribe}
                disabled={subscribePending || subscribed}
                className={
                  subscribed
                    ? "bg-muted text-muted-foreground"
                    : "bg-primary hover:bg-saffron-dark text-primary-foreground"
                }
                size="sm"
              >
                {subscribed ? "Subscribed ✓" : "Subscribe"}
              </Button>
            </div>

            {/* Description */}
            <div className="bg-muted/30 rounded-xl p-4 mb-6">
              <p className="text-sm leading-relaxed text-foreground/80">
                {displayVideo.description}
              </p>
            </div>

            {/* Comments */}
            <div>
              <h2 className="font-display font-bold text-lg mb-4">
                Comments ({comments?.length || 0})
              </h2>

              {/* Add comment */}
              <form onSubmit={handleComment} className="flex gap-3 mb-6">
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarFallback className="bg-primary/20 text-primary text-xs">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    data-ocid="video.comment.input"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={
                      isAuthenticated
                        ? "Add a comment..."
                        : "Sign in to comment"
                    }
                    disabled={!isAuthenticated}
                    rows={2}
                    className="resize-none mb-2 text-sm"
                  />
                  <Button
                    data-ocid="video.comment.submit_button"
                    type="submit"
                    size="sm"
                    disabled={
                      commentPending || !commentText.trim() || !isAuthenticated
                    }
                    className="bg-primary hover:bg-saffron-dark text-primary-foreground"
                  >
                    <Send className="w-3.5 h-3.5 mr-1.5" />
                    {commentPending ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </form>

              {/* Comments list */}
              {commentsLoading ? (
                <div className="space-y-3">
                  {["s1", "s2", "s3"].map((k) => (
                    <Skeleton key={k} className="h-16 rounded-lg" />
                  ))}
                </div>
              ) : comments && comments.length > 0 ? (
                <div className="space-y-4">
                  {comments.map((comment, i) => (
                    <motion.div
                      key={comment.id}
                      data-ocid={`video.comment.item.${i + 1}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="flex gap-3"
                    >
                      <Avatar className="w-8 h-8 shrink-0">
                        <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                          {comment.commenter
                            .toString()
                            .slice(0, 2)
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="bg-muted/40 rounded-lg p-3 flex-1">
                        <p className="text-xs text-muted-foreground mb-1 font-medium">
                          {comment.commenter.toString().slice(0, 12)}...
                        </p>
                        <p className="text-sm">{comment.text}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div
                  data-ocid="video.comment.empty_state"
                  className="text-center py-8 text-muted-foreground"
                >
                  <p>No comments yet. Be the first to comment!</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar - More Videos placeholder */}
        <div className="hidden lg:block">
          <h3 className="font-display font-bold text-base mb-4">More Videos</h3>
          <div className="space-y-3">
            {Object.entries(SAMPLE_THUMB)
              .filter(([key]) => key !== id)
              .slice(0, 4)
              .map(([key, thumb]) => (
                <Link
                  key={key}
                  to="/video/$id"
                  params={{ id: key }}
                  className="flex gap-3 group"
                >
                  <div
                    className="w-32 h-18 rounded-lg overflow-hidden bg-muted shrink-0"
                    style={{ height: 70 }}
                  >
                    <img
                      src={thumb}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium line-clamp-2 group-hover:text-primary transition-colors">
                      {
                        {
                          "sample-1": "Pathaan Review",
                          "sample-2": "India vs Australia",
                          "sample-3": "Mumbai Street Food",
                          "sample-4": "Zakir Khan Comedy",
                          "sample-5": "Raga Yaman",
                          "sample-6": "Ram Bhajan",
                        }[key]
                      }
                    </p>
                  </div>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
}
