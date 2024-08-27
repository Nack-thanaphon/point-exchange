import http from "http";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import kafka from "kafka-node";
import { Server as SocketIoServer } from "socket.io";
import Redis from "ioredis";
import axios from "axios";
import QRCode from 'qrcode';
import * as dotenv from "dotenv";
import exchangeLimiter from "./utility/rateLimit.js";
import clientModel from "./model/client.js";
import { paymentModel, createPayment } from "./model/payment.js";
import { pointExchangeModel, createPointExchange } from "./model/point_exchange.js";
import { checkPoint, successPoint } from "./utility/line-template.js";
import { totalPoint } from "./utility/util.js";


dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new SocketIoServer(server
  , {
    cors: {
      origin: [
        process.env.CLIENT_URL,
      ],
      methods: ['GET', 'POST'],
      allowedHeaders: ['Content-Type'],
      credentials: true,
      transports: ["websocket"],
      secure: true
    }
  }
);
const redis = new Redis(process.env.REDIS_URL || "redis://redis:6379");
const PORT = process.env.PORT || 3000;
const TOKEN = process.env.LINE_CHANNEL_TOKEN;

// MongoDB connection
mongoose.connect(process.env.MONGODB_URL || 'mongodb://localhost:27017/exchange', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => console.log("mongoDB is Connected")).catch(console.error);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Kafka setup
const kafkaClient = new kafka.KafkaClient({ kafkaHost: process.env.KAFKA_URL || 'kafka:9092' });
const producer = new kafka.Producer(kafkaClient);
const consumer = new kafka.Consumer(kafkaClient, [{ topic: 'exchange-topic', partition: 0 }], { autoCommit: true });

// Send exchange request to Kafka
app.post('/exchange', exchangeLimiter, async (req, res) => {
  const { clientId, points } = req.body;
  // Check cache first
  let userPoints = await clientModel.findOne({ clientId });
  if (userPoints === null) {
    // Check if user exists
    const userExists = await clientModel.findOne({ clientId });
    if (!userExists) {
      return res.status(404).send('ไม่พบข้อมูลผู้ใช้งาน');
    }
    // Retrieve total points from paymentModel
    const totalPoints = await paymentModel.aggregate([
      { $match: { clientId } },
      { $group: { _id: null, total: { $sum: "$point" } } }
    ]);

    // Retrieve total exchanged points from pointExchangeModel
    const exchangedPoints = await pointExchangeModel.aggregate([
      { $match: { clientId, status: 'success' } },
      { $group: { _id: null, total: { $sum: "$point" } } }
    ]);

    userPoints = (totalPoints[0]?.total || 0) - (exchangedPoints[0]?.total || 0);
    // Store user points in Redis cache
    await redis.set(clientId, userPoints);
  } else {
    userPoints = parseInt(userPoints, 10);
  }

  if (userPoints < points) {
    return res.status(400).send('คะแนนไม่เพียงพอสำหรับการแลกเปลี่ยน');
  }

  // Update cache
  await redis.set(clientId, userPoints - points);

  producer.send([{ topic: 'exchange-topic', messages: JSON.stringify({ clientId, points }) }], (err) => {
    if (err) return res.status(500).send('เกิดข้อผิดพลาด');
    res.status(200).send('ส่งคำขอแลกเปลี่ยนเรียบร้อยแล้ว');
    console.log(`ส่งคำขอแลกเปลี่ยนเรียบร้อยแล้ว: ${clientId} ==> ${points}`);
  });
});
// API endpoint to create a payment
app.post('/create-payment', exchangeLimiter, async (req, res) => {
  const { clientId, money, points, createdBy } = req.body;
  try {
    const payment = await createPayment(clientId, money, points, createdBy);
    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create payment' });
  }
});
// API endpoint to create a point exchange
app.post('/create-point-exchange', async (req, res) => {
  const { clientId, points, status, createdBy } = req.body;
  try {
    const pointExchange = await createPointExchange(clientId, points, status, createdBy);
    res.status(201).json(pointExchange);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create point exchange' });
  }
});

