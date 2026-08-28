"use client";

import {
  Settings,
  LayoutDashboard,
  Shield,
  Users,
  Link2,
  Zap,
  ShieldCheck,
  ScrollText,
  Ban,
  Trash2,
  X,
  ChevronLeft,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog";
import { memo, useState } from "react";
import { cn } from "@/lib/utils";
import ServerProfile from "./profile";
import dynamic from "next/dynamic";

function loader(compName: string) {
  return <p className="text-sm text-text-muted">Loading {compName}...</p>;
}

const ServerRolesSettings = dynamic(() => import("./roles"), {
  ssr: false,
  loading() {
    return loader("Roles");
  },
});
const Bans = dynamic(() => import("./Bans"), {
  ssr: false,
  loading() {
    return loader("Bans");
  },
});
const DeleteServer = dynamic(() => import("./DeleteServer"), {
  ssr: false,
  loading() {
    return loader("Delete Server");
  },
});
const AuditLog = dynamic(() => import("./AuditLog"), {
  ssr: false,
  loading() {
    return loader("Audit Log");
  },
});
const Invites = dynamic(() => import("./Invites"), {
  ssr: false,
  loading() {
    return loader("Invites");
  },
});
const Members = dynamic(() => import("./Members"), {
  ssr: false,
  loading() {
    return loader("Members");
  },
});
const BoostPerks = dynamic(() => import("./BoostPerks"), {
  ssr: false,
  loading() {
    return loader("Boost Perks");
  },
});
const SafetySetup = dynamic(() => import("./SafetySetup"), {
  ssr: false,
  loading() {
    return loader("Safety Setup");
  },
});

type SidebarItem = {
  id: string;
  label: string;
  icon: React.ReactNode;
  danger?: boolean;
};

type SidebarGroup = {
  title?: string;
  items: SidebarItem[];
};

const SIDEBAR_GROUPS = [
  {
    title: "Server Settings",
    items: [
      {
        id: "server-profile",
        label: "Overview",
        icon: <LayoutDashboard size={15} />,
      },
      { id: "roles", label: "Roles", icon: <Shield size={15} /> },
    ],
  },
  {
    title: "Community",
    items: [
      { id: "members", label: "Members", icon: <Users size={15} /> },
      { id: "invites", label: "Invites", icon: <Link2 size={15} /> },
      { id: "boost-perks", label: "Boost Perks", icon: <Zap size={15} /> },
    ],
  },
  {
    title: "Moderation",
    items: [
      {
        id: "safety-setup",
        label: "Safety Setup",
        icon: <ShieldCheck size={15} />,
      },
      {
        id: "audit-log",
        label: "Audit Log",
        icon: <ScrollText size={15} />,
      },
      { id: "bans", label: "Bans", icon: <Ban size={15} /> },
    ],
  },
  {
    items: [
      {
        id: "delete-server",
        label: "Delete Server",
        icon: <Trash2 size={15} />,
        danger: true,
      },
    ],
  },
] as const satisfies SidebarGroup[];

type PanelId = (typeof SIDEBAR_GROUPS)[number]["items"][number]["id"];

// Flat id -> label lookup, derived from the same source of truth used to
// render the sidebar, so a mobile header title never drifts out of sync.
const PANEL_LABELS: Record<PanelId, string> = Object.fromEntries(
  SIDEBAR_GROUPS.flatMap((g) => g.items.map((item) => [item.id, item.label])),
) as Record<PanelId, string>;

function NavItem({
  item,
  active,
  onClick,
}: {
  item: SidebarItem;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn("w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-md text-sm font-medium transition-colors text-left relative group",
        item.danger
          ? active
            ? "bg-destructive/15 text-destructive"
            : "text-destructive/70 hover:bg-destructive/10 hover:text-destructive"
          : active
            ? "bg-surface-hover text-text-bright"
            : "text-text-dim hover:text-text-primary",)}
    >
      {active && !item.danger && (
        <span className="hidden md:block absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 rounded-r-full bg-discord-brand" />
      )}
      <span
        className={cn(
          "shrink-0 transition-colors",
          item.danger
            ? "text-destructive/70 group-hover:text-destructive"
            : active
              ? "text-discord-brand"
              : "text-text-muted group-hover:text-text-dim",
        )}
      >
        {item.icon}
      </span>
      {item.label}
    </button>
  );
}

