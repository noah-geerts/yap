import { Layout, Typography, Flex, Select, Button, theme, Input } from "antd";
import type { Page } from "../App";
import { useEffect, useState } from "react";
import type { State } from "../domain/State";
import { CheckOutlined, EditOutlined, SaveOutlined } from "@ant-design/icons";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

type HomePageProps = {
  setCurrentPage: React.Dispatch<React.SetStateAction<Page>>;
  selectedRoom: string | undefined;
  setSelectedRoom: React.Dispatch<React.SetStateAction<string | undefined>>;
  name: string | undefined;
  setName: React.Dispatch<React.SetStateAction<string>>;
};

export default function HomePage({
  setCurrentPage,
  selectedRoom,
  setSelectedRoom,
  name,
  setName,
}: HomePageProps) {
  const token = theme.useToken();
  const [state, setState] = useState<State>("loading");
  const [rooms, setRooms] = useState([]);
  const [editingNameInput, setEditingNameInput] = useState(false);
  const [nameInput, setNameInput] = useState(name);

  // Upon the user seeing the page, load the rooms list
  useEffect(() => {
    fetch(import.meta.env.VITE_API_URL + "/rooms")
      .then((response) => response.json())
      .then((data) => {
        setRooms(data);
        setState("ok");
      })
      .catch(() => setState("error"));
  }, []);

  const handleJoin = () => {
    if (selectedRoom === undefined) return;
    setCurrentPage("chat");
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
          <Select
            placeholder="Choose a room"
            value={selectedRoom}
            onChange={setSelectedRoom}
            options={rooms.map((r) => ({ label: r, value: r }))}
            size="large"
            loading={state === "loading"}
          />
          <Text strong>Your name</Text>
          <Input
            placeholder="Your name"
            disabled={!editingNameInput}
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            size="large"
            suffix={
              editingNameInput ? (
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckOutlined />}
                  // when the user hits save, send an API call to the auth0 management API to update
                  // the name field on the user object, and either set the global user object to the returned
                  // updated object if that's how the API works, or manually update it depending on whether
                  // this API call is successful
                  onClick={() => setEditingNameInput(!editingNameInput)}
                  style={{ border: "none" }}
                />
              ) : (
                <Button
                  type="primary"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => setEditingNameInput(!editingNameInput)}
                  style={{ border: "none" }}
                />
              )
            }
          />
          <Button
            type="primary"
            size="large"
            disabled={!selectedRoom}
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
      <Header
        style={{
          background: token.token.colorBgContainer,
          borderBottom: `1px solid ${token.token.colorBorderSecondary}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Title level={3} style={{ margin: 0 }}>
          Welcome
        </Title>
      </Header>
      {content}
      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">Yap Demo Interface</Text>
      </Footer>
    </Layout>
  );
}
