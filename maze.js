/*
 *  maze.js - part of lab1rint
 *  (c) 2015, Vlad Dumitru.
 *  Released under the terms and conditions of the MIT license.
 *
 *  in case you didn't read the README (which you should have), here's the
 *  gist of the objective: lab1rint is a game in which the player must
 *  traverse a maze back and forth (from the upper-left to the lower-right
 *  corner, or vice-versa), in limited time;
 *
 *  the game is _meant_ to be difficult
 *
*/

var Maze = {

  /*
   *  initial width, height (in pixels) and ratio of the canvas;
   *  these are changed during the initialization procedure
  */
  width: 320,
  height: 480,
  ratio: null,

  /*
   *  current width and height of the canvas element
  */
  currentWidth: null,
  currentHeight: null,

  /*
   *  the canvas element the game is using for drawing its state on
  */
  canvas: null,

  /*
   *  the two-dimensional context attached to the canvas
  */
  ctx: null,

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
   *  which typeface to use when drawing text
  */
  font: "Montserrat",

  /*
   *  style (width in pixels, and line cap) of the line that makes the
   *  maze's edges
  */
  mazeLineWidth: 10,
  mazeLineCap: "round",

  /*
   *  size of the square cells (in pixels) of which the maze is made of
  */
  cellSize: null,

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
   *  maximum time (in milliseconds) that the player has to traverse the maze
  */
  maxTime: 5000,

  /*
   *  the path that the player's been taking since the game has started
  */
  path: null,

  /*
   *  the current (X, Y) pair of coordinates where the player is currently
   *  located (or rather, the player's tip of the pathway)
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
   *  current animation frame (0.0 .. 1.0);
   *  in most cases, it translates into the global alpha of the canvas on
   *  which the game is drawn
  */
  animationFrame: 0.0,

  /*
   *  the angle of the little rotating square that indicates the player's
   *  destination
  */
  rotatingAngle: 0,

  /*
   *  the screen that the user currently is in;
   *  can be one of: "title", "help", or "game"
  */
  currentScreen: "title",

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
   *  checks if the player has reached the other end of the maze, in which
   *  case he/she triggers a winning event
  */
  checkIfWon: function() {
    'use strict';

    if (Maze.levelNumber % 2 == 0) {
      /*  even-numbered levels end in the lower right corner */
      if (Maze.currentPointX == (Maze.mazeSize-1) &&
          Maze.currentPointY == (Maze.mazeSize-1)) {
        Maze.winner = true;
      }
    } else {
      /*  odd-numbered levels end in the upper left corner */
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
    
    /*  calculate the size of the maze cells */
    Maze.cellSize = Math.floor(Maze.width / 5);

    Maze.resize();

    Maze.setRandomColorScheme();

    /*  Hammer.js is used to provide a clean, cross-platform method of dealing
     *  with swipe and tap events */
    var Hammertime = new Hammer(Maze.canvas);
    
    Hammertime.get('swipe').set({direction: Hammer.DIRECTION_ALL, threshold: 0, velocity: 0.0});
    
    /*  swiping works like this:
     *
     *  1) if the user is in the main menu (title screen)
     *    a swipe up event shows a help screen, and
     *    a swipe down event starts the game.
     *
     *  2) if the user is in the help menu,
     *    a swipe down event returns to the title screen
     *
     *  3) if the user is in game, swiping controls the direction of
     *  movement for the path that the user takes towards his/her goal;
     *  in-game swiping is only allowed in the memory phase (the phase
     *  in which the player must traverse the maze from memory)
     *
     *  after each movement, the game checks whether the goal has been
     *  reached, and triggers a 'winner' event;
     *  
     *  the correctness of each movement (whether or not the player hits
     *  a wall) is checked _before_ the actual movement takes place,
     *  and may trigger a 'loser' event accordingly.
    */
    Hammertime.on('swipeleft', function(event) {
      if (!Maze.memoryPhase) {
        return;
      }
      Maze.animationFrame = 0;
			if (Maze.currentPointX - 1 < 0) {
				/*	nothing */
      } else if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].w) {
        Maze.path.push({x: Maze.currentPointX-1, y: Maze.currentPointY});
        Maze.currentPointX -= 1;
      } else {
        Maze.loser = true;
      }
      Maze.checkIfWon();
    });
    
    Hammertime.on('swiperight', function(event) {
      if (!Maze.memoryPhase) {
        return;
      }
      Maze.animationFrame = 0;
			if (Maze.currentPointX + 1 >= Maze.mazeSize) {
				/*	nothing */
      } else if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].e) {
        Maze.path.push({x: Maze.currentPointX+1, y: Maze.currentPointY});
        Maze.currentPointX += 1;
      } else {
        Maze.loser = true;
      }
      Maze.checkIfWon();
    });
    
    Hammertime.on('swipeup', function(event) {
      if (Maze.currentScreen == "title") {
        Maze.currentScreen = "help";
        Maze.animationFrame = 0;
      }

      if (!Maze.memoryPhase) {
        return;
      }
      Maze.animationFrame = 0;
			if (Maze.currentPointY - 1 < 0) {
				/*	nothing */
      } else if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].n) {
        Maze.path.push({x: Maze.currentPointX, y: Maze.currentPointY-1});
        Maze.currentPointY -= 1;
      } else {
        Maze.loser = true;
      }
      Maze.checkIfWon();
    });
  
    Hammertime.on('swipedown', function(event) {
      if (Maze.currentScreen == "title") {
        Maze.currentScreen = "game";
        Maze.startGame();
      }
      if (Maze.currentScreen == "help") {
        Maze.currentScreen = "title";
        Maze.animationFrame = 0;
      }

      if (!Maze.memoryPhase) {
        return;
      }
      Maze.animationFrame = 0;
			if (Maze.currentPointY + 1 > Maze.mazeSize) {
				/*	nothing */
      } else if (Maze.mazeData[Maze.currentPointX][Maze.currentPointY].s) {
        Maze.path.push({x: Maze.currentPointX, y: Maze.currentPointY+1});
        Maze.currentPointY += 1;
      } else {
        Maze.loser = true;
      }
      Maze.checkIfWon();
    });

    /*  the 'touchmove' event is inhibited to prevent scrolling */
    Maze.canvas.addEventListener('touchmove', function(e) {
      e.preventDefault();
    }, false);
    window.addEventListener('resize', Maze.resize);

    /*  begin the looping */
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
      /*  even-numbered levels start from the upper left corner */
      Maze.currentPointX = 0;
      Maze.currentPointY = 0;
      Maze.path = [{x: 0, y: 0}];
    } else {
      /*  odd-numbered levels start from the lower right corner */
      Maze.currentPointX = 3;
      Maze.currentPointY = 3;
      Maze.path = [{x: (Maze.mazeSize-1), y: (Maze.mazeSize-1)}];
    }

    /*  set a timeout to trigger the state out of the memory phase */
    setTimeout(function() {
      Maze.memoryPhase = true;
      Maze.animationFrame = 0.0;
    }, Maze.memoryTime);
  },

  /*
   *  tight loop function that makes the game beat
  */
  loop: function() {
    'use strict';

    setTimeout(Maze.loop, 1);
    Maze.update();
    Maze.render();
  },

  /*
   *  game state update function; deals with triggers such as 'loser' and
   *  'winner', and expiration time for the level traversal
  */
  update: function() {
    'use strict';

    /*  if the player is in the title screen, discard state updates */
    if (Maze.currentScreen != "game") {
      return;
    }

    /*  if the player hits a wall (or exceeds the time limit allocated for
     *  the level), the 'loser' event is triggered;
     *  this resets the player's score (saving it in case of a high score),
     *  and also generates a new level
    */
    if (Maze.loser) {
      /*  register the time the level has started */
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
        Maze.path = [{x: (Maze.mazeSize-1), y: (Maze.mazeSize-1)}];
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
        Maze.animationFrame = 0.0;
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

    /*  when the player reaches his/her goal, a 'winner' event is triggered;
     *  this increments the player's score (saving it in case it was a high
     *  score), and generates a new maze layout */
    if (Maze.winner) {
      /*  register the time the level has started */
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

      /*  reset the winner trigger */
      Maze.winner = false;
      /*  increment the current score */
      Maze.score++;

      /*  trigger a new memory phase */
      Maze.memoryPhase = false;
      /*  and set a timeout to exit out of it */
      setTimeout(function() {
        Maze.memoryPhase = true;
        Maze.animationFrame = 0.0;
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

    /*  there's a time limit imposed on completing each level;
     *  when the time is up, the player loses */
    if (Maze.maxTime - Date.now() + Maze.timeStarted <= 0) {
      Maze.loser = true;
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
    Maze.ctx.fillStyle = Maze.selectColor;
    Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);
    
    /*  update the animation frame (for fading effects) */
    Maze.animationFrame += 0.01;
    if (Maze.animationFrame > 1.0) {
      Maze.animationFrame = 1.0;
    }
    Maze.ctx.globalAlpha = Maze.animationFrame;

    /*  draw the game title */
    Maze.ctx.fillStyle = Maze.backgroundColor;
    Maze.ctx.font = "36px " + Maze.font;
    Maze.ctx.fillText("Lab1rint", 60, 180);

    /*  draw the game authors */
    Maze.ctx.font = "14px " + Maze.font;
    Maze.ctx.fillText("(c) 2015, Vlad Dumitru & Cosmin Istudor", 30, 194);

    /*  draw a minimal on-screen help */
    Maze.ctx.fillStyle = Maze.foregroundColor;
    Maze.ctx.fillText("Swipe up for help.", 30, 390);
    Maze.ctx.fillText("Swipe down to start.", 30, 404);

    /*  draw a little rotating square */
    Maze.ctx.globalAlpha = Math.abs(Math.sin(Maze.rotatingAngle * Math.PI / 180));
    Maze.ctx.save();
    Maze.ctx.translate(45, 168);
    Maze.ctx.rotate(Maze.rotatingAngle * Math.PI / 180);
    Maze.ctx.fillRect(-10, -10, 20, 20);
    Maze.ctx.restore();

    /*  update the rotation angle of the little rotating square */
    Maze.rotatingAngle++;
    if (Maze.rotatingAngle >= 360) {
      Maze.rotatingAngle = 0;
    }

    Maze.ctx.globalAlpha = 1.0;
  },

  /*
   *  renders the help screen, containing the basic info for the user
   *  to be able to start playing
  */
  renderHelpScreen: function() {
    'use strict';

    /*  clear the canvas */
    Maze.ctx.fillStyle = Maze.selectColor;
    Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);
    
    /*  update the animation frame (for fading effects) */
    Maze.animationFrame += 0.01;
    if (Maze.animationFrame > 1.0) {
      Maze.animationFrame = 1.0;
    }
    Maze.ctx.globalAlpha = Maze.animationFrame;

    /*  draw the game title */
    Maze.ctx.fillStyle = Maze.foregroundColor;
    Maze.ctx.font = "36px " + Maze.font;
    Maze.ctx.fillText("Lab1rint", 60, 180);

    /*  draw the game authors */
    Maze.ctx.font = "14px " + Maze.font;
    Maze.ctx.fillText("(c) 2015, Vlad Dumitru & Cosmin Istudor", 30, 194);

    /*  draw the instructions */
    Maze.ctx.fillStyle = Maze.backgroundColor;
    Maze.ctx.fillText("The objective of the game is", 30, 240);
    Maze.ctx.fillText("traversing each maze from", 30, 254);
    Maze.ctx.fillText("memory, reaching the little rotating", 30, 268);
    Maze.ctx.fillText("square without hitting any walls.", 30, 282);
    Maze.ctx.fillText("You move throughout the maze", 30, 320);
    Maze.ctx.fillText("by swiping in the direction", 30, 334);
    Maze.ctx.fillText("that you want to move in.", 30, 348);

    Maze.ctx.fillText("Swipe down to return to", 30, 390);
    Maze.ctx.fillText("the title screen.", 30, 404);
    
    /*  draw a little rotating square */
    Maze.ctx.fillStyle = Maze.foregroundColor;
    Maze.ctx.globalAlpha = Math.abs(Math.sin(Maze.rotatingAngle * Math.PI / 180));
    Maze.ctx.save();
    Maze.ctx.translate(45, 168);
    Maze.ctx.rotate(Maze.rotatingAngle * Math.PI / 180);
    Maze.ctx.fillRect(-10, -10, 20, 20);
    Maze.ctx.restore();

    /*  update the rotation angle of the little rotating square */
    Maze.rotatingAngle++;
    if (Maze.rotatingAngle >= 360) {
      Maze.rotatingAngle = 0;
    }

    Maze.ctx.globalAlpha = 1.0;
  },

  /*
   *  main render function; it dispatches the rendering event to other functions,
   *  depending on which screen the user is currently in
  */
  render: function() {
    'use strict';

    switch (Maze.currentScreen) {
    case "title":
      Maze.renderTitleScreen();
      return;
    case "game":
      Maze.renderGameScreen();
      return;
    case "help":
      Maze.renderHelpScreen();
      return;
    default:
      console.log("bug");
    }
  },

  /*
   *  game render function, responsible with keeping the screen up to date with
   *  various data related to the game state
  */
  renderGameScreen: function () {
    'use strict';

    /*  these values are needed to center the maze on the screen; their
     *  frame-by-frame calculation is needed in case the canvas is resized
     *  between frames */
    var offsetTop = (Maze.height - Maze.cellSize*Maze.mazeSize) / 2;
    var offsetRight = (Maze.width - Maze.cellSize*Maze.mazeSize) / 2;

    /*  clear the canvas surface with the background color */
    Maze.ctx.fillStyle = Maze.selectColor;
    Maze.ctx.fillRect(0, 0, Maze.canvas.width, Maze.canvas.height);

    /*  draw a square for each point in the player's path, thus constructing
     *  a visible path through the maze */
    for (var i = Maze.path.length-1; i >= 0; i--) {
      Maze.ctx.fillStyle = Maze.backgroundColor;
      if (Maze.path[i].x >= 0 && Maze.path[i].x < Maze.mazeSize &&
          Maze.path[i].y >= 0 && Maze.path[i].y < Maze.mazeSize) {
        Maze.ctx.fillRect(offsetRight + Maze.cellSize*Maze.path[i].x,
          offsetTop + Maze.cellSize*Maze.path[i].y, Maze.cellSize, Maze.cellSize);
      }
    }

    /*  animate the whole canvas by modulating the global alpha channel */
    if (Maze.animationFrame < 1.0) {
      Maze.animationFrame += 0.02;
    }
    if (Maze.animationFrame > 1.0) {
      Maze.animationFrame = 1.0;
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
          Maze.ctx.moveTo(offsetRight + i*Maze.cellSize, offsetTop + j*Maze.cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*Maze.cellSize, offsetTop + j*Maze.cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].s == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + i*Maze.cellSize, offsetTop + (j+1)*Maze.cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*Maze.cellSize, offsetTop + (j+1)*Maze.cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].e == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + (i+1)*Maze.cellSize, offsetTop + j*Maze.cellSize);
          Maze.ctx.lineTo(offsetRight + (i+1)*Maze.cellSize, offsetTop + (j+1)*Maze.cellSize);
          Maze.ctx.stroke();
        }

        if (Maze.mazeData[i][j].w == false) {
          Maze.ctx.beginPath();
          Maze.ctx.moveTo(offsetRight + i*Maze.cellSize, offsetTop + j*Maze.cellSize);
          Maze.ctx.lineTo(offsetRight + i*Maze.cellSize, offsetTop + (j+1)*Maze.cellSize);
          Maze.ctx.stroke();
        }
      }
    } 

    /*  highlight the destination square */
    if (Maze.memoryPhase) {
      Maze.ctx.globalAlpha = 1.0 - Maze.animationFrame;
    } else {
      Maze.ctx.globalAlpha = 1.0;
    }
    Maze.ctx.fillStyle = Maze.foregroundColor;
    Maze.ctx.save();
    if (Maze.levelNumber % 2 == 1) {
      Maze.ctx.translate(Maze.cellSize*0.5 + offsetRight, Maze.cellSize*0.5 + offsetTop);
    } else {
      Maze.ctx.translate(Maze.cellSize*0.5 + offsetRight + Maze.cellSize*(Maze.mazeSize-1),
        Maze.cellSize*0.5 + offsetTop + Maze.cellSize*(Maze.mazeSize-1));
    }
    Maze.ctx.rotate(Maze.rotatingAngle * Math.PI / 180);
    Maze.ctx.fillRect(-Maze.cellSize/4, -Maze.cellSize/4, Maze.cellSize/2, Maze.cellSize/2);
    Maze.ctx.restore();

    /*  rotate the little destination square */
    Maze.rotatingAngle++;
    if (Maze.rotatingAngle >= 360) {
      Maze.rotatingAngle = 0;
    }

    /*  draw the score, high score and time */
    Maze.ctx.globalAlpha = 1.0;
    Maze.ctx.font = "20px " + Maze.font;
    Maze.ctx.fillStyle = Maze.backgroundColor;
    Maze.ctx.fillText("Score: " + Maze.score, 10, 30);

    var currentTime = ((Maze.maxTime - Date.now() + Maze.timeStarted) / 1000);
    Maze.ctx.fillText("Time: " + currentTime.toString(), 200, 30);

    if (localStorage.getItem("highScore")) {
      Maze.ctx.fillText("Best: " + (localStorage.highScore).toString(), 10, 55);
    }
  }
};

