/* eslint-disable */

class Particle {

  constructor (x, y) {
    this.pos = createVector(x, y);
    this.vel = createVector(0, 0);
    this.acc = createVector(0, 0);
    this.dead = false;
    this.fadeTime = 255;
  }

  addForce (f) {
    this.acc.add(f);
  }

  update () {
    if (this.isOffscreen()) this.dead = true;
    this.fadeTime -= 5;
    if (!this.dead) {
      this.pos.add(this.vel);
      this.vel.add(this.acc);
      this.acc.mult(0);
    }
  }

  show () {
    if (!this.dead) {
      strokeWeight(2);
      stroke(255, this.fadeTime);
      point(this.pos.x, this.pos.y);
    }
  }

  isOffscreen () {
    return this.pos.x > width || this.pos.x < 0 || this.pos.y > height;
  }

}
