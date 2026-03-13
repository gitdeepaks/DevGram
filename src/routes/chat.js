import express from "express";
import { userAuth } from "../middlewares/auth.middleware";
import { ChatModel } from "../models/chat";

export const chatRouter = express.Router();

chatRouter.get("/chat/:targetUserId", userAuth, async (req, res) => {
	const { targetUserId } = req.params;
	const userId = req.user._id;
	try {
		let chat = await ChatModel.findOne({
			participants: { $all: [userId, targetUserId] },
		}).populate({
			path: "messages.content",
			select: "firstName lastName photoUrl",
		});

		if (!chat) {
			chat = await ChatModel.create({
				participants: [userId, targetUserId],
				messages: [],
			});
		}

		res.json(chat);
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});
