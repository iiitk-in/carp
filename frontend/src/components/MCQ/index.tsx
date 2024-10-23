import Option from "./option";
import createLocalStore from "../../store";

type option = {
  optionID: number;
  option: string;
};

export type MCQprops = {
  question: string;
  questionID: number;
  options: option[];
  isMultipleChoice?: boolean;
  correctAnswer: number[];
  locked?: boolean;
  hint?: string;
  onLock: (answers: number[]) => void;
};

const ansStore = createLocalStore<{ qid: number; ans: number[] }>(
  "ansStore",
  null
);

const hintOpenForQID = createLocalStore<number>("hintOpenForQID", null);

const MCQ = ({
  question,
  options,
  questionID,
  isMultipleChoice = true,
  correctAnswer,
  locked = false,
  hint = null,
  onLock,
}: MCQprops) => {
  //clear store if qid changes
  if (ansStore.value?.qid !== questionID) {
    ansStore.set({ qid: questionID, ans: [] });
  }
  const handleLock = (optionID: number) => {
    if (locked) return;
    if (isMultipleChoice) {
      const currentAns = ansStore.value?.ans || [];
      if (currentAns.includes(optionID)) {
        ansStore.set({
          qid: questionID,
          ans: currentAns.filter((ans) => ans !== optionID),
        });
      } else {
        ansStore.set({
          qid: questionID,
          ans: [...currentAns, optionID],
        });
      }
    }
  };

  return (
    <div className="bg-[#2a2a2a] p-8 pt-6 shadow-md w-full max-w-md flex flex-col">
      <h2 className="text-3xl font-bold mb-1 text-center teko-regular">
        {question}
      </h2>
      {hint && (
        <button
          className="bg-[#ff9999] text-[#2a2a2a] teko-semibold text-2xl p-2 py-1  hover:bg-[#ff6666] active:bg-[#ffcccc] 
                  transition-all duration-200 hover:scale-105 self-start ml-2 mb-4"
          onClick={() =>
            hintOpenForQID.set(
              hintOpenForQID.value === null ? questionID : null
            )
          }
        >
          See Hint
        </button>
      )}
      {hint && hintOpenForQID.value === questionID && (
        <HintModal hint={hint} onClose={() => hintOpenForQID.set(null)} />
      )}
      <div className="flex flex-col">
        {options.map((option) => (
          <Option
            key={option.optionID}
            option={option.option}
            optionID={option.optionID}
            locked={locked}
            selected={ansStore.value?.ans?.includes(option.optionID)}
            onLock={handleLock}
            isCorrect={correctAnswer && correctAnswer.includes(option.optionID)}
          />
        ))}
      </div>
      <button
        className="bg-[#ff9999] text-[#2a2a2a] teko-semibold text-2xl p-2 py-1 mt-4 self-center hover:bg-[#ff6666] active:bg-[#ffcccc] 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 disabled:scale-100 disabled:bg-[#ff9999]"
        onClick={() => onLock(ansStore.value.ans)}
        disabled={locked || !ansStore.value?.ans?.length}
      >
        Lock in
      </button>
    </div>
  );
};

function HintModal({ hint, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center w-full"
      onClick={onClose}
    >
      <div
        className="bg-[#2a2a2a] p-8 shadow-md max-w-md flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-3xl font-bold mb-1 text-center teko-regular">
          Hint
        </h2>
        <p className="text-lg text-center options-font">{hint}</p>
        <button
          className="bg-[#ff9999] text-[#2a2a2a] teko-semibold text-2xl p-2 py-1 mt-4 self-center hover:bg-[#ff6666] active:bg-[#ffcccc] 
                  transition-all duration-200 hover:scale-105"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default MCQ;
