import express from "express";

const app = express();

app.get("/hello", (req, res) => {
	res.send("Hello From server hello");
});
app.get("/hello/test", (req, res) => {
	res.send("Hello From server hello test");
});
app.get("/hello/testOne", (req, res) => {
	res.send("Hello From server hello testOne");
});
app.get("/test", (req, res) => {
	res.send("Hello From server");
});

app.listen(4100, () => {
	console.log("server is running on port:4100");
});
