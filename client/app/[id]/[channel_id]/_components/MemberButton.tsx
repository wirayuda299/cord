"use client";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/store";
import { Users } from "lucide-react";
import { useShallow } from "zustand/react/shallow";

export default function MembersButton() {


  const { isOpen, showMemberPanel } = useAppStore(
    useShallow((state) => ({
      isOpen: state.isMemberOpen,
      showMemberPanel: state.setShowMemberPanel,
    })),
  );

  return (
    <button className="cursor-pointer" onClick={() => showMemberPanel(!isOpen)}>
      <Users className={cn("text-sm text-gray-500 hover:text-white", isOpen ? "text-white" : "")} />
    </button>
  );
}
