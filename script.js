tokenData = {
  hash: "0x11ac16678959949c12d5410212301960fc496813cbc3495bf77aeed738579738",
  hash: "0x"+Math.random(2,3498294),
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

var DEFAULT_SIZE = 1000
var WIDTH = window.innerWidth
var HEIGHT = window.innerHeight
var size = Math.min(WIDTH, HEIGHT)
var strokeBase = size / DEFAULT_SIZE

let ntrees, iterations;
let r, g, b, bgcolor, fgcolor, fgcolorSolid, frameColor;
let attractor;
let rejectors;
let gravity;
let branches = Array();
let R = new Random();
let light;
function setup()
{
  createCanvas(size, size);
  smooth();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  light = R.random_bool(0.5);
  if(light) {
    r = R.random_int(200,255), g = R.random_int(200,255), b = R.random_int(200,255);
    fgcolor = color(150,0,0,51);
    fgcolorSolid = color(150,0,0,255);
    frameColor = color(100,0,0,255);
  } else {
    r = R.random_int(0,50), g = R.random_int(0,50), b = R.random_int(0,50);
    fgcolor = color(250,250,250,51);
    fgcolorSolid = color(250,250,250,255);
    frameColor = color(80,80,80,255);
  }
  bgcolor = color(r,g,b);
  background(bgcolor);
  stroke(fgcolor);
  fill(fgcolor);
  //background(255,245,180,255); stroke(150,0,0,51);
  frameRate(60);
  ntrees = 40;
  iterations = 600;
  gravity = 100000;
  attractor = createVector(size/2, 2000*strokeBase);
  rejectors = initRejectors();//[createVector(200*strokeBase, 900*strokeBase), createVector(800*strokeBase,600*strokeBase)]
  branches = initBranches(ntrees);

  for(let i=0; i<rejectors.length; i++) {
    drawRejector(rejectors[i]);
  }
}

function draw()
{
  
  if(frameCount < iterations) {
  //if(frameCount == 1) {
    //for(let i=0; i<iterations; i++) {
      for (let j=0; j<branches.length; j++) {
        branches[j].grow(attractor, rejectors, gravity, frameCount);
        //branches[j].grow(null, gravity, rejectors, frameCount);
      }
    //}
  }
  drawFrame();
  if(frameCount == iterations) print ("STOP");
}

function mouseClicked() {
  //background(0);
  saveFrames("frame.png");
  //branches = null;
  //branches = initBranches(ntrees);
}

function initBranches(ntrees) {
  let branches = Array();
  for (let i = 0; i < ntrees; i++) {
    let position = createVector( i*(width/ntrees)+(width/ntrees)/2*R.random_num(0.5,1), 0 );
    let speed = createVector(0,2*strokeBase*R.random_num(0.8,1.2));
    // (start, speed, wid, drift, diverge, divRateMin, divRateMax)
    branches.push( new Branch( position, speed, R.random_num(0.1, 8)*strokeBase, 0.1, 0.5, 50, 150 ) );
  }
  return branches;
}

function initRejectors() {
  const n = R.random_int(2,4);
  let rejectors = Array();
  for (let i = 0; i < n; i++) {
    let rejector = Object();
    let x = i*(width/n)+(width/n)/2*R.random_num(0.5,2); //R.random_num(0, 1)*size;
    let y = R.random_num(0.1, 0.8)*size;
    rejector.pos = createVector(x, y);
    rejector.mag = strokeBase*R.random_num(200,600)/n;
    rejectors.push(rejector);
  }
  return rejectors;
}

function drawRejector(rejector) {
  let pos = rejector.pos;
  let r = rejector.mag;
  let w = r;
  let h = w + strokeBase*R.random_num(200,400);
  push();
  noStroke();
  circle(pos.x, pos.y+h/5, w/2);
  pop();
  push();
  bezier(pos.x, pos.y, pos.x-w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
  if(light) {
    noFill();
    bezier(pos.x, pos.y, pos.x+w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
  }
  pop();
}

function drawFrame() {
  push();
  stroke(0,0,0,0);
  fill(frameColor);
  rect(0, 0, 0.03*size, size);
  rect(0, 0, size, 0.03*size);
  rect(0, 0.97*size, size, 0.03*size);
  rect(0.97*size, 0, 0.03*size, size);
  let tmpColor = bgcolor;
  tmpColor.setAlpha(150);
  stroke(tmpColor);
  strokeWeight(strokeBase);
  fill(0,0,0,0);
  rect(0.015*size, 0.015*size, 0.97*size, 0.97*size);
  fill(frameColor);
  rect(0.0075*size, 0.0075*size, 0.015*size);
  rect(0.9775*size, 0.0075*size, 0.015*size);
  rect(0.0075*size, 0.9775*size, 0.015*size);
  rect(0.9775*size, 0.9775*size, 0.015*size);
  pop();  
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
  grow(attractor, rejectors, gravity, frames) {
    strokeWeight(this.wid);
    let attractorNorm, rejectorsNorm = Array();
    if(attractor) {
      attractor.x = this.curPos.x;
      attractorNorm = attractor.copy();
    }
    if(rejectors) {
      for(let i=0; i<rejectors.length; i++) {
        //rejectorsNorm.push(rejectors[i].pos.copy());
        rejectors[i].norm = rejectors[i].pos.copy()
      }
    }
    if (this.growing) {
      if (attractor != null) {
        let D;
        D = p5.Vector.dist(this.curPos, attractorNorm);
        attractorNorm.sub(this.curPos).normalize().mult(gravity/(D*D));
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).add(attractorNorm).normalize().mult(this.speed.mag());
        for(let i=0; i<rejectors.length; i++) {
          D = p5.Vector.dist(this.curPos, rejectors[i].norm);
          rejectors[i].norm.sub(this.curPos).normalize().mult(-0.00001*rejectors[i].mag*gravity/(D*D));
          let rejectVect = createVector(rejectors[i].norm.x, 0);
          this.speed = p5.Vector.fromAngle(this.speed.heading()).add(rejectVect).normalize().mult(this.speed.mag());
        }
      }
      else {
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).mult(this.speed.mag());
      }
      let nextPos = p5.Vector.add(this.curPos, this.speed);
      this.linePV(this.curPos, nextPos);
      this.curPos = nextPos;
    } else {
      this.child1.grow(attractor, rejectors, gravity, frames);
      this.child2.grow(attractor, rejectors, gravity, frames);
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