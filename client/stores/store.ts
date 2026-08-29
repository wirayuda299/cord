import { ssrSafe } from "@/lib/zustand-ssr"
import { Category } from "@/types/category"
import type { Message } from "@/types/chat"
import { create } from "zustand"

type StoreState = {
  selectedMsg: Message | null
  isMemberOpen: boolean
  selectedCategory: Category | null
  isSidebarOpen: boolean
  isChannelSidebarOpen: boolean
  onlineUserIds: Set<string>
}

type StoreActions = {
  setSelectedMsg: (m: Message | null) => void
  toggleMemberPanel: () => void
  setSelectedCategory: (c: Category | null) => void
  setSidebarOpen: (isOpen: boolean) => void
  setChannelSidebarOpen: (isOpen: boolean) => void
  setOnlineUserIds: (ids: string[]) => void
  addOnlineUser: (id: string) => void
  removeOnlineUser: (id: string) => void
}

export type AppStore = StoreState & StoreActions

const defaultInitState: StoreState = {
  selectedMsg: null,
  isMemberOpen: false,
  selectedCategory: null,
  isSidebarOpen: false,
  isChannelSidebarOpen: false,
  onlineUserIds: new Set()
}

export const useAppStore = create<AppStore>(
  ssrSafe<AppStore>((set) => ({
    ...defaultInitState,
    setSelectedMsg: (m: Message | null) => set({ selectedMsg: m }),
    toggleMemberPanel: () => set((state) => ({ isMemberOpen: !state.isMemberOpen })),
    setSelectedCategory: (c: Category | null) => set({ selectedCategory: c }),
    setSidebarOpen: (isOpen: boolean) => set({ isSidebarOpen: isOpen }),
    setChannelSidebarOpen: (isOpen: boolean) => set({ isChannelSidebarOpen: isOpen }),
    setOnlineUserIds: (ids: string[]) => set({ onlineUserIds: new Set(ids) }),
    addOnlineUser: (id: string) => set((state) => {
      if (state.onlineUserIds.has(id)) return state
      return { onlineUserIds: new Set(state.onlineUserIds).add(id) }
    }),
    removeOnlineUser: (id: string) => set((state) => {
      if (!state.onlineUserIds.has(id)) return state
      const next = new Set(state.onlineUserIds)
      next.delete(id)
      return { onlineUserIds: next }
    })
  }))
)
