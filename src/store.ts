import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface UserState {
  userId: string;
  setUserId: (id: string) => void;
  clearUserId: () => void;
  currentVote: string | null;
  setCurrentVote: (vote: string | null) => void;
  clearCurrentVote: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      userId: "",
      setUserId: (id: string) => set({ userId: id }),
      clearUserId: () => set({ userId: "" }),
      currentVote: null,
      setCurrentVote: (qid: string | null) => set({ currentVote: qid }),
      clearCurrentVote: () => set({ currentVote: null }),
    }),
    {
      name: "user-storage",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
