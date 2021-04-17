// Add all dependencies
import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/User.js";
import cors from "cors";
import bcrypt from "bcrypt";
import cookieParser from "cookie-parser";
import roomRouter from "./router/roomRouter.js";
import chatRouter from "./router/chatRouter.js";
import Pusher from "pusher";
dotenv.config();

// pusher config
const pusher = new Pusher({
	appId: "1187448",
	key: process.env.PUSHER_KEY,
	secret: process.env.PUSHER_SECRET,
	cluster: "ap2",
	useTLS: true,
});

// make db connection
mongoose.connect(process.env.MONGO_CONN, {
	useNewUrlParser: true,
	useUnifiedTopology: true,
});

// pusher config on db side
const db = mongoose.connection;
db.once("open", () => {
	console.log("DB connected");
	// change stream for chats
	const messageCollection = db.collection("chats");
	const changeStream = messageCollection.watch();

	// change stream for rooms
	const roomCollection = db.collection("rooms");
	const changeStream1 = roomCollection.watch();

	// pusher watching changes of messages
	changeStream.on("change", (change) => {
		if (change.operationType === "insert") {
			const chatMessage = change.fullDocument;
			pusher.trigger("message", "inserted", {
				roomId: chatMessage.roomId,
				message: chatMessage.message,
				senderId: chatMessage.senderId,
				timestamp: chatMessage.timestamp,
			});
		}
	});

	// pusher watching changes of rooms
	changeStream1.on("change", (change) => {
		if (change.operationType === "insert") {
			const chatRoom = change.fullDocument;
			pusher.trigger("room", "inserted", {
				name: chatRoom.name,
				_id: chatRoom._id,
			});
		} else {
			console.log("error by pusher!");
		}
	});
});

// configure app
const app = express();

// use middleware to parse data
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

// app routes
app.get("/", (req, res) => {
	res.status(200).send("Hello");
});

app.post("/api/signup", async (req, res) => {
	const { mobile, password, verifyPassword } = req.body;

	// some checks
	if (!mobile || !password || !verifyPassword)
		return res.status(401).json({ errorMessage: "All fields are requires" });
	if (password !== verifyPassword)
		return res.status(401).json({ errorMessage: "Password must match" });
	if (mobile.length < 10 || mobile.length > 10)
		return res.status(401).json({
			errorMessage: "Mobile number length must be 10 digits",
			actualLength: mobile.length,
		});
	if (password.length < 6)
		return res
			.status(401)
			.json({ errorMessage: "Password length must be more than 6 characters" });
	const existingUser = await User.findOne({ mobile });
	if (existingUser)
		return res
			.status(401)
			.json({ errorMessage: "A user with same mobile number already exists" });
	// encrypt password
	const salt = await bcrypt.genSalt();
	const encPassword = await bcrypt.hash(password, salt);

	// create new user
	const newUser = await new User({
		mobile,
		password: encPassword,
	}).save();

	// create a token
	const token = await jwt.sign({ user: newUser._id }, process.env.JWT_SECRET);

	// store in frontend for reference
	return res
		.status(200)
		.cookie("token", token, {
			httpOnly: true,
		})
		.json({ userId: newUser._id });
});

app.post("/api/login", async (req, res) => {
	const { mobile, password } = req.body;

	// some checks
	if (!mobile || !password)
		return res.status(401).json({ errorMessage: "All fields are requires" });

	// find the user
	const existingUser = await User.findOne({ mobile });

	// check if user exists or not
	if (!existingUser)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	// check password
	const passwordCheck = await bcrypt.compare(password, existingUser.password);

	if (!passwordCheck)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	// create a token
	const token = await jwt.sign(
		{ user: existingUser._id },
		process.env.JWT_SECRET
	);

	// store in frontend for reference
	return res
		.status(200)
		.cookie("token", token, {
			httpOnly: true,
		})
		.json({ userId: existingUser._id });
});

app.get("/api/checkLoginStatus", async (req, res) => {
	const token = req.cookies.token;

	if (!token)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	const verifyUser = await jwt.verify(token, process.env.JWT_SECRET);

	if (!verifyUser)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	const payload = await jwt.decode(token);

	return res.status(200).json({ userId: payload.user });
});

app.post("/api/logout", async (req, res) => {
	const token = req.cookies.token;

	if (!token)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	const verifyUser = await jwt.verify(token, process.env.JWT_SECRET);

	if (!verifyUser)
		return res.status(401).json({ errorMessage: "Invalid Credentials" });

	return res
		.status(200)
		.cookie("token", "", {
			expires: new Date(98, 1),
		})
		.send();
});

// room routes
app.use("/api/room", roomRouter);
app.use("/api/chat", chatRouter);

// server listening on a port
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
	console.log(`server running on ${PORT}`);
});