app.post('/create-user', async (req, res) => {
  const { clientId, displayName, pictureUrl } = req.body;
  const role = 'client';
  try {
    const existingUser = await clientModel.findOne({ clientId });
    if (existingUser) {
      // Retrieve total points from paymentModel
      const totalPoints = await paymentModel.aggregate([
        { $match: { clientId } },
        { $group: { _id: null, total: { $sum: "$point" } } }
      ]);

      console.log('totalPoints', totalPoints)

      // Retrieve total exchanged points from pointExchangeModel
      const exchangedPoints = await pointExchangeModel.aggregate([
        { $match: { clientId, status: 'success' } },
        { $group: { _id: null, total: { $sum: "$point" } } }
      ]);

      const userPoints = (totalPoints[0]?.total || 0) - (exchangedPoints[0]?.total || 0);
      return res.status(200).json({ ...existingUser.toObject(), points: userPoints });
    }

    const newUser = new clientModel({ clientId, role, displayName, pictureUrl });
    await newUser.save();
    const userPoints = 0;
    res.status(200).json({ ...newUser.toObject(), points: userPoints });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.get('/get-point/:clientId', async (req, res) => {
  const { clientId } = req.params;

  try {
    const existingUser = await clientModel.findOne({ clientId });
    if (existingUser) {
      // Retrieve total points from paymentModel
      const totalPoints = await paymentModel.aggregate([
        { $match: { clientId } },
        { $group: { _id: null, total: { $sum: "$point" } } }
      ]);

      console.log('totalPoints', totalPoints);

      // Retrieve total exchanged points from pointExchangeModel
      const exchangedPoints = await pointExchangeModel.aggregate([
        { $match: { clientId, status: 'success' } },
        { $group: { _id: null, total: { $sum: "$point" } } }
      ]);

      console.log('exchangedPoints', exchangedPoints);

      const userPoints = (totalPoints[0]?.total || 0) - (exchangedPoints[0]?.total || 0);
      return res.status(200).json({ points: userPoints });
    } else {
      return res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/exchange-list/:clientId', async (req, res) => {
  const { clientId } = req.params;

  try {
    const exchanges = await pointExchangeModel.find({
      clientId: clientId,
      status: 'success'
    }).sort({ created_at: -1 }).limit(10);
    res.status(200).json(exchanges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data exchange list' });
  }
});


app.get('/exchange-list', async (req, res) => {

  try {
    const exchanges = await pointExchangeModel.find().sort({ created_at: -1 }).limit(10);
    res.status(200).json(exchanges);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve data exchange list' });
  }
});

// Webhook and API routes
app.post("/webhook", async (req, res) => {
  const replyToken = req.body.events[0]?.replyToken;
  if (replyToken) {
    const dataString = req.body.events[0].message.text
    const userId = req.body.events[0].source.userId;
    // const point = await totalPoint(userId);
    if (dataString === "คะแนนของฉัน") {
      await checkPoint(userId, 300);
      res.status(200).send("get webhook");
    }
  } else {
    res.status(400).send("Invalid request");
  }
});


app.get("/getTotalSend", async (req, res) => {
  try {
    const token = TOKEN;
    const [quota, usage] = await Promise.all([
      axios.get("https://api.line.me/v2/bot/message/quota", { headers: { Authorization: `Bearer ${token}` } }),
      axios.get("https://api.line.me/v2/bot/message/quota/consumption", { headers: { Authorization: `Bearer ${token}` } })
    ]);
    res.status(200).json({ message: "success", limit: quota.data.value, total: usage.data.totalUsage });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

consumer.on('message', async (message) => {
  const { clientId, points } = JSON.parse(message.value);
  const save = await createPointExchange(clientId, points, 'pending', clientId);
  const qrCodeData = {
    exchangeId: save.exchangeId,
    points: save.points
  };
  const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));
  await redis.set(`exchange:${qrCodeData.exchangeId}`, JSON.stringify(qrCodeData), 'EX', 60 * 10);
  io.emit('my-qrcode', {
    exchangeId: save.exchangeId,
    clientId: save.clientId,
    qrCode
  });
});

consumer.on('error', console.error);

// Socket.IO events
io.on('connection', (socket) => {
  console.log('Admin connected');
  socket.on('scan-qr', async ({ exchangeId }) => {
    console.log(`Admin scanning QR with exchangeId: ${exchangeId}`);
    // Use the correct field type for exchangeId

    const payment = await pointExchangeModel.findOne({ exchangeId: exchangeId });
    if (payment) {
      if (payment.status === 'success') {
        console.log(`Admin scanning exchangeId: ${exchangeId} expired`);
        io.emit('exchange-result', {
          exchangeId: exchangeId,
          success: false,
          message: 'QR code is expired'
        });
      } else {
        console.log(`Admin scanning exchangeId: ${exchangeId} success`);

        await pointExchangeModel.findOneAndUpdate(
          { exchangeId: exchangeId },
          { status: 'success', updated_at: new Date() }
        );

        await successPoint(payment.clientId, payment.point, payment.point);
        io.emit('exchange-result', { exchangeId: exchangeId, success: true });
      }
    } else {
      console.log(`Admin scanning exchangeId: ${exchangeId} fail`);
      io.emit('exchange-result', { exchangeId: exchangeId, success: false });
    }
  });

  socket.on('disconnect', () => {
    console.log('Admin disconnected');
  });
});


server.listen(PORT, () => {
  console.log('KAFKA_URL ===>', process.env.KAFKA_URL)
  console.log(`Server listening at Port :${PORT}`)
});
