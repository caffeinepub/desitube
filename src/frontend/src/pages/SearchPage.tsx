import { Skeleton } from "@/components/ui/skeleton";
import { useSearch } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { motion } from "motion/react";
import VideoCard from "../components/VideoCard";
import { useSearchVideos } from "../hooks/useQueries";

export default function SearchPage() {
  const { q } = useSearch({ from: "/search" });
  const { data: results, isLoading } = useSearchVideos(q || "");

  return (
    <main className="max-w-[1400px] mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <SearchIcon className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-2xl">Search Results</h1>
        </div>
        <p className="text-muted-foreground">
          {q ? (
            <>
              Results for{" "}
              <span className="font-semibold text-foreground">"{q}"</span>
            </>
          ) : (
            "Enter a search term to find videos"
          )}
        </p>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          data-ocid="search.loading_state"
        >
          {["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"].map((k) => (
            <Skeleton key={k} className="aspect-video rounded-xl" />
          ))}
        </div>
      ) : !q ? null : results && results.length > 0 ? (
        <motion.div
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.06 } },
            hidden: {},
          }}
        >
          {results.map((video, i) => (
            <motion.div
              key={video.id}
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0 },
              }}
              data-ocid={`search.video.item.${i + 1}`}
            >
              <VideoCard video={video} index={i + 1} />
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div data-ocid="search.empty_state" className="text-center py-24">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="font-display text-xl font-bold mb-2">
            No results found
          </h2>
          <p className="text-muted-foreground">
            Try different keywords or browse categories on the home page
          </p>
        </div>
      )}
    </main>
  );
}
