import "./style.css";
import checkmark from "./checkmark.svg";

type optionProps = {
  option: string;
  optionID: number;
  locked: boolean;
  selected: boolean;
  onLock: (optionID: number) => void;
  isCorrect: boolean;
};

const Option = ({
  option,
  optionID,
  locked,
  onLock,
  isCorrect,
  selected,
}: optionProps) => {
  const handleClick = () => {
    if (locked) return;
    onLock(optionID);
  };

  return (
    <div
      className={`${
        selected
          ? `bg-[#ff9999] text-[#4a2b2b] shadow-md shadow-[#ffd0d0] ${
              locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
            }`
          : `bg-[#e7e7d8] text-[#2a2a2a] shadow-md shadow-[#ff9999] hover:shadow-lg"
          ${locked ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`
      } p-3 m-2 cursor-pointer transition-all duration-200 options-font text-lg`}
      onClick={handleClick}
    >
      {option}
      {/*If correct overlay checkmark on right side of option*/}
      {isCorrect && (
        <img
          className="w-7 h-7 float-right translate-x-6"
          alt="correct"
          src={checkmark}
        />
      )}
    </div>
  );
};

export default Option;
