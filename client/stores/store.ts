import { ssrSafe } from "@/lib/shared/zustand-ssr"
import { Category } from "@/lib/types/category"
import type { Message } from "@/lib/types/chat"
import { create } from "zustand"

export type StoreState = {
  selectedMsg: Message | null
  isMemberOpen: boolean
  selectedCategory: Category | null
}

export type StoreActions = {
  setSelectedMsg: (m: Message | null) => void
  setShowMemberPanel: (isOpen: boolean) => void
  setSelectedCategory: (c: Category | null) => void
}

export type AppStore = StoreState & StoreActions

export const defaultInitState: StoreState = {
  selectedMsg: null,
  isMemberOpen: false,
  selectedCategory: null
}

export const useAppStore = create<AppStore>(
  ssrSafe<AppStore>((set) => ({
    ...defaultInitState,
    setSelectedMsg: (m: Message | null) => set({ selectedMsg: m }),
    setShowMemberPanel: (isOpen: boolean) => set({ isMemberOpen: isOpen }),
    setSelectedCategory: (c: Category | null) => set({ selectedCategory: c })
  }))
)
