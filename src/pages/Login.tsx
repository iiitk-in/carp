import { useState } from "react";
import { useUserStore } from "../store";
import { useNavigate } from "react-router-dom";

export default function Page() {
  const setUserId = useUserStore((state) => state.setUserId);

  const { clearCurrentVote } = useUserStore();

  const [loading, setloading] = useState(false);
  const [username, setusername] = useState("");
  const navigate = useNavigate();

  return (
    <div className="mt-40 flex flex-col items-center justify-center ">
      <div className="flex flex-col items-center justify-center gap-2">
        <span className="font-bold"> Enter a cool username </span>
        <input
          type="text"
          placeholder="HappyHippo"
          onChange={(e) => setusername(e.target.value)}
          className="bg-[#1c1c1c] text-[#f4f0e0] border border-gray-700 
          rounded-none focus:outline-none focus:ring-2 focus:ring-[#c401c4] 
          focus:border-transparent placeholder-gray-500 transition duration-200 ease-in-out"
        />
        <button
          className={`
        relative
        font-bold
        py-4
        px-4
        border-2
        transition-all
        ${
          loading
            ? `bg-gray-300 text-gray-500 border-gray-400 cursor-not-allowed 
            translate-x-1 translate-y-1`
            : `bg-white text-black border-black hover:bg-gray-100 
            active:translate-x-1 active:translate-y-1`
        }
      `}
          style={{
            boxShadow: loading ? "none" : "5px 5px 0 #c401c4",
          }}
          onClick={async () => {
            setloading(true);
            const id = await register(username);
            if (!id) {
              setloading(false);
              return;
            }
            setUserId(id);
            clearCurrentVote();
            console.log("Registered");
            navigate("/quiz");
          }}
          disabled={loading}
        >
          Submit
        </button>
      </div>
    </div>
  );
}
async function register(name: string) {
  const res = await fetch("https://carp-backend.iiitk.in/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ name }),
  });
  const data = await res.json();
  if (data.error) {
    throw new Error(data.error);
  }
  return data.uuid;
}
