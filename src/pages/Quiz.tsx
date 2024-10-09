import { useEffect, useState } from "react";
import { useUserStore } from "../store";
import io from "socket.io-client";
import { Socket } from "socket.io-client";

export default function Page() {
  type SocketState = null | Socket;
  type Question = null | {
    qid: string;
    question: string;
    choices: string[];
  };

  const userId = useUserStore((state) => state.userId);
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question>(null);
  const [socket, setSocket] = useState<SocketState>(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!userId) {
      window.location.href = "/login";
    } else {
      const newSocket = io("https://carp-backend.iiitk.in");
      setSocket(newSocket);

      newSocket.on("mcq", (data) => {
        setQuestion(data);
        setMessage("");
      });

      newSocket.on("waiting", (msg) => {
        setQuestion(null);
        setMessage(msg);
      });
    }
  }, [userId]);

  const handleAnswer = (choiceNo: number) => {
    if (!question || !socket) return;

    setLoading(true);
    socket.emit("response", {
      qid: question.qid,
      choiceNo,
      uuid: userId,
    });
    setLoading(false);
    setMessage("Answer submitted. Waiting for the next question...");
    setQuestion(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center 
    bg-[#1c1c1c] text-[#f4f0e0] p-4"
    >
      <h1 className="text-3xl font-bold mb-8">Quiz Page</h1>

      {message && <p className="text-lg opacity-80 mb-4">{message}</p>}

      {question && (
        <div
          className="bg-[#2a2a2a] shadow-lg rounded-md px-8 pt-6 
        pb-8 mb-4 w-full max-w-md border border-[#3a3a3a]"
        >
          <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
          <div className="space-y-2">
            {question.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index + 1)}
                disabled={loading}
                className="w-full bg-[#c401c4] hover:bg-[#a001a0] 
                text-[#f4f0e0] font-bold py-2 px-4 rounded-md focus:outline-none
                 focus:ring-2 focus:ring-[#c401c4] focus:ring-opacity-50 transition 
                 duration-150 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {choice}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
