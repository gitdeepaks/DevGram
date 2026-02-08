import mongoose from "mongoose";

const paymentSchema = mongoose.Schema(
	{
		userId: {
			type: mongoose.Types.ObjectId,
			ref: "User",
			required: true,
		},
		paymentId: {
			type: String,
		},
		orderId: {
			type: String,
			required: true,
		},
		amount: {
			type: Number,
			required: true,
		},
		currency: {
			type: String,
			required: true,
		},
		status: {
			type: String,
			required: true,
		},
		notes: {
			type: Object,
			required: true,
		},
	},
	{ timestamps: true }
);

export const PaymentModel = mongoose.model("Payment", paymentSchema);
