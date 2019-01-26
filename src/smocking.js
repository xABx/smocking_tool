import * as dat from 'dat.gui';

var settings = new function() {
  this.gridSize = 20;
  this.halfGrid = this.gridSize/2;
  this.quarterGrid = ~~(this.gridSize/4);
  this.xSegs = 400;
  this.ySegs = 400;
  this.upperLimit = this.xSegs * this.ySegs;
  this.numOfTilesInRow = this.xSegs/this.gridSize;
  this.layout = 0;
};

// Look at constraints and how they relate to the stretch of the fabric as well as segs

// Our fabric is square so the number of tiles in a row is the same as in a column

var gui = new dat.GUI();
gui.add(settings, 'layout', 0, 2).step(1);

var numOfCornersPerRow = settings.xSegs+1;
var totalTiles = settings.numOfTilesInRow*settings.numOfTilesInRow;

function getRowBasedOnTileNumber(tileNumber) {
  return Math.floor(tileNumber/settings.numOfTilesInRow);
}

function getColumnBasedOnTileNumber(tileNumber) {
  return tileNumber%settings.numOfTilesInRow + 1;
}

function getTileCorners(tileNumber) {
  var row = getRowBasedOnTileNumber(tileNumber);
  var column = getColumnBasedOnTileNumber(tileNumber);
  var offset = settings.gridSize*numOfCornersPerRow;
  var topRightCorner = column*settings.gridSize + row*offset;
  var topLeftCorner = topRightCorner - settings.gridSize;
  var bottomLeftCorner = topLeftCorner + offset;
  var bottomRightCorner = bottomLeftCorner + settings.gridSize;
  var center = topLeftCorner + settings.halfGrid + (settings.halfGrid*numOfCornersPerRow); 
  
  // Supports for the diagonalTopToBotton Compression Method
  var cOffset = settings.quarterGrid*numOfCornersPerRow;
  var negAdjustOffset = -cOffset + settings.quarterGrid;
  var posAdjustOffset = cOffset - settings.quarterGrid;

  var tlcSupport1 = topLeftCorner + negAdjustOffset;
  var tlcSupport2 = topLeftCorner + posAdjustOffset;

  var brcSupport1 = bottomRightCorner + negAdjustOffset;
  var brcSupport2 = bottomRightCorner + posAdjustOffset;

  var tlcBrcSupportCenter1 = center + negAdjustOffset;
  var tlcBrcSupportCenter2 = center + posAdjustOffset;

  // Supports for the diagonalBottomToTop Compression Method
  var negAdjustOffset2 = -cOffset - settings.quarterGrid;
  var posAdjustOffset2 = cOffset + settings.quarterGrid;

  var trcSupport1 = topRightCorner + negAdjustOffset2;
  var trcSupport2 = topRightCorner + posAdjustOffset2

  var blcSupport1 = bottomLeftCorner + negAdjustOffset2;
  var blcSupport2 = bottomLeftCorner + posAdjustOffset2;

  var trcBlcSupportCenter1 = center + negAdjustOffset2;
  var trcBlcSupportCenter2 = center + posAdjustOffset2;

  // Need to make sure that supports don't go outside of the tile that the diagonal is part of
  return {
    mainCorners: {
      topLeftCorner: topLeftCorner, 
      topRightCorner: topRightCorner, 
      bottomRightCorner: bottomRightCorner, 
      bottomLeftCorner: bottomLeftCorner, 
      center: center
    },
    supportCorners: {
      diagonalTopToBottom: {
        upperSupport: [
          tlcBrcSupportCenter1,
          tlcSupport1,
          brcSupport1
        ],
        lowerSupport: [
          tlcBrcSupportCenter2,
          tlcSupport2,
          brcSupport2
        ]
      },
      diagonalBottomToTop: {
        upperSupport: [
          trcBlcSupportCenter1,
          trcSupport1,
          blcSupport1
        ],
        lowerSupport: [
          trcBlcSupportCenter2,
          trcSupport2,
          blcSupport2
        ]
      }
    }
  };
}

