import { useState } from "preact/hooks";

type optionProps = {
  option: string;
  optionID: number;
  locked: boolean;
  onLock: (optionID: number) => void;
  isCorrect: boolean;
};

const Option = ({
  option,
  optionID,
  locked,
  onLock,
  isCorrect,
}: optionProps) => {
  const [selected, setSelected] = useState(false);

  const handleClick = () => {
    if (locked) return;
    setSelected(!selected);
    onLock(optionID);
  };

  return (
    <div
      className={`${
        selected ? (isCorrect ? "bg-green-500" : "bg-red-500") : "bg-gray-500"
      } p-4 m-2 cursor-pointer`}
      onClick={handleClick}
    >
      {option}
    </div>
  );
};

export default Option;
