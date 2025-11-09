// Bootstrap server
import server from "./controller/server.js";

const port = 3000;

server.listen(port, () => {
  console.log(`App started on port ${port}`);
});
