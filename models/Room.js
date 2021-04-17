import mongoose from "mongoose";
const roomSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
	createdBy: {
		type: String,
		required: true,
	},
	createdFor: {
		type: String,
		required: true,
	},
});

export default mongoose.model("room", roomSchema);
