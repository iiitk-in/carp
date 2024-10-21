import "./style.css";

import { useState, useEffect } from "preact/hooks";
import { signal, effect } from "@preact/signals";

// Helper function to get the initial state from localStorage
const getInitialValue = (key, defaultValue) => {
  const storedValue = localStorage.getItem(key);
  return storedValue !== null ? JSON.parse(storedValue) : defaultValue;
};

// Create a signal for the username
const username = signal(getInitialValue("username", ""));

// Sync the username with localStorage
effect(() => {
  localStorage.setItem("username", JSON.stringify(username.value));
});

const CarpLoginPage = () => {
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username: username.value }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData);
      }

      const data = await response.json();
      localStorage.setItem("userID", data.userID);
      window.location.href = "/quiz";

      // Handle successful registration (e.g., redirect to dashboard)
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen bg text-[#e7e7d8] flex flex-col">
      <main className="flex-grow flex items-center justify-center px-4">
        <div className="bg-[#2a2a2a] p-8 shadow-md w-full max-w-md">
          <h2 className="text-2xl font-bold mb-2 text-center teko-regular">
            Enter a cool username
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col">
            <div className="mb-4">
              <input
                type="text"
                id="username"
                placeholder={"Hacker123"}
                value={username.value}
                onInput={(e) => (username.value = e.currentTarget.value)}
                className="shadow appearance-none border w-full py-2 px-3 bg-[#1e1e1e] text-[#e7e7d8] leading-tight focus:outline-none focus:shadow-outline  focus:border-[#ff9999] border-[#555555] transition duration-300 placeholder:text-[#424242]"
                required
              />
            </div>
            {error && (
              <p className="text-[#ff9999] text-xs italic mb-4">{error}</p>
            )}
            <button
              type="submit"
              className="w-fit bg-[#ff9999] hover:bg-[#ff8080] text-[#1e1e1e] teko-medium text-2xl font-bold py-1 px-8  focus:outline-none focus:shadow-outline transition duration-300 self-center"
            >
              Confirm
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default CarpLoginPage;
