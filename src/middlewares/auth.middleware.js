import jwt from "jsonwebtoken";
import { User } from "../models/user.model";

export const userAuth = async (req, res, next) => {
	try {
		// Try to get token from cookies first (for GET requests), then from body (for POST requests)
		const token = req.cookies?.authToken || req.body?.token;

		if (!token) {
			return res.status(401).send("No token provided");
		}

		const decodedObj = await jwt.verify(token, process.env.JWT_SECRET);

		const { userId: _id } = decodedObj;

		const user = await User.findById(_id);
		if (!user) {
			return res.status(401).send("User not found");
		}

		req.user = user;

		next();
	} catch (error) {
		res.status(401).send(`User not found: ${error.message}`);
	}
};
