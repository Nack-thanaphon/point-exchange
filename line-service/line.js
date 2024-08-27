import http from "http";
import express from "express";
import cors from "cors";
import axios from "axios";
import * as dotenv from "dotenv";
import { sendLine } from "./utility/line-template.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;


// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Webhook and API routes
app.post("/webhook", async (req, res) => {
  const replyToken = req.body.events[0]?.replyToken;
  if (replyToken) {
    const dataString = req.body.events[0].message.text
    const userId = req.body.events[0].source.userId;
    console.log(dataString)

    if (dataString === "คะแนนของฉัน") {
      //  await line
      await CheckPoint(userId);
      res.status(200).send("get webhook");
    }

  } else {
    res.status(400).send("Invalid request");
  }
});


server.listen(PORT, () => {
  console.log(`Server listening at Port :${PORT}`)
});
