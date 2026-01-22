import bcrypt from "bcrypt";
import express from "express";
import { userAuth } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";
import { validateProfileEditDate } from "../utils/validations";

export const profileRouter = express.Router();

profileRouter.get("/profile/view", userAuth, async (req, res) => {
	try {
		const user = req.user;
		res.send(user);
	} catch (err) {
		res.status(401).send(`Invalid or expired token: ${err.message}`);
	}
});

profileRouter.patch("/profile/edit", userAuth, async (req, res) => {
	try {
		if (!validateProfileEditDate(req)) {
			throw new Error("Invalid Edit request");
		}
		const loggedInUser = req.user;

		Object.keys(req.body).forEach((key) => {
			loggedInUser[key] = req.body[key];
		});
		await loggedInUser.save();

		console.log(loggedInUser);
		res.json({
			message: `${loggedInUser.firstName} your profile has been updated successfully`,
			data: loggedInUser,
		});
	} catch (err) {
		res.status(400).send(`Error in edit profile, ${err.message}`);
	}
});

// Reset Forgot password API

profileRouter.post("/profile/password", async (req, res) => {
	try {
		const { emailId, newPassword } = req.body;

		// Validate input fields
		if (!emailId || !newPassword) {
			return res.status(400).send("Email and new password are required");
		}

		// Validate new password strength
		if (newPassword.length < 8) {
			return res.status(400).send("New password must be at least 8 characters long");
		}

		// Find user by email
		const user = await User.findOne({ emailId: emailId });
		if (!user) {
			return res.status(404).send("User not found with this email");
		}

		// Hash the new password
		const passwordHash = await bcrypt.hash(newPassword, 10);

		// Update user password
		user.password = passwordHash;
		await user.save();

		res.json({
			message: "Password has been reset successfully",
			emailId: user.emailId,
		});
	} catch (error) {
		res.status(400).send(`Error resetting password: ${error.message}`);
	}
});
