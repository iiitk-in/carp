import { useEffect, useState } from "preact/hooks";
import createLocalStore from "../../store";
import MCQ, { MCQprops } from "../../components/MCQ";

const password = createLocalStore("password", "");

export const Leaderboard = () => {
  const [question, setQuestion] = useState<MCQprops | null>(null);
  const [leaderboard, setLeaderboard] = useState<
    { username: string; time: number }[]
  >([]);
  useEffect(() => {
    console.log(question);
    //fetch /api/init to show the question
    fetch(import.meta.env.VITE_BACKEND_URL + "/api/init")
      .then((res) => res.json())
      .then((state) => {
        if (state.lastQuestion) {
          setQuestion({
            questionID: state.lastQuestion.questionID,
            question: state.lastQuestion.question,
            options: state.lastQuestion.options,
            correctAnswer: null,
            locked: false,
            hint: null,
            onLock: (answers) => {
              console.log(answers);
            },
          });
        }
      });
    if (password.value !== "") {
      //fetch leaderboard
      fetch(import.meta.env.VITE_BACKEND_URL + "/api/leaderboard", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ auth: password.value }),
      })
        .then((res) => res.json())
        .then((data) => {
          setLeaderboard(data);
        });
    }
  }, []);

  return (
    <div class="flex flex-col items-center">
      <div class="flex flex-row mb-3">
        <input
          className="bg-[#2a2a2a] p-8 pt-6 shadow-md w-fit max-w-md flex flex-col"
          type="password"
          onChange={(e) => password.set(e.currentTarget.value)}
          value={password.value}
        />
        <button
          className="bg-[#2a2a2a] p-8 pt-6 shadow-md w-fit max-w-md flex flex-col"
          onClick={() => {
            fetch(import.meta.env.VITE_BACKEND_URL + "/api/leaderboard", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ auth: password.value }),
            })
              .then((res) => res.json())
              .then((data) => {
                setLeaderboard(data);
              });
          }}
        >
          Refresh
        </button>
      </div>
      {question && <MCQ {...question} />}
      <h1 className="text-3xl mt-8">Leaderboard</h1>
      <ol>
        <div class="flex flex-row bg-[#ffa2a2] text-[#2a2a2a] p-2 m-1 shadow-md w-[80vh]">
          <p>Username</p>
          <div class="flex-grow"></div>
          <p>Time</p>
        </div>
        {leaderboard.map((user) => (
          <LeaderboardEntry
            username={user.username}
            time={user.time}
            key={user.username}
          />
        ))}
      </ol>
    </div>
  );
};

function LeaderboardEntry(props: { username: string; time: number }) {
  return (
    <div class="flex flex-row bg-[#2a2a2a] p-2 m-1 shadow-md w-[80vh]">
      <p>{props.username}</p>
      <div class="flex-grow"></div>
      <p>{formatMstoSec(props.time)}</p>
    </div>
  );
}

function formatMstoSec(ms: number) {
  // show upto 1 decimal place 1.1s
  return (ms / 1000).toFixed(1) + "s";
}

export default Leaderboard;
