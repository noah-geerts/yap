import { Layout, Typography, Flex, Select, Button, theme, Input } from "antd";
import type { Page } from "../App";

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

const rooms = ["general", "random", "support", "development"];

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

  const handleJoin = () => {
    if (selectedRoom === undefined) return;
    setCurrentPage("chat");
  };

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
            />
            <Input
              placeholder="Choose a name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              size="large"
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
      <Footer style={{ textAlign: "center" }}>
        <Text type="secondary">Yap Demo Interface</Text>
      </Footer>
    </Layout>
  );
}
