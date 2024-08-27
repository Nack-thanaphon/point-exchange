// import { io, redis } from './server.js'; // Import shared instances
// import kafka from "kafka-node";
// import { v4 as uuidv4 } from 'uuid';
// import QRCode from 'qrcode';

// const kafkaClient = new kafka.KafkaClient({ kafkaHost: 'kafka:9092' });
// const consumer = new kafka.Consumer(kafkaClient, [{ topic: 'exchange-topic', partition: 0 }], { autoCommit: true });

// consumer.on('message', async (message) => {
//   const { clientId, points } = JSON.parse(message.value);
//   const qrCodeData = { exchangeId: uuidv4(), clientId, points };
//   const qrCode = await QRCode.toDataURL(JSON.stringify(qrCodeData));

//   // Store data in Redis (if needed)
//   await redis.set(`exchange:${qrCodeData.exchangeId}`, JSON.stringify(qrCodeData), 'EX', 60 * 10); // Expires in 10 minutes
//   console.log('qrCode', qrCode)
//   io.emit('my-qrcode', { clientId, qrCode });
// });

// consumer.on('error', console.error);