import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { Play, Radio, TrendingUp } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import type { VideoMetadata } from "../backend.d";
import VideoCard from "../components/VideoCard";
import {
  useGetAllLiveStreams,
  useGetAllVideos,
  useGetTrendingVideos,
  useGetVideosByCategory,
} from "../hooks/useQueries";

const CATEGORIES = [
  "All",
  "Bollywood",
  "Cricket",
  "Music",
  "Comedy",
  "Food",
  "Devotional",
  "News",
  "Education",
  "Entertainment",
];

const SAMPLE_VIDEOS: VideoMetadata[] = [
  {
    id: "sample-1",
    title: "Pathaan Full Movie Review - Shah Rukh Khan is Back!",
    description:
      "Complete review of the blockbuster Pathaan featuring SRK at his finest.",
    category: "Bollywood",
    viewCount: BigInt(2400000),
    likeCount: BigInt(145000),
    createdAt: BigInt(Date.now() - 3 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
  {
    id: "sample-2",
    title: "India vs Australia - Epic Last Over Finish | Cricket Highlights",
    description:
      "India's stunning victory in the final over against Australia.",
    category: "Cricket",
    viewCount: BigInt(5600000),
    likeCount: BigInt(320000),
    createdAt: BigInt(Date.now() - 1 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
  {
    id: "sample-3",
    title: "Mumbai Street Food Tour - Best Chaat, Vada Pav & More!",
    description: "Exploring the legendary street food lanes of Mumbai.",
    category: "Food",
    viewCount: BigInt(890000),
    likeCount: BigInt(67000),
    createdAt: BigInt(Date.now() - 5 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
  {
    id: "sample-4",
    title: "Zakir Khan Live - Sakht Launda Stand Up Comedy 2024",
    description:
      "Hilarious stand up set by India's favourite comedian Zakir Khan.",
    category: "Comedy",
    viewCount: BigInt(3200000),
    likeCount: BigInt(201000),
    createdAt: BigInt(Date.now() - 10 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
  {
    id: "sample-5",
    title: "Raga Yaman - Pt. Ravi Shankar Sitar Masterclass",
    description:
      "Learn the intricacies of Raga Yaman from a classical sitar legend.",
    category: "Music",
    viewCount: BigInt(430000),
    likeCount: BigInt(38000),
    createdAt: BigInt(Date.now() - 20 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
  {
    id: "sample-6",
    title: "Shri Ram Bhajan - Jai Shri Ram | Diwali Special",
    description: "Beautiful devotional bhajan for Diwali celebrations.",
    category: "Devotional",
    viewCount: BigInt(1700000),
    likeCount: BigInt(124000),
    createdAt: BigInt(Date.now() - 7 * 86400000) * BigInt(1_000_000),
    videoBlobId: "",
    thumbnailBlobId: "",
    uploader: { toString: () => "sample" } as any,
  },
];

const SAMPLE_THUMBS: Record<string, string> = {
  "sample-1": "/assets/generated/thumb-bollywood.dim_640x360.jpg",
  "sample-2": "/assets/generated/thumb-cricket.dim_640x360.jpg",
  "sample-3": "/assets/generated/thumb-food.dim_640x360.jpg",
  "sample-4": "/assets/generated/thumb-comedy.dim_640x360.jpg",
  "sample-5": "/assets/generated/thumb-music.dim_640x360.jpg",
  "sample-6": "/assets/generated/thumb-devotional.dim_640x360.jpg",
};

function VideoCardWithSample({
  video,
  index,
}: { video: VideoMetadata; index: number }) {
  const sampleThumb = SAMPLE_THUMBS[video.id];
  return (
    <Link
      to="/video/$id"
      params={{ id: video.id }}
      data-ocid={`home.video.item.${index}`}
      className="group block"
    >
      <article className="bg-card rounded-xl overflow-hidden shadow-card hover:shadow-glow transition-all duration-300 hover:-translate-y-0.5">
        <div className="relative aspect-video overflow-hidden bg-muted">
          <img
            src={
              sampleThumb || "/assets/generated/thumb-bollywood.dim_640x360.jpg"
            }
            alt={video.title}
            className="w-full h-full object-cover video-card-thumb"
            loading="lazy"
          />
          <span
            className={`absolute top-2 left-2 text-xs font-semibold px-2 py-0.5 rounded-full border ${
              {
                Bollywood: "badge-bollywood",
                Cricket: "badge-cricket",
                Music: "badge-music",
                Comedy: "badge-comedy",
                Food: "badge-food",
                Devotional: "badge-devotional",
                News: "badge-news",
                Education: "badge-education",
                Entertainment: "badge-entertainment",
              }[video.category] || "badge-entertainment"
            }`}
          >
            {video.category}
          </span>
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-white/0 group-hover:bg-white/90 transition-all flex items-center justify-center">
              <Play className="w-5 h-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity ml-0.5" />
            </div>
          </div>
        </div>
        <div className="p-3">
          <h3 className="font-display font-semibold text-sm leading-snug line-clamp-2 text-card-foreground group-hover:text-primary transition-colors mb-1">
            {video.title}
          </h3>
          <div className="flex items-center justify-between text-xs text-muted-foreground mt-2">
            <span>{Number(video.viewCount).toLocaleString("en-IN")} views</span>
            <span>
              {Math.floor(
                (Date.now() - Number(video.createdAt) / 1_000_000) / 86400000,
              )}
              d ago
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default function HomePage() {
  const [activeCategory, setActiveCategory] = useState("All");
  const { data: trendingVideos, isLoading: trendingLoading } =
    useGetTrendingVideos();
  const { data: allVideos, isLoading: allLoading } = useGetAllVideos();
  const { data: categoryVideos, isLoading: categoryLoading } =
    useGetVideosByCategory(activeCategory !== "All" ? activeCategory : "");
  const { data: liveStreams } = useGetAllLiveStreams();

  const activeLiveStreams = liveStreams?.filter((s) => s.isLive) || [];

  const displayVideos =
    activeCategory === "All"
      ? allVideos && allVideos.length > 0
        ? allVideos
        : SAMPLE_VIDEOS
      : categoryVideos && categoryVideos.length > 0
        ? categoryVideos
        : SAMPLE_VIDEOS.filter((v) => v.category === activeCategory);

  const heroVideos =
    trendingVideos && trendingVideos.length > 0
      ? trendingVideos
      : SAMPLE_VIDEOS;
  const heroVideo = heroVideos[0];

  return (
    <main>
      {/* Hero Banner */}
      <section
        className="relative overflow-hidden bg-foreground"
        style={{ minHeight: 360 }}
      >
        <img
          src="/assets/generated/desi-hero-banner.dim_1400x400.jpg"
          alt="DesiTube Hero"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="hero-overlay absolute inset-0" />
        <div className="relative max-w-[1400px] mx-auto px-4 py-16 md:py-24">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1 rounded-full mb-4">
              <TrendingUp className="w-3 h-3" />
              TRENDING NOW
            </div>
            <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-3 max-w-2xl">
              {heroVideo?.title || "Discover the Best Indian Content"}
            </h1>
            <p className="text-white/80 text-base mb-6 max-w-lg">
              Watch, share, and celebrate the best of India — Bollywood,
              Cricket, Music & more
            </p>
            {heroVideo && (
              <Link
                to="/video/$id"
                params={{ id: heroVideo.id }}
                className="inline-flex items-center gap-2 bg-primary hover:bg-saffron-dark text-primary-foreground font-semibold px-6 py-3 rounded-full transition-colors shadow-glow"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Now
              </Link>
            )}
          </motion.div>
        </div>
      </section>

      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Live Now Section */}
        {activeLiveStreams.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
            data-ocid="home.live.section"
          >
            <h2 className="font-display font-bold text-xl flex items-center gap-2 mb-5">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <Radio className="w-5 h-5 text-red-500" />
              Live Now
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {activeLiveStreams.map((stream, i) => (
                <motion.div
                  key={stream.channel.toString()}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.07 }}
                  data-ocid={`home.live.item.${i + 1}`}
                  className="shrink-0 w-64 bg-card rounded-xl overflow-hidden shadow-card border border-red-500/30"
                >
                  <div className="relative aspect-video bg-gradient-to-br from-red-900/50 to-orange-900/50 flex items-center justify-center">
                    <Radio className="w-10 h-10 text-red-400 opacity-50" />
                    <Badge className="absolute top-2 left-2 bg-red-600 text-white text-xs animate-pulse">
                      🔴 LIVE
                    </Badge>
                  </div>
                  <div className="p-3">
                    <p className="font-semibold text-sm line-clamp-1 mb-2">
                      {stream.title}
                    </p>
                    <Link
                      to="/live/$principal"
                      params={{ principal: stream.channel.toString() }}
                    >
                      <Button
                        size="sm"
                        className="w-full bg-red-600 hover:bg-red-700 text-white text-xs"
                        data-ocid={`home.live.button.${i + 1}`}
                      >
                        <Play className="w-3 h-3 mr-1 fill-current" />
                        Watch Live
                      </Button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Category Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-8 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              type="button"
              key={cat}
              data-ocid="home.category.tab"
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-all border ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary shadow-glow"
                  : "bg-card text-muted-foreground border-border hover:border-primary hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Trending Section */}
        {activeCategory === "All" && (
          <section className="mb-10">
            <h2 className="font-display font-bold text-xl flex items-center gap-2 mb-5">
              <TrendingUp className="w-5 h-5 text-primary" />
              Trending on DesiTube
            </h2>
            {trendingLoading ? (
              <div
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                data-ocid="home.loading_state"
              >
                {["s1", "s2", "s3", "s4"].map((k) => (
                  <Skeleton key={k} className="aspect-video rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {(trendingVideos && trendingVideos.length > 0
                  ? trendingVideos
                  : SAMPLE_VIDEOS.slice(0, 4)
                ).map((video, i) =>
                  video.thumbnailBlobId ? (
                    <VideoCard key={video.id} video={video} index={i + 1} />
                  ) : (
                    <VideoCardWithSample
                      key={video.id}
                      video={video}
                      index={i + 1}
                    />
                  ),
                )}
              </div>
            )}
          </section>
        )}

        {/* All/Category Videos */}
        <section>
          <h2 className="font-display font-bold text-xl mb-5">
            {activeCategory === "All"
              ? "All Videos"
              : `${activeCategory} Videos`}
          </h2>
          {allLoading || categoryLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
                <Skeleton key={k} className="aspect-video rounded-xl" />
              ))}
            </div>
          ) : displayVideos.length === 0 ? (
            <div
              data-ocid="home.empty_state"
              className="text-center py-20 text-muted-foreground"
            >
              <div className="text-5xl mb-4">🎬</div>
              <p className="text-lg font-medium">
                No videos yet in this category
              </p>
              <p className="text-sm mt-1">Be the first to upload!</p>
            </div>
          ) : (
            <motion.div
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.06 } },
                hidden: {},
              }}
            >
              {displayVideos.map((video, i) => (
                <motion.div
                  key={video.id}
                  variants={{
                    hidden: { opacity: 0, y: 16 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  {video.thumbnailBlobId ? (
                    <VideoCard video={video} index={i + 1} />
                  ) : (
                    <VideoCardWithSample video={video} index={i + 1} />
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
        </section>
      </div>
    </main>
  );
}
