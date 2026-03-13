import { Server } from "socket.io";
import { ChatModel } from "../models/chat";
import { ConnectionRequestModel } from "../models/connectionRequest.model";

const getChatRoomId = (userIdA, userIdB) => {
	if (!userIdA || !userIdB) return null;
	return [userIdA.toString(), userIdB.toString()].sort().join("-");
};

export const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: [
				"http://localhost:5173",
				"https://www.devfinderapp.com",
				"https://devfinderapp.com",
			],
			credentials: true,
		},
	});

	io.on("connection", (socket) => {
		socket.on("joinChat", ({ targetUserId, userId }) => {
			const room = getChatRoomId(userId, targetUserId);
			if (!room) return;
			socket.join(room);
			console.log("Socket joined room", room);
		});

		socket.on(
			"sendMessage",
			async ({ firstName, lastName, text, fromUserId, toUserId }) => {
				const room = getChatRoomId(fromUserId, toUserId);

				if (!room || !fromUserId || !toUserId || !text?.trim()) {
					return;
				}

				try {
					const connection = await ConnectionRequestModel.findOne({
						$or: [
							{ fromUserId, toUserId, status: "accepted" },
							{
								fromUserId: toUserId,
								toUserId: fromUserId,
								status: "accepted",
							},
						],
					});

					if (!connection) {
						console.warn(
							"Blocked chat message between non-connected users",
							fromUserId,
							toUserId,
						);
						return;
					}

					let chat = await ChatModel.findOne({
						participants: { $all: [fromUserId, toUserId] },
					});

					if (!chat) {
						chat = await ChatModel.create({
							participants: [fromUserId, toUserId],
						});
					}

					chat.messages.push({
						content: fromUserId,
						text,
					});

					await chat.save();

					// send only to the other participant(s), not back to sender
					socket.to(room).emit("receiveMessage", {
						firstName,
						lastName,
						text,
						fromUserId,
						toUserId,
					});
				} catch (error) {
					console.error("Error sending message", error);
				}
			},
		);

		socket.on("disconnect", () => {});
	});
};
