import express from "express";
import Razorpay from "razorpay";
import { userAuth } from "../middlewares/auth.middleware";
import { PaymentModel } from "../models/payment.model";
import { User } from "../models/user.model";
import { MEMBERSHIP_TYPES } from "../utils/constants";
import razorpay from "../utils/payment";

export const paymentRouter = express.Router();

paymentRouter.post("/payment/create", userAuth, async (req, res) => {
	try {
		if (!razorpay) {
			return res.status(503).json({
				message: "Payment is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
			});
		}
		const { amount, membershipType } = req.body;
		const { firstName, lastName, emailId } = req.user;
		const options = {
			amount: amount * 100, // 500 INR
			currency: "INR",
			receipt: "receipt_order_1",
			notes: {
				firstName: firstName,
				lastName: lastName,
				emailId: emailId,
				membershipType: membershipType,
			},
		};
		const order = await razorpay.orders.create(options);

		const payment = new PaymentModel({
			userId: req.user._id,
			orderId: order.id,
			amount: MEMBERSHIP_TYPES[membershipType.toUpperCase()].price * 100,
			currency: options.currency,
			status: order.status,
			notes: options.notes,
			receipt: order.receipt,
		});

		const savedPayment = await payment.save();
		res.json({
			message: "Order created successfully",
			data: {
				...savedPayment.toJSON(),
				orderId: order.id,
				keyId: process.env.RAZORPAY_KEY_ID,
			},
		});
	} catch (error) {
		res.status(500).send(`Error in creating order: ${error.message}`);
	}
});

paymentRouter.post("/payment/webhook", async (req, res) => {
	try {
		const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
		if (!webhookSecret) {
			return res.status(503).send("Payment webhook is not configured (RAZORPAY_WEBHOOK_SECRET missing).");
		}
		const webHookSignature = req.get("x-razorpay-signature");
		const isWebHookValid = Razorpay.validateWebhookSignature(
			JSON.stringify(req.body),
			webHookSignature,
			webhookSecret,
		);

		if (!isWebHookValid) {
			return res.status(400).send("Invalid webhook signature");
		}

		//Update my Payment status in Database

		const paymentDetails = req.body.payload.payment.entity;
		const payment = await PaymentModel.findOne({
			orderId: paymentDetails.order_id,
		});
		payment.status = paymentDetails.status;
		await payment.save();

		// Update the user as Premium
		const user = await User.findOne({
			userId: payment.userId,
		});

		user.isPremium = true;
		user.membershipType = paymentDetails.notes.membershipType;
		user.membershipExpiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		// return success response

		// if (req.body.event === "payment.captured") {
		// 	await user.save();
		// }

		// if (req.body.event === "payment.failed") {
		// 	await user.save();
		// }

		return res.status(200).send("Webhook received successfully");
	} catch (error) {
		res.status(500).send(`Error in webhook: ${error.message}`);
	}
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
	try {
		const user = req.user;
		if (user.isPremium) {
			return res.status(200).send("User is premium");
		}
		return res.status(401).send("User is not premium");
	} catch (error) {
		res.status(500).send(`Error in premium verify: ${error.message}`);
	}
});
