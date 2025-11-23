import Layout, { Content } from "antd/es/layout/layout";
import { Flex } from "antd";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "antd";
import Title from "antd/es/typography/Title";
import InnerApp from "./InnerApp";

export type Page = "home" | "chat";

export default function App() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();

  // Render inner app content if authenticated
  if (isAuthenticated) return <InnerApp />;

  // Unauthenticated screen
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
}
