import { useAuth0 } from "@auth0/auth0-react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";
import type Message from "./domain/Message";
import { io, Socket } from "socket.io-client";
import type NewMessageDto from "./domain/NewMessageDto";
import type SendMessageDto from "./domain/SendMessageDto";

export default function InnerApp() {
  const { user, getAccessTokenSilently } = useAuth0();
  const [toId, setToId] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const socket = useRef<Socket | undefined>(undefined);

  function updateMessage(newMessage: NewMessageDto) {
    if (newMessage.fromId === toId)
      setMessages((prev) => [
        ...prev,
        {
          chatid: "doesntmatter",
          timestamp_utc: newMessage.timestamp_utc,
          text: newMessage.text,
          from: newMessage.fromId,
        },
      ]);
  }

  useEffect(() => {
    // connect to the server on mount
    async function connectSocket() {
      const jwt = await getAccessTokenSilently();
      socket.current = io("http://localhost:3000", {
        extraHeaders: {
          Authorization: `Bearer ${jwt}`,
        },
      });
    }
    connectSocket();

    // define how to handle new messages arriving
    socket.current?.on("newMessage", (newMessage: NewMessageDto) => {
      console.log("received message", newMessage);
    });

    // Disconnect on unmount
    return () => {
      socket.current?.disconnect();
    };
  }, []);

  const handleEnterChat: React.MouseEventHandler<HTMLButtonElement> = () => {
    setToId(userInput);

    // Fetch messages for the chat we enter
    async function fetchMessages() {
      const jwt = await getAccessTokenSilently();
      try {
        const result = await axios.get(
          `http://localhost:3000/messages/${userInput}`,
          { headers: { Authorization: `Bearer ${jwt}` } }
        );
        setMessages(result.data);
      } catch (e) {
        console.log("Error fetching message:", e);
      }
    }
    fetchMessages();
  };

  const handleExitChat: React.MouseEventHandler<HTMLButtonElement> = () => {
    setToId("");
    setMessages([]);
  };

  const handleSendMessage: React.MouseEventHandler<HTMLButtonElement> = () => {
    const newMessage: SendMessageDto = {
      toId: toId || "",
      text: messageInput,
      timestamp_utc: Date.now(),
    };
    console.log("sending", newMessage);
    socket.current?.emit("sendMessage", newMessage);
  };

  return (
    <>
      <p>Your user id is: {user?.sub}</p>
      {toId ? (
        <>
          <p>Chat with {toId}</p>
          <button onClick={handleExitChat}>exit</button>
          {messages.map((message) => (
            <p key={message.timestamp_utc}>
              {message.from}: {message.text}
            </p>
          ))}
          <input
            value={messageInput}
            onChange={(e) => setMessageInput(e.target.value)}
            placeholder="compose a message"
          ></input>
          <button onClick={handleSendMessage}>Send</button>
        </>
      ) : (
        <>
          <input
            type="text"
            onChange={(e) => setUserInput(e.target.value)}
            value={userInput}
            placeholder="Enter another user's id"
          ></input>
          <button onClick={handleEnterChat}>Enter chat</button>
        </>
      )}
    </>
  );
}
