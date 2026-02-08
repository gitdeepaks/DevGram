import { endOfDay, startOfDay, subDays } from "date-fns";
import cron from "node-cron";
import { ConnectionRequestModel } from "../models/connectionRequest.model";

export const cronJob = cron.schedule("* * * * * *", async () => {
	try {
		const yesterday = subDays(new Date(), 1);
		const yesterdayState = startOfDay(yesterday);
		const yesterdayEnd = endOfDay(yesterday);

		const pendingRequests = await ConnectionRequestModel.find({
			status: "interested",
			createdAt: {
				$gte: yesterdayState,
				$lte: yesterdayEnd,
			},
		}).populate("fromUserId toUserId");

		const listOfEmails = [...new Set(pendingRequests.map((request) => request.toUserId.emailId))];
		for (const email of listOfEmails) {
			//send emails
			await sendEmail(
				email,
				"Pending Connection Requests",
				"You have pending connection requests",
				pendingRequests
			);
		}
	} catch (error) {
		console.log("Error in CRON job", error.message);
	}
});
