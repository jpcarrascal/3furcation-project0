tokenData = {
  hash: "0x11ac16678959949c12d5410212301960fc496813cbc3495bf77aeed738579738",
  tokenId: "123000456"
}

class Random {
  constructor() {
    this.useA = false;
    let sfc32 = function (uint128Hex) {
      let a = parseInt(uint128Hex.substr(0, 8), 16);
      let b = parseInt(uint128Hex.substr(8, 8), 16);
      let c = parseInt(uint128Hex.substr(16, 8), 16);
      let d = parseInt(uint128Hex.substr(24, 8), 16);
      return function () {
        a |= 0; b |= 0; c |= 0; d |= 0;
        let t = (((a + b) | 0) + d) | 0;
        d = (d + 1) | 0;
        a = b ^ (b >>> 9);
        b = (c + (c << 3)) | 0;
        c = (c << 21) | (c >>> 11);
        c = (c + t) | 0;
        return (t >>> 0) / 4294967296;
      };
    };
    // seed prngA with first half of tokenData.hash
    this.prngA = new sfc32(tokenData.hash.substr(2, 32));
    // seed prngB with second half of tokenData.hash
    this.prngB = new sfc32(tokenData.hash.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }
  // random number between 0 (inclusive) and 1 (exclusive)
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }
  // random number between a (inclusive) and b (exclusive)
  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }
  // random integer between a (inclusive) and b (inclusive)
  // requires a < b for proper probability distribution
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }
  // random boolean with p as percent liklihood of true
  random_bool(p) {
    return this.random_dec() < p;
  }
  // random value in an array of items
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}

const getComplementaryColor = (color = '') => {
  const colorPart = color.slice(1);
  const ind = parseInt(colorPart, 16);
  let iter = ((1 << 4 * colorPart.length) - 1 - ind).toString(16);
  while (iter.length < colorPart.length) {
     iter = '0' + iter;
  };
  return '#' + iter;
};

var DEFAULT_SIZE = 1000
var WIDTH = window.innerWidth
var HEIGHT = window.innerHeight
var size = Math.min(WIDTH, HEIGHT)
var strokeBase = size / DEFAULT_SIZE

let ntrees, iterations;
let bgColor, fgColor, luma;
let attractor;
let gravity;
let branches = Array();
let R = new Random();
function setup()
{
  createCanvas(size, size);
  smooth();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  let r = R.random_int(0,255), g = R.random_int(0,255), b = R.random_int(0,255);
  bgColor = "rgb(" + r + "," + g + "," + b + ")";
  fgColor = "rgba(" + (255-r) + "," + (255-g) + "," + (255-b) + ",0.3)";
  luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  background(bgColor);
  if(luma>40) {
    fill("rgba(0,0,0,0.2)");
    stroke("rgba(0,0,0,0.2)");
  } else {
    fill("rgba(255,255,255,0.3)");
    stroke("rgba(255,255,255,0.3)");
  }
  frameRate(60);
  ntrees = 20;
  iterations = 640;
  gravity = 1000;
  attractor = createVector(size/2, -8000*strokeBase);
  branches = initBranches(ntrees);
}

function draw()
{  
  if(frameCount < iterations) {
    for (let j=0; j<branches.length; j++) {
      branches[j].grow(attractor, gravity, frameCount);
      //branches[i].grow(null, gravity, frameCount);
    }
    print(frameCount + "\t" + floor(getFrameRate()) );
  }
  if(frameCount == iterations) print ("STOP");
}

function mouseClicked() {
  //background(0);
  saveFrames("frame.png");
  //branches = null;
  //branches = initBranches(ntrees);
}

function initBranches(ntrees) {
  branches = Array();
  for (var i = 0; i < ntrees; i++) {
    let position = createVector( i*(width/ntrees)+(width/ntrees)/2, height );
    let speed = createVector(0,-2*strokeBase);
    // (start, speed, wid, drift, diverge, divRateMin, divRateMax)
    branches.push( new Branch( position, speed, R.random_num(0.1, 8)*strokeBase, 0.2, 0.5, 50, 150 ) );
  }
  return branches;
}

//=================================================================

class Branch {
  constructor(start, speed, wid, 
    drift, diverge, divRateMin, divRateMax) {
    this.speed = speed;
    this.curPos = start;
    this.wid = wid;
    this.growing = true;
    this.drift = drift;
    this.diverge = diverge;
    this.divRateMin = divRateMin;
    this.divRateMax = divRateMax;
  }
  // Attractor and gravity
  grow(attractor, gravity, frames) {
    strokeWeight(this.wid);
    let attractorNorm;
    if(attractor)
      attractorNorm = attractor.copy();
    if (this.growing) {
      if (attractorNorm != null) {
        let D = p5.Vector.dist(this.curPos, attractorNorm);
        attractorNorm.sub(this.curPos).normalize().mult(gravity/(D*D));
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).add(attractorNorm).normalize().mult(this.speed.mag());
      }
      else {
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).mult(this.speed.mag());
      }
      let nextPos = p5.Vector.add(this.curPos, this.speed);
      this.linePV(this.curPos, nextPos);
      this.curPos = nextPos;
    } else {
      this.child1.grow(attractor, gravity, frames);
      this.child2.grow(attractor, gravity, frames);
    }

    if (frames % (floor(R.random_num(this.divRateMin, this.divRateMax))) == 0) {
      if (this.growing)
        this.divide();
    }
  }

  divide() {
    if (this.growing) {
      this.growing = false;
      let oneChildSize = R.random_num(0.2, 0.8);
      let speed1 = p5.Vector.fromAngle(this.speed.heading()+((PI/2)*this.diverge)+R.random_num(-this.drift, this.drift)).mult(this.speed.mag());
      let speed2 = p5.Vector.fromAngle(this.speed.heading()-((PI/2)*this.diverge)+R.random_num(-this.drift, this.drift)).mult(this.speed.mag());
      this.child1 = new Branch(this.curPos, speed1, this.wid*oneChildSize,     this.drift, this.diverge, this.divRateMin, this.divRateMax);
      this.child2 = new Branch(this.curPos, speed2, this.wid*(1-oneChildSize), this.drift, this.diverge, this.divRateMin, this.divRateMax);
    } else {
      this.child1.divide();
      this.child2.divide();
    }
  }

  // Helper function for drawing lines between vectors
  linePV(a, b) {
    line(a.x, a.y, b.x, b.y);
  }
}