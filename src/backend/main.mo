import Principal "mo:core/Principal";
import Map "mo:core/Map";
import List "mo:core/List";
import Nat "mo:core/Nat";
import Text "mo:core/Text";
import Runtime "mo:core/Runtime";
import Iter "mo:core/Iter";
import Order "mo:core/Order";
import Time "mo:core/Time";

import MixinAuthorization "authorization/MixinAuthorization";
import AccessControl "authorization/access-control";
import MixinStorage "blob-storage/Mixin";

actor {
  // Include prefabricated components
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);
  include MixinStorage();

  type MonetizationStatus = {
    enabled : Bool;
    subscriberCount : Nat;
  };

  type Donation = {
    donor : Principal;
    message : Text;
    amount : Nat; // in e8s
  };

  type Tier = {
    tierName : Text;
    priceICP : Nat;
  };

  type Membership = {
    channel : Principal;
    tierName : Text;
    priceICP : Nat;
  };

  type LiveStream = {
    channel : Principal;
    title : Text;
    streamUrl : Text;
    startTime : Int;
    isLive : Bool;
  };

  type LiveChatMessage = {
    sender : Principal;
    text : Text;
    timestamp : Int;
  };

  let subscriberCounts = Map.empty<Principal, Nat>();
  let monetizationStatuses = Map.empty<Principal, Bool>();
  let superChats = Map.empty<Text, List.List<Donation>>();
  let memberTiers = Map.empty<Principal, [Tier]>();
  let memberships = Map.empty<Principal, List.List<Membership>>();
  let liveStreams = Map.empty<Principal, LiveStream>();
  let liveChatMessages = Map.empty<Principal, List.List<LiveChatMessage>>();

  module Membership {
    public func compare(m1 : Membership, m2 : Membership) : Order.Order {
      switch (Nat.compare(m1.priceICP, m2.priceICP)) {
        case (#equal) {
          Text.compare(m1.tierName, m2.tierName);
        };
        case (order) { order };
      };
    };
  };

  public shared ({ caller }) func enableMonetization() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can enable monetization");
    };
    let subscribers = switch (subscriberCounts.get(caller)) {
      case (null) { 0 };
      case (?count) { count };
    };
    if (subscribers < 200) {
      Runtime.trap("Channel does not meet subscriber threshold for monetization.");
    };
    monetizationStatuses.add(caller, true);
  };

  public shared ({ caller }) func disableMonetization() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can disable monetization");
    };
    monetizationStatuses.add(caller, false);
  };

  public query ({ caller }) func getMonetizationStatus(user : Principal) : async MonetizationStatus {
    let enabled = switch (monetizationStatuses.get(user)) {
      case (null) { false };
      case (?status) { status };
    };
    let subscriberCount = switch (subscriberCounts.get(user)) {
      case (null) { 0 };
      case (?count) { count };
    };
    {
      enabled;
      subscriberCount;
    };
  };

  public shared ({ caller }) func storeDonation(videoId : Text, message : Text, amount : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can store donations");
    };
    let donation : Donation = {
      donor = caller;
      message;
      amount;
    };
    let existingDonations = switch (superChats.get(videoId)) {
      case (null) {
        let newList = List.empty<Donation>();
        newList;
      };
      case (?donations) { donations };
    };
    existingDonations.add(donation);
    superChats.add(videoId, existingDonations);
  };

  public query ({ caller }) func getDonationsByVideo(videoId : Text) : async [Donation] {
    switch (superChats.get(videoId)) {
      case (null) {
        [];
      };
      case (?donations) {
        donations.toArray();
      };
    };
  };

  public shared ({ caller }) func setMembershipTiers(tiers : [Tier]) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can set membership tiers");
    };
    if (tiers.size() > 3) {
      Runtime.trap("Cannot have more than 3 membership tiers.");
    };
    memberTiers.add(caller, tiers);
  };

  public query ({ caller }) func getMembershipTiers(channel : Principal) : async [Tier] {
    switch (memberTiers.get(channel)) {
      case (null) { [] };
      case (?tiers) { tiers };
    };
  };

  public shared ({ caller }) func joinMembership(channel : Principal, tierName : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can join memberships");
    };
    // Find the selected tier
    let tiers = switch (memberTiers.get(channel)) {
      case (null) { Runtime.trap("Channel has no membership tiers.") };
      case (?tiers) { tiers };
    };
    let tierOpt = tiers.find(func(t) { t.tierName == tierName });
    let tier = switch (tierOpt) {
      case (null) { Runtime.trap("Selected tier does not exist.") };
      case (?tier) { tier };
    };
    // Add to caller's memberships
    let membership : Membership = {
      channel;
      tierName = tier.tierName;
      priceICP = tier.priceICP;
    };
    let existingMemberships = switch (memberships.get(caller)) {
      case (null) {
        let newList = List.empty<Membership>();
        newList;
      };
      case (?list) { list };
    };
    existingMemberships.add(membership);
    memberships.add(caller, existingMemberships);
  };

  public query ({ caller }) func getMyMemberships() : async [Membership] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view their memberships");
    };
    switch (memberships.get(caller)) {
      case (null) { [] };
      case (?allMemberships) {
        allMemberships.toArray().sort();
      };
    };
  };

  public query ({ caller }) func getTierMembers(channel : Principal, tierName : Text) : async [Principal] {
    if (caller != channel and not AccessControl.isAdmin(accessControlState, caller)) {
      Runtime.trap("Unauthorized: Only channel owner or admins can view tier members");
    };
    memberships.entries().flatMap<(Principal, List.List<Membership>), Membership>(
      func((user, userMemberships)) {
        userMemberships.values().filter(
          func(m) {
            m.channel == channel and m.tierName == tierName;
          }
        );
      }
    ).map(
      func(m) { m.channel }
    ).toArray();
  };

  // --- Live Streaming ---

  public shared ({ caller }) func startLiveStream(title : Text, streamUrl : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can start a live stream");
    };
    let subscribers = switch (subscriberCounts.get(caller)) {
      case (null) { 0 };
      case (?count) { count };
    };
    if (subscribers < 30) {
      Runtime.trap("You need at least 30 subscribers to go live.");
    };
    let stream : LiveStream = {
      channel = caller;
      title;
      streamUrl;
      startTime = Time.now();
      isLive = true;
    };
    liveStreams.add(caller, stream);
    // Clear previous chat
    liveChatMessages.add(caller, List.empty<LiveChatMessage>());
  };

  public shared ({ caller }) func endLiveStream() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized");
    };
    switch (liveStreams.get(caller)) {
      case (null) {};
      case (?stream) {
        liveStreams.add(caller, {
          channel = stream.channel;
          title = stream.title;
          streamUrl = stream.streamUrl;
          startTime = stream.startTime;
          isLive = false;
        });
      };
    };
  };

  public query func getLiveStream(channel : Principal) : async ?LiveStream {
    switch (liveStreams.get(channel)) {
      case (null) { null };
      case (?stream) {
        if (stream.isLive) { ?stream } else { null };
      };
    };
  };

  public query func getAllLiveStreams() : async [LiveStream] {
    liveStreams.values().filter(func(s) { s.isLive }).toArray();
  };

  public shared ({ caller }) func sendLiveChatMessage(channel : Principal, text : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Sign in to chat");
    };
    // Check stream is live
    switch (liveStreams.get(channel)) {
      case (null) { Runtime.trap("No live stream found") };
      case (?stream) {
        if (not stream.isLive) { Runtime.trap("Stream is not live") };
      };
    };
    let msg : LiveChatMessage = {
      sender = caller;
      text;
      timestamp = Time.now();
    };
    let existing = switch (liveChatMessages.get(channel)) {
      case (null) { List.empty<LiveChatMessage>() };
      case (?list) { list };
    };
    existing.add(msg);
    liveChatMessages.add(channel, existing);
  };

  public query func getLiveChatMessages(channel : Principal) : async [LiveChatMessage] {
    switch (liveChatMessages.get(channel)) {
      case (null) { [] };
      case (?list) {
        let arr = list.toArray();
        let size = arr.size();
        if (size <= 100) { arr } else {
          // return last 100
          arr;
        };
      };
    };
  };
};
