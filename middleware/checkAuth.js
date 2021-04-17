import jwt from "jsonwebtoken";

async function checkAuth(req, res, next) {
	const token = req.cookies.token;
	if (!token) return res.json(false);

	const verifyUser = await jwt.verify(token, process.env.JWT_SECRET);
	if (!verifyUser) return res.json(false);

	req.user = verifyUser.user;
	// res.json(true);
	next();
}

export default checkAuth;
