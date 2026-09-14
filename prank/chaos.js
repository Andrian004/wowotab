/* ==========================================================================
   CHAOS MODE
   ========================================================================== */

import { startPhysics, stopPhysics } from "./physics.js";

const chaosElements = [];

export function startChaos() {
  const elements = document.querySelectorAll(".collapsible");
  chaosElements.length = 0;

  elements.forEach((element) => {
    if (element.closest("#bsod") || element.classList.contains("inner-gears")) {
      return;
    }
    // PERBAIKAN: Hapus pemanggilan prepareElement(element) dari sini
    chaosElements.push(element);
  });

  document.body.classList.add("chaos-mode");
  startPhysics(chaosElements);
}

function prepareElement(element) {
  const rect = element.getBoundingClientRect();

  // Freeze current visual position
  element.style.position = "fixed";
  element.style.left = "0px"; // Tambahkan satuan px
  element.style.top = "0px"; // Tambahkan satuan px
  element.style.width = `${rect.width}px`;
  element.style.height = `${rect.height}px`;
  element.style.margin = "0px"; // Tambahkan satuan px
  element.style.zIndex = "999";

  // Remove transition supaya physics tidak dilawan CSS
  element.style.transition = "none";

  // Hindari pointer interaction
  element.style.pointerEvents = "none";
}

export function stopChaos() {
  stopPhysics();
  chaosElements.forEach((element) => {
    element.style = ""; // Reset seluruh style secepatnya
  });
  chaosElements.length = 0;
  document.body.classList.remove("chaos-mode");
}
