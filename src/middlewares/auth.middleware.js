export const adminAuth = (req, res, next) => {
	console.log("Admin auth getting checked");

	const token = "xyzabcdefghijklmno";

	const isAdminAuthorized = token === "xyzabcdefghijklmno";

	if (isAdminAuthorized) {
		res.send("All data send");
	} else {
		next();
	}
};
export const userAuth = (req, res, next) => {
	console.log("user auth getting checked");

	const token = "xyzabcdefghijklmno";

	const isAdminAuthorized = token === "xyzabcdefghijklmno";

	if (isAdminAuthorized) {
		res.send("All data send");
	} else {
		next();
	}
};