function SettingsSidebar({
  serverName,
  active,
  onSelect,
  className,
}: {
  serverName: string;
  active: PanelId;
  onSelect: (id: PanelId) => void;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "w-full md:w-56 shrink-0 flex flex-col h-full bg-surface-chat md:border-r border-surface-subtle/40",
        className,
      )}
    >
      <div className="px-4 pt-5 pb-3 shrink-0 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-text-primary truncate">
            {serverName}
          </p>
          <p className="text-xs text-text-muted mt-px">Server Settings</p>
        </div>
        <DialogClose className='md:hidden'>
          <X className="text-white" size={15} />
        </DialogClose>
      </div>

      <div className="h-px bg-surface-subtle/40 mx-3" />

      <nav
        className="flex-1 overflow-y-auto px-2 py-3 space-y-4"
        aria-label="Server settings"
      >
        {SIDEBAR_GROUPS.map((group, gi) => (
          <div key={group.title ?? gi} role="group" aria-label={group.title}>
            {!group.title && gi > 0 && (
              <div className="h-px bg-surface-subtle/40 mx-1 mb-4" />
            )}

            {group.title && (
              <p className="px-1 md:px-3 mb-1 text-[10px] font-semibold uppercase tracking-widest text-text-muted">
                {group.title}
              </p>
            )}

            <div className="space-y-0.5" role="tablist">
              {group.items.map((item) => (
                <NavItem
                  key={item.id}
                  item={item}
                  active={active === item.id}
                  onClick={() => onSelect(item.id)}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 px-3 py-3 border-t border-surface-subtle/40">
        <p className="text-[10px] text-text-muted leading-relaxed">
          <span className="md:hidden">Tap a setting to open it</span>
          <span className="hidden md:inline">Esc or click outside to close</span>
        </p>
      </div>
    </aside>
  );
}

type ServerSettingProps = {
  serverId: string;
  serverOwner: string;
  serverName: string;
};

function ServerSettingDialog({
  serverId,
  serverOwner,
  serverName,
}: ServerSettingProps) {
  const [active, setActive] = useState<PanelId>("server-profile");
  // Mobile-only: which pane is showing. Irrelevant at md+ where both render.
  const [mobileView, setMobileView] = useState<"nav" | "panel">("nav");

  const panels: Record<PanelId, React.ReactNode> = {
    "server-profile": <ServerProfile />,
    roles: (
      <ServerRolesSettings serverOwner={serverOwner} serverID={serverId} />
    ),
    members: <Members serverID={serverId} serverOwner={serverOwner} />,
    invites: <Invites serverID={serverId} />,
    "boost-perks": <BoostPerks />,
    "safety-setup": <SafetySetup serverId={serverId} />,
    "audit-log": <AuditLog serverId={serverId} />,
    bans: <Bans serverId={serverId} />,
    "delete-server": (
      <DeleteServer serverId={serverId} serverName={serverName} />
    ),
  };

  const handleSelect = (id: PanelId) => {
    setActive(id);
    setMobileView("panel");
  };

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open) setMobileView("nav");
      }}
    >
      <DialogTrigger className="w-full p-1.5 text-xs font-medium md:font-normal md:text-sm rounded flex justify-between items-center hover:bg-sidebar-primary/15 text-white hover:text-white transition-colors">
        <p>Server Settings</p>
        <Settings size={16} />
      </DialogTrigger>

      <DialogContent
        showCloseButton={false}
        onKeyDown={(e) => {
          if (e.key !== "Escape") e.stopPropagation();
        }}
        className="min-w-full h-dvh max-h-dvh rounded-none bg-surface-base p-0 border-none ring-0"
      >
        <div className="flex h-full w-full max-h-svh">
          <SettingsSidebar
            serverName={serverName}
            active={active}
            onSelect={handleSelect}
            className={cn(mobileView === "panel" && "hidden md:flex")}
          />

          <main
            className={cn(
              "flex-1 relative overflow-hidden flex flex-col md:flex",
              mobileView === "nav" && "hidden md:flex",
            )}
          >
            <div className="md:hidden flex items-center  md:px-3 py-3 border-b border-surface-subtle/40 shrink-0">
              <button
                type="button"
                onClick={() => setMobileView("nav")}
                className="flex items-center cursor-pointer justify-center size-8 rounded-lg hover:bg-surface-hover text-text-dim hover:text-text-bright transition-colors"
              >
                <ChevronLeft size={16} />
                <span className="sr-only">Back to settings list</span>
              </button>
              <p className="text-sm font-medium text-text-primary truncate">
                {PANEL_LABELS[active]}
              </p>
            </div>

            <DialogClose className="absolute top-4 right-4 z-20 flex items-center justify-center size-8 rounded-lg bg-surface-hover hover:bg-surface-subtle text-text-dim hover:text-text-bright transition-colors">
              <X size={15} />
              <span className="sr-only">Close</span>
            </DialogClose>

            <div className="flex-1 overflow-hidden">{panels[active]}</div>
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(ServerSettingDialog);
