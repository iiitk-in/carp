import { useEffect, useState } from "react";
import { useUserStore } from "../store";
import io from "socket.io-client";
import { Socket } from "socket.io-client";
import { useNavigate } from "react-router";
import Announcement from "../components/Annoucement";

type SocketState = null | Socket;
type Question = null | {
  qid: string;
  question: string;
  choices: string[];
};

export default function Page() {
  const { clearUserId, userId, currentVote, setCurrentVote } = useUserStore();
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState<Question>(null);
  const [socket, setSocket] = useState<SocketState>(null);
  const [message, setMessage] = useState("");
  const [selectedChoices, setSelectedChoices] = useState<number[] | null>(null);
  const [importantMessage, setImportantMessage] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) {
      navigate("/");
    } else {
      const newSocket = io("https://carp-backend.iiitk.in");
      setSocket(newSocket);
      newSocket.onAny((event, ...args) => {
        console.log(event, args);
      });
      newSocket.on("mcq", (data) => {
        setQuestion(data);
        setMessage("");
        setImportantMessage("");
        setSelectedChoices(null);
      });
      newSocket.on("waiting", () => {
        setQuestion(null);
        setSelectedChoices(null);
      });
      newSocket.on("msg", (data) => {
        setQuestion(null);
        setSelectedChoices(null);
        setMessage("");
        setImportantMessage(data.message);
      });
      newSocket.on("forceLogout", () => {
        console.log("Force logout");
        clearUserId();
        navigate("/login");
      });
    }
  }, [userId]);

  const handleAnswer = (choiceNo: number) => {
    console.log("Answered", choiceNo, selectedChoices);
    if (question?.qid === currentVote) return;
    if (selectedChoices === null) {
      setSelectedChoices([choiceNo]);
      return;
    }
    if (selectedChoices.includes(choiceNo)) {
      setSelectedChoices(selectedChoices.filter((c) => c !== choiceNo));
      return;
    }
    setSelectedChoices([...selectedChoices, choiceNo]);
  };

  const handleLockIn = () => {
    if (
      !question ||
      !socket ||
      selectedChoices === null ||
      selectedChoices.length === 0 ||
      currentVote === question.qid
    )
      return;
    setCurrentVote(question.qid);
    setLoading(true);
    socket.emit("response", {
      qid: question.qid,
      choiceNo: selectedChoices.sort(),
      uuid: userId,
    });
    setLoading(false);
    setMessage("Answer submitted. Waiting for the next question...");
  };

  return (
    <div className="mt-8 flex flex-col items-center justify-center bg-[#1c1c1c] text-[#f4f0e0] p-4">
      {importantMessage && <Announcement message={importantMessage} />}
      {!message && !question && (
        <p className="text-lg opacity-80 mb-4">Waiting for host</p>
      )}
      {message && <p className="text-xl opacity-80 mb-4">{message}</p>}
      {question && (
        <div
          className="bg-[#2a2a2a] shadow-lg rounded-none px-8 pt-6 pb-8 mb-4 
        w-full max-w-md border border-[#3a3a3a]"
        >
          <h2 className="text-xl font-semibold mb-4">{question.question}</h2>
          <div className="space-y-4">
            {question.choices.map((choice, index) => (
              <button
                key={index}
                onClick={() => handleAnswer(index + 1)}
                disabled={currentVote === question.qid}
                className={`w-full py-4 px-4 border-2 text-black border-black
                  active:translate-x-1 active:translate-y-1 font-bold
                  drop-shadow-md focus:outline-none shadow-purple
                  focus:ring-0 transition duration-150
                  ease-in-out disabled:opacity-50 disabled:cursor-not-allowed
                  ${
                    selectedChoices?.includes(index + 1)
                      ? currentVote === question.qid
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-green-500 hover:bg-green-600"
                      : "bg-white hover:bg-gray-100"
                  }`}
              >
                {choice}
              </button>
            ))}
          </div>
          <button
            onClick={handleLockIn}
            disabled={
              selectedChoices === null ||
              loading ||
              currentVote === question.qid
            }
            className="mt-4 w-3/4 py-4 px-4 bg-orange-500 text-xl text-white font-bold
              rounded-none hover:bg-orange-600 focus:ring-0 transition duration-150
              ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Lock in
          </button>
        </div>
      )}
    </div>
  );
}
