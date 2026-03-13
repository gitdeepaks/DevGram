import bcrypt from "bcrypt";
import express from "express";
import { userAuth } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";
import { validateSignUpData } from "../utils/validations";

export const authRouter = express.Router();

const handleSignup = async (req, res) => {
	try {
		// validation the data
		validateSignUpData(req);

		const { firstName, lastName, emailId, password } = req.body;

		// Encrypt the password
		const passwordHash = await bcrypt.hash(password, 10);

		const user = new User({
			firstName,
			lastName,
			emailId,
			password: passwordHash,
		});
		const savedUser = await user.save();
		const token = savedUser.getJWT();
		const isProduction = process.env.NODE_ENV === "production";
		res.cookie("authToken", token, {
			maxAge: 86400000, // 24 hours
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		});
		res.status(200).json({
			message: "user added successfully",
			data: savedUser,
		});
	} catch (error) {
		res.status(400).json({
			message: `Error in adding user: ${error.message}`,
		});
	}
};

authRouter.post("/singup", handleSignup);
authRouter.post("/signup", handleSignup);
authRouter.post("/login", async (req, res) => {
	try {
		const { emailId, password } = req.body;
		const user = await User.findOne({ emailId: emailId });
		if (!user) {
			throw new Error("email or password not valid");
		}

		const isPasswordValid = await user.validatePassword(password);
		if (isPasswordValid) {
			// create a JWT Token
			const token = await user.getJWT();

			// console.log(token);

			// Add a token to cookie and send the response to the user.
			const isProduction = process.env.NODE_ENV === "production";
			res.cookie("authToken", token, {
				maxAge: 86400000, // 24 hours
				httpOnly: true,
				sameSite: isProduction ? "none" : "lax",
				secure: isProduction,
			});
			res.status(200).json({
				message: "Login successful!!!",
				data: user,
			});
		} else {
			throw new Error("email or password not valid");
		}
	} catch (error) {
		res.status(400).send(`Email or password is not valid ${error.message}`);
	}
});

authRouter.post("/logout", userAuth, async (req, res) => {
	const isProduction = process.env.NODE_ENV === "production";
	res
		.cookie("authToken", "", {
			expires: new Date(0),
			httpOnly: true,
			sameSite: isProduction ? "none" : "lax",
			secure: isProduction,
		})
		.status(200)
		.send("user loggedout");
});
