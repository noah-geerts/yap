import { useAuth0 } from "@auth0/auth0-react";

export default function OuterApp() {
  const { loginWithRedirect, logout } = useAuth0();

  return (
    <>
      <p>Welcome to Yap</p>
      <button onClick={() => loginWithRedirect()}>Log in</button>
      <button onClick={() => logout()}>reset auth</button>
    </>
  );
}
