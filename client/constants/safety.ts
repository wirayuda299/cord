import {
   Mail,
   Phone,
   ShieldAlert,
   ShieldCheck,
   ShieldOff,
   Timer,
   UserCheck,
} from "lucide-react";

export const VERIFICATION_LEVELS = [
   {
      value: "none",
      label: "None",
      description: "Unrestricted — anyone can send messages",
      icon: ShieldOff,
      color: "text-white/40",
      bg: "bg-white/5",
   },
   {
      value: "low",
      label: "Low",
      description: "Must have a verified email on their account",
      icon: Mail,
      color: "text-green-400",
      bg: "bg-green-500/10",
   },
   {
      value: "medium",
      label: "Medium",
      description: "Must be registered on Discord for longer than 5 minutes",
      icon: Timer,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
   },
   {
      value: "high",
      label: "High",
      description: "Must be a member of this server for longer than 10 minutes",
      icon: ShieldCheck,
      color: "text-orange-400",
      bg: "bg-orange-500/10",
   },
   {
      value: "highest",
      label: "Highest",
      description: "Must have a verified phone number on their account",
      icon: Phone,
      color: "text-red-400",
      bg: "bg-red-500/10",
   },
] as const;

export const CONTENT_FILTERS = [
   {
      value: "disabled",
      label: "Don't scan any messages",
      description:
         "No automatic filtering — moderators handle everything manually",
      icon: ShieldOff,
      color: "text-white/40",
      bg: "bg-white/5",
   },
   {
      value: "no_role",
      label: "Scan messages from roleless members",
      description:
         "Filter explicit content from members who don't have an assigned role",
      icon: UserCheck,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
   },
   {
      value: "everyone",
      label: "Scan all messages",
      description:
         "Filter explicit content sent by all members regardless of role",
      icon: ShieldAlert,
      color: "text-purple-400",
      bg: "bg-purple-500/10",
   },
] as const;

export const NOTIFICATION_OPTIONS = [
   {
      value: "all_messages",
      label: "All messages",
      description: "Members are notified for every message by default",
   },
   {
      value: "only_mentions",
      label: "Only @mentions",
      description: "Members are only notified when directly mentioned",
   },
] as const;
