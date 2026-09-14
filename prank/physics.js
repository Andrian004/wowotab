/* ==========================================================================
   PRANK PHYSICS ENGINE
   ========================================================================== */

const physicsObjects = [];
let animationFrame = null;

// Kurangi pantulan drastis agar terdengar seperti benda padat/berat yang jatuh menabrak lantai
const GRAVITY = 0.8;
const AIR_FRICTION = 0.99;
const BOUNCE = 0.1;
const ROTATION_FRICTION = 0.98;
const COLLISION_BOUNCE = 0.1;
// const COLLISION_FRICTION = 0.85;

/* ==========================================================================
   PHYSICS OBJECT
   ========================================================================== */

class PhysicsObject {
  constructor(element) {
    this.element = element;

    const rect = element.getBoundingClientRect();
    this.x = rect.left;
    this.y = rect.top;

    // Simpan posisi asli untuk titik pusat getaran gempa
    this.originalX = rect.left;
    this.originalY = rect.top;

    this.width = rect.width;
    this.height = rect.height;

    element.style.position = "fixed";
    element.style.left = "0px";
    element.style.top = "0px";
    element.style.width = `${rect.width}px`;
    element.style.height = `${rect.height}px`;
    element.style.margin = "0px";
    element.style.zIndex = "999";
    element.style.transition = "none";
    element.style.pointerEvents = "none";

    this.vx = 0;
    this.vy = 0;
    this.rotation = 0;
    this.rotationVelocity = 0;
    this.mass = Math.max(1, this.width * this.height);

    // FITUR GEMPA
    this.shakeTimer = 5;
    this.isFalling = false;

    this.render();
  }

  /* ------------------------------------------------------------------------
     UPDATE
     ------------------------------------------------------------------------ */

  update() {
    // 1. FASE GEMPA (Menempel di dinding sambil bergetar)
    if (this.shakeTimer > 0) {
      this.shakeTimer--;

      // Getaran makin keras sebelum akhirnya lepas
      const intensity = 2 + (60 - this.shakeTimer) * 0.05;

      this.x = this.originalX + (Math.random() - 0.5) * intensity;
      this.y = this.originalY + (Math.random() - 0.5) * intensity;

      this.render();
      return; // Hentikan fungsi di sini, jangan terapkan gravitasi dulu
    }

    // 2. FASE LEPAS (Hanya dieksekusi sekali saat timer habis)
    if (!this.isFalling) {
      this.isFalling = true;
      this.x = this.originalX; // Kembalikan ke posisi pas
      this.y = this.originalY;

      // Beri sedikit dorongan miring saat paku/lemnya lepas
      this.vx = (Math.random() - 0.5) * 3;
      this.rotationVelocity = (Math.random() - 0.5) * 2;
    }

    // 3. FASE JATUH BEBAS
    this.vy += GRAVITY;

    this.vx *= AIR_FRICTION;
    this.vy *= AIR_FRICTION;

    this.x += this.vx;
    this.y += this.vy;

    this.rotation += this.rotationVelocity;
    this.rotationVelocity *= ROTATION_FRICTION;

    this.handleBounds();
    this.render();
  }

  /* ------------------------------------------------------------------------
     SCREEN BOUNDS
     ------------------------------------------------------------------------ */

  handleBounds() {
    const maxX = window.innerWidth - this.width;

    const maxY = window.innerHeight - this.height;

    // Left wall
    if (this.x < 0) {
      this.x = 0;

      this.vx *= -BOUNCE;

      this.rotationVelocity *= 0.8;
    }

    // Right wall
    if (this.x > maxX) {
      this.x = maxX;

      this.vx *= -BOUNCE;

      this.rotationVelocity *= 0.8;
    }

    // Floor
    if (this.y > maxY) {
      this.y = maxY;

      if (Math.abs(this.vy) > 1) {
        this.vy *= -BOUNCE;
      } else {
        this.vy = 0;
      }

      this.vx *= 0.92;
      this.rotationVelocity *= 0.9;
    }
  }

  /* ------------------------------------------------------------------------
     COLLISION
     ------------------------------------------------------------------------ */

  intersects(other) {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  /* ------------------------------------------------------------------------
     RENDER
     ------------------------------------------------------------------------ */

  render() {
    this.element.style.transform = `
      translate3d(
        ${this.x}px,
        ${this.y}px,
        0
      )
      rotate(${this.rotation}deg)
    `;
  }
}

/* ==========================================================================
   COLLISION RESOLUTION
   ========================================================================== */

/* ==========================================================================
   COLLISION RESOLUTION
   ========================================================================== */
function resolveCollision(a, b) {
  if (!a.intersects(b)) return;

  const aCenterX = a.x + a.width / 2;
  const aCenterY = a.y + a.height / 2;
  const bCenterX = b.x + b.width / 2;
  const bCenterY = b.y + b.height / 2;

  const dx = bCenterX - aCenterX;
  const dy = bCenterY - aCenterY;

  const overlapX = a.width / 2 + b.width / 2 - Math.abs(dx);
  const overlapY = a.height / 2 + b.height / 2 - Math.abs(dy);

  const relaxation = 0.3;

  if (overlapX < overlapY) {
    const direction = dx > 0 ? 1 : -1;
    const separation = (overlapX / 2) * relaxation;

    a.x -= direction * separation;
    b.x += direction * separation;

    const velocityA = a.vx;
    const velocityB = b.vx;
    a.vx = velocityB * COLLISION_BOUNCE;
    b.vx = velocityA * COLLISION_BOUNCE;
  } else {
    const direction = dy > 0 ? 1 : -1;
    const separation = (overlapY / 2) * relaxation;

    a.y -= direction * separation;
    b.y += direction * separation;

    // PERBAIKAN: Jangan kurangi kecepatan secara drastis saat bertumpuk.
    // Gunakan rata-rata kecepatan agar benda yang saling bersentuhan jatuh bersamaan
    // dengan momentum gravitasi yang sama, tidak melambat.
    const avgVy = (a.vy + b.vy) / 2;
    a.vy = avgVy;
    b.vy = avgVy;
  }

  // Redam rotasi saat bersentuhan
  a.rotationVelocity *= 0.5;
  b.rotationVelocity *= 0.5;
}

/* ==========================================================================
   COLLISION LOOP
   ========================================================================== */

function handleCollisions() {
  for (let i = 0; i < physicsObjects.length; i++) {
    // PERBAIKAN: Abaikan elemen yang masih menempel di dinding/bergetar
    if (!physicsObjects[i].isFalling) continue;

    for (let j = i + 1; j < physicsObjects.length; j++) {
      // PERBAIKAN: Abaikan juga target tumbukan yang masih menempel
      if (!physicsObjects[j].isFalling) continue;

      resolveCollision(physicsObjects[i], physicsObjects[j]);
    }
  }
}

/* ==========================================================================
   START PHYSICS
   ========================================================================== */

export function startPhysics(elements) {
  stopPhysics();

  physicsObjects.length = 0;

  elements.forEach((element) => {
    if (!element) return;

    physicsObjects.push(new PhysicsObject(element));
  });

  function loop() {
    /*
     * Update movement
     */

    physicsObjects.forEach((object) => object.update());

    /*
     * Resolve collisions
     */

    handleCollisions();

    /*
     * Render corrected positions
     */

    physicsObjects.forEach((object) => object.render());

    animationFrame = requestAnimationFrame(loop);
  }

  animationFrame = requestAnimationFrame(loop);
}

/* ==========================================================================
   STOP PHYSICS
   ========================================================================== */

export function stopPhysics() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);

    animationFrame = null;
  }

  physicsObjects.length = 0;
}
