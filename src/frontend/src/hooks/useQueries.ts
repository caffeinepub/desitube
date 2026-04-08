import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ChannelProfile,
  Comment,
  Donation,
  Membership,
  MonetizationStatus,
  Tier,
  UserProfile,
  VideoMetadata,
} from "../backend.d";
import type { LiveChatMessage, LiveStream } from "../types/live";
import { useActor } from "./useActor";

export function useGetTrendingVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ["trending"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getTrendingVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAllVideos() {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ["allVideos"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllVideos();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetCategories() {
  const { actor, isFetching } = useActor();
  return useQuery<string[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCategories();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetVideosByCategory(category: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ["videosByCategory", category],
    queryFn: async () => {
      if (!actor || !category) return [];
      return actor.getVideosByCategory(category);
    },
    enabled: !!actor && !isFetching && !!category,
  });
}

export function useGetVideo(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata | null>({
    queryKey: ["video", videoId],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useGetComments(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Comment[]>({
    queryKey: ["comments", videoId],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getCommentsByVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useSearchVideos(keyword: string) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ["search", keyword],
    queryFn: async () => {
      if (!actor || !keyword.trim()) return [];
      return actor.searchVideos(keyword);
    },
    enabled: !!actor && !isFetching && !!keyword.trim(),
  });
}

export function useGetChannelProfile(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<ChannelProfile | null>({
    queryKey: ["channel", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getChannelProfile(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetVideosByUploader(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<VideoMetadata[]>({
    queryKey: ["uploaderVideos", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getVideosByUploader(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();
  const query = useQuery<UserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });
  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useAddComment(videoId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.addComment(videoId, text);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["comments", videoId] }),
  });
}

export function useToggleLike(videoId: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.toggleLike(videoId);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["video", videoId] }),
  });
}

export function useIncrementView(videoId: string) {
  const { actor } = useActor();
  return useMutation({
    mutationFn: async () => {
      if (!actor) return;
      return actor.incrementView(videoId);
    },
  });
}

export function useSubscribeChannel(uploader: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.subscribeChannel(Principal.fromText(uploader));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channel", uploader] }),
  });
}

export function useUnsubscribeChannel(uploader: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.unsubscribeChannel(Principal.fromText(uploader));
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["channel", uploader] }),
  });
}

export function useSaveProfile() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (profile: UserProfile) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["currentUserProfile"] }),
  });
}

export function useUploadVideo() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      title: string;
      description: string;
      category: string;
      thumbnailBlobId: string;
      videoBlobId: string;
    }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.uploadVideo(
        params.title,
        params.description,
        params.category,
        params.thumbnailBlobId,
        params.videoBlobId,
      );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["allVideos"] });
      qc.invalidateQueries({ queryKey: ["trending"] });
    },
  });
}

// --- Monetization ---

export function useGetMonetizationStatus(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<MonetizationStatus | null>({
    queryKey: ["monetizationStatus", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return actor.getMonetizationStatus(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useEnableMonetization() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.enableMonetization();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetizationStatus"] }),
  });
}

export function useDisableMonetization() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return actor.disableMonetization();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["monetizationStatus"] }),
  });
}

export function useGetMembershipTiers(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<Tier[]>({
    queryKey: ["membershipTiers", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getMembershipTiers(Principal.fromText(principal));
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

export function useSetMembershipTiers() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (tiers: Tier[]) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.setMembershipTiers(tiers);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["membershipTiers"] }),
  });
}

export function useJoinMembership() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      channel,
      tierName,
    }: { channel: Principal; tierName: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return actor.joinMembership(channel, tierName);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["myMemberships"] }),
  });
}

export function useGetMyMemberships() {
  const { actor, isFetching } = useActor();
  return useQuery<Membership[]>({
    queryKey: ["myMemberships"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getMyMemberships();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetDonationsByVideo(videoId: string) {
  const { actor, isFetching } = useActor();
  return useQuery<Donation[]>({
    queryKey: ["donations", videoId],
    queryFn: async () => {
      if (!actor || !videoId) return [];
      return actor.getDonationsByVideo(videoId);
    },
    enabled: !!actor && !isFetching && !!videoId,
  });
}

export function useGetDonationsByChannelVideos(videos: Array<{ id: string }>) {
  const { actor, isFetching } = useActor();
  return useQuery<Donation[]>({
    queryKey: ["channelDonations", videos.map((v) => v.id).join(",")],
    queryFn: async () => {
      if (!actor || videos.length === 0) return [];
      const results = await Promise.all(
        videos.map((v) => actor.getDonationsByVideo(v.id)),
      );
      return results.flat();
    },
    enabled: !!actor && !isFetching && videos.length > 0,
  });
}

// --- Live Streaming ---

export function useGetLiveStream(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<LiveStream | null>({
    queryKey: ["liveStream", principal],
    queryFn: async () => {
      if (!actor || !principal) return null;
      return (actor as any).getLiveStream(
        Principal.fromText(principal),
      ) as Promise<LiveStream | null>;
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 3000,
  });
}

export function useGetAllLiveStreams() {
  const { actor, isFetching } = useActor();
  return useQuery<LiveStream[]>({
    queryKey: ["allLiveStreams"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as any).getAllLiveStreams() as Promise<LiveStream[]>;
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 5000,
  });
}

export function useStartLiveStream() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      streamUrl,
    }: { title: string; streamUrl: string }) => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).startLiveStream(title, streamUrl) as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liveStream"] });
      qc.invalidateQueries({ queryKey: ["allLiveStreams"] });
    },
  });
}

export function useEndLiveStream() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).endLiveStream() as Promise<void>;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["liveStream"] });
      qc.invalidateQueries({ queryKey: ["allLiveStreams"] });
    },
  });
}

export function useGetLiveChatMessages(principal: string | undefined) {
  const { actor, isFetching } = useActor();
  return useQuery<LiveChatMessage[]>({
    queryKey: ["liveChatMessages", principal],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return (actor as any).getLiveChatMessages(
        Principal.fromText(principal),
      ) as Promise<LiveChatMessage[]>;
    },
    enabled: !!actor && !isFetching && !!principal,
    refetchInterval: 3000,
  });
}

export function useSendLiveChatMessage(channelPrincipal: string) {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (text: string) => {
      if (!actor) throw new Error("Not authenticated");
      return (actor as any).sendLiveChatMessage(
        Principal.fromText(channelPrincipal),
        text,
      ) as Promise<void>;
    },
    onSuccess: () =>
      qc.invalidateQueries({
        queryKey: ["liveChatMessages", channelPrincipal],
      }),
  });
}
