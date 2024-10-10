const Announcement = ({ message }: { message: string }) => {
  // Regular expression to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  // Function to replace URLs with anchor tags
  const replaceUrlsWithLinks = (text: string) => {
    return text.split(urlRegex).map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#ff7bff] underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="border-[#4f4f4f] border-4 bg-[#2a2a2a] shadow-purple text-[#f4f0e0] 
    p-4 mb-4 max-w-prose"
    >
      <p className="font-bold text-xl mb-2">Announcement</p>
      <p>{replaceUrlsWithLinks(message)}</p>
    </div>
  );
};

export default Announcement;
