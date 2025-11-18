import { useState } from "react";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";

export type Page = "home" | "chat";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();
  const [name, setName] = useState<string>("");

  if (currentPage === "home")
    return (
      <HomePage
        name={name}
        setName={setName}
        setCurrentPage={setCurrentPage}
        setSelectedRoom={setSelectedRoom}
        selectedRoom={selectedRoom}
      />
    );
  return (
    <ChatPage
      room={selectedRoom!}
      setCurrentPage={setCurrentPage}
      name={name}
    />
  );
}
