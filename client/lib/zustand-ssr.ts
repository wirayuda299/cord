import type { StateCreator } from "zustand";

export function ssrSafe<T extends object>(
  config: StateCreator<T, [], []>
): StateCreator<T, [], []> {
  return (set, get, api) => {
    if (typeof window === "undefined") {
      const ssrSet: typeof set = () => {
        throw new Error("Cannot set state of Zustand store in SSR");
      };
      api.setState = ssrSet;
      return config(ssrSet, get, api);
    }
    return config(set, get, api);
  };
}
