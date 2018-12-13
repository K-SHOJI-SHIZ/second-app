'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
let players = [];
let drawData = [];

class Player {
    constructor(obj={}){
        this.id = obj.id;
        this.socketId = obj.socketId;
        this.nickname = obj.nickname;
        this.nextQuestionNo = obj.nextQuestionNo;
        this.score = obj.score;
        this.isWriter = false;
    }
    remove(){
        delete players[this.id];
    }
}

io.on('connection', function(socket) {
    let player = null;
    socket.on('game-start', (config) => {
        const id = players.length;
        player = new Player({
            id: id,
            socketId: socket.id,
            nickname: config.nickname,
            nextQuestionNo: 1,
            score: 0,
        });
        players.push(player);
    });
    socket.on('draw', function(data) {
      drawData.push(data);
      if(data.act == "clear") {
        drawData=[];
      }
      io.sockets.emit("receiveDrawData", data);
    });
    socket.on('requestCurrentCanvas', ()=>{
      socket.emit("receiveCurrentCanvas", drawData);
    });
    socket.on('logout', () => {
        delete players[player.id];
        player = null;
    });
    socket.on('disconnect', () => {
        if(!player){return;}
        delete players[player.id];
        player = null;
    });
});

app.use('/js', express.static(__dirname + '/js'));
app.use('/css', express.static(__dirname + '/css'));
app.use('/img', express.static(__dirname + '/img'));
app.use('/json', express.static(__dirname + '/json'));

app.get('/', (request, response) => {
  response.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(3000, function() {
  console.log('Starting server on port 3000');
});
