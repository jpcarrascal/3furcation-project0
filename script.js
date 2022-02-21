tokenData = {
  hash: "0x11ac16678959949c12d5410212301960fc496813cbc3495bf77aeed738579738",
  //hash: "0x"+Math.random(2,3498294),
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
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var DIM = Math.min(WIDTH, HEIGHT);
var strokeBase = DIM / DEFAULT_SIZE;

let ntrees, iterations;
let r, g, b, bgcolor, fgcolor, fgcolorSolid, frameColor, rejectorColor;
let attractor;
let rejectors;
let gravity;
let branches = Array();
let R = new Random();
let light;
function setup()
{
  createCanvas(DIM*3/4, DIM);
  smooth();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  light = R.random_bool(0.5);
  if(light) {
    r = R.random_int(190,200);
    g = R.random_int(190,200);
    b = R.random_int(200,220);
    fgcolor = color(150,0,0,51);
    fgcolorSolid = color(150,0,0,255);
    frameColor = color(100,0,0,255);
  } else {
    r = R.random_int(0,50);
    g = R.random_int(0,50);
    b = R.random_int(0,50);
    fgcolor = color(250,250,250,51);
    fgcolorSolid = color(250,250,250,255);
    frameColor = color(r*1.4, g*1.4, b*1.4);
  }
  bgcolor = color(r,g,b);
  rejectorColor = lerpColor(fgcolor, bgcolor,0.8);
  rejectorColor.setAlpha(255);
  background(bgcolor);
  if(light) vGradient(0, 0, width, height, bgcolor, color(r*1.2,g*1.2,b*1.2));
  else      vGradient(0, 0, width, height, bgcolor, color(r*0.5,g*0.5,b*0.5));
  stroke(fgcolor);
  fill(fgcolor);
  //background(255,245,180,255); stroke(150,0,0,51);
  frameRate(60);
  ntrees = 40, nrejectors = R.random_int(2,8);
  iterations = 600;
  gravity = 100000;
  attractor = createVector(width/2, height*2);
  rejectors = initRejectors(nrejectors);//[createVector(200*strokeBase, 900*strokeBase), createVector(800*strokeBase,600*strokeBase)]
  branches = initBranches(ntrees);
  for(let i=0; i<rejectors.length; i++) {
    drawRejector(rejectors[i]);
  }
}

function draw()
{
  let livingBranches = 0;
  if(frameCount < iterations) {
    if(frameCount%4 ==0) {
      fgcolor.setAlpha(alpha(fgcolor)+0);
      //stroke(fgcolor);
    }
    for (let j=0; j<branches.length; j++) {
      if(branches[j]) {
        livingBranches++;
        if (frameCount % (floor(R.random_num(branches[j].divRateMin, branches[j].divRateMax))) == 0) {
          branches[j].growing = false;
          let oneChildSize = R.random_num(0.2, 0.8);
          let speed1 = p5.Vector.fromAngle(branches[j].speed.heading()+((PI/2)*branches[j].diverge)+R.random_num(-branches[j].drift, branches[j].drift)).mult(branches[j].speed.mag());
          let speed2 = p5.Vector.fromAngle(branches[j].speed.heading()-((PI/2)*branches[j].diverge)+R.random_num(-branches[j].drift, branches[j].drift)).mult(branches[j].speed.mag());
          branches.push( new Branch(branches[j].curPos, speed1, branches[j].wid*oneChildSize,     branches[j].drift, branches[j].diverge, branches[j].divRateMin, branches[j].divRateMax) );
          branches.push( new Branch(branches[j].curPos, speed2, branches[j].wid*(1-oneChildSize), branches[j].drift, branches[j].diverge, branches[j].divRateMin, branches[j].divRateMax) );
          branches[j] = null;
        } else if (branches[j].curPos.y >= height) {
          branches[j].growing = false;
          branches[j] = null;
        } else {
          branches[j].grow(attractor, rejectors, gravity, frameCount);
          //branches[j].grow(null, gravity, rejectors, frameCount);            
        }
      }
    }
    for(let i=0; i<rejectors.length; i++) {
      drawRejector(rejectors[i]);
    }
  }
  drawFrame();
  if(frameCount == iterations) {
    branches = null;
    print ("STOP");
    //save("frame.png");
//    setTimeout( function() {
//      window.location.reload();
//    }, 500);
  }
}

function mouseClicked() {
  //background(0);


  //branches = null;
  //branches = initBranches(ntrees);
}

function initBranches(ntrees) {
  let branches = Array();
  for (let i = 0; i < ntrees; i++) {
    let position = createVector( i*(width/ntrees)+(width/ntrees)/2*R.random_num(0.5,1), 0 );
    let speed = createVector(0,2*strokeBase*R.random_num(0.8,1.2));
    let strokeWidth = R.random_num(0.1, 8)*strokeBase;
    let drift = 0.15*strokeBase;
    let diverge = 0.7*strokeBase;
    let divRateMin = 50;
    let divRateMax = 150;
    branches.push( new Branch( position, speed, strokeWidth, drift, diverge, divRateMin, divRateMax ) );
  }
  return branches;
}

function initRejectors(nrejectors) {
  let rejectors = Array();
  for (let i = 0; i < nrejectors; i++) {
    let rejector = Object();
    let x = i*(width/nrejectors)+(width/nrejectors)/2*R.random_num(0.5,2); //R.random_num(0, 1)*DIM;
    let y = R.random_num(0.1, 0.8)*DIM;
    rejector.pos = createVector(x, y);
    rejector.mag = strokeBase*R.random_num(200,600)/nrejectors;
    rejector.h = rejector.mag + strokeBase*R.random_num(200,400);
    rejectors.push(rejector);
  }
  return rejectors;
}

function drawRejector(rejector) {
  let pos = rejector.pos;
  let w = rejector.mag;
  let h = rejector.h;

  push();
  fill(rejectorColor);
  if(light) {
    noStroke();
    bezier(pos.x, pos.y, pos.x+w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
    fill( lerpColor(bgcolor, color(255,255,255), 0.7) );
    bezier(pos.x, pos.y, pos.x-w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
  } else {
    noStroke();
    bezier(pos.x, pos.y, pos.x-w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
    fill( lerpColor(bgcolor, color(0,0,0), 0.5) );
    bezier(pos.x, pos.y, pos.x+w, pos.y+w, pos.x, pos.y+strokeBase*100, pos.x, pos.y+h);
  }
  pop();
  push();
  noStroke();
  circle(pos.x, pos.y+h/5, w/2);
  pop();
}

function drawFrame() {
  push();
  noStroke();
  fill(frameColor);
  rect(0, 0, 0.02*width, height);
  rect(0, 0, width, 0.02*width);
  rect(0, height-(0.02*width), width, 0.02*width);
  rect(0.98*width, 0, 0.02*width, height);
  /*
  let tmpColor;
  if(light) {
    tmpColor = bgcolor;
    tmpColor.setAlpha(150);
  } else {
    tmpColor = fgcolor;
    tmpColor.setAlpha(80);
  }
  stroke(tmpColor);
  strokeWeight(strokeBase);
  noFill();
  rect(0.01*width, 0.01*width, 0.98*width, height-0.02*width);
  fill(frameColor);
  rect(0, 0, 0.02*width);
  rect(0.98*width, height-0.02*width, 0.02*width);
  rect(0, height-0.02*width, 0.02*width);
  rect(0.98*width, 0, 0.02*width);
  */
  pop();  
}

/*
function predominantColor(c) {
  let elem = [red(c), green(c), blue(c)];
  let largest = 0;
  for(let i=0; i<elem.length; i++) {
    if(elem[i] > elem[largest])
      largest = i;
  }
  print(largest)
  return largest;
}
*/

function vGradient(x, y, w, h, c1, c2) {
  push();
  noFill();
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    stroke(c);
    line(x, i, x + w, i);
  }
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
  }

  // Helper function for drawing lines between vectors
  linePV(a, b) {
    line(a.x, a.y, b.x, b.y);
  }
}