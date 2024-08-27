import clientModel from "../model/client.js";
import { paymentModel } from "../model/payment.js";
import { pointExchangeModel } from "../model/point_exchange.js";

export const totalPoint = async (clientId) => {
    const existingUser = await clientModel.findOne({ clientId });
    if (existingUser) {
        // Retrieve total points from paymentModel
        const totalPoints = await paymentModel.aggregate([
            { $match: { clientId } },
            { $group: { _id: null, total: { $sum: "$point" } } }
        ]);

        const exchangedPoints = await pointExchangeModel.aggregate([
            { $match: { clientId, status: 'success' } },
            { $group: { _id: null, total: { $sum: "$point" } } }
        ]);

        const userPoints = (totalPoints[0]?.total || 0) - (exchangedPoints[0]?.total || 0);
        return userPoints
    }
}