function compressionMethodDetails(compressionMethod, corners) {
  var topLeft = corners.mainCorners.topLeftCorner;
  var topRight = corners.mainCorners.topRightCorner;
  var bottomRight = corners.mainCorners.bottomRightCorner;
  var bottomLeft = corners.mainCorners.bottomLeftCorner;
  var center = corners.mainCorners.center;

  // change these to an object, add the compression method, check compression method in the loop at the bottom to determine offset direction
  var accrossTop  = {
    mainCorners: [center, topLeft, topRight],
  }

  var downLeftSide = {
    mainCorners: [center, topLeft, bottomLeft],
  }

  var diagonalTopToBottom = {
    mainCorners: [center, topLeft, bottomRight],
    //support1: corners.supportCorners.diagonalTopToBottom.upperSupport,
    //support2: corners.supportCorners.diagonalTopToBottom.lowerSupport,
  };

  var diagonalBottomToTop = {
    mainCorners: [center, bottomLeft, topRight],
    //support1: corners.supportCorners.diagonalBottomToTop.upperSupport,
    //support2: corners.supportCorners.diagonalBottomToTop.lowerSupport
  };

  var topAndLeftSide = {
    mainCorners: [center, topLeft, topRight, bottomLeft],
  }

  var compressionMethods = {
    accrossTop: accrossTop,
    downLeftSide: downLeftSide,
    diagonalTopToBottom: diagonalTopToBottom,
    diagonalBottomToTop: diagonalBottomToTop,
    topAndLeftSide: topAndLeftSide
  };

  return compressionMethods[compressionMethod];
}

//var cornersPerTile = experimental()

function classicCanadian() {
  var tileDetails = [];

  for (var tile = settings.numOfTilesInRow+1; tile < totalTiles-2; tile ++) {
    var currentRow = getRowBasedOnTileNumber(tile) + 1;
    var currentColumn = getColumnBasedOnTileNumber(tile);
    
    if (currentColumn > 1 && currentColumn < settings.numOfTilesInRow && currentRow > 1 && currentRow < settings.numOfTilesInRow) {
      var method;
      var mod = 0;
      if ((currentRow)%2 === 0) {
        method = 'diagonalBottomToTop';
        mod = 0;
      } else {
        method = 'diagonalTopToBottom';
        mod = 1;
      }

      if ((tile+mod)%2 == 0) {
        tileDetails.push(compressionMethodDetails(method , getTileCorners(tile)));
      }
    }
  }

  return tileDetails;
}

function classicWave() {
  var tileDetails = [];

  for (var tile = ~~settings.numOfTilesInRow+1; tile < totalTiles-2; tile ++) {
    var currentRow = getRowBasedOnTileNumber(tile) + 1;
    var currentColumn = getColumnBasedOnTileNumber(tile);
    
    if (currentColumn > 1 && currentColumn < settings.numOfTilesInRow && currentRow > 1 && currentRow < settings.numOfTilesInRow) {

      var method;
      if ((tile)%4 === 0) {
        method = 'diagonalBottomToTop';
      } else if ((tile-2)%4 === 0) {
        method = 'diagonalTopToBottom';
      }

      if ((tile)%2 == 0) {
        tileDetails.push(compressionMethodDetails(method , getTileCorners(tile)));
      }
    }
  }

  return tileDetails;

}

function experimental() {
  var tileDetails = [];

  for (var tile = settings.numOfTilesInRow+1; tile < totalTiles-1; tile ++) {
    var currentRow = getRowBasedOnTileNumber(tile) + 1;
    var currentColumn = getColumnBasedOnTileNumber(tile);
    
    if (currentColumn > 1 && currentColumn < settings.numOfTilesInRow && currentRow > 1 && currentRow <= settings.numOfTilesInRow) {
      var method;
      var mod;

      if (currentRow%2 === 0) {
        mod = 3;
      } else {
        mod = 0;
      }

      if ((currentColumn+mod)%6 === 0) {
        method = 'diagonalTopToBottom';
        tileDetails.push(compressionMethodDetails(method , getTileCorners(tile)));
      } 
      
      if ((currentColumn+mod+4)%6 === 0) {
        method = 'diagonalBottomToTop';
        tileDetails.push(compressionMethodDetails(method , getTileCorners(tile)));
      }

    }
  }
  return tileDetails;
}


//var cornersPerTileLength = cornersPerTile.length;
var layoutArray = [experimental(), classicCanadian(), classicWave()];

function updateParticles(particles) {

  var cornersPerTile = layoutArray[settings.layout];
  var cornersPerTileLength = cornersPerTile.length;

  for (var tile = 0; tile < cornersPerTileLength; tile++) {
    //var tileDetails = cornersPerTile[tile].mainCorners;
    var tileDetails = cornersPerTile[tile];

    for (var key in tileDetails) {
      var cornersArray = tileDetails[key];
      var pCenter = particles[cornersArray[0]];
      if (cornersArray[1] > 0 && cornersArray[2] < settings.upperLimit) {
        var p1 = particles[cornersArray[1]];
        var p2 = particles[cornersArray[2]];
        
        var pCenterV = pCenter.original.clone(pCenter.original.x, pCenter.original.y, 0);

        if (p2 == undefined) {
        }

        pCenterV.set(pCenterV.x, pCenterV.y, -5);

        p1.position.copy(pCenterV);
        p1.previous.copy(pCenterV);

        p2.position.copy(pCenterV);
        p2.previous.copy(pCenterV);
      }
    }
    //this is for two points only right now
  } 
}

export { settings, updateParticles }
