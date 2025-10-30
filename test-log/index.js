const { io } = require("socket.io-client");

const socket = io("http://localhost:5001");

socket.on("connect", () => {
    console.log("connected:", socket.id);
    socket.emit("subscribe", "logs:most-refined-shampoo");
});

socket.on("log", (msg) => {
    console.log("LOG:", msg);
});
