const socket = io('/');

socket.on('connect', () => {
    console.log('successfully connected to socket.io server');
    console.log("SOCKET ID:--->"+socket.id);
});




