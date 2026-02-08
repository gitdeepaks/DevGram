import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { connectDB } from "./config/database.js";
import { authRouter } from "./routes/auth.js";
import { paymentRouter } from "./routes/paymant.js";
import { profileRouter } from "./routes/profile.js";
import { requestRouter } from "./routes/request.js";
import { userRouter } from "./routes/user.js";

const app = express();

// CORS: localhost for dev; set ALLOWED_ORIGINS in Railway to your Vercel URL (comma-separated for multiple)
const defaultOrigins = ["http://localhost:5173", "http://localhost:5174"];
const allowedFromEnv = process.env.ALLOWED_ORIGINS
	? process.env.ALLOWED_ORIGINS.split(",").map((s) => s.trim()).filter(Boolean)
	: [];
const corsOrigins = [...defaultOrigins, ...allowedFromEnv];

app.use(
	cors({
		origin: corsOrigins,
		credentials: true,
		methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
		allowedHeaders: ["Content-Type", "Authorization"],
	})
);

// cronJob.start();

app.use(express.json());
app.use(cookieParser());

app.use("/", authRouter);
app.use("/", profileRouter);
app.use("/", requestRouter);
app.use("/", userRouter);
app.use("/", paymentRouter);
connectDB()
	.then(() => {
		console.log("Datebase connected....");
		const PORT = process.env.PORT || 4100;
		app.listen(PORT, () => {
			console.log(`server is running on port:${PORT}`);
		});
	})
	.catch((err) => console.error(`Database cannot connected: ${err.message}`));
