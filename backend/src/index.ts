// Bootstrap server
import app from "./controller/message.controller.js";

const port = 3000;

app.listen(port, () => {
  console.log(`App started on port ${port}`);
});
