import { useEffect, useState } from "react";
import ChatPage from "./pages/ChatPage";
import HomePage from "./pages/HomePage";
import Layout, { Content } from "antd/es/layout/layout";
import { Flex } from "antd";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "antd";
import Title from "antd/es/typography/Title";

export type Page = "home" | "chat";

export default function App() {
  const { user } = useAuth0();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();
  const [name, setName] = useState<string>(user?.name || "");
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // Upon the app loading, fetch the user's information from the auth0 management API
  useEffect(() => {}, []);

  if (!isAuthenticated)
    return (
      <Layout style={{ minHeight: "100%" }}>
        <Content>
          <Flex
            vertical
            align="center"
            justify="center"
            style={{ width: "100%", height: "100%" }}
          >
            <Title>Welcome to Yap</Title>
            <Button
              type="primary"
              size="large"
              onClick={() => loginWithRedirect()}
            >
              Log in
            </Button>
          </Flex>
        </Content>
      </Layout>
    );
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
