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

io.on('connection', (socket) => {
    console.log('user connected to socket.io server');
    console.log("SOCKET ID:--->"+socket.id);
})

server.listen(PORT, () => {
    console.log(`listening on ${PORT}`);
})
