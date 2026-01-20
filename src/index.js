import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import express from "express";

import { connectDB } from "./config/database.js";
import { userAuth } from "./middlewares/auth.middleware.js";
import { User } from "./models/user.model.js";
import { validateSignUpData } from "./utils/validations.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.post("/singup", async (req, res) => {
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
app.post("/login", async (req, res) => {
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

			console.log(token);

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

app.get("/profile", userAuth, async (req, res) => {
	try {
		const user = req.user;
		res.send(user);
	} catch (err) {
		res.status(401).send(`Invalid or expired token: ${err.message}`);
	}
});

app.post("/sendConnectionRequest", userAuth, async (req, res) => {
	console.log("Send a connection Request");

	res.send(`${req.user.firstName} sent a connection request`);
});

connectDB()
	.then(() => {
		console.log("Datebase connected....");
		app.listen(4100, () => {
			console.log("server is running on port:4100");
		});
	})
	.catch((err) => console.error(`Database cannot connected: ${err.message}`));
