import mongoose from "mongoose";

const ClientSchema = new mongoose.Schema({
  clientId: { type: String, required: true },
  displayName: { type: String, required: true },
  phone: { type: String },
  role: { type: String },
  pictureUrl: { type: String, required: true }
});

const clientModel = mongoose.model("Client", ClientSchema);

export default clientModel;
