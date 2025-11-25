import {
  Layout,
  Typography,
  Flex,
  Button,
  theme,
  Input,
  Avatar,
  Tag,
  Spin,
} from "antd";
const { Header, Content } = Layout;
const { Title, Text } = Typography;
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState, useCallback } from "react";
import type { Page } from "../App";
import type { State } from "../domain/State";
import type { Message } from "../domain/Message";
import { useAuth0, type User } from "@auth0/auth0-react";

type ChatPageProps = {
  room: string;
  userInfo: User;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
};

export default function ChatPage({
  room,
  userInfo,
  setCurrentPage,
}: ChatPageProps) {
  const token = theme.useToken();
  const ws = useRef<WebSocket | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<State>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [composeText, setComposeText] = useState("");
  const { getAccessTokenSilently } = useAuth0();

  // Scroll to bottom upon receiving new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchMessagesAndConnect = useCallback(
    (jwt: string) => {
      // Close any existing connection first
      if (ws.current) {
        ws.current.close();
        ws.current = undefined;
      }

      // Fetch old messages
      fetch(import.meta.env.VITE_API_URL + `/messages/${room}`, {
        headers: { authorization: `Bearer ${jwt}` },
      })
        .then((response) => {
          if (!response.ok)
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          return response.json();
        })
        .then((data) => {
          setMessages(data);
          setState("ok");
        })
        .catch((error) => {
          console.log(error);
          setState("error");
        });

      // Websocket connection
      ws.current = new WebSocket(
        import.meta.env.VITE_WS_URL + `/messages?room=${room}&auth=${jwt}`
      );
      ws.current.onmessage = (event) => {
        const data: string = event.data;
        try {
          const message: Message = JSON.parse(data);
          setMessages((prev) => [message, ...prev]);
        } catch (e) {
          console.log("Invalid JSON received in websocket event");
        }
      };
    },
    [room]
  );

  // Fetch messages for the room when initially loading the view (on mount)
  // and establish a WebSocket connection to the backend for live messages
  useEffect(() => {
    // Fetch old messages and connect to the WebSocket
    getAccessTokenSilently({
      authorizationParams: {
        audience: "http://localhost:3000",
      },
    })
      .then((jwt) => {
        fetchMessagesAndConnect(jwt);
      })
      .catch((error) => {
        console.log(error);
        setState("error");
      });

    // Close connection on dismount or room change
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = undefined;
      }
    };
  }, [room, fetchMessagesAndConnect]);

  const handleSend = () => {
    if (!composeText.trim() || !userInfo.user_metadata.name) return; // TODO handle the user's name not being loaded more elegantly
    const newMessage: Message = {
      room: room,
      from: userInfo.user_metadata.name,
      timestamp_utc: Date.now(),
      text: composeText.trim(),
    };
    ws.current?.send(JSON.stringify(newMessage));
    setComposeText("");
  };

  const content = (
    <Content
      style={{
        display: "flex",
        flexDirection: "column",
        padding: 0,
      }}
    >
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px 32px 16px 32px",
          background: token.token.colorBgLayout,
        }}
      >
        <Flex vertical style={{ flexDirection: "column-reverse", gap: 16 }}>
          <div ref={bottomRef}></div>
          {messages.map((item) => {
            const date = new Date(item.timestamp_utc);
            console.log(item.from);
            console.log(userInfo?.user_metadata.name);
            return (
              <div
                key={`${item.timestamp_utc}-${item.from}-${item.text}`}
                style={{
                  backgroundColor:
                    item.from === userInfo?.user_metadata.name
                      ? "#F6FFFF"
                      : token.token.colorBgContainer,
                  border: `1px solid ${token.token.colorBorderSecondary}`,
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <Flex vertical gap={4} style={{ width: "100%" }}>
                  <Flex
                    align="center"
                    justify="space-between"
                    style={{ width: "100%" }}
                  >
                    <Flex align="center" gap={8}>
                      <Avatar size="small">
                        {item.from.charAt(0).toUpperCase()}
                      </Avatar>
                      <Text strong>{item.from}</Text>
                    </Flex>
                    <Flex gap={8} justify="space-between">
                      {item.from === userInfo?.user_metadata.name && (
                        <Tag color="purple" style={{ margin: 0 }}>
                          You
                        </Tag>
                      )}
                      <Tag color="blue" style={{ margin: 0 }}>
                        {date.toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Tag>
                    </Flex>
                  </Flex>
                  <Text>{item.text}</Text>
                </Flex>
              </div>
            );
          })}
        </Flex>
      </div>
      <div
        style={{
          borderTop: `1px solid ${token.token.colorBorderSecondary}`,
          padding: 16,
          background: token.token.colorBgContainer,
        }}
      >
        <Flex gap={12} style={{ width: "100%" }}>
          <Input.TextArea
            autoSize={{ minRows: 1, maxRows: 4 }}
            placeholder="Type a message"
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            onPressEnter={(e) => {
              if (!e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!composeText.trim()}
          >
            Send
          </Button>
        </Flex>
      </div>
    </Content>
  );

  return (
    <Layout style={{ minHeight: "100%" }}>
      <Header
        style={{
          background: token.token.colorBgContainer,
          borderBottom: `1px solid ${token.token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          padding: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", width: "100%" }}>
          <div style={{ flex: 1 }}>
            <Button
              icon={<ArrowLeftOutlined />}
              onClick={() => setCurrentPage("home")}
              style={{ marginLeft: 8, marginRight: 8 }}
            >
              Back
            </Button>
          </div>

          <div style={{ flex: 5, display: "flex", justifyContent: "center" }}>
            <Title level={4} style={{ margin: 0, textAlign: "center" }}>
              {room}
            </Title>
          </div>
          <div style={{ flex: 1 }}></div>
        </div>
      </Header>
      {state === "loading" ? (
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
      ) : state === "error" ? (
        <Content
          style={{
            display: "flex",
            flexDirection: "column",
            padding: 0,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text>Error fetching messages for this room</Text>
        </Content>
      ) : (
        content
      )}
    </Layout>
  );
}
