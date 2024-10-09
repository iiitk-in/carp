import { useState } from "react";
import { useUserStore } from "../store";

export default function Page() {
  const userId = useUserStore((state) => state.userId);
  const setUserId = useUserStore((state) => state.setUserId);

  const [loading, setloading] = useState(false);
  const [username, setusername] = useState("");

  return (
    <div className="h-20 flex flex-col items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="font-bold"> Enter a cool username </span>
        <input
          type="text"
          placeholder="HappyHippo"
          onChange={(e) => setusername(e.target.value)}
          className="bg-[#1c1c1c] text-[#f4f0e0] border border-gray-700 rounded-none focus:outline-none focus:ring-2 focus:ring-[#c401c4] focus:border-transparent placeholder-gray-500 transition duration-200 ease-in-out"
        />
        <button
          className={`
        relative
        font-bold
        py-2
        px-4
        border-2
        transition-all
        ${
          loading
            ? "bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed translate-x-1 translate-y-1"
            : "bg-white text-black border-black hover:bg-gray-100 active:translate-x-1 active:translate-y-1"
        }
      `}
          style={{
            boxShadow: loading ? "none" : "5px 5px 0 #c401c4",
          }}
          onClick={() => {
            setloading(true);
            setUserId(register(username));
          }}
          disabled={loading}
        >
          Submit
        </button>
      </div>
    </div>
  );
}

function register(name: string) {
  // make a request to the server
  return "123";
}
