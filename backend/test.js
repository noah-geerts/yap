// install first: npm install socket.io-client
import { io } from 'socket.io-client';

const token =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImZFY0xJaU5pVEF3TG5wb2xoaFQwSyJ9.eyJpc3MiOiJodHRwczovL2Rldi1oNjBiemdlZHFidTg2Nm9qLnVzLmF1dGgwLmNvbS8iLCJzdWIiOiJhdXRoMHw2OTAxOWFkZDY1MTQ4YmQ3NTVlODNhZTkiLCJhdWQiOlsiaHR0cDovL2xvY2FsaG9zdDozMDAwIiwiaHR0cHM6Ly9kZXYtaDYwYnpnZWRxYnU4NjZvai51cy5hdXRoMC5jb20vdXNlcmluZm8iXSwiaWF0IjoxNzYxNzE0Mzg5LCJleHAiOjE3NjE4MDA3ODksInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwiLCJhenAiOiJvQ2hMMWNGN3oyczBIQUhwVlZFeWxIOUMwbGFPZlhrZiJ9.MrE0A6BWLNzAfR9x2POPEO4W5HFIGIlKJN3TQnsULPak6eVyOQ1zqOiUr6yx1J4FUGZBzqTq89yKr1XIYfZzruQd4d-pqXrhh5tQB92h6tHsb8ipK0IrYY_dGh33FmcFMF0CY3lZ6HsB7rIqZv3_Gf9t0wcDKjMLXbr0XITgSJX5SkU5i22Sc1gW8vc2KuvS0JN3xiSFcCOJOIwnPqyEERmVrw99yHKR4rNzxInfobDf7dvQvjp7ORQzxqBnMXbGg3RfB5E-j1rfm4jpHe72yQJck08JvCIiz_2UtWtTkROLG8UATTW8ZctUUmI5Gq3Sm_K4uhiQjexbgGmoX0Szyw';

const socket = io('http://localhost:3000', {
  extraHeaders: {
    Authorization: `Bearer ${token}`,
  },
});

socket.on('connect', () => {
  console.log('CONNECTING');
});

const sendMessageDto = {
  toId: 'dad',
  timestamp_utc: 5,
  text: 'hi',
};
for (let i = 0; i < 3; i++) {
  socket.emit('sendMessage', { ...sendMessageDto, timestamp_utc: i });
}

socket.on('messageStatus', (status) => {
  console.log(status);
});

socket.on('disconnect', (reason) => {
  console.log('DISCONNECTING');
  console.log(reason);
});

socket.on('connect_error', (reason) => {
  console.log('connect_error');
  console.log(reason);
});

socket.on('connect_failed', (reason) => {
  console.log('connect_failed');
  console.log(reason);
});
