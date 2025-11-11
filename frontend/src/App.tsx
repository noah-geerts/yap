import { useState } from "react";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";

export type Page = "home" | "chat";

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();

  if (currentPage === "home")
    return (
      <HomePage
        setCurrentPage={setCurrentPage}
        setSelectedRoom={setSelectedRoom}
        selectedRoom={selectedRoom}
      />
    );
  return <ChatPage room={selectedRoom!} setCurrentPage={setCurrentPage} />;
}
