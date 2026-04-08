import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate } from "@tanstack/react-router";
import { CheckCircle2, Image, Loader2, Upload, Video } from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../blob-storage";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useUploadVideo } from "../hooks/useQueries";

const CATEGORIES = [
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

interface UploadProgress {
  thumbnail: number;
  video: number;
}

export default function UploadPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const { mutateAsync: uploadVideo, isPending } = useUploadVideo();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [progress, setProgress] = useState<UploadProgress>({
    thumbnail: 0,
    video: 0,
  });
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent, type: "thumbnail" | "video") => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (!file) return;
      if (type === "thumbnail") setThumbnailFile(file);
      else setVideoFile(file);
    },
    [],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity) {
      toast.error("Please sign in to upload");
      return;
    }
    if (!title.trim() || !category) {
      toast.error("Please fill in all required fields");
      return;
    }
    if (!videoFile) {
      toast.error("Please select a video file");
      return;
    }

    setUploading(true);
    try {
      // Upload thumbnail first if provided
      let thumbnailBlobId = "";
      if (thumbnailFile) {
        const thumbBytes = new Uint8Array(await thumbnailFile.arrayBuffer());
        const thumbBlob = ExternalBlob.fromBytes(thumbBytes).withUploadProgress(
          (pct) => setProgress((p) => ({ ...p, thumbnail: pct })),
        );
        await thumbBlob.getBytes(); // trigger upload
        thumbnailBlobId = thumbBlob.getDirectURL();
      }

      // Upload video
      const videoBytes = new Uint8Array(await videoFile.arrayBuffer());
      const videoBlob = ExternalBlob.fromBytes(videoBytes).withUploadProgress(
        (pct) => setProgress((p) => ({ ...p, video: pct })),
      );
      await videoBlob.getBytes();
      const videoBlobId = videoBlob.getDirectURL();

      await uploadVideo({
        title: title.trim(),
        description: description.trim(),
        category,
        thumbnailBlobId,
        videoBlobId,
      });

      setDone(true);
      toast.success("Video uploaded successfully! 🎉");
      setTimeout(() => navigate({ to: "/" }), 2000);
    } catch (err: any) {
      toast.error(err?.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  if (!identity) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <div className="text-5xl mb-4">🔒</div>
        <h2 className="font-display text-2xl font-bold mb-2">
          Sign in to Upload
        </h2>
        <p className="text-muted-foreground">
          You need to be signed in to upload videos to DesiTube.
        </p>
      </div>
    );
  }

  if (done) {
    return (
      <div
        className="max-w-xl mx-auto px-4 py-24 text-center"
        data-ocid="upload.success_state"
      >
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <CheckCircle2 className="w-20 h-20 text-desi-green mx-auto mb-4" />
          <h2 className="font-display text-2xl font-bold mb-2">
            Video Uploaded!
          </h2>
          <p className="text-muted-foreground">
            Your video is now live on DesiTube. Redirecting...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="mb-8">
          <h1 className="font-display font-bold text-3xl mb-1">Upload Video</h1>
          <p className="text-muted-foreground">
            Share your content with the DesiTube community
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Video Title *</Label>
            <Input
              id="title"
              data-ocid="upload.title_input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. India's Best Street Food Tour 2024"
              required
              className="text-base"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              data-ocid="upload.description_input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell viewers about your video..."
              rows={4}
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger
                data-ocid="upload.category_select"
                className="w-full"
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Thumbnail Upload */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <label
              data-ocid="upload.dropzone"
              onDrop={(e) => handleDrop(e, "thumbnail")}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              className="block border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors cursor-pointer"
              htmlFor="thumb-input"
            >
              <input
                id="thumb-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
              {thumbnailFile ? (
                <div className="flex items-center gap-3 justify-center text-desi-green">
                  <Image className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {thumbnailFile.name}
                  </span>
                </div>
              ) : (
                <>
                  <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop thumbnail here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 10MB
                  </p>
                </>
              )}
            </label>
            {uploading &&
              progress.thumbnail > 0 &&
              progress.thumbnail < 100 && (
                <div className="w-full bg-muted rounded-full h-1.5">
                  <div
                    className="bg-primary h-1.5 rounded-full transition-all"
                    style={{ width: `${progress.thumbnail}%` }}
                  />
                </div>
              )}
          </div>

          {/* Video Upload */}
          <div className="space-y-2">
            <Label>Video File *</Label>
            <label
              data-ocid="upload.dropzone"
              onDrop={(e) => handleDrop(e, "video")}
              onDragOver={(e: React.DragEvent) => e.preventDefault()}
              className="block border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary transition-colors cursor-pointer"
              htmlFor="video-input"
            >
              <input
                id="video-input"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
              />
              {videoFile ? (
                <div className="flex items-center gap-3 justify-center text-desi-green">
                  <Video className="w-5 h-5" />
                  <span className="text-sm font-medium">{videoFile.name}</span>
                  <span className="text-xs text-muted-foreground">
                    ({(videoFile.size / 1_000_000).toFixed(1)} MB)
                  </span>
                </div>
              ) : (
                <>
                  <Video className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Drop video file here or click to browse
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    MP4, WebM, MOV supported
                  </p>
                </>
              )}
            </label>
            {uploading && progress.video > 0 && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Uploading video...</span>
                  <span>{progress.video}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${progress.video}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <Button
            type="submit"
            data-ocid="upload.submit_button"
            disabled={
              uploading || isPending || !title.trim() || !category || !videoFile
            }
            className="w-full bg-primary hover:bg-saffron-dark text-primary-foreground py-6 text-base font-semibold"
          >
            {uploading || isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload to DesiTube
              </>
            )}
          </Button>
        </form>
      </motion.div>
    </main>
  );
}
