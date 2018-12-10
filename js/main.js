const socket = io();
let questionData = [];
let currentQuestionNo=1;
getJson();

function gameStart(){
    currentQuestionNo=1;
    socket.emit('game-start', {nickname: $("#nickname").val() });
    $("#start-screen").hide();
    $("#logout-screen").show();
}
$("#start-button").on('click', ()=>{
    const playerName = $("#nickname").val();
    if (playerName) {
        gameStart();
    }
});

function logOut(){
    // socket.emit('logout');
    drawOpen();
    $("#start-screen").show();
    $("#logout-screen").hide();
}
$("#logout-button").on('click', logOut);

function drawOpen(){
    $("#draw-screen").show();
    $("#question-screen").hide();
    $("#result-screen").hide();
}
$("#draw-button").on('click', drawOpen);

function questionOpen(){
    $("#draw-screen").hide();
    $("#question-screen").show();
    $("#result-screen").hide();
}
$("#question-button").on('click', () => {
  socket.emit('requestStatus');
});
$("#nextQuestion-button").on('click', () => {
  socket.emit('requestStatus');
});

function resultOpen(){
    $("#draw-screen").hide();
    $("#question-screen").hide();
    $("#result-screen").show();
}
$("#result-button").on('click', resultOpen);
$("#answer-button").on('click', ()=> {
  const element = document.getElementById("answer");
  const radioNodeList = element.ans;
  const yourAnswer = radioNodeList.value;
  console.log("あなたの回答: ", yourAnswer);
  const targetQuestion = questionData[currentQuestionNo - 1];
  const isCorrect = targetQuestion.answer == yourAnswer;
  console.log(isCorrect?"正解":"不正解","です");
  if (isCorrect) {
    $("#correct-img").show();
    $("#notcorrect-img").hide();
  } else {
    $("#correct-img").hide();
    $("#notcorrect-img").show();
  }
  socket.emit('statusUpdate', isCorrect);
});

socket.on('receiveStatus', (data) => {
  const targetQuestion = questionData[data.nextQuestionNo-1];
  const title = document.getElementById('question-title');
  title.innerHTML = `<h1>問題${data.nextQuestionNo}</h1>`;
  const body = document.getElementById('question-body');
  body.innerHTML = targetQuestion.question;
  const form = document.getElementById('answer');
  let choices='';
  targetQuestion.choices.forEach((val, index)=>{
    choices = choices + `${index === 0 ? '': '<br/>'}` + `<input type="radio" name="ans" value=${val.value} ${index === 0 ? 'checked': ''}>${val.label}</input>`
  });
  form.innerHTML = choices;
  questionOpen();
});

socket.on('nextQuestion', (data) => {
  currentQuestionNo = data.nextQuestionNo;
  console.log(`次の問題は${currentQuestionNo}です`);
  resultOpen();
});

function getJson() {
   //var xmlhttp = createXMLHttpRequest(); //旧バージョンのIEなどに対応する場合
   var xmlhttp = new XMLHttpRequest();
   xmlhttp.onreadystatechange = function () {
     if (xmlhttp.readyState == 4) {
       if (xmlhttp.status == 200) {
         questionData = JSON.parse(xmlhttp.responseText);
       }
     }
   }
   xmlhttp.open("GET", "json/data.json");
   xmlhttp.send();
 }

window.addEventListener('load', () => {
  const canvas = document.querySelector('#draw-area');
  const context = canvas.getContext('2d');
  const lastPosition = { x: null, y: null };
  let isDrag = false;
  
  function scrollX(){
        return document.documentElement.scrollLeft || document.body.scrollLeft;
  }
  function scrollY(){
        return document.documentElement.scrollTop || document.body.scrollTop;
  }
  function getPositionX (event) {
        const position = event.touches[0].clientX - $(canvas).position().left + scrollX() - parseInt($('#body').css('margin-left'), 10);
        return position;
  }
  function getPositionY (event) {
        const position = event.touches[0].clientY - $(canvas).position().top + scrollY();
        return position;
  }

  // 現在の線の色を保持する変数(デフォルトは黒(#000000)とする)
  let currentColor = '#000000';

  function draw(x, y) {
    if(!isDrag) {
      return;
    }
    // context.lineCap = 'round';
    // context.lineJoin = 'round';
    // context.lineWidth = 5;
    //context.strokeStyle = currentColor;
    let lastPositionX = lastPosition.x;
    let lastPositionY = lastPosition.y;
    if (lastPosition.x === null || lastPosition.y === null) {
      lastPositionX = x;
      lastPositionY = y;
    }
    // context.moveTo(lastPositionX, lastPositionY);
    // context.lineTo(x, y);
    // context.stroke();
    const drawData = {
        act: 'move',
        x: x,
        y: y,
        lastPositionX: lastPositionX,
        lastPositionY: lastPositionY,
        color: currentColor,
    };
    socket.emit('draw', drawData);
    lastPosition.x = x;
    lastPosition.y = y;
  }

  function clear() {
    context.clearRect(0, 0, canvas.width, canvas.height);
  }

  function dragStart(event) {
    // context.beginPath();
    // const drawData = {
    //     act: 'start',
    // };
    // socket.emit('draw', drawData);
    isDrag = true;
  }

  function dragEnd(event) {
    // context.closePath();
    isDrag = false;
    // const drawData = {
    //     act: 'end',
    // };
    // socket.emit('draw', drawData);
    lastPosition.x = null;
    lastPosition.y = null;
  }

  function initEventHandler() {
    const clearButton = document.querySelector('#clear-button');
    clearButton.addEventListener('click', ()=>{
      const drawData = {
        act: 'clear',
      };
      socket.emit('draw', drawData);
    });

    const eraserButton = document.querySelector('#eraser-button');
    eraserButton.addEventListener('click', () => {
      currentColor = '#FFFFFF';
    });

    canvas.addEventListener('mousedown', dragStart);
    canvas.addEventListener('mouseup', dragEnd);
    canvas.addEventListener('mouseout', dragEnd);
    canvas.addEventListener('mousemove', (event) => {
      draw(event.layerX, event.layerY);
    });
    canvas.addEventListener('touchstart', dragStart);
    canvas.addEventListener('touchend', dragEnd);
    canvas.addEventListener('touchmove', (event) => {
      event.preventDefault();
      console.log(getPositionX(event));
      console.log(getPositionY(event));
      draw(getPositionX(event), getPositionY(event));
    });
  }
  socket.on('message', function(data) {
      switch (data.act) {
          case "move":
              context.beginPath();
              context.lineCap = 'round';
              context.lineJoin = 'round';
              context.lineWidth = 5;
              context.strokeStyle = data.color;
              context.moveTo(data.lastPositionX, data.lastPositionY);
              context.lineTo(data.x, data.y);
              context.stroke();
              context.closePath();
              break;
          case "clear":
              clear();
      }
  });

  function initColorPalette() {
    const joe = colorjoe.rgb('color-palette', currentColor);
    joe.on('done', color => {
      currentColor = color.hex();
    });
  }

  initEventHandler();

  // カラーパレット情報を初期化する
  initColorPalette();
});
