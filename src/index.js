import express from "express";
import { connectDB } from "./config/database.js";
import { User } from "./models/user.model.js";

const app = express();

app.use(express.json());

app.post("/singup", async (req, res) => {
	const newUser = req.body;
	const user = new User(newUser);
	try {
		await user.save();
		res.status(200).send("user added successfully");
	} catch (error) {
		res.status(400).send(`Error in adding user: ${error.message}`);
	}
});
// get user by email
app.get("/user", async (req, res) => {
	const userEmail = req.body.emailId;

	try {
		const user = await User.findOne({ emailId: userEmail });
		if (!user) {
			res.status(404).send("User not found");
		}
		res.send(user);
	} catch (error) {
		res.status(400).send(`Error in getting user: ${error.message}`);
	}
});

app.get("/feed", async (req, res) => {
	try {
		const users = await User.find({});
		res.send(users);
	} catch (error) {
		res.status(400).send(`Error in getting feed: ${error.message}`);
	}
});

//update data of user
app.delete("/user", async (req, res) => {
	const userId = req.body.userId;

	try {
		const user = await User.findByIdAndDelete(userId);
		if (!user) {
			return res.status(404).send("User not found");
		}
		res.status(200).send(`User ${user.firstName} ${user.lastName} deletion successful`);
	} catch (error) {
		res.status(400).send(`Error in deleting user ${error.message}`);
	}
});

app.patch("/user/:id", async (req, res) => {
	const userId = req.params.id || req.body.userId;
	const ALLOWED_UPDATES = ["photoUrl", "about", "gender", "age", "skills", "userId"];

	if (!userId) {
		return res.status(400).send("ID or userId is required");
	}

	const { _id, userId: _, ...updateData } = req.body; // Remove _id and userId from update data

	const isUpdateAllowed = Object.keys(updateData).every((k) => ALLOWED_UPDATES.includes(k));
	if (!isUpdateAllowed) {
		return res.status(400).send("Invalid update fields");
	}
	const data = updateData;

	if (data?.skills?.length > 10) {
		return res.status(400).send("Skills should be an array of strings and should be less than 10");
	}
	try {
		const user = await User.findById(userId);

		if (!user) {
			return res.status(404).send("User not found");
		}

		// Update fields
		Object.keys(data).forEach((key) => {
			user[key] = data[key];
		});

		// Save will run all validators
		await user.save();

		console.log(user);

		res.status(200).send(`User ${user.firstName} ${user.lastName} updated successfully`);
	} catch (error) {
		res.status(400).send(`Error updating user: ${error.message}`);
	}
});

connectDB()
	.then(() => {
		console.log("Datebase connected....");
		app.listen(4100, () => {
			console.log("server is running on port:4100");
		});
	})
	.catch((err) => console.error(`Database cannot connected: ${err.message}`));
