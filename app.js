const express = require('express');
const http = require('http');


const PORT = process.env.PORT || 3000;

const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


let connectedPeers = [];


io.on('connection', (socket) => {
    connectedPeers.push(socket.id);
    console.log("CONNECTED PEERS (1)" + connectedPeers);
    socket.on('disconnect', () => {
        console.log("user disconnected");
        const newConnectedPeers = connectedPeers.filter((peerSocketId) => {
            peerSocketId !== socket.io;
        });
        connectedPeers = newConnectedPeers;
        console.log("CONNECTED PEERS (2)" + connectedPeers);
    });
});

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
})
