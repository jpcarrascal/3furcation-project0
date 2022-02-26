function genTokenData(projectNum) {
  let data = {};
  let hash = "0x";
  for (var i = 0; i < 64; i++) {
    hash += Math.floor(Math.random() * 16).toString(16);
  }
  data.hash = hash;
  data.tokenId = (projectNum * 1000000 + Math.floor(Math.random() * 1000)).toString();
  return data;
}
let tokenData = genTokenData(123);

//tokenData = { hash: "0x11ac16678959949c12d5410212301960fc496813cbc3495bf77aeed738579738", tokenId: "123000456" }

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
    this.prngA = new sfc32(tokenData.hash.substr(2, 32));
    this.prngB = new sfc32(tokenData.hash.substr(34, 32));
    for (let i = 0; i < 1e6; i += 2) {
      this.prngA();
      this.prngB();
    }
  }
  random_dec() {
    this.useA = !this.useA;
    return this.useA ? this.prngA() : this.prngB();
  }
  random_num(a, b) {
    return a + (b - a) * this.random_dec();
  }
  random_int(a, b) {
    return Math.floor(this.random_num(a, b + 1));
  }
  random_bool(p) {
    return this.random_dec() < p;
  }
  random_choice(list) {
    return list[this.random_int(0, list.length - 1)];
  }
}

var DEFAULT_SIZE = 1000;
var WIDTH = window.innerWidth;
var HEIGHT = window.innerHeight;
var DIM = Math.min(WIDTH, HEIGHT);
var strokeBase = DIM / DEFAULT_SIZE;

let xMin, yMin, WID, HEI;
let ntrees, iterations;
let r, g, b, bgcolor, fgcolor, frameColor, rejectorColor, rejectorColor2;
let attractor;
let rejectors;
let gravity;
let branches;
let R = new Random();
let light;
let running = true;
function setup()
{
  if(WIDTH/HEIGHT > 3/4) {
    yMin = 0;
    HEI = HEIGHT;
    xMin = WIDTH/2-HEI*3/8;
    WID = HEI*3/4;
  } else {
    xMin = 0;
    WID = WIDTH;
    yMin = HEIGHT/2-WID*4/6;
    HEI = WID*4/3;
  }
  createCanvas(WIDTH, HEIGHT);
  frame = createGraphics(WIDTH, HEIGHT);
  smooth();
  strokeCap(ROUND);
  strokeJoin(ROUND);
  light = R.random_bool(0.5);
  let noiseScale=0.05;
  for (let x=0; x < HEIGHT; x++) {
    let noiseVal = noise(x*noiseScale, noiseScale);
    stroke(noiseVal*255);
    line(x, 0, x, HEIGHT);
  }
  if(light) {
    r = R.random_int(180,200);
    g = R.random_int(180,200);
    b = R.random_int(180,220);
    fgcolor = color(150,0,0,51);
    frameColor = color(r*0.7, g*0.7, b*0.7);
    bgcolor = color(r,g,b,120);
    circleColor = color(compColor(bgcolor));
    circleColor.setAlpha(90);
    vGradient(0, yMin, WIDTH, HEI, bgcolor, frameColor);
  } else {
    r = R.random_int(15,55);
    g = R.random_int(15,55);
    b = R.random_int(15,55);
    if(r<b && r<g) r*=0.3;
    else if(g<b && g<r) g*=0.3;
    else b*=0.3;
    fgcolor = color(200,200,200,51);
    frameColor = color(r*0.5, g*0.5, b*0.5);
    bgcolor = color(r,g,b,120);
    circleColor = color(compColor(bgcolor));
    circleColor.setAlpha(60);
    vGradient(0, yMin, WIDTH, HEI, bgcolor, frameColor);
  }
  rejectorColor = lerpColor(fgcolor, bgcolor,0.8);
  rejectorColor2 = color(r*1.2, g*1.2, b*1.2);
  rejectorColor.setAlpha(255);    
  stroke(fgcolor);
  fill(fgcolor);
  frameRate(60);
  ntrees = 30;
  nrejectors = R.random_int(3,7);
  iterations = 600;
  gravity = 150000*strokeBase*strokeBase;
  attractor = createVector(WID/2, HEI*2);
  rejectors = initRejectors(nrejectors);
  branches = initBranches(ntrees);
}

