import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Donation {
    message: string;
    amount: bigint;
    donor: Principal;
}
export interface MonetizationStatus {
    enabled: boolean;
    subscriberCount: bigint;
}
export interface Membership {
    tierName: string;
    priceICP: bigint;
    channel: Principal;
}
export interface Tier {
    tierName: string;
    priceICP: bigint;
}
export interface VideoMetadata {
    id: string;
    title: string;
    description: string;
    category: string;
    uploader: Principal;
    thumbnailBlobId: string;
    videoBlobId: string;
    viewCount: bigint;
    likeCount: bigint;
    createdAt: bigint;
}
export interface ChannelProfile {
    username: string;
    bio: string;
    subscriberCount: bigint;
}
export interface Comment {
    id: string;
    videoId: string;
    commenter: Principal;
    text: string;
    createdAt: bigint;
}
export interface UserProfile {
    username: string;
    bio: string;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    disableMonetization(): Promise<void>;
    enableMonetization(): Promise<void>;
    getCallerUserRole(): Promise<UserRole>;
    getDonationsByVideo(videoId: string): Promise<Array<Donation>>;
    getMembershipTiers(channel: Principal): Promise<Array<Tier>>;
    getMonetizationStatus(user: Principal): Promise<MonetizationStatus>;
    getMyMemberships(): Promise<Array<Membership>>;
    getTierMembers(channel: Principal, tierName: string): Promise<Array<Principal>>;
    isCallerAdmin(): Promise<boolean>;
    joinMembership(channel: Principal, tierName: string): Promise<void>;
    setMembershipTiers(tiers: Array<Tier>): Promise<void>;
    storeDonation(videoId: string, message: string, amount: bigint): Promise<void>;
    getAllVideos(): Promise<Array<VideoMetadata>>;
    getTrendingVideos(): Promise<Array<VideoMetadata>>;
    getVideo(videoId: string): Promise<VideoMetadata | null>;
    getVideosByCategory(category: string): Promise<Array<VideoMetadata>>;
    getVideosByUploader(uploader: Principal): Promise<Array<VideoMetadata>>;
    getCategories(): Promise<Array<string>>;
    incrementView(videoId: string): Promise<void>;
    toggleLike(videoId: string): Promise<void>;
    searchVideos(keyword: string): Promise<Array<VideoMetadata>>;
    addComment(videoId: string, text: string): Promise<void>;
    getCommentsByVideo(videoId: string): Promise<Array<Comment>>;
    getChannelProfile(user: Principal): Promise<ChannelProfile | null>;
    updateChannelProfile(username: string, bio: string): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    subscribeChannel(uploader: Principal): Promise<void>;
    unsubscribeChannel(uploader: Principal): Promise<void>;
    uploadVideo(title: string, description: string, category: string, thumbnailBlobId: string, videoBlobId: string): Promise<void>;
}
