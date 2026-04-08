import { Flame, Heart } from "lucide-react";

export default function Footer() {
  const year = new Date().getFullYear();
  const href = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="border-t border-border bg-card mt-16">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
              <Flame className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg">
              Desi<span className="text-desi-green">Tube</span>
            </span>
            <span className="text-muted-foreground text-sm">
              — Your Desi Video Destination
            </span>
          </div>
          <p className="text-muted-foreground text-sm flex items-center gap-1">
            © {year}. Built with{" "}
            <Heart className="w-3.5 h-3.5 text-primary fill-primary" /> using{" "}
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              caffeine.ai
            </a>
          </p>
        </div>
        <div className="mt-4 pt-4 border-t border-border flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
          {[
            "Bollywood",
            "Cricket",
            "Music",
            "Comedy",
            "Food",
            "Devotional",
            "News",
            "Education",
          ].map((cat) => (
            <span
              key={cat}
              className="hover:text-primary cursor-pointer transition-colors"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>
    </footer>
  );
}
