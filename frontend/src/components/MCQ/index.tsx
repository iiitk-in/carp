import { useState } from "preact/hooks";
import Option from "./option";
import { signal, effect } from "@preact/signals";

type option = {
  optionID: number;
  option: string;
};

type MCQprops = {
  question: string;
  options: option[];
  isMultipleChoice?: boolean;
  correctAnswer: string;
  locked?: boolean;
  hint?: string;
  onLock: (answers: number[]) => void;
};

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

const MCQ = ({
  question,
  options,
  isMultipleChoice = false,
  correctAnswer,
  locked = false,
  hint = null,
  onLock,
}: MCQprops) => {
  const [answers, setAnswers] = useState<number[]>([]);

  const handleLock = (optionID: number) => {
    if (locked) return;
    if (isMultipleChoice) {
      if (answers.includes(optionID)) {
        setAnswers(answers.filter((ans) => ans !== optionID));
      } else {
        setAnswers([...answers, optionID]);
      }
    } else {
      setAnswers([optionID]);
    }
  };

  return (
    <div className="bg-[#2a2a2a] p-8 shadow-md w-full max-w-md">
      <h2 className="text-2xl font-bold mb-2 text-center teko-regular">
        {question}
      </h2>
      <div className="flex flex-col">
        {options.map((option) => (
          <Option
            key={option.optionID}
            option={option.option}
            optionID={option.optionID}
            locked={locked}
            onLock={handleLock}
            isCorrect={option.option === correctAnswer}
          />
        ))}
      </div>
      <button
        className="bg-[#e7e7d8] text-[#2a2a2a] p-2 mt-4 rounded-md"
        onClick={() => onLock(answers)}
      >
        Lock
      </button>
    </div>
  );
};
