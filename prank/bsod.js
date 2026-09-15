/* ==========================================================================
   PRANK STORAGE
   ========================================================================== */

const STORAGE_KEY = "prankActive";

/* ==========================================================================
   GET PRANK STATE
   ========================================================================== */

export async function isPrankActive() {
  const result = await chrome.storage.local.get(STORAGE_KEY);

  return result[STORAGE_KEY] === true;
}

/* ==========================================================================
   ACTIVATE PRANK
   ========================================================================== */

export async function activatePrank() {
  await chrome.storage.local.set({
    [STORAGE_KEY]: true,
  });
}

/* ==========================================================================
   DEACTIVATE PRANK
   ========================================================================== */

export async function deactivatePrank() {
  await chrome.storage.local.set({
    [STORAGE_KEY]: false,
  });
}

/* ==========================================================================
   FAKE BSOD CONTROLLER
   ========================================================================== */

const bsodElement = document.getElementById("bsod");

const bsodScreen = document.getElementById("bsod-screen");

const recoveryScreen = document.getElementById("recovery-screen");

const progressElement = document.getElementById("bsod-progress-value");

const recoveryStatus = document.getElementById("recovery-status-text");

const recoveryProgressBar = document.getElementById("recovery-progress-bar");

let progressTimer = null;
let recoveryTimer = null;

/* ==========================================================================
   SHOW BSOD
   ========================================================================== */

export function showBSOD() {
  if (!bsodElement) {
    console.error("BSOD element not found.");
    return;
  }

  /*
   * Make BSOD visible
   */

  bsodElement.classList.add("active");

  /*
   * Reset screens
   */

  bsodScreen.style.display = "flex";

  recoveryScreen.classList.remove("active");

  /*
   * Start glitch transition
   */

  bsodElement.classList.add("glitch");

  setTimeout(() => {
    bsodElement.classList.remove("glitch");

    startProgress();
  }, 700);
}

/* ==========================================================================
   BSOD PROGRESS
   ========================================================================== */

function startProgress() {
  stopProgress();

  let progress = 0;

  progressElement.textContent = "0";

  progressTimer = setInterval(() => {
    /*
     * Random progress increment
     */

    progress += Math.floor(Math.random() * 10) + 1;

    /*
     * Clamp
     */

    if (progress >= 100) {
      progress = 100;

      stopProgress();

      /*
       * Give the user a short moment
       * before recovery appears.
       */

      setTimeout(() => {
        showRecovery();
      }, 900);
    }

    progressElement.textContent = progress;
  }, 180);
}

/* ==========================================================================
   RECOVERY SCREEN
   ========================================================================== */

function showRecovery() {
  if (!bsodElement) {
    return;
  }

  /*
   * Hide BSOD
   */

  bsodScreen.style.display = "none";

  /*
   * Show recovery
   */

  recoveryScreen.classList.add("active");

  /*
   * Start recovery process
   */

  startRecovery();
}

/* ==========================================================================
   RECOVERY PROCESS
   ========================================================================== */

function startRecovery() {
  stopRecovery();

  let progress = 0;

  recoveryStatus.textContent = "Diagnosing your browser...";

  recoveryProgressBar.style.width = "0%";

  recoveryTimer = setInterval(() => {
    progress += Math.floor(Math.random() * 10) + 1;

    if (progress >= 100) {
      progress = 100;

      stopRecovery();

      recoveryStatus.textContent = "System could not repair your browser.";

      recoveryProgressBar.style.width = "100%";

      return;
    }

    recoveryProgressBar.style.width = `${progress}%`;

    /*
     * Change status during recovery
     */

    if (progress > 30) {
      recoveryStatus.textContent = "Checking system files...";
    }

    if (progress > 60) {
      recoveryStatus.textContent = "Attempting system recovery...";
    }

    if (progress > 85) {
      recoveryStatus.textContent = "Finalizing diagnostics...";
    }
  }, 150);
}

/* ==========================================================================
   REPAIR
   ========================================================================== */

export function repairSystem() {
  stopProgress();
  stopRecovery();

  bsodElement.classList.remove("active");
  bsodElement.classList.remove("glitch");
  recoveryScreen.classList.remove("active");
  bsodScreen.style.display = "flex";
  progressElement.textContent = "0";
  recoveryProgressBar.style.width = "0%";
}

/* ==========================================================================
   EVENT
   ========================================================================== */

/* ==========================================================================
   STOP PROGRESS
   ========================================================================== */

function stopProgress() {
  if (progressTimer) {
    clearInterval(progressTimer);

    progressTimer = null;
  }
}

/* ==========================================================================
   STOP RECOVERY
   ========================================================================== */

function stopRecovery() {
  if (recoveryTimer) {
    clearInterval(recoveryTimer);

    recoveryTimer = null;
  }
}
