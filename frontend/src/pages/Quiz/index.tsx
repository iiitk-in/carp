import "./style.css";
import websocketAPI from "../../ws";
import MCQ, { MCQprops } from "../../components/MCQ";

import { useEffect } from "preact/hooks";
import { signal } from "@preact/signals";
import createLocalStore from "../../store";
import fire from "./confetti";

const MCQState = signal<MCQprops>(null);
const announcementState = signal<string>(null);
const answersLocked = createLocalStore<{
  questionID: number;
  answers: number[];
}>("answersLocked", null);

const sessionUserID = createLocalStore<{ session: string; userID: string }>(
  "sessionUserName",
  { session: null, userID: null }
);

const sendAnswer = (
  answers: number[],
  websocketAPI: { sendMessage: (arg0: string) => void }
) => {
  websocketAPI.sendMessage(
    JSON.stringify({
      type: "answer",
      data: {
        questionID: MCQState.value.questionID,
        optionIDs: answers,
        userID: sessionUserID.value?.userID,
      },
    })
  );
};

export const QuizPage = () => {
  useEffect(() => {
    //check if session matches server, if not logout
    fetch("/api/session")
      .then((res) => res.json())
      .then((data) => {
        if (data.sessionID !== sessionUserID.value?.session) {
          window.location.href = "/";
        }
      });

    //first hydrate from /api/init
    fetch("/api/init")
      .then((res) => res.json())
      .then((state) => {
        if (state.lastAnnouncement) {
          announcementState.value = state.lastAnnouncement.text;
          MCQState.value = null;
          return;
        }
        if (state.lastQuestion) {
          MCQState.value = {
            questionID: state.lastQuestion.questionID,
            question: state.lastQuestion.question,
            options: state.lastQuestion.options,
            correctAnswer: null,
            locked: false,
            hint: null,
            onLock: (answers) => {
              sendAnswer(answers, websocketAPI);
              MCQState.value = {
                ...MCQState.value,
                locked: true,
              };
              answersLocked.set({
                questionID: state.lastQuestion.questionID,
                answers,
              });
            },
          };
        }
        if (state.lastHint) {
          console.log("lastHint", state.lastHint);
          if (MCQState.value?.questionID === state.lastHint.data.questionID)
            MCQState.value = {
              ...MCQState.value,
              hint: state.lastHint.data.text,
            };
        }
        if (state.lastAnswerkey) {
          console.log("lastAnswerKey", state.lastAnswerkey);
          if (
            MCQState.value?.questionID === state.lastAnswerkey.data.questionID
          ) {
            MCQState.value = {
              ...MCQState.value,
              correctAnswer: state.lastAnswerkey.data.optionIDs,
              locked: true,
            };
          }
        }
        if (answersLocked.value) {
          if (MCQState.value?.questionID === answersLocked.value.questionID) {
            MCQState.value.locked = true;
          }
        }
      })
      .then(() => {
        websocketAPI.connect();
        websocketAPI.onMessage((event) => {
          console.log("event.data", event.data);
          const message = JSON.parse(event.data);
          let data = message.data;
          switch (message.type) {
            case "newQuestion":
              MCQState.value = {
                questionID: data.questionID,
                question: data.question,
                options: data.options,
                correctAnswer: null,
                locked: false,
                hint: null,
                onLock: (answers) => {
                  sendAnswer(answers, websocketAPI);
                  MCQState.value = {
                    ...MCQState.value,
                    locked: true,
                  };
                  console.log("answers", answers);
                  answersLocked.set({ questionID: data.questionID, answers });
                },
              };
              announcementState.value = null;
              break;
            case "announcement":
              data = message.data;
              MCQState.value = {
                questionID: null,
                question: null,
                options: null,
                correctAnswer: null,
                locked: false,
                hint: null,
                onLock: () => {
                  console.error("Sanity check failed!");
                },
              };
              announcementState.value = data.text;
              break;
            case "hint":
              data = message.data;
              if (MCQState.value.questionID === data.questionID) {
                MCQState.value = {
                  ...MCQState.value,
                  hint: data.text,
                };
              }
              break;
            case "answerkey":
              data = message.data;
              if (MCQState.value.questionID === data.questionID) {
                MCQState.value = {
                  ...MCQState.value,
                  correctAnswer: data.optionIDs,
                  locked: true,
                };
              }
              //check if all are correct and launch confetti
              if (
                data.optionIDs.length === MCQState.value.options.length &&
                data.optionIDs.every((value, index) => value === index)
              ) {
                console.log("All correct!");
                fire();
              }
              break;

            default:
              break;
          }
        });
      });

    // Clean up on unmount
    return () => {
      websocketAPI.disconnect();
    };
  }, []);

  return (
    <div className="bg-quiz p-8 shadow-md h-screen text-[#e7e7d8] flex flex-col items-center">
      {MCQState.value?.questionID ? (
        <MCQ {...MCQState.value} />
      ) : announcementState.value ? (
        <div className={"bg-[#2a2a2a] p-4 shadow-md w-full max-w-md"}>
          <h2 className="text-3xl font-bold mb-1 text-center teko-semibold">
            Announcement
          </h2>
          <AnnouncementFormatted text={announcementState.value} />
        </div>
      ) : (
        <p>Waiting for a question...</p>
      )}
    </div>
  );
};

//converts all urls in a string to clickable links
function AnnouncementFormatted(props: { text: string }) {
  const text = props.text;
  const splitText = text.split(" ");
  const formattedText = splitText.map((word, index) => {
    if (word.startsWith("http")) {
      return (
        <a
          key={index}
          href={word}
          target="_blank"
          rel="noreferrer"
          className="underline text-[#ff9999] hover:text-[#ff6666]"
        >
          {word}
        </a>
      );
    }
    return word + (index < splitText.length - 1 ? " " : "");
  });
  return <p className="text-lg text-center">{formattedText}</p>;
}

export default QuizPage;
