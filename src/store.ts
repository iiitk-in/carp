import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  userId: string;
  setUserId: (id: string) => void;
  clearUserId: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: "",
      setUserId: (id: string) => set({ userId: id }),
      clearUserId: () => set({ userId: "" }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
