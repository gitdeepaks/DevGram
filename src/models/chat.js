import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
	{
		content: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
		},
		text: {
			type: String,
			required: true,
		},
	},
	{ timestamps: true },
);

const chatSchema = new mongoose.Schema({
	participants: [
		{
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
		},
	],
	messages: [messageSchema],
});

export const ChatModel = mongoose.model("Chat", chatSchema);
