import websocketAPI from "../../ws";

import { useEffect } from "preact/hooks";
import createLocalStore from "../../store";

const content = createLocalStore("content", "");

export const AdminPage = () => {
  useEffect(() => {
    websocketAPI.connect();

    websocketAPI.onMessage((event) => {
      console.log(event);
    });

    // Clean up on unmount
    return () => {
      websocketAPI.disconnect();
    };
  }, []);

  return (
    <div>
      <h1>Send custom ws msg</h1>
      <textarea
        class="bg-black text-white"
        onChange={(e) => content.set(e.currentTarget.value)}
        value={content.value}
      ></textarea>
      <button
        onClick={() => {
          websocketAPI.sendMessage(content.value);
        }}
      >
        Send
      </button>
    </div>
  );
};

export default AdminPage;
