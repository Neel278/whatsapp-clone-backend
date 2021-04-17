import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
	roomId: {
		type: String,
		required: true,
	},
	message: {
		type: String,
		required: true,
	},
	senderId: {
		type: String,
		required: true,
	},
	timestamp: {
		type: String,
		default: new Date(),
		required: true,
	},
});

export default mongoose.model("chat", chatSchema);
