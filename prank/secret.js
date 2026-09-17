/* ==========================================================================
   SECRET BUTTON
   ========================================================================== */

const secretButton = document.getElementById("secret-docs");
const MAX_ESCAPES = 5;

let escapeCount = 0;
let isEscaping = false; // Mencegah trigger ganda

/* ==========================================================================
   INITIALIZE
   ========================================================================== */

export function initSecretButton() {
  if (!secretButton) {
    return;
  }

  /*
   * Ubah event listener dari 'wrapper' ke 'document'
   * agar kita bisa mendeteksi kursor meskipun tombol
   * sudah kabur jauh dari kontainer aslinya.
   */
  document.addEventListener("mousemove", handleMouseMove);

  /*
   * Touch / click fallback
   */
  secretButton.addEventListener("click", handleClick);
}

/* ==========================================================================
   MOUSE MOVE
   ========================================================================== */

function handleMouseMove(event) {
  if (escapeCount >= MAX_ESCAPES || isEscaping) {
    return;
  }

  // getBoundingClientRect selalu akurat untuk mengetahui posisi elemen di layar
  const rect = secretButton.getBoundingClientRect();

  /*
   * Cursor position
   */
  const mouseX = event.clientX;
  const mouseY = event.clientY;

  /*
   * Button center
   */
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const distance = Math.hypot(mouseX - centerX, mouseY - centerY);

  /*
   * Escape radius
   */
  const escapeRadius = 100;

  if (distance < escapeRadius) {
    escapeButton();
  }
}

/* ==========================================================================
   ESCAPE
   ========================================================================== */

function escapeButton() {
  if (escapeCount >= MAX_ESCAPES || isEscaping) {
    return;
  }

  isEscaping = true;
  escapeCount++;

  /*
   * Menggunakan window.innerWidth & innerHeight agar tombol
   * bisa kabur ke seluruh sudut layar.
   */
  const maxX = Math.max(0, window.innerWidth - secretButton.offsetWidth);
  const maxY = Math.max(0, window.innerHeight - secretButton.offsetHeight);

  const x = Math.random() * maxX;
  const y = Math.random() * maxY;

  /*
   * Ubah menjadi 'fixed' agar tombol keluar dari flexbox .repair-container.
   * Tombol "REPAIR SYSTEM" akan otomatis ke tengah saat ini terjadi,
   * yang justru membuat efek kaburnya terasa lebih dramatis.
   */
  secretButton.style.position = "fixed";
  secretButton.style.left = `${x}px`;
  secretButton.style.top = `${y}px`;
  secretButton.style.transform = "none";
  secretButton.style.margin = "0";
  secretButton.style.zIndex = "9999"; // Pastikan tombol selalu di atas

  /*
   * Final attempt
   */
  if (escapeCount >= MAX_ESCAPES) {
    surrenderButton();
  }

  /*
   * Cooldown pergerakan
   */
  setTimeout(() => {
    isEscaping = false;
  }, 300);
}

/* ==========================================================================
   SURRENDER
   ========================================================================== */

function surrenderButton() {
  secretButton.textContent = "I DON'T CARE";
  secretButton.classList.add("secret-surrender");
  secretButton.style.cursor = "pointer";
}

/* ==========================================================================
   CLICK & SECRET GATE (Tidak ada perubahan di bawah ini)
   ========================================================================== */

function handleClick() {
  if (escapeCount < MAX_ESCAPES) {
    return;
  }
  openSecretGate();
}

function openSecretGate() {
  const event = new CustomEvent("open-secret-gate");
  window.dispatchEvent(event);
}

const secretGate = document.getElementById("secret-gate");
const secretForm = document.getElementById("secret-form");
const secretPassword = document.getElementById("secret-password");
const secretError = document.getElementById("secret-error");
const SECRET_PASSWORD = "hello world";

window.addEventListener("open-secret-gate", () => {
  if (!secretGate) return;
  secretGate.classList.add("active");
  setTimeout(() => {
    secretPassword?.focus();
  }, 100);
});

secretForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = secretPassword.value.trim().toLowerCase();

  if (password.toLowerCase() === SECRET_PASSWORD) {
    openSecretDocs();
    return;
  }

  secretError.textContent = "ACCESS DENIED — wrong password.";
  secretPassword.value = "";
  secretPassword.focus();
});

function openSecretDocs() {
  secretGate.classList.remove("active");
  window.dispatchEvent(new CustomEvent("secret-unlocked"));
}

const secretDocsPage = document.getElementById("secret-docs-page");
window.addEventListener("secret-unlocked", () => {
  secretDocsPage?.classList.add("active");
});
