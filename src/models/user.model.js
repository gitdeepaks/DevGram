import mongoose from "mongoose";

const userSchema = mongoose.Schema(
	{
		firstName: {
			type: String,
			required: true,
			minlength: 4,
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
		},
		password: {
			type: String,
			required: true,
		},
		age: {
			type: Number,
			min: 18,
		},
		gender: {
			type: String,
			validate(value) {
				if (!["male", "female", "other"].includes(value)) {
					throw new Error("Gender data is not valid");
				}
			},
		},
		photoUrl: {
			type: String,
			default: "https://www.freepik.com/free-photos-vectors/default-user",
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

export const User = mongoose.model("User", userSchema);
