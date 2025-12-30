import express from "express";
import { connectDB } from "./config/database.js";
import { User } from "./models/user.js";

const app = express();

app.post("/singup", async (req, res) => {
	const userObj = {
		firstName: "Sachin",
		lastName: "Tendulkar",
		emailId: "sachin@gmail.com",
		password: "sachin@1234567",
	};
	// creating the new instance of user model.
	const user = new User(userObj);
	try {
		await user.save();

		res.send("user added successfully");
	} catch (error) {
		res.send("Error in saving the user", error).status(400);
	}
});

connectDB()
	.then(() => {
		console.log("Datebase connected....");
		app.listen(4100, () => {
			console.log("server is running on port:4100");
		});
	})
	.catch((err) => console.error("Database cannot connected", err));
