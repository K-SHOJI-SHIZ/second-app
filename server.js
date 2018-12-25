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
let currentMode = 'wait';
let cntPainter = 0;
let drawer = '';

class Player {
    constructor(obj={}){
        this.id = obj.id;
        this.socketId = obj.socketId;
        this.nickname = obj.nickname;
        this.nextQuestionNo = obj.nextQuestionNo;
        this.score = obj.score;
        this.isPainter = false;
    }
    remove(){
        delete players[this.id];
    }
}

function getDrawerData(){
  const data = {
    mode: currentMode,
    drawer: ''
  }
  switch(currentMode){
    case "wait":
      break;
    case "alone":
      data.drawer = drawer;
      break;
    case "gether":
      break;
    default:
  }
  return data;
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
    socket.on('drawer-name-request', () => {
      const data = getDrawerData();
      socket.emit("drawer-name-response", data);
    });
    socket.on('draw-start-request', function(mode) {
      let isStart = false;
      if (cntPainter === 0) {
        drawData=[];
        io.sockets.emit("receiveDrawData", {act: "clear"});
      }
      switch(mode){
          case "alone":
          case "relay":
          if (currentMode === 'wait') {
            isStart = true;
            currentMode = mode;
            cntPainter = cntPainter + 1;
            player.isPainter=true;
            drawer = player.nickname;
          }
          break;
        case "gether":
          if (currentMode === 'wait' || currentMode === 'gether') {
            isStart = true;
            currentMode = mode;
            cntPainter = cntPainter + 1;
            player.isPainter=true;
          }
          break;
        default:
      }
      if (isStart){
        const data = getDrawerData();
        socket.broadcast.emit("drawer-name-response", data);
      }
      socket.emit("draw-start-response",isStart);
    });
    socket.on('draw-quit-request', ()=>{
      cntPainter = cntPainter-1;
      player.isPainter=false;
      if (cntPainter === 0) {
        currentMode = 'wait';
      }
      socket.emit("draw-quit-response");
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
        if(player.isPainter) {
          cntPainter = cntPainter-1;
          player.isPainter=false;
          if (cntPainter === 0) {
            currentMode = 'wait';
          }
        }
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
