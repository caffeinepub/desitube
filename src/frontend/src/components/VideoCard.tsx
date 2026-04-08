import { Link } from "@tanstack/react-router";
import { Clock, Eye } from "lucide-react";
import type { VideoMetadata } from "../backend.d";
import { ExternalBlob } from "../blob-storage";

interface VideoCardProps {
  video: VideoMetadata;
  index?: number;
}

function formatViews(count: bigint): string {
  const n = Number(count);
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function timeAgo(timestamp: bigint): string {
  const ms = Number(timestamp) / 1_000_000;
  const diff = Date.now() - ms;
  const days = Math.floor(diff / 86400000);
  if (days > 365) return `${Math.floor(days / 365)}y ago`;
  if (days > 30) return `${Math.floor(days / 30)}mo ago`;
  if (days > 0) return `${days}d ago`;
  const hrs = Math.floor(diff / 3600000);
  if (hrs > 0) return `${hrs}h ago`;
  return "Just now";
}

function getCategoryClass(category: string): string {
  const map: Record<string, string> = {
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
  return map[category] || "badge-entertainment";
}

export default function VideoCard({ video, index = 1 }: VideoCardProps) {
  const thumbnailUrl = video.thumbnailBlobId
    ? ExternalBlob.fromURL(video.thumbnailBlobId).getDirectURL()
    : null;

  return (
    <Link
      to="/video/$id"
      params={{ id: video.id }}
      data-ocid={`home.video.item.${index}`}
      className="group block"
    >
      <article className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
        {/* Thumbnail */}
        <div className="relative aspect-video overflow-hidden bg-muted">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover video-card-thumb"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-primary/30 flex items-center justify-center">
                <div className="w-0 h-0 border-l-[16px] border-l-primary border-t-[10px] border-t-transparent border-b-[10px] border-b-transparent ml-1" />
              </div>
            </div>
          )}
          {/* Category badge */}
          <span
            className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${getCategoryClass(video.category)}`}
          >
            {video.category}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 text-card-foreground group-hover:text-primary transition-colors mb-1">
            {video.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span className="flex items-center gap-1">
              <Eye className="w-3 h-3" />
              {formatViews(video.viewCount)} views
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {timeAgo(video.createdAt)}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}
