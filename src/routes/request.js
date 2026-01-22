import express from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import { ConnectionRequestModel as ConnectionRequest } from "../models/connectionRequest.model.js";
import { User } from "../models/user.model.js";

export const requestRouter = express.Router();

requestRouter.post("/request/status/:status/:toUserId", userAuth, async (req, res) => {
	try {
		const fromUserId = req.user._id;
		const toUserId = req.params.toUserId;
		const status = req.params.status;

		const allowedStatus = ["ignored", "interested"];

		if (!allowedStatus.includes(status)) {
			return res.status(400).json({ error: `Invalid status: ${status}` });
		}

		// Check if user is trying to send request to themselves
		if (toUserId.toString() === fromUserId.toString()) {
			return res.status(400).json({ error: "You cannot send a connection request to yourself" });
		}

		const toUser = await User.findById(toUserId);
		if (!toUser) {
			return res.status(400).json({ error: "User not found" });
		}

		// Check if there is an existing connectionRequest in either direction
		const existingConnectionRequest = await ConnectionRequest.findOne({
			$or: [
				{
					fromUserId,
					toUserId,
				},
				{
					fromUserId: toUserId,
					toUserId: fromUserId,
				},
			],
		});

		// If request exists, update it; otherwise create new one
		let savedConnectionRequest;
		if (existingConnectionRequest) {
			existingConnectionRequest.status = status;
			savedConnectionRequest = await existingConnectionRequest.save();
		} else {
			const connectionRequest = new ConnectionRequest({
				fromUserId,
				toUserId,
				status,
			});
			savedConnectionRequest = await connectionRequest.save();
		}
		res.json({
			message: `${req.user.firstName} is ${status} to ${toUser.firstName}`,
			data: savedConnectionRequest,
		});
	} catch (error) {
		res.status(400).json({ error: error.message });
	}
});
