import {
  Layout,
  Typography,
  Flex,
  Select,
  Button,
  theme,
  Input,
  notification,
} from "antd";
import type { Page } from "../App";
import { useEffect, useState } from "react";
import type { State } from "../domain/State";
import {
  CheckOutlined,
  EditOutlined,
  LoadingOutlined,
  SaveOutlined,
} from "@ant-design/icons";
import { useAuth0, type User } from "@auth0/auth0-react";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

type HomePageProps = {
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  selectedRoom: string | undefined;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | undefined>>;
  userInfo: User;
  setUserInfo: React.Dispatch<React.SetStateAction<User>>;
};

type InputState = "loading" | "editing" | "ok";

export default function HomePage({
  setCurrentPage,
  selectedRoom,
  setSelectedRoom,
  userInfo,
  setUserInfo,
}: HomePageProps) {
  const token = theme.useToken();
  const [loading, setLoading] = useState(false);
  const [api, contextHolder] = notification.useNotification();
  const [rooms, setRooms] = useState([]);
  const [nameInputState, setNameInputState] = useState<InputState>("ok");
  const [nameInput, setNameInput] = useState<string>(
    userInfo.user_metadata?.name || ""
  );
  const { user, getAccessTokenSilently, getAccessTokenWithPopup, logout } =
    useAuth0();

  // Function to load rooms list. Can't be triggered in a useEffect because it opens a popup and browsers will block it.
  const loadRooms = () => {
    getAccessTokenWithPopup({
      authorizationParams: {
        audience: "http://localhost:3000",
      },
    })
      .then((jwt) => {
        console.log(jwt);
        console.log("HI");
        fetch(import.meta.env.VITE_API_URL + "/rooms", {
          headers: { authorization: `Bearer ${jwt}` },
        })
          .then((response) => {
            if (!response.ok)
              throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
              );
            return response.json();
          })
          .then((data) => {
            setRooms(data);
            setLoading(false);
          })
          .catch((error) => {
            console.log(error);
            api.error({
              message:
                "Fetching rooms failed. Please ensure you have a stable network connection.",
            });
            setLoading(false);
          });
      })
      .catch((error) => {
        console.log(error);
        api.error({
          message:
            "Fetching rooms failed. Please ensure you don't have a popup blocker enabled.",
        });
        setLoading(false);
      });
  };

  // Function to call the Auth0 Management API to save changes to the user's name
  const handleSaveName: React.MouseEventHandler<HTMLElement> = () => {
    setNameInputState("loading");

    // If the user sub isn't available we have an authentication issue. Reset the name input and go back to ok state
    if (user?.sub === undefined || nameInput === "") {
      setNameInput(userInfo.user_metadata?.name || "");
      setNameInputState("ok");
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
      .then((jwt) => {
        // Send a patch request to update the user's information
        fetch(
          `https://dev-h60bzgedqbu866oj.us.auth0.com/api/v2/users/${user.sub}`,
          {
            method: "PATCH",
            headers: {
              authorization: `Bearer ${jwt}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ user_metadata: { name: nameInput } }),
          }
        )
          .then((response) => {
            if (!response.ok) throw new Error(response.statusText);
            return response.json();
          })
          .then((data) => {
            setUserInfo(data);
            setNameInputState("ok");
          })
          .catch((error) => {
            console.log(error);
            setNameInput(userInfo.user_metadata?.name || "");
            setNameInputState("ok");
          });
      })
      // If we can't get an access token we can't update the user info, so fall back
      .catch((error) => {
        console.log(error);
        setNameInput(userInfo.user_metadata?.name || "");
        setNameInputState("ok");
      });
  };

  const handleJoin = () => {
    if (selectedRoom === undefined || nameInputState !== "ok") return;
    setCurrentPage("chat");
  };

  const nameInputSuffix = () => {
    switch (nameInputState) {
      case "editing":
        return (
          <Button
            type="primary"
            size="small"
            icon={<CheckOutlined />}
            onClick={handleSaveName}
            style={{ border: "none" }}
          />
        );
      case "ok":
        return (
          <Button
            type="primary"
            size="small"
            icon={<EditOutlined />}
            onClick={() => setNameInputState("editing")}
            style={{ border: "none" }}
          />
        );
      default:
        return <LoadingOutlined />;
    }
  };

  const content = (
    <Content style={{ padding: "48px 32px" }}>
      <Flex vertical gap={32} align="center" style={{ width: "100%" }}>
        <Title level={2} style={{ textAlign: "center", marginBottom: 0 }}>
          Welcome to Yap 💬
        </Title>
        <Text type="secondary" style={{ textAlign: "center" }}>
          Select a room below to jump into the conversation.
        </Text>
        <Flex
          vertical
          gap={16}
          align="center"
          style={{ maxWidth: 420, width: "100%" }}
        >
          <Text strong>Select a room</Text>
          <Flex gap="small">
            <Select
              placeholder="Choose a room"
              value={selectedRoom}
              onChange={setSelectedRoom}
              options={rooms.map((r) => ({ label: r, value: r }))}
              size="large"
              loading={loading}
            />
            <Button size="large" onClick={loadRooms}>
              Load rooms
            </Button>
          </Flex>
          <Text strong>Your name</Text>
          <Input
            placeholder="Your name"
            disabled={nameInputState !== "editing"}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            size="large"
            suffix={nameInputSuffix()}
          />
          <Button
            type="primary"
            size="large"
            disabled={!selectedRoom || !userInfo.user_metadata?.name}
            onClick={handleJoin}
            block
          >
            Join Room
          </Button>
        </Flex>
      </Flex>
    </Content>
  );

  return (
    <Layout style={{ minHeight: "100%" }}>
      {contextHolder}
      <Header
        style={{
          background: token.token.colorBgContainer,
          borderBottom: `1px solid ${token.token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
        }}
      >
        <Button color="danger" variant="outlined" onClick={() => logout()}>
          Log out
        </Button>
      </Header>
      {content}
      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">Yap Demo Interface</Text>
      </Footer>
    </Layout>
  );
}
