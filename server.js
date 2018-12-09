'use strict';

const express = require('express');
const http = require('http');
const path = require('path');
const socketIO = require('socket.io');
const app = express();
const server = http.Server(app);
const io = socketIO(server);
let players = [];

const FIELD_WIDTH = 1000, FIELD_HEIGHT = 1000;

class Player {
    constructor(obj={}){
        this.socketId = obj.socketId;
        this.nickname = obj.nickname;
        this.nextQuestionNo = obj.nextQuestionNo;
        this.score = obj.score;
    }
    remove(){
        delete players[this.id];
        io.to(this.socketId).emit('dead');
    }
}

io.on('connection', function(socket) {
    let player = null;
    socket.on('game-start', (config) => {
        player = new Player({
            socketId: socket.id,
            nickname: config.nickname,
            nextQuestionNo: 1,
            score: 0,
        });
        console.log(player.nextQuestionNo);
        players[player.id] = player;
    });
    socket.on('requestStatus', () => {
      socket.emit('receiveStatus', player);
    });
    socket.on('statusUpdate', (isCorrect) => {
        player.nextQuestionNo = player.nextQuestionNo + 1;
        if (isCorrect) {
          player.score = player.score + 1;
        }
        console.log(player.nextQuestionNo);
        socket.emit('nextQuestion', player);
    });
    socket.on('draw', function(data) {
        if (data.act === 'move') {
            io.sockets.emit("message", data);
        }
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
