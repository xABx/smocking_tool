var gridSize = 20;
var halfGrid = gridSize/2;
var quarterGrid = ~~(gridSize/4);
var xSegs = 400;
var ySegs = 400;
var numOfTilesInRow = xSegs/gridSize;

// Our fabric is square so the number of tiles in a row is the same as in a column
var numOfCornersPerRow = xSegs+1;
var totalTiles = numOfTilesInRow*numOfTilesInRow;

function getRowBasedOnTileNumber(tileNumber) {
  return Math.floor(tileNumber/numOfTilesInRow);
}

function getColumnBasedOnTileNumber(tileNumber) {
  return tileNumber%numOfTilesInRow + 1;
}

function getTileCorners(tileNumber) {
  var row = getRowBasedOnTileNumber(tileNumber);
  var column = getColumnBasedOnTileNumber(tileNumber);
  var offset = gridSize*numOfCornersPerRow;
  var topRightCorner = column*gridSize + row*offset;
  var topLeftCorner = topRightCorner - gridSize;
  var bottomLeftCorner = topLeftCorner + offset;
  var bottomRightCorner = bottomLeftCorner + gridSize;
  var center = topLeftCorner + halfGrid + (halfGrid*numOfCornersPerRow); 
  
  // Supports for the diagonalTopToBotton Compression Method
  var cOffset = quarterGrid*numOfCornersPerRow;
  var negAdjustOffset = -cOffset + quarterGrid;
  var posAdjustOffset = cOffset - quarterGrid;

  var tlcSupport1 = topLeftCorner + negAdjustOffset;
  var tlcSupport2 = topLeftCorner + posAdjustOffset;

  var brcSupport1 = bottomRightCorner + negAdjustOffset;
  var brcSupport2 = bottomRightCorner + posAdjustOffset;

  var tlcBrcSupportCenter1 = center + negAdjustOffset;
  var tlcBrcSupportCenter2 = center + posAdjustOffset;

  // Supports for the diagonalBottomToTop Compression Method
  var negAdjustOffset2 = -cOffset - quarterGrid;
  var posAdjustOffset2 = cOffset + quarterGrid;

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
  var accrossTop  = [center, topLeft, topRight];
  var downLeftSide = [center, topLeft, bottomLeft];
  var diagonalTopToBottom = {
    mainCorners: [center, topLeft, bottomRight],
    support1: corners.supportCorners.diagonalTopToBottom.upperSupport,
    support2: corners.supportCorners.diagonalTopToBottom.lowerSupport,
  };
  var diagonalBottomToTop = {
    mainCorners: [center, bottomLeft, topRight],
    support1: corners.supportCorners.diagonalBottomToTop.upperSupport,
    support2: corners.supportCorners.diagonalBottomToTop.lowerSupport
  };
  var topAndLeftSide = [center, topLeft, topRight, bottomLeft];

  var compressionMethods = {
    accrossTop: accrossTop,
    downLeftSide: downLeftSide,
    diagonalTopToBottom: diagonalTopToBottom,
    diagonalBottomToTop: diagonalBottomToTop,
    topAndLeftSide: topAndLeftSide
  };

  return compressionMethods[compressionMethod];
}

var cornersPerTile = [];

//Redo smocking grid generation. Compare to smocked fabric to ensure it is correct.
for (var tile = numOfTilesInRow+1; tile < totalTiles-2; tile ++) {
  var currentRow = getRowBasedOnTileNumber(tile) + 1;
  var currentColumn = getColumnBasedOnTileNumber(tile);
  
  if (currentColumn > 1 && currentColumn < numOfTilesInRow && currentRow > 1 && currentRow < numOfTilesInRow) {
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
      cornersPerTile.push(compressionMethodDetails(method , getTileCorners(tile)));
    }
  }
}


var cornersPerTileLength = cornersPerTile.length;

function updateParticles(particles) {

  for (var tile = 0; tile < cornersPerTileLength; tile++) {
    //var tileDetails = cornersPerTile[tile].mainCorners;
    var tileDetails = cornersPerTile[tile];

    for (var key in tileDetails) {
      var cornersArray = tileDetails[key];
      var pCenter = particles[cornersArray[0]];
      if (cornersArray[1] > 0 && cornersArray[2] < 160000) {
        var p1 = particles[cornersArray[1]];
        var p2 = particles[cornersArray[2]];
        
        var pCenterV = pCenter.original.clone(pCenter.original.x, pCenter.original.y, 0);

        if (p2 == undefined) {
          console.log(cornersArray[2], 'what the hell');
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

export { xSegs, ySegs, updateParticles }
