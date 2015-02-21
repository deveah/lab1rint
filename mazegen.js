/*
 *  mazegen.js - part of lab1rint
 *  (c) 2015, Vlad Dumitru.
 *  Released under the terms and conditions of the MIT licence.
*/

/*
 *  This is a JavaScript translation of:
 *  http://weblog.jamisbuck.org/2010/12/27/maze-generation-recursive-backtracking
*/

var MazeGen = {
  DX: { "n": 0, "s": 0, "e": 1, "w": -1 },
  DY: { "n": -1, "s": 1, "e": 0, "w": 0 },
  OPPOSITE: { "n": "s", "s": "n", "e": "w", "w": "e" },

  width:  null,
  height: null,
  data:   null,

  init: function(width, height) {
    MazeGen.width = width;
    MazeGen.height = height;
    
    MazeGen.data = [];
    for (var i = 0; i < MazeGen.width; i++) {
      MazeGen.data[i] = [];
      for (var j = 0; j < MazeGen.height; j++) {
        MazeGen.data[i][j] = {
          n: false,
          s: false,
          e: false,
          w: false,
          visited: false
        };
      }
    }
  },

  shuffle: function(array) {
    var currentIndex = array.length, temporaryValue, randomIndex ;
    while (0 !== currentIndex) {
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
      temporaryValue = array[currentIndex];
      array[currentIndex] = array[randomIndex];
      array[randomIndex] = temporaryValue;
    }

    return array;
  },

  carveFrom: function(cx, cy) {
    var nx = 0;
    var ny = 0;
    var directions = MazeGen.shuffle(["n", "s", "e", "w"]);

    MazeGen.data[cx][cy].visited = true;

    for (var i = 0; i < 4; i++) {
      nx = cx + MazeGen.DX[directions[i]];
      ny = cy + MazeGen.DY[directions[i]];

      if ((ny >= 0) &&
          (ny < MazeGen.height) &&
          (nx >= 0) &&
          (nx < MazeGen.width) && 
          (MazeGen.data[nx][ny].visited == false)) {
        MazeGen.data[cx][cy][directions[i]] = true;
        MazeGen.data[nx][ny][MazeGen.OPPOSITE[directions[i]]] = true;
        MazeGen.carveFrom(nx, ny);
      }
    }
  }
};

