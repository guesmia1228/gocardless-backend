const express = require("express");
const cors = require('cors');
const dotenv = require("dotenv");
dotenv.config();

const router = require("./routes");

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api", router);

app.listen(3000, () => {
  console.log("Listening to port 3000");
});
