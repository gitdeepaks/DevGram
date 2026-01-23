import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import validator from "validator";

const userSchema = mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			index: true,
			minlength: 3,
		},
		lastName: {
			type: String,
		},
		emailId: {
			type: String,
			lowerCase: true,
			required: true,
			unique: true,
			trim: true,
			validate(val) {
				if (!validator.isEmail(val)) {
					throw new Error("Invalid email address");
				}
			},
		},
		password: {
			type: String,
			required: true,
			validate(value) {
				if (value.length < 8) {
					throw new Error("Invalid password");
				}
			},
		},
		age: {
			type: Number,
			min: 18,
		},
		gender: {
			type: String,
			enum: { values: ["male", "female", "other"], message: `Invalid gender` },
			// validate(value) {
			// 	if (!["male", "female", "other"].includes(value)) {
			// 		throw new Error("Gender data is not valid");
			// 	}
			// },
		},
		photoUrl: {
			type: String,
			default: "https://www.freepik.com/free-photos-vectors/default-user",
			validate(value) {
				if (!validator.isURL(value)) {
					throw new Error("Invalid photoUrl");
				}
			},
		},
		about: {
			type: String,
			default: "This is the about section",
		},
		skills: {
			type: [String],
		},
	},
	{
		timestamps: true,
	}
);

userSchema.methods.getJWT = function () {
	const token = jwt.sign({ userId: this._id, emailId: this.emailId }, process.env.JWT_SECRET, {
		expiresIn: "1d",
	});

	return token;
};

userSchema.methods.validatePassword = async function (passwordInputByUser) {
	const passwordHash = this.password;
	const isPasswordValid = await bcrypt.compare(passwordInputByUser, passwordHash);

	return isPasswordValid;
};

export const User = mongoose.model("User", userSchema);
