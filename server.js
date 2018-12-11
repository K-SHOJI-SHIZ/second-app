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
        this.id = obj.id;
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
    socket.on('requestStatus', (mode) => {
      const data = {
        mode: mode,
        player: player,
        ranking: []
      };
      switch (mode) {
          case "question":
              break;
          case "ranking":
              let sortedPlayers = [];
              sortedPlayers = players.concat();
              sortedPlayers.sort((a,b)=>{
                if (a.score < b.score) return 1;
                else return -1;
              });
              data.ranking = sortedPlayers;
              break;
      }
      socket.emit('receiveStatus', data);
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
        io.sockets.emit("message", data);
        //socket.broadcast.emit("message", data);
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
