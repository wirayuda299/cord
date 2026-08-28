import { ssrSafe } from "@/lib/zustand-ssr"
import { Category } from "@/types/category"
import type { Message } from "@/types/chat"
import { create } from "zustand"

export type StoreState = {
  selectedMsg: Message | null
  isMemberOpen: boolean
  selectedCategory: Category | null
  isSidebarOpen: boolean
}

export type StoreActions = {
  setSelectedMsg: (m: Message | null) => void
  toggleMemberPanel: () => void
  setSelectedCategory: (c: Category | null) => void
  setSidebarOpen: (isOpen: boolean) => void
}

export type AppStore = StoreState & StoreActions

export const defaultInitState: StoreState = {
  selectedMsg: null,
  isMemberOpen: false,
  selectedCategory: null,
  isSidebarOpen: false
}

export const useAppStore = create<AppStore>(
  ssrSafe<AppStore>((set) => ({
    ...defaultInitState,
    setSelectedMsg: (m: Message | null) => set({ selectedMsg: m }),
    toggleMemberPanel: () => set((state) => ({ isMemberOpen: !state.isMemberOpen })),
    setSelectedCategory: (c: Category | null) => set({ selectedCategory: c }),
    setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen })
  }))
)
