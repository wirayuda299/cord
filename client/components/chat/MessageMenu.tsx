"use client";

import { useEffect, useRef, useState, useCallback, memo, useMemo } from "react";
import {
  Bookmark,
  Copy,
  Edit,
  Forward,
  MoreHorizontal,
  Pin,
  Reply,
  SmilePlus,
  Trash2,
} from "lucide-react";

import { topEmojies } from "@/constants/emoji";
import { copyText } from "@/lib/client/clipboard";
import { deleteMessage, pinMessage } from "@/lib/server/actions/messages";
import type { Message } from "@/lib/types/chat";
import { usePathname } from "next/navigation";
import { useAppStore } from "@/stores/store";

type MenuAction = {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  danger?: boolean;
  dividerBefore?: boolean;
};

type MessageMenuProps = {
  isOwn?: boolean;
  message: Message;
  onEdit?: () => void;
  onReaction?: () => void;
  onBookmark?: () => void;
  onForward?: () => void;
  onMore?: () => void;
  serverId: string;
  onDelete: (id: string) => void;
  userId?: string;
};

function EmojiRow({
  onSelectEmoji,
}: {
  onSelectEmoji: (emoji: string) => void;
}) {
  return (
    <div className="flex items-center gap-1 px-2 pt-2 pb-1.5">
      {topEmojies.map((e) => (
        <button
          key={e.code}
          onClick={() => onSelectEmoji(e.emoji)}
          className="flex-1 flex items-center justify-center py-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer"
          title={e.code}
        >
          <span className="text-base leading-none">{e.emoji}</span>
        </button>
      ))}
      <button
        className="flex items-center justify-center p-1.5 rounded hover:bg-white/10 transition-colors cursor-pointer text-text-secondary hover:text-white"
        title="More reactions"
      >
        <SmilePlus size={15} />
      </button>
    </div>
  );
}

function ActionItem({ action }: { action: MenuAction }) {
  const [active, setActive] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleEnter = useCallback(() => {
    enterTimer.current = setTimeout(() => setActive(true), 80);
  }, []);

  const handleLeave = useCallback(() => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    setActive(false);
  }, []);

  return (
    <>
      {action.dividerBefore && (
        <div className="mx-1 my-1 border-t border-white/6" />
      )}
      <button
        onClick={action.onClick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        className={`
          w-full flex items-center gap-2.5 px-2 py-2 rounded text-[13px] font-medium text-left
          transition-colors duration-100 cursor-pointer
          ${action.danger
            ? `text-destructive-foreground ${active ? "bg-destructive/20 text-destructive-light" : ""}`
            : `text-text-primary ${active ? "bg-accent-blue text-white" : ""}`
          }
        `}
      >
        <span
          className={action.danger ? "text-danger" : "text-text-secondary"}
        >
          {action.icon}
        </span>
        {action.label}
      </button>
    </>
  );
}

function useMenuActions(
  message: Message,
  serverId: string,
  userId: string,
  onDelete: (id: string) => void,
  onEdit?: () => void,
  onReaction?: () => void,
  onBookmark?: () => void,
  onForward?: () => void,
  onMore?: () => void,
): MenuAction[] {
  const selectMessage = useAppStore((m) => m.setSelectedMsg);
  const pathname = usePathname();

  return useMemo(() => [
    {
      icon: <Reply size={15} />,
      label: "Reply",
      onClick: () => selectMessage(message),
    },
    ...(userId === message.user_id && onEdit
      ? [
        {
          icon: <Edit size={15} />,
          label: "Edit Message",
          onClick: onEdit,
        },
      ]
      : []),
    {
      icon: <Forward size={15} />,
      label: "Forward Message",
      onClick: onForward,
    },
    {
      icon: <Pin size={15} />,
      label: "Pin Message",
      onClick: async () => {
        try {
          const res = await pinMessage(
            userId,
            message.id,
            message.channel_id,
          );
          if (res?.error) console.error(res.error);
        } catch (e) {
          console.error(e);
        }
      },
    },
    {
      icon: <SmilePlus size={15} />,
      label: "Add Reaction",
      onClick: onReaction,
    },
    { icon: <Bookmark size={15} />, label: "Bookmark", onClick: onBookmark },
    {
      icon: <Copy size={15} />,
      label: "Copy Text",
      onClick: () =>
        copyText(message.content).then(() => alert("Text copied!")),
    },
    {
      icon: <MoreHorizontal size={15} />,
      label: "More Options",
      onClick: onMore,
      dividerBefore: true,
    },
    {
      icon: <Trash2 size={15} />,
      label: "Delete Message",
      onClick: async () => {
        try {
          await deleteMessage({
            id: message.id,
            public_id: message.image_asset_id,
            channel_id: message.channel_id,
            server_id: serverId,
            path: pathname,
          });
          onDelete(message.id);
        } catch (e) {
          console.error(e);
        }
      },
      danger: true,
    },
  ], [message, userId, onEdit, onDelete, onForward, onReaction, onBookmark, onMore, selectMessage, pathname]);
}

function MessageMenu(props: MessageMenuProps) {
  const {
    serverId,
    onEdit,
    onReaction,
    onBookmark,
    onForward,
    onMore,
    message,
    onDelete,
    userId = "usr_001",
  } = props;

  const menuRef = useRef<HTMLDivElement>(null);
  const [flipUp, setFlipUp] = useState(false);

  const actions = useMenuActions(
    message,
    serverId,
    userId,
    onDelete,
    onEdit,
    onReaction,
    onBookmark,
    onForward,
    onMore,
  );

  const checkFlip = useCallback(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const trigger = menu.closest<HTMLElement>("[data-chat-item]");

    menu.style.display = "flex";
    const menuHeight = menu.scrollHeight;
    menu.style.display = "";

    if (trigger) {
      const { top, bottom } = trigger.getBoundingClientRect();
      setFlipUp(
        window.innerHeight - bottom < menuHeight &&
        top > window.innerHeight - bottom,
      );
    } else {
      const rect = menu.getBoundingClientRect();
      setFlipUp(window.innerHeight - rect.top < menuHeight + 20);
    }
  }, []);

  useEffect(() => {
    const raf = requestAnimationFrame(checkFlip);
    window.addEventListener("scroll", checkFlip, true);
    window.addEventListener("resize", checkFlip);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", checkFlip, true);
      window.removeEventListener("resize", checkFlip);
    };
  }, [checkFlip]);

  const handleEmojiSelect = useCallback((emoji: string) => {
    console.log("Emoji selected:", emoji);
  }, []);

  return (
    <div
      ref={menuRef}
      className={`
        absolute right-2 z-10 w-52 bg-overlay border border-white/6
        group-hover:flex hidden flex-col rounded-md shadow-xl shadow-black/40 overflow-hidden
        ${flipUp ? "bottom-full mb-1" : "top-0"}
      `}
    >
      <EmojiRow onSelectEmoji={handleEmojiSelect} />
      <div className="mx-2 my-1 border-t border-white/6" />
      <div className="flex flex-col px-1.5 pb-1.5 gap-px">
        {actions.map((action) => (
          <ActionItem key={action.label} action={action} />
        ))}
      </div>
    </div>
  );
}

export default memo(MessageMenu);
