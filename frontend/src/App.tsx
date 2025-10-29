import { useAuth0 } from "@auth0/auth0-react";
import InnerApp from "./InnerApp";
import OuterApp from "./OuterApp";

function App() {
  const { isAuthenticated } = useAuth0();

  if (isAuthenticated) return <InnerApp />;
  return <OuterApp />;
}

export default App;
