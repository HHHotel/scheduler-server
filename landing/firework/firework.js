/* eslint-disable */

class Firework extends Particle {

  constructor (x, y) {
    super(x, y);
    this.vel = createVector(0, random(-height / 55, -height / 66));
    this.particles = [];
    this.color = color(random(255), random(255), random(255));
    this.exploded = false;
  }

  update () {
    super.update();
    if (!this.exploded && this.vel.y >= 0) this.explode();
    for (let p of this.particles) {
      p.addForce(grav);
      p.update();
      p.show();
    }
  }

  show () {
    if (!this.exploded) {
      strokeWeight(8);
      stroke(this.color);
      point(this.pos.x, this.pos.y);
    }
  }

  explode () {
    this.exploded = true;
    for (let i = 0; i < 80; i++) {
      this.particles[i] = new Particle(this.pos.x, this.pos.y);
      this.particles[i].vel = p5.Vector.random2D().mult(random(.1, 10));
    }
  }

}
