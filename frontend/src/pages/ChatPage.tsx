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
} from "antd";
const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;
import { ArrowLeftOutlined, SendOutlined } from "@ant-design/icons";
import { useState } from "react";
import type { Page } from "../App";

type Message = {
  room: string;
  from: string;
  timestamp_utc: number;
  text: string;
};

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
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      room: "general",
      from: "Alice",
      timestamp_utc: Date.now() - 1000 * 60 * 5,
      text: "Hey everyone! Welcome to the chat.",
    },
    {
      room: "general",
      from: "Bob",
      timestamp_utc: Date.now() - 1000 * 60 * 3,
      text: "Hi Alice! Glad to be here.",
    },
    {
      room: "general",
      from: "Charlie",
      timestamp_utc: Date.now() - 1000 * 60 * 2,
      text: "Looking forward to collaborating.",
    },
  ]);
  const [composeText, setComposeText] = useState("");

  const handleSend = () => {
    if (!composeText.trim()) return;
    const newMessage: Message = {
      room: room,
      from: name,
      timestamp_utc: Date.now(),
      text: composeText.trim(),
    };
    setMessages((prev) => [newMessage, ...prev]); // prepend for reverse chronological list
    setComposeText("");
  };
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
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => setCurrentPage("home")}
            style={{ marginLeft: 8, marginRight: 8 }}
          >
            Back
          </Button>
          <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
            <Title level={4} style={{ margin: 0, textAlign: "center" }}>
              {room}
            </Title>
          </div>
        </div>
      </Header>
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
    </Layout>
  );
}
