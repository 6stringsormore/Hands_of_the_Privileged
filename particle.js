// adapted from Daniel Shiffman's Nature of Code example

var Roff = 0;
var Goff = 120;
var Boff = 240;

class Particle {
  constructor(x = random(width), y = random(height), maxspeed = 4, r = 0, g = 500, b = 1000, strokeWeight = 40, alpha = 30) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.maxspeed = maxspeed;
    this.prevPos = this.pos.copy();
    this.r = r;
    this.g = g;
    this.b = b;
    this.strokeWeight = strokeWeight;
    this.alpha = alpha;
    this.isAttached = false;
  }

  update() {
    this.vel.add(this.acc);
    this.vel.limit(this.maxspeed);
    this.pos.add(this.vel);
    this.acc.mult(0);
  }

  follow(vectors) {
    var x = floor(this.pos.x / scl);
    var y = floor(this.pos.y / scl);
    var index = x + y * cols;
    var force = vectors[index];
    this.applyForce(force);
  }

  applyForce(force) {
    this.acc.add(force);
  }

  show() {
    // Only update colors for non-attached particles
    if (!this.isAttached) {
      this.r = map(noise(Roff),0,1,0,255);
      this.g = map(noise(Goff),0,1,0,0);  
      this.b = map(noise(Boff),0,1,0,50);  
      Roff += 0.01;
      Goff += 0.01;
      Boff += 0.01;
    }
    
    // Don't show attached particles if no hands are detected
    if (this.isAttached && !window.handsDetected) {
      return;
    }
    
    // Calculate ellipse dimensions based on velocity
    const speed = this.vel.mag();
    const ellipseWidth = map(speed, 0, this.maxspeed, 30, 50);
    const ellipseHeight = map(speed, 0, this.maxspeed, 15, 25);
    
    // Calculate angle of motion
    const angle = this.vel.heading();
    
    push();
    translate(this.pos.x, this.pos.y);
    rotate(angle);
    
    if (this.isAttached) {
      // For attached particles, draw three layers
      // Outer dark edge
      stroke(this.r * 0.5, this.g * 0.5, this.b * 0.5, 255);
      strokeWeight(this.strokeWeight * 1.2);
      noFill();
      ellipse(0, 0, ellipseWidth * 1.1, ellipseHeight * 1.1);
      
      // Middle ellipse with full color
      stroke(this.r, this.g, this.b, 255);
      strokeWeight(this.strokeWeight);
      noFill();
      ellipse(0, 0, ellipseWidth, ellipseHeight);
      
      // Inner ellipse with dimmer color
      noStroke();
      fill(this.r, this.g, this.b, 100);
      ellipse(0, 0, ellipseWidth * 0.6, ellipseHeight * 0.6);
    } else {
      // For non-attached particles, draw two layers
      // Outer dark edge
      stroke(this.r * 0.5, this.g * 0.5, this.b * 0.5, 100);
      strokeWeight(this.strokeWeight * 1.2);
      noFill();
      ellipse(0, 0, ellipseWidth * 1.1, ellipseHeight * 1.1);
      
      // Main particle
      stroke(this.r, this.g, this.b, 100);
      strokeWeight(this.strokeWeight);
      noFill();
      ellipse(0, 0, ellipseWidth, ellipseHeight);
    }
    
    pop();
  }

  updatePrev() {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }

  edges() {
    if (this.pos.x > width) {
      this.pos.x = 0;
      this.updatePrev();
    }
    if (this.pos.x < 0) {
      this.pos.x = width;
      this.updatePrev();
    }
    if (this.pos.y > height) {
      this.pos.y = 0;
      this.updatePrev();
    }
    if (this.pos.y < 0) {
      this.pos.y = height;
      this.updatePrev();
    }
  }
}