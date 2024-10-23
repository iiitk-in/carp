import { signal, effect } from "@preact/signals";

type LocalStore<T> = {
  value: T;
  set: (newValue: T) => void;
  reset: () => void;
  subscribe: (callback: (value: T) => void) => () => void;
};

function createLocalStore<T>(key: string, defaultValue: T): LocalStore<T> {
  // Retrieve the initial value from localStorage or use the default value
  const storedValue = localStorage.getItem(key);
  const initialValue =
    storedValue !== null ? JSON.parse(storedValue) : defaultValue;

  // Create a signal with the initial value
  const state = signal<T>(initialValue);

  // Automatically sync the signal with localStorage
  effect(() => {
    localStorage.setItem(key, JSON.stringify(state.value));
  });

  return {
    get value() {
      return state.value;
    },
    set(newValue: T) {
      state.value = newValue;
    },
    reset() {
      state.value = defaultValue;
    },
    subscribe(callback) {
      // Subscribe to changes in the signal
      const unsubscribe = state.subscribe(callback);
      return () => {
        unsubscribe();
      };
    },
  };
}

// Example of using the createLocalStore function
export default createLocalStore;
