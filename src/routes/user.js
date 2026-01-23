import express from "express";
import { userAuth } from "../middlewares/auth.middleware.js";
import { ConnectionRequestModel } from "../models/connectionRequest.model.js";
import { User } from "../models/user.model.js";

export const userRouter = express.Router();

const USER_SAFE_DATA = ["firstName", "lastName", "photoUrl", "age", "about", "skills", "gender"];

// get all the pensing connection request for the logged in user
userRouter.get("/user/request/recieved", userAuth, async (req, res) => {
	try {
		const loggedInUser = req.user;
		const connectionRequest = await ConnectionRequestModel.find({
			toUserId: loggedInUser._id,
			status: "interested",
		}).populate("fromUserId", USER_SAFE_DATA);
		res.json({
			message: "Connection requests received",
			data: connectionRequest,
		});
	} catch (error) {
		res.status(400).json({
			error: `Failed to get the connection ${error.message}`,
		});
	}
});

userRouter.get("/user/connections", userAuth, async (req, res) => {
	try {
		const loggedInUser = req.user;
		const connectionRequest = await ConnectionRequestModel.find({
			$or: [
				{
					toUserId: loggedInUser._id,
					status: "accepted",
				},
				{
					fromUserId: loggedInUser._id,
					status: "accepted",
				},
			],
		})
			.populate("fromUserId", USER_SAFE_DATA)
			.populate("toUserId", USER_SAFE_DATA);

		// console.log(connectionRequest);

		const data = connectionRequest.map((row) =>
			row.fromUserId._id.toString() === loggedInUser._id.toString() ? row.toUserId : row.fromUserId
		);
		res.json({
			message: "Connections",
			data: data,
		});
	} catch (error) {
		res.status(400).json({
			error: `Failed to get the connections ${error.message}`,
		});
	}
});

userRouter.get("/user/feed", userAuth, async (req, res) => {
	try {
		// user shouild see all the user cards except
		//0. his own card
		//1. his connections
		//2. ignored poeple
		//3. already sent the connection request

		const loggedInUser = req.user;

		const page = parseInt(req.query.page) || 1;
		let limit = parseInt(req.query.limit) || 10;

		limit = limit > 50 ? 50 : limit;

		const skip = (page - 1) * limit;

		const connectionRequest = await ConnectionRequestModel.find({
			$or: [
				{
					fromUserId: loggedInUser._id,
				},
				{
					toUserId: loggedInUser._id,
				},
			],
		}).select(["fromUserId", "toUserId"]);

		const hideUsersFromFeed = new Set();

		connectionRequest.forEach((req) => {
			hideUsersFromFeed.add(req.fromUserId.toString());
			hideUsersFromFeed.add(req.toUserId.toString());
		});
		// console.log(hideUsersFromFeed);

		const users = await User.find({
			$and: [
				{
					_id: {
						$nin: Array.from(hideUsersFromFeed),
					},
				},
				{
					_id: {
						$ne: loggedInUser._id,
					},
				},
			],
		})
			.select(USER_SAFE_DATA)
			.skip(skip)
			.limit(limit);

		res.json({
			message: "Feed",
			data: users,
		});
	} catch {
		res.status(400).json({
			message: `Failed to get the feed of user`,
		});
	}
});
