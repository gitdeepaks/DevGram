import bcrypt from "bcrypt";
import express from "express";
import { userAuth } from "../middlewares/auth.middleware";
import { User } from "../models/user.model";
import { validateSignUpData } from "../utils/validations";

export const authRouter = express.Router();

authRouter.post("/singup", async (req, res) => {
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
		await user.save();
		res.status(200).send("user added successfully");
	} catch (error) {
		res.status(400).send(`Error in adding user: ${error.message}`);
	}
});
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
			res.cookie("authToken", token, {
				maxAge: 86400000, // 24 hours
				httpOnly: true,
				sameSite: "lax",
			});
			res.send("Login successful!!!");
		} else {
			throw new Error("email or password not valid");
		}
	} catch (error) {
		res.status(400).send(`Email or password is not valid ${error.message}`);
	}
});

authRouter.post("/logout", userAuth, async (req, res) => {
	res
		.cookie("authToken", "", {
			expires: new Date(0),
			httpOnly: true,
			sameSite: "lax",
		})
		.status(200)
		.send("user loggedout");
});
