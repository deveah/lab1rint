/*
 *  maze.js - part of lab1rint
 *  (c) 2015, Vlad Dumitru.
 *  Released under the terms and conditions of the MIT licence.
*/

var Maze = {

  /*
   *  initial width, height and ratio of the canvas;
   *  these are changed during the initialization procedure
  */
  width:    320,
  height:   480,
  ratio:    null,

  /*
   *  current width and height of the canvas element
  */
  currentWidth: null,
  currentHeight: null,

  /*
   *  the canvas element the game is using for drawing its state on
  */
  canvas:   null,

  /*
   *  the two-dimensional context attached to the canvas
  */
  ctx:      null,

  /*
   *  the maze's configuration;
   *  a two-dimensional array (NxN, where N = maze size), composed of
   *  elements of type {n: bool, s: bool, e: bool, w: bool} which tell
   *  which directions are open from the current cell
  */
  mazeData: null,

  /*
   *  color scheme configuration: background, foreground, and select;
  */
  backgroundColor: "rgb(0, 0, 0)",
  foregroundColor: "rgb(128, 128, 128)",
  selectColor: "rgb(255, 255, 255)",

  /*
   *  style of the line that makes the maze's edges
  */
  mazeLineWidth: 10,
  mazeLineCap: "round",

  /*
   *  the maze's size (mazeSize x mazeSize)
  */
  mazeSize: 4,

  /*
   *  the game has two main phases - the first, in which the player has to
   *  memorize the layout of the maze, and the second, in which the player
   *  must traverse the maze;
   *  'memoryPhase' describes the current state; if true, then the game is
   *  in the second phase
  */
  memoryPhase: false,
  
  /*
   *  time (in milliseconds) that the player has to memorize the maze layout
  */
  memoryTime: 1000,

  /*
   *  for swiping to be recognised, the game must keep track of the source
   *  (where the motion has been initialized) and destination (where the motion
   *  has ended) of the touch movements
  */
  mouseStartX: 0,
  mouseStartY: 0,

  /*
   *  the path that the player's been taking since the game has started
  */
  path:     null,

  /*
   *  the current (X, Y) pair of coordinates where the player is currently
   *  located
  */
  currentPointX: 0,
  currentPointY: 0,

  /*
   *  'loser' and 'winner' are game state triggers
  */
  loser: false,
  winner: false,

  /*
   *  current score of the player
  */
  score: 0,

  /*
   *  current animation frame (0.0 .. 1.0)
  */
  animationFrame: 1.0,

  /*
   *  true if in the title screen, false otherwise
  */
  inTitleScreen: true,

  /*
   *  time since the beginnning of the current game
  */
  timeStarted: null,

  /*
   *  level number (doesn't reset when losing); used for tracking whether
   *  the maze should be traversed from the upper-left corner to the
   *  lower-right or otherwise
  */
  levelNumber: 0,

  /*
   *  used to keep track of on-screen debugging data
  */
  debugString: null,

  /*
   *  handles the 'mousedown' and 'touchstart' events, keeping track of the
   *  origin of the motion event;
   *  if in the title screen, jumps to normal game state
  */
  mouseDownHandler: function(event) {
    'use strict';
    event.preventDefault();

    /*  transition from the title screen into the game */
    if (Maze.inTitleScreen) {
      Maze.inTitleScreen = false;
      Maze.startGame();
    }

    /*  if the player is in the maze memorization phase, a mousedown
     *  or touchstart event triggers nothing */
    if (!Maze.memoryPhase) {
      return;
    }

    /*  register motion start coordinates */
    /*if (event.type == "mousedown") {*/
      Maze.mouseStartX = event.clientX - Maze.canvas.offsetLeft;
      Maze.mouseStartY = event.clientY - Maze.canvas.offsetTop;
    /*} else if(event.type == "touchstart") {
      Maze.mouseStartX = event.touches[0].pageX - Maze.canvas.offsetLeft;
      Maze.mouseStartY = event.touches[0].pageY - Maze.canvas.offsetTop;
    }*/
  },


  /*
   *  handles the 'mouseup' and 'touchend' events, registering a motion event
   *  and acting accordingly (moving inside the maze)
  */
  mouseUpHandler: function(event) {
    'use strict';
    event.preventDefault();

    /*  if the player is in the maze memorization phase, a mouseup
     *  or touchend event triggers nothing */
    if (!Maze.memoryPhase) {
      return;
    }

    /*  reset the animation frame */
    Maze.animationFrame = 0;

    /*  register the motion end */
    var currentX, currentY;
    /*if (event.type == "mouseup") {*/
      currentX = event.clientX - Maze.canvas.offsetLeft;
      currentY = event.clientY - Maze.canvas.offsetTop;
    /*} else if(event.type == "touchend") {
      currentX = event.touches[0].pageX - Maze.canvas.offsetLeft;
      currentY = event.touches[0].pageY - Maze.canvas.offsetTop;
    }*/

    /*  calculate the length of the movement on both axes */
    var lengthX = currentX - Maze.mouseStartX;
    var lengthY = currentY - Maze.mouseStartY;

    /*  handles movement depending on the motion;
     *  if the motion is illegal (moving through a non-existant cell exit),
     *  then trigger a losing event;
     *  if the motion is legal, push the new coordinates on the player's
     *  path
    */
    if (Math.abs(lengthX) > Math.abs(lengthY)) {
      /*  horizontal movement */
      if (lengthX > 0) {
        /*  right movement */
        if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].e) {
          Maze.path.push({x: Maze.currentPointX+1, y: Maze.currentPointY});
          Maze.currentPointX += 1;
        } else {
          Maze.loser = true;
        }
      }
      if (lengthX < 0) {
        /*  left movement */
        if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].w) {
          Maze.path.push({x: Maze.currentPointX-1, y: Maze.currentPointY});
          Maze.currentPointX -= 1;
        } else {
          Maze.loser = true;
        }
      }
    } else {
      /*  vertical movement */
      if (lengthY > 0) {
        /*  down movement */
        if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].s) {
          Maze.path.push({x: Maze.currentPointX, y: Maze.currentPointY+1});
          Maze.currentPointY += 1;
        } else {
          Maze.loser = true;
        }
      }
      if (lengthY < 0) {
        /*  up movement */
        if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].n) {
          Maze.path.push({x: Maze.currentPointX, y: Maze.currentPointY-1});
          Maze.currentPointY -= 1;
        } else {
          Maze.loser = true;
        }
      }
    }

    /*  update the on-screen debug string */
    Maze.debugString = lengthX.toString() + ":" + lengthY.toString();

    /*  check if the maze endpoint has been reached */
    if (Maze.levelNumber % 2 == 0) {
      if (Maze.currentPointX == (Maze.mazeSize-1) &&
          Maze.currentPointY == (Maze.mazeSize-1)) {
        Maze.winner = true;
      }
    } else {
      if (Maze.currentPointX == 0 && Maze.currentPointY == 0) {
        Maze.winner = true;
      }
    }

  },

  /*
   *  initialization procedure for the whole game, setting up the canvas, its
   *  context, and registering event listeners
  */
  init: function() {
    'use strict';
    Maze.canvas = document.getElementById('mainCanvas');
    Maze.ctx = Maze.canvas.getContext('2d');
    Maze.ratio = Maze.width / Maze.height;
    Maze.canvas.width = Maze.width;
    Maze.canvas.height = Maze.height;

    Maze.resize();

    Maze.canvas.addEventListener('mousedown', Maze.mouseDownHandler);
    Maze.canvas.addEventListener('mouseup', Maze.mouseUpHandler);
    /*Maze.canvas.addEventListener('touchstart', Maze.mouseDownHandler);
    Maze.canvas.addEventListener('touchend', Maze.mouseUpHandler);*/
    Maze.canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);
    window.addEventListener('resize', Maze.resize);

    Maze.loop();
  },

  /*
   *  resizes the canvas to fit the current view
  */
  resize: function() {
    'use strict';
    Maze.currentHeight = window.innerHeight;
    Maze.currentWidth = Maze.currentHeight * Maze.ratio;
    Maze.canvas.style.width = Maze.currentWidth + "px";
    Maze.canvas.style.height = Maze.currentHeight + "px";
  },

  /*
   *  starts a new game; initializes all data necessary in order to do so
  */
  startGame: function() {
    'use strict';
    
    /*  register the time the game has started */
    Maze.timeStarted = Date.now();

    /*  create a new maze layout */
    MazeGen.init(Maze.mazeSize, Maze.mazeSize);
    MazeGen.carveFrom(0, 0);
    Maze.mazeData = MazeGen.data;

    /*  assign a start point */
    if (Maze.levelNumber % 2 == 0) {
      Maze.currentPointX = 0;
      Maze.currentPointY = 0;
      Maze.path = [{x: 0, y: 0}];
    } else {
      Maze.currentPointX = 3;
      Maze.currentPointY = 3;
      Maze.path = [{x: 3, y: 3}];
    }

    /*  set a timeout to trigger the state out of the memory phase */
    setTimeout(function() {
      Maze.memoryPhase = true;
    }, Maze.memoryTime);
  },

  /*
   *  tight loop function that makes the game beat
  */
  loop: function() {
    'use strict';
    setTimeout(Maze.loop, 10);
    Maze.update();
    Maze.render();
  },

  /*
   *  game state update function
  */
  update: function() {
    'use strict';
    if (Maze.loser) {
      /*  register the time the game has started */
      Maze.timeStarted = Date.now();

      /*  clear the canvas according to the new color scheme */
      Maze.ctx.fillStyle = Maze.backgroundColor;
      Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);

      /*  create a new maze layout */
      MazeGen.init(Maze.mazeSize, Maze.mazeSize);
      MazeGen.carveFrom(0, 0);
      Maze.mazeData = MazeGen.data;

      /*  increment the level number, and assign a start point */
      Maze.levelNumber++;
      if (Maze.levelNumber % 2 == 0) {
        Maze.currentPointX = 0;
        Maze.currentPointY = 0;
        Maze.path = [{x: 0, y: 0}];
      } else {
        Maze.currentPointX = 3;
        Maze.currentPointY = 3;
        Maze.path = [{x: 3, y: 3}];
      }

      /*  reset the trigger */
      Maze.loser = false;
      /*  reset the score */
      Maze.score = 0;
    
      /*  trigger a new memory phase */
      Maze.memoryPhase = false;
      /*  and set a timeout to exit out of it */
      setTimeout(function() {
        Maze.memoryPhase = true;
      }, Maze.memoryTime);

      /*  save highscore */
      if (localStorage.getItem("highScore")) {
        if (Number(localStorage.getItem("highScore")) < Maze.score) {
          localStorage.setItem("highScore", Maze.score);
        }
      } else {
        localStorage.setItem("highScore", Maze.score);
      }

      /*  create a new color scheme */
      Maze.setRandomColorScheme();
    }

    if (Maze.winner) {
      /*  clear the canvas according to the new color scheme */
      Maze.ctx.fillStyle = Maze.backgroundColor;
      Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);

      /*  create a new maze layout */
      MazeGen.init(Maze.mazeSize, Maze.mazeSize);
      MazeGen.carveFrom(0, 0);
      Maze.mazeData = MazeGen.data;


      /*  increment the level number, and assign a start point */
      Maze.levelNumber++;
      if (Maze.levelNumber % 2 == 0) {
        Maze.currentPointX = 0;
        Maze.currentPointY = 0;
        Maze.path = [{x: 0, y: 0}];
      } else {
        Maze.currentPointX = 3;
        Maze.currentPointY = 3;
        Maze.path = [{x: 3, y: 3}];
      }

      /*  reset the winner trigger */
      Maze.winner = false;
      /*  increment the current score */
      Maze.score++;

      /*  trigger a new memory phase */
      Maze.memoryPhase = false;
      /*  and set a timeout to exit out of it */
      setTimeout(function() {
        Maze.memoryPhase = true;
      }, Maze.memoryTime);

      /*  save highscore */
      if (localStorage.getItem("highScore")) {
        if (Number(localStorage.getItem("highScore")) < Maze.score) {
          localStorage.setItem("highScore", Maze.score);
        }
      } else {
        localStorage.setItem("highScore", Maze.score);
      }
      
      Maze.setRandomColorScheme();
    }
  },

  /*
   *  creates a random color scheme, and assigns it to the game state;
   *  the three colors (background, foreground, and select) are in the order
   *  of their brightness
  */
  setRandomColorScheme: function() {
    'use strict';
    var br, bg, bb;

    /*  create a random (background) color with a minimum brightness of 64 */
    do {
      br = Math.floor(Math.random() * 64);
      bg = Math.floor(Math.random() * 64);
      bb = Math.floor(Math.random() * 64);
    } while (Math.sqrt((br*br) + (bg*bg) + (bb*bb)) < 64);
    Maze.backgroundColor = "rgb(" + br.toString() + "," + bg.toString() + "," +
      bb.toString() + ")";

    /*  create a foreground color twice as bright as the background one */
    var fr = br * 2;
    var fg = bg * 2;
    var fb = bb * 2;
    Maze.foregroundColor = "rgb(" + fr.toString() + "," + fg.toString() + "," +
      fb.toString() + ")";
    
    /*  create a select color four times as bright as the background one */
    var sr = br * 4;
    var sg = bg * 4;
    var sb = bb * 4;
    Maze.selectColor = "rgb(" + sr.toString() + "," + sg.toString() + "," +
      sb.toString() + ")";
  },

  /*
   *  draws the title screen
  */
  renderTitleScreen: function() {
    'use strict';

    /*  clear the canvas */
    Maze.ctx.clearRect(0, 0, Maze.canvas.width, Maze.canvas.height);
    Maze.ctx.fillStyle = "black";
    
    /*  draw the game title */
    Maze.ctx.font = "36px Open Sans";
    Maze.ctx.fillText("Lab1rint", 30, 172);

    /*  draw the game authors */
    Maze.ctx.font = "14px Open Sans";
    Maze.ctx.fillText("(c) 2015, Vlad Dumitru & Cosmin Istudor", 30, 190);

    /*  draw a minimal on-screen help */
    Maze.ctx.fillText("Apasă și tu pe ecran, ceva.", 30, 390);
  },

  /*
   *  draws the main game scren
  */
  render: function() {
    'use strict';

    /*  these values are needed to center the maze on the screen; their
     *  frame-by-frame calculation is needed in case the canvas is resized
     *  between frames */
    var cellSize = 50;
    var offsetTop = (Maze.height - cellSize*Maze.mazeSize) / 2;
    var offsetRight = (Maze.width - cellSize*Maze.mazeSize) / 2;

    /*  if in the title screen state, jump to it */
    if (Maze.inTitleScreen) {
      Maze.renderTitleScreen();
      return;
    }

    /*  clear the canvas surface with the background color */
    Maze.ctx.fillStyle = Maze.selectColor;
    Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);

    /*  draw a square for each point in the player's path, thus constructing
     *  a visible path through the maze */
    for (var i = Maze.path.length-1; i >= 0; i--) {
      Maze.ctx.fillStyle = Maze.backgroundColor;
      if (Maze.path[i].x >= 0 && Maze.path[i].x < Maze.mazeSize &&
          Maze.path[i].y >= 0 && Maze.path[i].y < Maze.mazeSize) {
        Maze.ctx.fillRect(offsetRight + cellSize*Maze.path[i].x,
          offsetTop + cellSize*Maze.path[i].y, cellSize, cellSize);
      }
    }

    /*  animate the whole canvas by modulating the global alpha channel */
    if (Maze.animationFrame < 1.0) {
      Maze.animationFrame += 0.02;
    }
    Maze.ctx.globalAlpha = Maze.animationFrame;

    /*  prepare the canvas to draw the maze layout */
    Maze.ctx.lineWidth = Maze.mazeLineWidth;
    Maze.ctx.lineCap = Maze.mazeLineCap;
    /*  if the game is in the state in which the player must traverse the maze
     *  from memory, the maze is drawn in the color of the background, to keep
     *  it hidden from view */
    if (!Maze.memoryPhase) {
      Maze.ctx.strokeStyle = Maze.foregroundColor;
    } else {
      Maze.ctx.strokeStyle = Maze.selectColor;
    }

    /*  loop through the maze layout and draw each cell's sides */
    for (var i = 0; i < Maze.mazeSize; i++) {
      for (var j = 0; j < Maze.mazeSize; j++) {
        if (Maze.mazeData[i][j].n == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + i*cellSize, offsetTop + j*cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*cellSize, offsetTop + j*cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].s == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + i*cellSize, offsetTop + (j+1)*cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*cellSize, offsetTop + (j+1)*cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].e == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + (i+1)*cellSize, offsetTop + j*cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*cellSize, offsetTop + (j+1)*cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].w == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + i*cellSize, offsetTop + j*cellSize);
          Maze.ctx.lineTo(offsetRight + i*cellSize, offsetTop + (j+1)*cellSize);
          Maze.ctx.stroke();
        }
      }
    } 

    /*  draw the score, high score and time */
    Maze.ctx.globalAlpha = 1.0;
    Maze.ctx.font = "20px Open Sans";
    Maze.ctx.fillStyle = Maze.backgroundColor;
    Maze.ctx.fillText("Score: " + Maze.score, 10, 30);

    var currentTime = ((Date.now() - Maze.timeStarted) / 1000);
    Maze.ctx.fillText("Time: " + currentTime.toString(), 200, 30);

    if (localStorage.getItem("highScore")) {
      Maze.ctx.fillText("Best: " + (localStorage.highScore).toString(), 10, 55);
    }

	/*  draw the on-screen debugging string */
	Maze.ctx.fillText(Maze.debugString, 10, 80);
  }
};

