/*
 * Cloth Simulation using a relaxed constraints solver
 */

// Suggested Readings

// Advanced Character Physics by Thomas Jakobsen Character
// http://freespace.virgin.net/hugo.elias/models/m_cloth.htm
// http://en.wikipedia.org/wiki/Cloth_modeling
// http://cg.alexandra.dk/tag/spring-mass-system/
// Real-time Cloth Animation http://www.darwin3d.com/gamedev/articles/col0599.pdf

var DAMPING = 0.03;
var DRAG = 1 - DAMPING;
var MASS = 0.0001;
var restDistance = 5;

var xSegs = 400;
var ySegs = 400;

var clothFunction = plane( restDistance * xSegs, restDistance * ySegs );

var cloth = new Cloth( xSegs, ySegs );

//var GRAVITY = 981 * 1.4;
var GRAVITY = 50;
//var gravity = new THREE.Vector3( 0, - GRAVITY, 0 ).multiplyScalar( MASS );
var gravity = new THREE.Vector3( 0, 0, GRAVITY ).multiplyScalar( MASS );


var TIMESTEP = 18 / 1000;
var TIMESTEP_SQ = TIMESTEP * TIMESTEP;
var pins = [];
var gridSize = 20;
var halfGrid = gridSize/2;
var quarterGrid = ~~(gridSize/4);
var pinx, piny;

var xofst, yofst, sumofst;
// Our fabric is square so the number of tiles in a row is the same as in a column
var numOfTilesInRow = xSegs/gridSize;
var numOfCornersPerRow = xSegs+1;

//This pins a grid based on grid size
for (piny = 0; piny <= numOfTilesInRow; piny ++) {
  for ( pinx = 0; pinx <= numOfTilesInRow; pinx ++) {
    xofst = pinx*gridSize;   
    yofst = piny*gridSize*numOfCornersPerRow;
    sumofst = xofst+yofst;
    pins.push(sumofst);
  }
}

// Get number of tiles
var totalTiles = numOfTilesInRow*numOfTilesInRow;

// Get four corners based tile number numbered [top left, top right, bottom right, bottom left]
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

// Get Row and column based on tile number
function getRowBasedOnTileNumber(tileNumber) {
  return Math.floor(tileNumber/numOfTilesInRow);
}

function getColumnBasedOnTileNumber(tileNumber) {
  return tileNumber%numOfTilesInRow + 1;
}

// Compressed columns
// Compressed rows
// Compression method
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

    // The current method is bringing one up and one down so a middle row at grid size 50 has 4 points instead of 2 -- this is correct but will skew the pattern. Should be using midpoints.
    if ((tile+mod)%2 == 0) {
      cornersPerTile.push(compressionMethodDetails(method , getTileCorners(tile)));
    }
  }
}

// Pin perimeter based on compressed rows and columns

var tmpForce = new THREE.Vector3();

var lastTime;


function plane( width, height ) {

	return function ( u, v, target ) {
		var x = ( u - 0.5 ) * width;
		var y = ( v - 0.5 ) *height;
		var z = 0;

		target.set( x, y, z );

	};

}

function Particle( x, y, z, mass ) {

	this.position = new THREE.Vector3();
	this.previous = new THREE.Vector3();
	this.original = new THREE.Vector3();
	this.a = new THREE.Vector3( 0, 0, 0 ); // acceleration
	this.mass = mass;
	this.invMass = 1 / mass;
	this.tmp = new THREE.Vector3();
	this.tmp2 = new THREE.Vector3();

	// init

	clothFunction( x, y, this.position ); // position
	clothFunction( x, y, this.previous ); // previous
	clothFunction( x, y, this.original );

}

// Force -> Acceleration

Particle.prototype.addForce = function ( force ) {

	this.a.add(
		this.tmp2.copy( force ).multiplyScalar( this.invMass )
	);

};


// Performs Verlet integration

