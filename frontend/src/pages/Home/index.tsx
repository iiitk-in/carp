import { h } from "preact";
import { signal, effect } from "@preact/signals";

// Helper function to get the initial state from localStorage
const getInitialValue = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
};

// Create a signal that reads from localStorage and sets a default value
const count = signal(getInitialValue("count", 0));

// Sync the signal with localStorage using an effect
effect(() => {
  localStorage.setItem("count", JSON.stringify(count.value));
});

export function Home() {
  return (
    <div>
      <p>Count: {count.value}</p>
      <button onClick={() => count.value++}>Increment</button>
      <button onClick={() => count.value--}>Decrement</button>
    </div>
  );
}
