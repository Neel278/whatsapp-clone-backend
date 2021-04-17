import { Router } from "express";
import checkAuth from "../middleware/checkAuth.js";
import Room from "../models/Room.js";
import User from "../models/User.js";

const router = Router();

router.get("/getAllRooms", checkAuth, async (req, res) => {
	const loggedInUserId = req.user;

	const roomListCreatedByMe = await Room.find({ createdBy: loggedInUserId });
	const roomListCreatedForMe = await Room.find({ createdFor: loggedInUserId });

	const roomList = [...roomListCreatedForMe, ...roomListCreatedByMe];

	res.status(200).send(roomList);
});

router.post("/createRoom", checkAuth, async (req, res) => {
	const { roomName, createdFor } = req.body;
	if (!roomName || !createdFor)
		return res.status(401).json({ errorMessage: "All fields are required" });

	// fetching friend user's userId
	let createdForUserId = await User.findOne({ mobile: createdFor });
	createdForUserId = createdForUserId._id;

	const existingRoom = await Room.findOne({
		name: roomName,
	});
	if (existingRoom)
		return res
			.status(400)
			.json({ errorMessage: "A room with same name already exists" });

	const newRoom = await new Room({
		name: roomName,
		createdBy: req.user,
		createdFor: createdForUserId,
	}).save();

	return res.status(200).send(newRoom);
});

export default router;
