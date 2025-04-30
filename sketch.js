// adapted from Daniel Shiffman'
// i like more flow vectors ie bigger scale and more particles
//try 50 / 200 or 80/400, 100 is to big on the scl
var inc = 0.1;
var scl = 400;
var cols, rows;

var zoff = 0;

var fr;

var particles = [];

var flowfield;

// MediaPipe variables
let hands;
let video;
let results = null;
let lastHandPositions = [];
let particleCreationThreshold = 30; // Minimum distance to create new particle
window.handsDetected = false; // Global flag for hand detection

// Finger tracking variables
let lastFingerPositions = new Map(); // Store last positions for each hand
let flickThreshold = 30; // Minimum velocity for a flick
let maxFlickVelocity = 20; // Maximum velocity for particles
let minFlickDistance = 20; // Minimum distance for a flick
let lastFlickTime = new Map(); // Track last flick time for each hand
let flickCooldown = 200; // Milliseconds between flicks

// Track particles attached to hand points
let attachedParticles = new Map();

// Video visibility
let showVideo = false; // Start with video off by default

// Finger tip landmarks (MediaPipe hand landmarks)
const FINGER_TIPS = [4, 8, 12, 16, 20]; // Thumb, Index, Middle, Ring, Pinky tips

function setup() {
  createCanvas(windowWidth, windowHeight);
  cols = floor(width / scl);
  rows = floor(height / scl);
  fr = createP('');

  flowfield = new Array(cols * rows);

  // Setup MediaPipe Hands
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  hands = new self.Hands({
    locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4.1646424915/${file}`;
    }
  });

  hands.setOptions({
    maxNumHands: 2,
    modelComplexity: 1,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5
  });

  hands.onResults(onResults);
  
  // Start the camera
  video.elt.addEventListener('loadeddata', () => {
    console.log('Video loaded');
    startHandTracking();
  });
}

function startHandTracking() {
  const sendFrame = async () => {
    if (video.loadedmetadata) {
      try {
        await hands.send({image: video.elt});
        requestAnimationFrame(sendFrame);
      } catch (error) {
        console.error('Error sending frame to MediaPipe:', error);
      }
    }
  };
  sendFrame();
}

function onResults(results) {
  if (results) {
    this.results = results;
    window.handsDetected = results.multiHandLandmarks && results.multiHandLandmarks.length > 0;
    updateFingerPositions(results);
  } else {
    window.handsDetected = false;
  }
}

function createAttachedParticle(x, y) {
  const particle = new Particle(x, y, 4, 255, 0, 0, 20, 100);
  particle.isAttached = true;
  return particle;
}

function updateFingerPositions(results) {
  if (!results.multiHandLandmarks) return;

  const currentPositions = new Map();
  const currentTime = Date.now();
  
  results.multiHandLandmarks.forEach((landmarks, handIndex) => {
    // Track all hand points
    const pointPositions = {};
    landmarks.forEach((landmark, pointIndex) => {
      pointPositions[pointIndex] = {
        x: landmark.x * width,
        y: landmark.y * height,
        time: currentTime
      };
    });
    currentPositions.set(handIndex, pointPositions);
  });

  // Update attached particles and detect flicks
  currentPositions.forEach((currentPoints, handIndex) => {
    const lastPoints = lastFingerPositions.get(handIndex);
    const lastFlick = lastFlickTime.get(handIndex) || 0;
    
    Object.keys(currentPoints).forEach(pointIndex => {
      const currentPos = currentPoints[pointIndex];
      const lastPos = lastPoints ? lastPoints[pointIndex] : null;
      
      // Create or update attached particle
      const particleKey = `${handIndex}-${pointIndex}`;
      let attachedParticle = attachedParticles.get(particleKey);
      
      if (!attachedParticle) {
        // Create new attached particle
        attachedParticle = createAttachedParticle(currentPos.x, currentPos.y);
        attachedParticles.set(particleKey, attachedParticle);
        particles.push(attachedParticle);
      } else {
        // Update position of attached particle
        attachedParticle.pos.x = currentPos.x;
        attachedParticle.pos.y = currentPos.y;
      }
      
      // Check for flick
      if (lastPos && (currentTime - lastFlick) > flickCooldown) {
        const dt = (currentPos.time - lastPos.time) / 1000;
        if (dt > 0) {
          const dx = currentPos.x - lastPos.x;
          const dy = currentPos.y - lastPos.y;
          const distance = sqrt(dx * dx + dy * dy);
          
          if (distance > minFlickDistance) {
            const velocity = {
              x: dx / dt,
              y: dy / dt
            };
            
            const speed = sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
            
            if (speed > flickThreshold && attachedParticle.isAttached) {
              // Detach and flick the particle
              attachedParticle.isAttached = false;
              attachedParticle.vel = createVector(
                (velocity.x / speed) * maxFlickVelocity,
                (velocity.y / speed) * maxFlickVelocity
              );
              attachedParticles.delete(particleKey);
              lastFlickTime.set(handIndex, currentTime);
            }
          }
        }
      }
    });
  });

  lastFingerPositions = currentPositions;
}

function drawHands() {
  if (results && results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      // Draw all connections between landmarks
      stroke(255, 200); // More visible white lines
      strokeWeight(3); // Thicker lines
      noFill();
      
      // Draw palm connections
      const palmConnections = [
        [0, 1], [1, 2], [2, 3], [3, 4], // Thumb
        [0, 5], [5, 6], [6, 7], [7, 8], // Index
        [0, 9], [9, 10], [10, 11], [11, 12], // Middle
        [0, 13], [13, 14], [14, 15], [15, 16], // Ring
        [0, 17], [17, 18], [18, 19], [19, 20], // Pinky
        [5, 9], [9, 13], [13, 17] // Palm connections
      ];
      
      for (const [i, j] of palmConnections) {
        if (i < landmarks.length && j < landmarks.length) {
          const x1 = landmarks[i].x * width;
          const y1 = landmarks[i].y * height;
          const x2 = landmarks[j].x * width;
          const y2 = landmarks[j].y * height;
          line(x1, y1, x2, y2);
        }
      }
      
      // Draw landmarks as points
      noStroke();
      for (let i = 0; i < landmarks.length; i++) {
        const x = landmarks[i].x * width;
        const y = landmarks[i].y * height;
        fill(255, 0, 0, 150); // Slightly more transparent red for points
        ellipse(x, y, 6, 6);
      }
    }
  }
}

function createParticleFromHand(hand) {
  if (hand.landmarks) {
    const indexFinger = hand.landmarks[8]; // Index finger tip
    const x = map(indexFinger.x, 0, 1, 0, width);
    const y = map(indexFinger.y, 0, 1, 0, height);
    
    // Check if we should create a new particle based on distance
    let shouldCreate = true;
    for (let pos of lastHandPositions) {
      if (dist(x, y, pos.x, pos.y) < particleCreationThreshold) {
        shouldCreate = false;
        break;
      }
    }
    
    if (shouldCreate) {
      particles.push(new Particle(
        x,
        y,
        8, // maxspeed increased from 6 to 8
        255, // r
        0, // g
        0, // b
        20, // strokeWeight
        50 // alpha
      ));
      lastHandPositions.push({x, y});
      
      // Keep only recent positions
      if (lastHandPositions.length > 5) {
        lastHandPositions.shift();
      }
    }
  }
}

function keyPressed() {
  if (key === ' ') {
    showVideo = !showVideo;
  }
}

function draw() {
  // Clear the canvas
  clear();
  
  // Start flipped transformation
  push();
  translate(width, 0);
  scale(-1, 1);
  
  // Draw video background with dark tint if enabled
  if (showVideo && video && video.loadedmetadata) {
    // Draw video with very dark tint
    tint(255, 20); // Much more transparent white tint
    image(video, 0, 0, width, height);
    noTint();
    
    // Add dark overlay
    fill(0, 0, 0, 200); // Semi-transparent black overlay
    rect(0, 0, width, height);
  } else {
    // If video is off, just show black background
    background(0);
  }
  
  // Draw hand tracking
  drawHands();
  
  // Build the flow field
  var yoff = 0;
  for (var y = 0; y < rows; y++) {
    var xoff = 0;
    for (var x = 0; x < cols; x++) {
      var index = x + y * cols;
      var angle = noise(xoff, yoff, zoff) * TWO_PI * 4;
      var v = p5.Vector.fromAngle(angle);
      v.setMag(2);
      flowfield[index] = v;
      xoff += inc;
    }
    yoff += inc;
    zoff += 0.0003;
  }

  // Create particles from hand tracking
  if (results && results.multiHandLandmarks) {
    for (let hand of results.multiHandLandmarks) {
      createParticleFromHand({landmarks: hand});
    }
  }

  // First pass: Draw and update non-attached particles
  for (var i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    if (!particle.isAttached) {
      particle.follow(flowfield);
      particle.update();
      particle.edges();
      particle.show();
      
      // Remove old particles
      if (particle.alpha < 0.1) {
        particles.splice(i, 1);
      }
    }
  }

  // Second pass: Draw attached particles
  for (const particle of particles) {
    if (particle.isAttached) {
      particle.show();
    }
  }

  // End flipped transformation
  pop();

  // fr.html(floor(frameRate()));
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowfield = new Array(cols * rows);
}