# Hands of the Privileged

Artistic Statement:

In life we all have various privileges. From the heads of government to members of the homeless population, to some degree we all have certain privileges over other people or things. When used, these privileges create intentionally or unintendedly harm to various extents. The blood of this harm is left on our hands whether or not we mean to create harm though our privilege. We all have blood on our hands, the Hands of the Privileged. 


Technial Statement:

An interactive particle system that responds to hand movements using MediaPipe hand tracking. The project creates a beautiful flow field of particles that can be manipulated with hand gestures.

## Features

- Real-time hand tracking using MediaPipe
- Interactive particle system with flow field
- Particles that attach to hand landmarks
- Dynamic particle colors and sizes
- Video background toggle (spacebar)
- Responsive design that adapts to window size

## How to Use

1. Open the project in a web browser
2. Allow camera access when prompted
3. Move your hands in front of the camera to interact with the particles
4. Press spacebar to toggle the video background on/off

## Technical Details

- Built with p5.js
- Uses MediaPipe for hand tracking
- Implements a custom particle system with flow field inspired by "The Nature of Code"
- Responsive canvas that adapts to window size

## Project Structure

- `index.html` - Main HTML file
- `sketch.js` - Main p5.js sketch
- `particle.js` - Particle class implementation
- `style.css` - Styling
- `p5.min.js` - p5.js library
- `p5.dom.min.js` - p5.js DOM library
- `p5.sound.min.js` - p5.js sound library

## Requirements

- Modern web browser with WebGL support
- Camera access
- Internet connection (for MediaPipe)

## License

This project is open source and available under the MIT License. 