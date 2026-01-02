import express from "express";
import { connectDB } from "./config/database.js";
import { User } from "./models/user.js";

const app = express();

app.use(express.json());

app.post("/singup", async (req, res) => {
	const newUser = req.body;
	const user = new User(newUser);
	try {
		await user.save();
		res.status(200).send("user added successfull y");
	} catch (error) {
		res.send("Error in saving the user", error).status(400);
	}
});
// get user by email
app.get("/user", async (req, res) => {
	const userEmail = req.body.emailId;

	try {
		const user = await User.findOne({ emailId: userEmail });
		if (!user) {
			res.status(404).send("user not found");
		}
		res.send(user);
	} catch (error) {
		res.send("something went wrong", error).status(400);
	}
});

app.get("/feed", async (req, res) => {
	try {
		const users = await User.find({});
		res.send(users);
	} catch (error) {
		res.status(400).send("something went wrong", error);
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
		res.status(200).send(`${user.firstName} ${user.lastName} deletion successful`);
	} catch (error) {
		res.status(400).send(`Error in deleting user ${error.message}`);
	}
});

app.patch("/user", async (req, res) => {
	const userId = req.body._id || req.body.userId;
	if (!userId) {
		return res.status(400).send("_id or userId is required");
	}
	const { _id, userId: _, ...data } = req.body; // Remove _id and userId from update data
	try {
		const user = await User.findByIdAndUpdate(
			userId,
			data,
			{ new: true },
			{ returnDocument: "before" }
		);

		console.log(user);

		if (!user) {
			return res.status(404).send("User not found");
		}
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
	.catch((err) => console.error("Database cannot connected", err));
