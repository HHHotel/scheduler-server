/* eslint-disable */
// Matt Rochford
// p5.js Firework simulation

let fireworks = [];
let grav;

function setup () {
  createCanvas(windowWidth, windowHeight);
  console.log(width);
  grav = createVector(0, .2);
}

function draw () {
  if (random(1) < .03) fireworks.push(new Firework(random(width), height));
  background(20, 30, 50);
  for (let fw of fireworks) {
    if (fw.dead) fireworks.splice(fireworks.indexOf(fw), 1);
    fw.addForce(grav);
    fw.update();
    fw.show();
  }
}
