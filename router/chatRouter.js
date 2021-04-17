import { Router } from "express";
import checkAuth from "../middleware/checkAuth.js";
import Chat from "../models/Chat.js";

const router = Router();

router.get("/getAllMessages/:roomId", checkAuth, async (req, res) => {
	const roomId = req.params.roomId;
	const messages = await Chat.find({ roomId });
	res.status(200).send(messages);
});

router.post("/addNewMessage", checkAuth, async (req, res) => {
	const { roomId, message } = req.body;
	if (!roomId || !message)
		return res.status(400).json({ errorMessage: "Something went wrong!" });

	const newMessage = await new Chat({
		roomId: roomId,
		message: message,
		senderId: req.user,
	}).save();

	res.status(200).send(newMessage);
});

export default router;
