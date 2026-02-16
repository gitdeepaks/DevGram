import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

// Only create Razorpay instance when credentials are set (avoids crash when env vars are missing in deployment)
const razorpay =
	keyId && keySecret
		? new Razorpay({ key_id: keyId, key_secret: keySecret })
		: null;

export default razorpay;
