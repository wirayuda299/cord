import { useAppStore } from "@/stores/store";
import { beforeEach, describe, expect, it } from "vitest";

describe("useAppStore online users", () => {
  beforeEach(() => {
    useAppStore.setState({ onlineUserIds: new Set() });
  });

  it("addOnlineUser adds a new id to the set", () => {
    useAppStore.getState().addOnlineUser("u1");
    expect(useAppStore.getState().onlineUserIds.has("u1")).toBe(true);
  });

  it("addOnlineUser creates a new Set reference when the id is actually new", () => {
    const before = useAppStore.getState().onlineUserIds;
    useAppStore.getState().addOnlineUser("u1");
    const after = useAppStore.getState().onlineUserIds;
    expect(after).not.toBe(before);
  });

  it("addOnlineUser keeps the same Set reference (no-op) when the id is already present", () => {
    useAppStore.getState().addOnlineUser("u1");
    const before = useAppStore.getState().onlineUserIds;

    useAppStore.getState().addOnlineUser("u1");
    const after = useAppStore.getState().onlineUserIds;

    expect(after).toBe(before);
  });

  it("removeOnlineUser removes an existing id from the set", () => {
    useAppStore.getState().addOnlineUser("u1");
    useAppStore.getState().removeOnlineUser("u1");
    expect(useAppStore.getState().onlineUserIds.has("u1")).toBe(false);
  });

  it("removeOnlineUser creates a new Set reference when the id was actually removed", () => {
    useAppStore.getState().addOnlineUser("u1");
    const before = useAppStore.getState().onlineUserIds;

    useAppStore.getState().removeOnlineUser("u1");
    const after = useAppStore.getState().onlineUserIds;

    expect(after).not.toBe(before);
  });

  it("removeOnlineUser keeps the same Set reference (no-op) when the id isn't present", () => {
    const before = useAppStore.getState().onlineUserIds;
    useAppStore.getState().removeOnlineUser("nonexistent");
    const after = useAppStore.getState().onlineUserIds;

    expect(after).toBe(before);
  });
});
