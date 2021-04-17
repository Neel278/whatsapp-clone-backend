import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
	mobile: {
		type: String,
		required: true,
	},
	password: {
		type: String,
		required: true,
	},
});

export default mongoose.model("user", UserSchema);
