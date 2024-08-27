import mongoose from "mongoose";
import { v4 as uuidv4 } from 'uuid';

const PointExchangeSchema = new mongoose.Schema({
  exchangeId: { type: String, required: true },
  clientId: { type: String, required: true },
  point: { type: Number, required: true },
  status: { type: String, required: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, required: true },
  updated_by: { type: String, required: true },
  updated_at: { type: Date, required: true },
});

const pointExchangeModel = mongoose.model("pointExchange", PointExchangeSchema);


// Function to create a point exchange
async function createPointExchange(clientId, points, status, createdBy) {
  const pointExchange = new pointExchangeModel({
    exchangeId: uuidv4(),
    clientId,
    point: points,
    status,
    created_by: createdBy,
    created_at: new Date(),
    updated_by: createdBy,
    updated_at: new Date()
  });
  await pointExchange.save();
  return pointExchange;
}

export  {
  pointExchangeModel,
  createPointExchange
};
