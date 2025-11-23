import { useEffect, useState } from "react";
import type { Page } from "./App";
import HomePage from "./pages/HomePage";
import ChatPage from "./pages/ChatPage";
import { useAuth0, User } from "@auth0/auth0-react";
import type { State } from "./domain/State";
import { Content } from "antd/es/layout/layout";
import { Spin, Typography } from "antd";
const { Text } = Typography;

export default function InnerApp() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [selectedRoom, setSelectedRoom] = useState<string | undefined>();
  const [userInfo, setUserInfo] = useState<User>({});
  const { getAccessTokenSilently, user } = useAuth0();
  const [state, setState] = useState<State>("loading");

  // Upon the inner app loading, fetch the user's information from the Auth0 Management API
  useEffect(() => {
    // If the user's id isn't available for some reason, we have an authentication error
    if (user?.sub === undefined) {
      setState("error");
      return;
    }

    // Fetch a jwt for the Auth0 Management API
    getAccessTokenSilently({
      // Explicitly specify the scope and API for this JWT
      authorizationParams: {
        scope:
          "read:current_user update:current_user_identities update:current_user_metadata",
        audience: "https://dev-h60bzgedqbu866oj.us.auth0.com/api/v2/",
      },
    })
      .then((jwt) =>
        // Send a get request for the user's information
        fetch(
          `https://dev-h60bzgedqbu866oj.us.auth0.com/api/v2/users/${user?.sub}`,
          { headers: { authorization: `Bearer ${jwt}` } }
        )
          .then((response) => {
            if (!response.ok) {
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            }
            return response.json();
          })
          .then((data) => {
            setUserInfo(data);
            setState("ok");
          })
          .catch((error) => {
            console.error("Failed to fetch user info:", error);
            setState("error");
          })
      )
      .catch((error) => {
        console.error("Failed to get access token:", error);
        setState("error");
      });
  }, []);

  if (state === "loading")
    return (
      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Spin size="large"></Spin>
      </Content>
    );

  if (state === "error")
    return (
      <Content
        style={{
          display: "flex",
          flexDirection: "column",
          padding: 0,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text>Error loading user information</Text>
      </Content>
    );

  if (currentPage === "home")
    return (
      <HomePage
        userInfo={userInfo}
        setUserInfo={setUserInfo}
        setCurrentPage={setCurrentPage}
        setSelectedRoom={setSelectedRoom}
        selectedRoom={selectedRoom}
      />
    );
  return (
    <ChatPage
      room={selectedRoom!}
      setCurrentPage={setCurrentPage}
      userInfo={userInfo}
    />
  );
}
