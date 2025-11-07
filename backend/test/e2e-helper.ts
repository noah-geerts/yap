// Fetches a legitimate jwt from the auth0 server for testing auth guards
export async function getToken() {
  try {
    const response = await fetch(
      'https://dev-h60bzgedqbu866oj.us.auth0.com/oauth/token',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          client_id: process.env.AUTH0_CLIENT_ID,
          client_secret: process.env.AUTH0_CLIENT_SECRET,
          audience: 'http://localhost:3000',
          grant_type: 'client_credentials',
        }),
      },
    );

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching token:', error);
  }
}
