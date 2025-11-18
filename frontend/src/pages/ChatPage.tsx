import {
  Layout,
  Typography,
  Flex,
  Select,
  Button,
  theme,
  Input,
  Avatar,
  Tag,
  Spin,
} from "antd";
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import type { Page } from "../App";
import type { State } from "../domain/State";
import type { Message } from "../domain/Message";

type ChatPageProps = {
  room: string;
  name: string;
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
};

export default function ChatPage({
  room,
  name,
  setCurrentPage,
}: ChatPageProps) {
  const token = theme.useToken();
  const ws = useRef<WebSocket | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const [state, setState] = useState<State>("loading");
  const [messages, setMessages] = useState<Message[]>([]);
  const [composeText, setComposeText] = useState("");

  // Scroll to bottom upon receiving new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fetch messages for the room when initially loading the view (on mount)
  // and establish a WebSocket connection to the backend for live messages
  useEffect(() => {
    // Fetch old messages
    fetch(`http://localhost:3000/messages/${room}`)
      .then((response) => response.json())
      .then((data) => {
        setMessages(data);
        setState("ok");
      })
      .catch((e) => setState("error"));

    // Websocket connection
    ws.current = new WebSocket(`ws://localhost:3000/messages?room=${room}`);
    ws.current.onopen = () => {
      console.log("OPEN");
    };
    ws.current.onclose = () => {
      console.log("CLOSE");
    };
    ws.current.onmessage = (event) => {
      const data: string = event.data;
      try {
        const message: Message = JSON.parse(data);
        setMessages((prev) => [message, ...prev]);
      } catch (e) {
        console.log("Invalid JSON received in websocket event");
      }
    };

    // Close connection on dismount
    return () => {
      ws.current?.close();
    };
  }, [room]);

  const handleSend = () => {
    if (!composeText.trim()) return;
    const newMessage: Message = {
      room: room,
      from: name,
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
            return (
              <div
                key={`${item.timestamp_utc}-${item.from}-${item.text}`}
                style={{
                  background: token.token.colorBgContainer,
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
                    <Tag color="blue" style={{ margin: 0 }}>
                      {date.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Tag>
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