Particle.prototype.integrate = function ( timesq ) {

	var newPos = this.tmp.subVectors( this.position, this.previous );
	newPos.multiplyScalar( DRAG ).add( this.position );
	newPos.add( this.a.multiplyScalar( timesq ) );

	this.tmp = this.previous;
	this.previous = this.position;
	this.position = newPos;

	this.a.set( 0, 0, 0 );

};


var diff = new THREE.Vector3();

function satisfyConstraints( p1, p2, distance ) {

	diff.subVectors( p2.position, p1.position );
	var currentDist = diff.length();
	if ( currentDist === 0 ) return; // prevents division by 0
	var correction = diff.multiplyScalar( 1 - distance / currentDist );
	var correctionHalf = correction.multiplyScalar( 0.5 );
	p1.position.add( correctionHalf );
	p2.position.sub( correctionHalf );

}


function Cloth( w, h ) {

	w = w || 10;
	h = h || 10;
	this.w = w;
	this.h = h;

	var particles = [];
	var constraints = [];

	var u, v;

	// Create particles
	for ( v = 0; v <= h; v ++ ) {
		for ( u = 0; u <= w; u ++ ) {
			particles.push(
				new Particle( u / w, v / h, 0, MASS )
			);
		}
	}
	// Structural

	for ( v = 0; v < h; v ++ ) {

		for ( u = 0; u < w; u ++ ) {

			constraints.push( [
				particles[ index( u, v ) ],
				particles[ index( u, v + 1 ) ],
				restDistance
			] );

			constraints.push( [
				particles[ index( u, v ) ],
				particles[ index( u + 1, v ) ],
				restDistance
			] );

		}

	}

	for ( u = w, v = 0; v < h; v ++ ) {

		constraints.push( [
			particles[ index( u, v ) ],
			particles[ index( u, v + 1 ) ],
			restDistance

		] );

	}

	for ( v = h, u = 0; u < w; u ++ ) {

		constraints.push( [
			particles[ index( u, v ) ],
			particles[ index( u + 1, v ) ],
			restDistance
		] );

	}

	this.particles = particles;
	this.constraints = constraints;

	function index( u, v ) {

		return u + v * ( w + 1 );

	}

	this.index = index;

}

function simulate( time ) {

	if ( ! lastTime ) {

		lastTime = time;
		return;

	}

	var i, il, particles, particle, pt, constraints, constraint;

	for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ) {

		particle = particles[ i ];
		particle.addForce( gravity );

		particle.integrate( TIMESTEP_SQ );

	}

	// Start Constraints

	constraints = cloth.constraints;
	il = constraints.length;

	for ( i = 0; i < il; i ++ ) {

		constraint = constraints[ i ];
		satisfyConstraints( constraint[ 0 ], constraint[ 1 ], constraint[ 2 ] );

	}


	// Floor Constraints

  var pos;

	for ( particles = cloth.particles, i = 0, il = particles.length; i < il; i ++ ) {

		particle = particles[ i ];
		pos = particle.position;
		if ( pos.y < - 1000 ) {

			pos.y = - 1000;

		}

	}

	// Pin Constraints
  // The next thing to work on is using the offset of compressed rows and columns so things don't just become a stretched mess.
  var cornersPerTileLength = cornersPerTile.length;

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

        //pCenter.position.copy(pCenterV);
        //pCenter.previous.copy(pCenterV);

        pCenterV.set(pCenterV.x, pCenterV.y, -5);

        p1.position.copy(pCenterV);
        p1.previous.copy(pCenterV);

        //p1.original.set(p1.original.x, p1.original.y, 15);

        p2.position.copy(pCenterV);
        p2.previous.copy(pCenterV);
      }
    }


    //this is for two points only right now
    
  }
	//for ( i = 0, il = pins.length; i < il; i ++ ) {

	//	var xy = pins[ i ];
	//	var p = particles[ xy ];
  //  if (xy > 100) {
  //    p.original.set(p.original.x, p.original.y, -20);
  //  }
  //  p.position.copy( p.original );
  //  p.previous.copy( p.original );
	//}


}

export { cloth, clothFunction, ballSize, simulate };