function draw()
{
  translate(xMin, yMin);
  if(frameCount < iterations && running) {
    if(frameCount%18 == 0) {
      let al = alpha(fgcolor);
      fgcolor.setAlpha(al-1);
      stroke(fgcolor);
      if(al == 25) running = false;
    }
    for (let j=0; j<branches.length; j++) {
      if(branches[j]) {
        if(!branches[j].growing) branches[j] = null;
        let splitChance = ((R.random_int(branches[j].divRateMin, branches[j].divRateMax)));
        if (frameCount % splitChance == 0) {
          branches[j].growing = false;
          let oneChildSize = R.random_num(0.3, 0.9);
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
    drawFrame();
    image(frame, -xMin,-yMin);

    for(let i=0; i<rejectors.length; i++) {
      drawRejector(rejectors[i],frameCount==1);
    }
  }
  if(frameCount == iterations) {
    branches = null;
    print ("Done.");
  }

}

function mouseClicked() {
  //save("frame.png");
}

function initBranches(ntrees) {
  let branches = Array();
  for (let i = 0; i < ntrees; i++) {
    let position = createVector( i*(WID/ntrees)+(WID/ntrees)/2*R.random_num(0.5,1), 0 );
    let speed = createVector(0,2*strokeBase*R.random_num(0.8,1.2));
    let strokeWidth = R.random_num(3, 13)*strokeBase;
    let drift = 0.08//*strokeBase;
    let diverge = 0.4//*strokeBase;
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
    let x = i*(WID/nrejectors)+(WID/nrejectors)/2*R.random_num(0.5,2);
    let y = R.random_num(0.05, 0.6)*HEI;
    rejector.pos = createVector(x, y);
    rejector.w = strokeBase*R.random_num(200,600)/nrejectors;
    rejector.mag = rejector.w*strokeBase/2;
    rejector.h = rejector.w + strokeBase*R.random_num(200,400);
    rejectors.push(rejector);
  }
  return rejectors;
}

function drawRejector(rejector,shadow) {
  if(!shadow) shadow = false;
  let pos = rejector.pos;
  let w = rejector.w;
  let h = rejector.h;
  push();
  fill(rejectorColor);
  strokeWeight(2*strokeBase);
  if(light) {
    stroke(lerpColor(bgcolor, frameColor, 0.7))
    bezier(pos.x, pos.y, pos.x+w, pos.y+w, pos.x, pos.y+100*strokeBase, pos.x, pos.y+h);
    fill( lerpColor(rejectorColor2, color(255,255,255), 0.7) );
    bezier(pos.x, pos.y, pos.x-w, pos.y+w, pos.x, pos.y+100*strokeBase, pos.x, pos.y+h);
  } else {
    stroke(bgcolor)
    bezier(pos.x, pos.y, pos.x-w, pos.y+w, pos.x, pos.y+100*strokeBase, pos.x, pos.y+h);
    fill( lerpColor(rejectorColor2, color(0,0,0), 0.5) );
    bezier(pos.x, pos.y, pos.x+w, pos.y+w, pos.x, pos.y+100*strokeBase, pos.x, pos.y+h);
  }
  if(shadow) {
    posShadow = createVector(pos.x+20*strokeBase, pos.y+5*strokeBase);
    push();
    stroke(0,0,0,0);
    if(light)
      fill(0,0,0,10);
    else
      fill(0,0,0,30);
    bezier(posShadow.x, posShadow.y, posShadow.x-w, posShadow.y+w, posShadow.x, posShadow.y+100*strokeBase, posShadow.x, posShadow.y+h);
    bezier(posShadow.x, posShadow.y, posShadow.x+w, posShadow.y+w, posShadow.x, posShadow.y+100*strokeBase, posShadow.x, posShadow.y+h);
    pop();
  }
  pop();
  push();
  noStroke();
  fill(circleColor);
  circle(pos.x, pos.y+h/5, w/2.1);
  pop();
}

function drawFrame() {
  frame.push();
  frame.noStroke();
  frame.fill(frameColor);
  frame.rect(0, 0, WIDTH, HEIGHT);
  frame.translate(xMin, yMin);
  frame.erase();
  frame.stroke("Red")
  frame.bezier(WID/2, 0.01*HEI, WID*0.2, HEI*0.1, 0,   HEI/4, 0,   HEI*0.5);       
  frame.bezier(WID/2, 0.01*HEI, WID*0.8, HEI*0.1, WID, HEI/4, WID, HEI*0.5);       
  frame.triangle(0, HEI*0.5, WID/2, 0.01*HEI, WID, HEI*0.5);
  frame.rect(0, HEI*0.5, WID, HEI*0.5);
  frame.noErase();
  frame.pop();
}

function windowResized() {
  window.location.reload();
  print("Reloading...");
}


function compColor(c) {
  let input = [red(c), green(c), blue(c)];
  let output = [1, 1, 1];
  let largest = 0;
  for(let i=0; i<input.length; i++) {
    output[i] = 255 - input[i];
  }
  return color(output);
}


function vGradient(x, y, w, h, c1, c2) {
  push();
  noFill();
  for (let i = y; i <= y + h; i++) {
    let inter = map(i, y, y + h, 0, 1);
    let c = lerpColor(c1, c2, inter);
    strokeWeight(2)
    stroke(c);
    line(x, i, x + w, i);
  }
  pop();
}

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
  grow(attractor, rejectors, gravity, frames) {
    if(frames%18 == 0) this.wid*=0.95;
    if(this.wid < 0) this.growing = false;
    strokeWeight(this.wid);
    let attractorNorm;
    let rejectorNorm;
    if(attractor) {
      attractor.x = this.curPos.x;
      attractorNorm = attractor.copy();
    }
    if (this.growing) {
      if (attractor != null) {
        let D;
        let mag = this.speed.mag();
        D = p5.Vector.dist(this.curPos, attractorNorm);
        attractorNorm.sub(this.curPos).normalize().mult(gravity/(D*D));
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).add(attractorNorm).normalize();
        for(let i=0; i<rejectors.length; i++) {
          rejectorNorm = rejectors[i].pos.copy();
          D = p5.Vector.dist(this.curPos, rejectorNorm);
          rejectorNorm.sub(this.curPos).normalize().mult(-rejectors[i].mag/(D*D));
          let rejectVect = createVector(rejectorNorm.x, 0);
          this.speed = p5.Vector.fromAngle(this.speed.heading()).add(rejectVect).normalize();
        }
        this.speed.mult(mag);
      }
      else {
        this.speed = p5.Vector.fromAngle(this.speed.heading() + R.random_num(-this.drift, this.drift)).mult(this.speed.mag());
      }
      let nextPos = p5.Vector.add(this.curPos, this.speed);
      this.linePV(this.curPos, nextPos);
      this.curPos = nextPos;
    }
  }
  linePV(a, b) {
    line(a.x, a.y, b.x, b.y);
  }
}