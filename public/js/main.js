const socket = io('/');

socket.on('connect', () => {
    console.log('successfully connected to socket.io server (2)');
    console.log("SOCKET ID (2):--->"+socket.id);
});




