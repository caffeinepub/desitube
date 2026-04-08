import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Principal } from "@icp-sdk/core/principal";
import {
  Crown,
  Gift,
  IndianRupee,
  Loader2,
  Lock,
  Sparkles,
  TrendingUp,
  Tv2,
  Zap,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  useDisableMonetization,
  useEnableMonetization,
  useGetDonationsByChannelVideos,
  useGetMembershipTiers,
  useGetMonetizationStatus,
  useJoinMembership,
  useSetMembershipTiers,
} from "../hooks/useQueries";

const TIER_COLORS = [
  {
    border: "from-yellow-400 to-amber-500",
    bg: "bg-amber-50",
    icon: "🥇",
    label: "Gold",
  },
  {
    border: "from-slate-300 to-slate-400",
    bg: "bg-slate-50",
    icon: "🥈",
    label: "Silver",
  },
  {
    border: "from-amber-600 to-orange-700",
    bg: "bg-orange-50",
    icon: "🥉",
    label: "Bronze",
  },
];

interface TierInput {
  tierName: string;
  priceICP: string;
}

interface MonetizationTabProps {
  principal: string;
  isOwnChannel: boolean;
  videos: Array<{ id: string; title: string }> | undefined;
}

export default function MonetizationTab({
  principal,
  isOwnChannel,
  videos,
}: MonetizationTabProps) {
  const principalObj = (() => {
    try {
      return Principal.fromText(principal);
    } catch {
      return null;
    }
  })();

  const { data: status, isLoading: statusLoading } =
    useGetMonetizationStatus(principal);
  const { data: tiers, isLoading: tiersLoading } =
    useGetMembershipTiers(principal);
  const { data: donations } = useGetDonationsByChannelVideos(videos || []);

  const { mutateAsync: enableMon, isPending: enabling } =
    useEnableMonetization();
  const { mutateAsync: disableMon, isPending: disabling } =
    useDisableMonetization();
  const { mutateAsync: saveTiers, isPending: savingTiers } =
    useSetMembershipTiers();
  const { mutateAsync: joinMembership, isPending: joiningMembership } =
    useJoinMembership();

  const [tierInputs, setTierInputs] = useState<TierInput[]>([
    { tierName: "", priceICP: "" },
    { tierName: "", priceICP: "" },
    { tierName: "", priceICP: "" },
  ]);
  const [joiningTier, setJoiningTier] = useState<string | null>(null);

  // Sync tier inputs with loaded tiers
  useEffect(() => {
    if (tiers && tiers.length > 0) {
      const filled = tiers.slice(0, 3).map((t) => ({
        tierName: t.tierName,
        priceICP: String(t.priceICP),
      }));
      const padded = [
        ...filled,
        ...Array(3 - filled.length).fill({ tierName: "", priceICP: "" }),
      ];
      setTierInputs(padded.slice(0, 3));
    }
  }, [tiers]);

  const subscriberCount = status ? Number(status.subscriberCount) : 0;
  const isUnlocked = subscriberCount >= 200;
  const progressPct = Math.min((subscriberCount / 200) * 100, 100);

  const handleToggleMonetization = async () => {
    if (!status) return;
    try {
      if (status.enabled) {
        await disableMon();
        toast.success("Monetization disabled");
      } else {
        await enableMon();
        toast.success("Monetization enabled! 🎉");
      }
    } catch {
      toast.error("Failed to update monetization");
    }
  };

  const handleSaveTiers = async () => {
    const validTiers = tierInputs
      .filter((t) => t.tierName.trim() && t.priceICP.trim())
      .map((t) => ({
        tierName: t.tierName.trim(),
        priceICP:
          BigInt(Math.round(Number.parseFloat(t.priceICP) * 100)) / BigInt(100),
      }));
    if (validTiers.length === 0) {
      toast.error("Add at least one tier");
      return;
    }
    try {
      await saveTiers(validTiers);
      toast.success("Membership tiers saved! 💎");
    } catch {
      toast.error("Failed to save tiers");
    }
  };

  const handleJoinTier = async (tierName: string, _idx: number) => {
    if (!principalObj) return;
    setJoiningTier(tierName);
    try {
      await joinMembership({ channel: principalObj, tierName });
      toast.success(`Joined ${tierName} tier! 🎊`);
    } catch {
      toast.error("Failed to join membership");
    } finally {
      setJoiningTier(null);
    }
  };

  if (statusLoading) {
    return (
      <div
        data-ocid="channel.monetization.loading_state"
        className="py-16 text-center"
      >
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary opacity-60" />
      </div>
    );
  }

  // --- Viewer: see tiers to join ---
  if (!isOwnChannel) {
    if (!status?.enabled || !tiers || tiers.length === 0) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-6"
      >
        <h2 className="font-display font-bold text-xl mb-4 flex items-center gap-2">
          <Crown className="w-5 h-5 text-primary" />
          Channel Memberships
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {tiers.map((tier, i) => {
            const style = TIER_COLORS[i % TIER_COLORS.length];
            return (
              <div
                key={tier.tierName}
                data-ocid={`channel.monetization.tier.card.${i + 1}`}
                className={`relative rounded-2xl p-[2px] bg-gradient-to-br ${style.border}`}
              >
                <div
                  className={`rounded-2xl ${style.bg} p-5 h-full flex flex-col gap-3`}
                >
                  <div className="text-2xl">{style.icon}</div>
                  <div>
                    <p className="font-display font-bold text-lg">
                      {tier.tierName}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <IndianRupee className="w-3 h-3" />
                      {String(tier.priceICP)} ICP / month
                    </p>
                  </div>
                  <Button
                    data-ocid={`channel.monetization.join_button.${i + 1}`}
                    size="sm"
                    className="mt-auto bg-primary hover:bg-primary/90 text-primary-foreground"
                    disabled={
                      joiningMembership && joiningTier === tier.tierName
                    }
                    onClick={() => handleJoinTier(tier.tierName, i)}
                  >
                    {joiningMembership && joiningTier === tier.tierName ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    Join
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // --- Owner: Locked state ---
  if (!isUnlocked) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto mt-8"
      >
        <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
          {/* Decorative top bar */}
          <div className="h-1.5 bg-gradient-to-r from-primary/30 via-primary/60 to-primary/30" />

          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="font-display font-bold text-2xl mb-1">
              Monetization Locked
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              Bas thoda aur! Get <strong>200 subscribers</strong> to unlock
              monetization 🎉
            </p>

            {/* Progress */}
            <div className="mb-2 flex justify-between text-sm font-medium">
              <span>{subscriberCount} subscribers</span>
              <span className="text-muted-foreground">200 needed</span>
            </div>
            <div className="relative h-3 rounded-full bg-muted overflow-hidden mb-6">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: "oklch(0.68 0.21 47)",
                }}
                initial={{ width: 0 }}
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 1.2, ease: "easeOut" }}
              />
            </div>
            <p className="text-xs text-muted-foreground mb-8">
              {200 - subscriberCount} more subscribers to go!
            </p>

            {/* Unlock benefits */}
            <div className="text-left space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Unlock karo ye features:
              </p>
              {[
                {
                  icon: Zap,
                  label: "Super Chat",
                  desc: "Receive highlighted donations during live streams",
                },
                {
                  icon: Crown,
                  label: "Channel Memberships",
                  desc: "Offer paid tiers to your superfans",
                },
                {
                  icon: TrendingUp,
                  label: "Ad Revenue",
                  desc: "Earn from ads shown on your videos",
                },
              ].map(({ icon: Icon, label, desc }) => (
                <div
                  key={label}
                  className="flex items-start gap-3 p-3 rounded-xl bg-muted/60"
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{label}</p>
                    <p className="text-xs text-muted-foreground">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // --- Owner: Unlocked state ---
  const isMonetizationEnabled = status?.enabled ?? false;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="unlocked"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 mt-2"
      >
        {/* Status + Toggle */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border border-border rounded-2xl px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isMonetizationEnabled ? "bg-green-100" : "bg-muted"
              }`}
            >
              <Sparkles
                className={`w-5 h-5 ${isMonetizationEnabled ? "text-green-600" : "text-muted-foreground"}`}
              />
            </div>
            <div>
              <p className="font-display font-bold text-lg">Monetization</p>
              <AnimatePresence mode="wait">
                {isMonetizationEnabled ? (
                  <motion.div
                    key="on"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                  >
                    <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                      ✅ Monetization Active
                    </Badge>
                  </motion.div>
                ) : (
                  <motion.div
                    key="off"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 8 }}
                  >
                    <Badge
                      variant="outline"
                      className="text-muted-foreground text-xs"
                    >
                      ⚫ Monetization Off
                    </Badge>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {isMonetizationEnabled ? "On" : "Off"}
            </span>
            <Switch
              data-ocid="channel.monetization.toggle"
              checked={isMonetizationEnabled}
              onCheckedChange={handleToggleMonetization}
              disabled={enabling || disabling}
            />
          </div>
        </div>

        {/* Three cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Super Chat */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                Super Chat
              </CardTitle>
            </CardHeader>
            <CardContent>
              {donations && donations.length > 0 ? (
                <div className="space-y-3">
                  {donations.slice(0, 5).map((d, i) => (
                    <div
                      key={`donation-${d.donor.toString()}-${i}`}
                      data-ocid={`channel.monetization.donation.item.${i + 1}`}
                      className="flex items-start gap-2 p-3 rounded-xl bg-primary/5 border border-primary/10"
                    >
                      <Gift className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground truncate">
                          {d.donor.toString().slice(0, 12)}...
                        </p>
                        <p className="text-sm font-medium line-clamp-2">
                          {d.message}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-primary shrink-0">
                        {String(d.amount)} ICP
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  data-ocid="channel.monetization.superchat.empty_state"
                  className="text-center py-8"
                >
                  <Gift className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-40" />
                  <p className="text-sm text-muted-foreground">
                    No super chats yet
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Super chats will appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Channel Memberships */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Crown className="w-4 h-4 text-secondary" />
                </div>
                Channel Memberships
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {tiersLoading ? (
                <div className="text-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto text-primary opacity-50" />
                </div>
              ) : (
                <>
                  {([0, 1, 2] as const).map((i) => {
                    const tier = tierInputs[i];
                    const style = TIER_COLORS[i];
                    return (
                      <div
                        key={TIER_COLORS[i].label}
                        className={`relative rounded-xl p-[1.5px] bg-gradient-to-br ${style.border}`}
                      >
                        <div
                          className={`rounded-xl ${style.bg} px-3 py-2.5 space-y-2`}
                        >
                          <p className="text-xs font-semibold text-muted-foreground">
                            {style.icon} Tier {i + 1}
                          </p>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <Label
                                htmlFor={`tier-name-${i}`}
                                className="text-xs mb-1 block"
                              >
                                Name
                              </Label>
                              <Input
                                id={`tier-name-${i}`}
                                data-ocid={`channel.monetization.tier.input.${i + 1}`}
                                placeholder={`e.g. ${style.label} Fan`}
                                value={tier.tierName}
                                onChange={(e) => {
                                  const next = [...tierInputs];
                                  next[i] = {
                                    ...next[i],
                                    tierName: e.target.value,
                                  };
                                  setTierInputs(next);
                                }}
                                className="h-8 text-sm bg-white/80"
                              />
                            </div>
                            <div className="w-24">
                              <Label
                                htmlFor={`tier-price-${i}`}
                                className="text-xs mb-1 block"
                              >
                                ICP/mo
                              </Label>
                              <Input
                                id={`tier-price-${i}`}
                                type="number"
                                min="0"
                                step="0.1"
                                placeholder="0.5"
                                value={tier.priceICP}
                                onChange={(e) => {
                                  const next = [...tierInputs];
                                  next[i] = {
                                    ...next[i],
                                    priceICP: e.target.value,
                                  };
                                  setTierInputs(next);
                                }}
                                className="h-8 text-sm bg-white/80"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <Button
                    data-ocid="channel.monetization.save_button"
                    className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground"
                    onClick={handleSaveTiers}
                    disabled={savingTiers}
                  >
                    {savingTiers ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : null}
                    {savingTiers ? "Saving..." : "Save Tiers"}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Ad Revenue */}
          <Card className="border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base font-display">
                <div className="w-7 h-7 rounded-lg bg-accent/30 flex items-center justify-center">
                  <Tv2 className="w-4 h-4 text-foreground/70" />
                </div>
                Ad Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent/40 to-primary/20 flex items-center justify-center mx-auto">
                  <TrendingUp className="w-7 h-7 text-primary/70" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Coming Soon!</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    Ad revenue sharing coming soon. Stay tuned! 📺
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs border-primary/30 text-primary"
                >
                  🚀 In Development
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
