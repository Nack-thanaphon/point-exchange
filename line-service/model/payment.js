import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  money: { type: Number, required: true },
  point: { type: Number, required: true },
  created_by: { type: String, required: true },
  created_at: { type: Date, required: true },
  updated_by: { type: String, required: true },
  updated_at: { type: Date, required: true },
});

const paymentModel = mongoose.model("payment", PaymentSchema);


async function createPayment(clientId, money, points, createdBy) {
  const payment = new paymentModel({
    clientId,
    money,
    point: points,
    created_by: createdBy,
    created_at: new Date(),
    updated_by: createdBy,
    updated_at: new Date()
  });
  await payment.save();
  return payment;
}
export {
  paymentModel,
  createPayment
};