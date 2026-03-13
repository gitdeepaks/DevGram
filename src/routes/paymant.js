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
				message:
					"Payment is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
			});
		}

		const { membershipType } = req.body;
		if (!membershipType) {
			return res
				.status(400)
				.json({ message: "membershipType is required to create an order." });
		}

		const normalizedType = membershipType.toUpperCase();
		const membershipConfig = MEMBERSHIP_TYPES[normalizedType];

		if (!membershipConfig) {
			return res.status(400).json({
				message: `Invalid membershipType "${membershipType}".`,
			});
		}

		const { firstName, lastName, emailId } = req.user;
		const amountInPaise = membershipConfig.price * 100;

		const options = {
			amount: amountInPaise,
			currency: "INR",
			receipt: `receipt_${Date.now()}`,
			notes: {
				firstName,
				lastName,
				emailId,
				membershipType: normalizedType,
			},
		};

		const order = await razorpay.orders.create(options);

		const payment = new PaymentModel({
			userId: req.user._id,
			orderId: order.id,
			amount: amountInPaise,
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
			return res
				.status(503)
				.send(
					"Payment webhook is not configured (RAZORPAY_WEBHOOK_SECRET missing).",
				);
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

		const paymentDetails = req.body.payload.payment.entity;
		const payment = await PaymentModel.findOne({
			orderId: paymentDetails.order_id,
		});

		if (!payment) {
			return res.status(404).send("Payment record not found for this order.");
		}

		payment.status = paymentDetails.status;
		payment.paymentId = paymentDetails.id;
		await payment.save();

		// Only mark user as premium when payment is actually captured
		if (req.body.event === "payment.captured") {
			const user = await User.findById(payment.userId);
			if (user) {
				const membershipType =
					paymentDetails.notes?.membershipType ||
					payment.notes?.membershipType ||
					null;
				user.isPremium = true;
				user.membershipType = membershipType;
				user.membershipExpiryDate = new Date(
					Date.now() + 30 * 24 * 60 * 60 * 1000,
				);
				await user.save();
			}
		}

		return res.status(200).send("Webhook received successfully");
	} catch (error) {
		res.status(500).send(`Error in webhook: ${error.message}`);
	}
});

paymentRouter.get("/premium/verify", userAuth, async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select(
			"isPremium membershipType membershipExpiryDate",
		);

		if (!user || !user.isPremium) {
			return res.status(401).json({ isPremium: false });
		}

		if (user.membershipExpiryDate && user.membershipExpiryDate < new Date()) {
			user.isPremium = false;
			await user.save();
			return res.status(401).json({ isPremium: false });
		}

		return res.status(200).json({
			isPremium: true,
			membershipType: user.membershipType || null,
			membershipExpiryDate: user.membershipExpiryDate || null,
		});
	} catch (error) {
		res.status(500).send(`Error in premium verify: ${error.message}`);
	}
});
