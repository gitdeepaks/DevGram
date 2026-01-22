import cookieParser from "cookie-parser";
import express from "express";
import { connectDB } from "./config/database.js";
import { authRouter } from "./routes/auth.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/request.js";

const app = express();

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);

connectDB()
	.then(() => {
		console.log("Datebase connected....");
		app.listen(4100, () => {
			console.log("server is running on port:4100");
		});
	})
	.catch((err) => console.error(`Database cannot connected: ${err.message}`));
