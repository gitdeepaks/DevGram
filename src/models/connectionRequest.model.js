import mongoose from "mongoose";

const connectionRequestSchema = new mongoose.Schema(
	{
		fromUserId: {
			type: mongoose.Schema.Types.ObjectId,
			required: true,
		},
		toUserId: {
			type: mongoose.Schema.Types.ObjectId,
		},
		status: {
			type: String,
			required: true,
			enum: ["ignored", "interested", "accepted", "rejected"],
		},
	},
	{
		timestamps: true,
	}
);

connectionRequestSchema.index({ fromUserId: 1, toUserId: 1 });

connectionRequestSchema.pre("save", async function () {
	const connectionsRequest = this;

	// Check if my fromUserId is the same as the toUserId
	if (connectionsRequest.fromUserId.equals(connectionsRequest.toUserId)) {
		throw new Error("You cannot send a connection request to yourself");
	}
});

export const ConnectionRequestModel = new mongoose.model(
	"ConnectionRequestModel",
	connectionRequestSchema
);
