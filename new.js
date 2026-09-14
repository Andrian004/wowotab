/* ==========================================================================
   DEV NEW TAB
   JavaScript / Interaction Layer
   ========================================================================== */

/* ==========================================================================
   0. Prank
   ========================================================================== */
import { startChaos } from "./prank/chaos.js";

const prankButton = document.getElementById("prank-trigger");

prankButton?.addEventListener("click", () => {
  startChaos();
});

/* ==========================================================================
   1. DOM REFERENCES
   ========================================================================== */

const canvas = document.getElementById("network-bg");
const ctx = canvas?.getContext("2d");

const timeDisplay = document.getElementById("time-display");
const dateDisplay = document.getElementById("date-display");
const greetingEl = document.getElementById("greeting-text");

const searchInput = document.getElementById("search-input");
const suggestionInput = document.getElementById("suggestion-input");

const quickNavElement = document.getElementById("quick-nav");

const devLog = document.getElementById("dev-log");
const infoElement = document.getElementById("info");

/* ==========================================================================
   2. CONFIGURATION
   ========================================================================== */

const CONFIG = {
  network: {
    particleCount: 200,
    connectionDistance: 150,
    mouseDistance: 220,
    particleSpeed: 0.18,

    depth: {
      min: 0.5,
      max: 1,
    },

    opacity: {
      min: 0.5,
      max: 1,
    },
  },

  quickNav: [
    {
      name: "Github",
      url: "https://github.com",
    },
    {
      name: "Youtube",
      url: "https://youtube.com",
    },
  ],

  command: [
    {
      name: "github",
      url: "https://github.com",
    },
  ],

  search: {
    engine: "https://www.google.com/search?q=",
  },

  typing: {
    speed: 35,
    pause: 1800,
  },

  storage: {
    commands: "commands",
    navigation: "nav",
    searchHistory: "searchHistory",
  },

  searchHistoryLimit: 20,
};

/* ==========================================================================
   3. GLOBAL STATE
   ========================================================================== */

const state = {
  animationFrame: null,

  mouse: {
    x: null,
    y: null,
    active: false,
  },

  particles: [],

  viewport: {
    width: window.innerWidth,
    height: window.innerHeight,
    dpr: Math.min(window.devicePixelRatio || 1, 3),
  },

  typing: {
    running: false,
  },
};

/* ==========================================================================
   4. UTILITY
   ========================================================================== */

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function random(min, max) {
  return Math.random() * (max - min) + min;
}

function sleep(duration) {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}

/* ==========================================================================
   5. CANVAS SETUP
   ========================================================================== */

function resizeCanvas() {
  if (!canvas || !ctx) {
    return;
  }

  const rect = canvas.getBoundingClientRect();

  state.viewport.width = rect.width;
  state.viewport.height = rect.height;
  state.viewport.dpr = Math.min(window.devicePixelRatio || 1, 2);

  canvas.width = Math.floor(rect.width * state.viewport.dpr);
  canvas.height = Math.floor(rect.height * state.viewport.dpr);

  ctx.setTransform(state.viewport.dpr, 0, 0, state.viewport.dpr, 0, 0);

  createParticles();
}

/* ==========================================================================
   6. PARTICLE
   ========================================================================== */

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = random(0, state.viewport.width);
    this.y = random(0, state.viewport.height);

    this.z = random(CONFIG.network.depth.min, CONFIG.network.depth.max);

    this.baseZ = this.z;

    this.radius = random(0.6, 1.8);

    this.speedX = random(-0.25, 0.25);
    this.speedY = random(-0.25, 0.25);

    this.phase = random(0, Math.PI * 2);
    this.phaseSpeed = random(0.002, 0.008);

    this.opacity = random(
      CONFIG.network.opacity.min,
      CONFIG.network.opacity.max,
    );
  }

  update() {
    this.updatePhase();
    this.updatePosition();
    this.handleMouseInteraction();
    this.handleScreenWrap();
    this.updateDepth();
  }

  updatePhase() {
    this.phase += this.phaseSpeed;
  }

  updatePosition() {
    this.x += this.speedX * CONFIG.network.particleSpeed;
    this.y += this.speedY * CONFIG.network.particleSpeed;

    this.x += Math.sin(this.phase) * 0.04;
    this.y += Math.cos(this.phase) * 0.04;
  }

  handleMouseInteraction() {
    if (!state.mouse.active) {
      return;
    }

    const dx = this.x - state.mouse.x;
    const dy = this.y - state.mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance >= CONFIG.network.mouseDistance) {
      return;
    }

    const force = (1 - distance / CONFIG.network.mouseDistance) * 0.18;
    const safeDistance = distance || 1;

    this.x += (dx / safeDistance) * force;
    this.y += (dy / safeDistance) * force;
  }

  handleScreenWrap() {
    const margin = 30;

    if (this.x < -margin) {
      this.x = state.viewport.width + margin;
    }

    if (this.x > state.viewport.width + margin) {
      this.x = -margin;
    }

    if (this.y < -margin) {
      this.y = state.viewport.height + margin;
    }

    if (this.y > state.viewport.height + margin) {
      this.y = -margin;
    }
  }

  updateDepth() {
    this.z = this.baseZ + Math.sin(this.phase * 0.5) * 0.04;
    this.z = clamp(this.z, CONFIG.network.depth.min, CONFIG.network.depth.max);
  }

  draw() {
    if (!ctx) {
      return;
    }

    const radius = this.radius * this.z;
    const opacity = this.opacity * this.z;

    ctx.beginPath();

    ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);

    ctx.fillStyle = `rgba(0, 246, 255, ${opacity})`;

    ctx.fill();
  }
}

/* ==========================================================================
   7. PARTICLE MANAGEMENT
   ========================================================================== */

function createParticles() {
  state.particles = [];

  if (!canvas) {
    return;
  }

  const area = state.viewport.width * state.viewport.height;
  const calculatedCount = Math.floor(area / 5000);
  const count = clamp(calculatedCount, 45, CONFIG.network.particleCount);

  for (let i = 0; i < count; i++) {
    state.particles.push(new Particle());
  }
}

/* ==========================================================================
   8. NETWORK CONNECTIONS
   ========================================================================== */

function drawConnections() {
  if (!ctx) {
    return;
  }

  const particles = state.particles;
  const maxDistance = CONFIG.network.connectionDistance;

  for (let i = 0; i < particles.length; i++) {
    const particleA = particles[i];

    for (let j = i + 1; j < particles.length; j++) {
      const particleB = particles[j];
      const dx = particleA.x - particleB.x;
      const dy = particleA.y - particleB.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > maxDistance) {
        continue;
      }

      const strength = 1 - distance / maxDistance;
      const depth = (particleA.z + particleB.z) / 2;
      const alpha = strength * depth;

      ctx.beginPath();
      ctx.moveTo(particleA.x, particleA.y);
      ctx.lineTo(particleB.x, particleB.y);
      ctx.strokeStyle = `rgba(0, 180, 220, ${alpha})`;
      ctx.lineWidth = 0.8 * depth;
      ctx.stroke();
    }
  }
}

/* ==========================================================================
   9. MOUSE CONNECTIONS
   ========================================================================== */

function drawMouseConnections() {
  if (!ctx || !state.mouse.active) {
    return;
  }

  const maxDistance = CONFIG.network.mouseDistance;

  for (const particle of state.particles) {
    const dx = particle.x - state.mouse.x;
    const dy = particle.y - state.mouse.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      continue;
    }

    const strength = 3 - distance / maxDistance;

    ctx.beginPath();
    ctx.moveTo(particle.x, particle.y);
    ctx.lineTo(state.mouse.x, state.mouse.y);
    ctx.strokeStyle = `rgba(0, 246, 255, ${strength * 0.22})`;
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }
}

/* ==========================================================================
   10. BACKGROUND
   ========================================================================== */

function drawBackground() {
  if (!ctx) {
    return;
  }

  const { width, height } = state.viewport;

  ctx.clearRect(0, 0, width, height);

  const gradient = ctx.createRadialGradient(
    width * 0.5,
    height * 0.45,
    0,
    width * 0.5,
    height * 0.45,
    Math.max(width, height) * 0.75,
  );

  gradient.addColorStop(0, "rgba(8, 20, 35, 0.12)");

  gradient.addColorStop(1, "rgba(3, 5, 11, 0)");

  ctx.fillStyle = gradient;

  ctx.fillRect(0, 0, width, height);

  drawConnections();
  drawMouseConnections();

  for (const particle of state.particles) {
    particle.update();
    particle.draw();
  }
}

/* ==========================================================================
   11. ANIMATION
   ========================================================================== */

function animateBackground() {
  drawBackground();

  state.animationFrame = requestAnimationFrame(animateBackground);
}

/* ==========================================================================
   12. MOUSE
   ========================================================================== */

function handleMouseMove(event) {
  state.mouse.x = event.clientX;
  state.mouse.y = event.clientY;
  state.mouse.active = true;
}

function handleMouseLeave() {
  state.mouse.x = null;
  state.mouse.y = null;
  state.mouse.active = false;
}

/* ==========================================================================
   13. CLOCK
   ========================================================================== */

function updateClock() {
  if (!timeDisplay) {
    return;
  }

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  timeDisplay.textContent = `${hours}:${minutes}`;
  timeDisplay.dataset.seconds = seconds;

  let greeting = "Good Evening";

  if (hours < 12) {
    greeting = "Good Morning";
  } else if (hours < 18) {
    greeting = "Good Afternoon";
  }

  if (greetingEl) {
    greetingEl.textContent = greeting;
  }
}

/* ==========================================================================
   14. DATE
   ========================================================================== */

function updateDate() {
  if (!dateDisplay) {
    return;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  dateDisplay.textContent = formatter.format(new Date());
}

/* ==========================================================================
   15. URL / SEARCH UTILITIES
   ========================================================================== */

function isUrl(value) {
  return (
    /^https?:\/\//i.test(value) ||
    /^www\./i.test(value) ||
    /^[a-z0-9-]+(\.[a-z0-9-]+)+/i.test(value) ||
    /^localhost(?::\d+)?/i.test(value)
  );
}

function normalizeUrl(value) {
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function isCommand(value) {
  return value.startsWith("/");
}

/* ==========================================================================
   16. STORAGE
   ========================================================================== */

async function getStorage(key, fallback) {
  const result = await chrome.storage.local.get(key);

  return result[key] ?? fallback;
}

async function setStorage(key, value) {
  await chrome.storage.local.set({
    [key]: value,
  });
}

/* --------------------------------------------------------------------------
   Commands
   -------------------------------------------------------------------------- */

async function getCommands() {
  return getStorage(CONFIG.storage.commands, CONFIG.command);
}

/* --------------------------------------------------------------------------
   Navigation
   -------------------------------------------------------------------------- */

async function getNavigation() {
  return getStorage(CONFIG.storage.navigation, CONFIG.quickNav);
}

/* --------------------------------------------------------------------------
   Search History
   -------------------------------------------------------------------------- */

async function getSearchHistory() {
  return getStorage(CONFIG.storage.searchHistory, []);
}

async function saveSearchHistory(value) {
  if (!value || !value.trim()) {
    return;
  }

  const query = value.trim();
  const history = await getSearchHistory();
  const filteredHistory = history.filter(
    (item) => item.toLowerCase() !== query.toLowerCase(),
  );

  filteredHistory.unshift(query);

  await setStorage(
    CONFIG.storage.searchHistory,
    filteredHistory.slice(0, CONFIG.searchHistoryLimit),
  );
}

/* ==========================================================================
   17. INFO OUTPUT
   ========================================================================== */

function showInfo(html) {
  if (!infoElement) {
    return;
  }

  infoElement.innerHTML = html;

  infoElement.classList.add("is-visible");
}

function showCommandError(command, message) {
  showInfo(`
    <div class="info-output">
      <span class="info-muted">$</span> ${command}
    </div>

    <div class="info-output">
      <span class="info-error">${message}</span>
    </div>
  `);
}

function showCommandResult(command, result) {
  showInfo(`
    <div class="info-output">
      <span class="info-muted">$</span> ${command}
    </div>

    <div class="info-output">
      <span class="info-command">${result}</span>
    </div>
  `);
}

function hideInfo() {
  if (!infoElement) {
    return;
  }

  infoElement.classList.remove("is-visible");

  infoElement.innerHTML = "";
}

/* ==========================================================================
   18. RESOURCE CONFIGURATION
   ========================================================================== */

/*
 * A "resource" is something that can be added,
 * removed, and optionally listed.
 *
 * This allows commands and navigation to use
 * exactly the same logic.
 */

const RESOURCE_CONFIG = {
  commands: {
    storageKey: CONFIG.storage.commands,
    fallback: CONFIG.command,
    duplicateMessage: "Command is already exist",
    notFoundMessage: "Command not found",
    addMessage: (name) => `${name} added to commands`,
    removeMessage: (name) => `${name} removed from commands`,
  },

  navigation: {
    storageKey: CONFIG.storage.navigation,
    fallback: CONFIG.quickNav,
    duplicateMessage: "Nav is already exist",
    notFoundMessage: "Quick nav not found",
    addMessage: (name) => `${name} added to quick nav`,
    removeMessage: (name) => `${name} removed from quick nav`,
  },
};

/* ==========================================================================
   19. GENERIC RESOURCE MANAGEMENT
   ========================================================================== */

async function getResource(type) {
  const config = RESOURCE_CONFIG[type];

  if (!config) {
    return [];
  }

  return getStorage(config.storageKey, config.fallback);
}

async function updateResource(type, action, data) {
  const config = RESOURCE_CONFIG[type];

  if (!config) {
    return "Invalid resource.";
  }

  const resources = await getResource(type);

  switch (action) {
    case "add":
      return addResource(config, resources, data);

    case "remove":
      return removeResource(config, resources, data);

    default:
      return "Invalid option. Run `/config` brother.";
  }
}

async function addResource(config, resources, data) {
  const exists = resources.some((item) => item.name === data.name);

  if (exists) {
    return config.duplicateMessage;
  }

  await setStorage(config.storageKey, [
    ...resources,
    {
      name: data.name,
      url: data.url,
    },
  ]);

  return config.addMessage(data.name);
}

async function removeResource(config, resources, data) {
  const exists = resources.some((item) => item.name === data.name);

  if (!exists) {
    return config.notFoundMessage;
  }

  await setStorage(
    config.storageKey,
    resources.filter((item) => item.name !== data.name),
  );

  return config.removeMessage(data.name);
}

/* ==========================================================================
   20. COMMAND ARGUMENT PARSER
   ========================================================================== */

function parseAddArguments(parts) {
  if (
    parts[2] !== "-n" ||
    parts[4] !== "-u" ||
    !parts[3] ||
    !parts[5] ||
    !isUrl(parts[5])
  ) {
    return null;
  }

  return {
    name: parts[3],
    url: parts[5],
  };
}

function parseRemoveArguments(parts) {
  if (parts[2] !== "-n" || !parts[3]) {
    return null;
  }

  return {
    name: parts[3],
  };
}

/* ==========================================================================
   21. COMMAND HANDLERS
   ========================================================================== */

const ACTION_HANDLERS = {
  commands: {
    ls: async (command) => {
      await listResource(command, "commands");
    },

    add: async (command, parts) => {
      await handleResourceAdd(command, parts, "commands");
    },

    remove: async (command, parts) => {
      await handleResourceRemove(command, parts, "commands");
    },
  },

  navigation: {
    add: async (command, parts) => {
      await handleResourceAdd(command, parts, "navigation");
    },

    remove: async (command, parts) => {
      await handleResourceRemove(command, parts, "navigation");
    },
  },
};

/* ==========================================================================
   22. RESOURCE ACTION HANDLERS
   ========================================================================== */

async function listResource(command, type) {
  const resources = await getResource(type);

  const output = resources
    .map(
      (item) => `
          <div class="info-output">
            <span class="info-command">
              ${item.name}
            </span>
            <span class="info-muted">
              - ${item.url}
            </span>
          </div>
        `,
    )
    .join("");

  showInfo(`
    <div class="info-output">
      <span class="info-muted">$</span>
      ${command}
    </div>

    ${output}
  `);
}

async function handleResourceAdd(command, parts, type) {
  const data = parseAddArguments(parts);

  if (!data) {
    showCommandError(command, "Please follow the right role bro. Run /config");

    return;
  }

  const result = await updateResource(type, "add", data);

  showCommandResult(command, result);
}

async function handleResourceRemove(command, parts, type) {
  const data = parseRemoveArguments(parts);

  if (!data) {
    showCommandError(command, "Please follow the right role bro. Run /config");

    return;
  }

  const result = await updateResource(type, "remove", data);

  showCommandResult(command, result);
}

/* ==========================================================================
   23. GENERIC ACTION DISPATCHER
   ========================================================================== */

async function dispatchAction(command, type) {
  const parts = command.split(" ");
  const action = parts[1];
  const handlers = ACTION_HANDLERS[type];
  const handler = handlers?.[action];

  if (!handler) {
    showCommandError(command, "Invalid options. Run /config");

    return;
  }

  await handler(command, parts);
}

/* ==========================================================================
   24. HELP
   ========================================================================== */

function showHelp() {
  showInfo(`
    <div class="info-output">
      <span class="info-muted">$</span> /config
    </div>

    <div class="info-output">
      COMMANDS
    </div>

    <div class="info-output">
      <span class="info-command">
        cmd ls
      </span>
      <span class="info-muted">
        - List all commands
      </span>
    </div>

    <div class="info-output">
      <span class="info-command">
        cmd add -n &lt;name&gt; -u &lt;url&gt;
      </span>
      <span class="info-muted">
        - Add a new command
      </span>
    </div>

    <div class="info-output">
      <span class="info-command">
        cmd remove -n &lt;name&gt;
      </span>
      <span class="info-muted">
        - Remove a command
      </span>
    </div>

    <div class="info-output">
      QUICK NAV
    </div>

    <div class="info-output">
      <span class="info-command">
        nav add -n &lt;name&gt; -u &lt;url&gt;
      </span>
      <span class="info-muted">
        - Add a new quick navigation
      </span>
    </div>

    <div class="info-output">
      <span class="info-command">
        nav remove -n &lt;name&gt;
      </span>
      <span class="info-muted">
        - Remove a navigation
      </span>
    </div>
  `);
}

/* ==========================================================================
   25. SEARCH
   ========================================================================== */

async function performSearch(value) {
  const query = value.trim();

  if (!query) {
    return;
  }

  await saveSearchHistory(query);

  if (query === "clear" || query === "cls") {
    searchInput.value = "";
    suggestionInput.value = "";
    hideInfo();
    return;
  }

  /*
   * Help.
   */
  if (query === "/config") {
    showHelp();

    searchInput.value = "";
    suggestionInput.value = "";

    return;
  }

  /*
   * Command management.
   */
  if (query.startsWith("cmd")) {
    await dispatchAction(query, "commands");

    searchInput.value = "";
    suggestionInput.value = "";

    return;
  }

  /*
   * Navigation management.
   */
  if (query.startsWith("nav")) {
    await dispatchAction(query, "navigation");

    searchInput.value = "";
    suggestionInput.value = "";

    return;
  }

  hideInfo();

  /*
   * Shortcut command.
   */
  if (isCommand(query)) {
    const commandName = query.slice(1);
    const commands = await getCommands();
    const command = commands.find((item) => item.name === commandName);

    if (command) {
      window.location.href = normalizeUrl(command.url);

      return;
    }
  }

  /*
   * Direct URL.
   */
  if (isUrl(query)) {
    window.location.href = normalizeUrl(query);

    return;
  }

  /*
   * Search engine.
   */
  const searchUrl = CONFIG.search.engine + encodeURIComponent(query);

  window.location.href = searchUrl;
}

/* ==========================================================================
   26. SEARCH SUGGESTIONS
   ========================================================================== */

async function handleInput(event) {
  const value = event.target.value;

  if (!value) {
    suggestionInput.value = "";
    return;
  }

  const commands = await getCommands();
  const commandSuggestions = commands.map((command) => `/${command.name}`);
  const historySuggestions = await getSearchHistory();
  const suggestions = [...historySuggestions, ...commandSuggestions];

  const match = suggestions.find((suggestion) =>
    suggestion.toLowerCase().startsWith(value.toLowerCase()),
  );

  suggestionInput.value = match ? value + match.slice(value.length) : "";
}

function handleSearchKeydown(event) {
  if (event.key === "Tab") {
    if (suggestionInput.value && suggestionInput.value !== searchInput.value) {
      event.preventDefault();

      searchInput.value = suggestionInput.value;
    }

    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();

  performSearch(searchInput.value);
}

/* ==========================================================================
   27. SEARCH INITIALIZATION
   ========================================================================== */

function initializeSearch() {
  if (!searchInput) {
    return;
  }

  searchInput.addEventListener("keydown", handleSearchKeydown);

  searchInput.addEventListener("input", handleInput);

  /*
   * "/" acts as a shortcut to focus search.
   */
  document.addEventListener("keydown", (event) => {
    if (event.key === "/" && document.activeElement !== searchInput) {
      event.preventDefault();
      searchInput.focus();
    }
  });
}

/* ==========================================================================
   28. TERMINAL TYPING
   ========================================================================== */

function typeText(element, text, speed = CONFIG.typing.speed) {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    element.textContent = "";

    let index = 0;

    const interval = setInterval(() => {
      element.textContent = text.slice(0, index + 1);

      index++;

      if (index >= text.length) {
        clearInterval(interval);
        resolve();
      }
    }, speed);
  });
}

async function initializeTyping() {
  if (!devLog || state.typing.running) {
    return;
  }

  state.typing.running = true;

  const messages = [
    "DEV_LOG: SYSTEM_ACTIVE // USER: ADMIN",
    "DEV_LOG: NETWORK_READY // STATUS: ONLINE",
    "DEV_LOG: ALL_SYSTEMS_OPERATIONAL",
    "DEV_LOG: ACCESS_GRANTED // SESSION_ACTIVE",
  ];

  let index = 0;

  while (true) {
    await typeText(devLog, messages[index], CONFIG.typing.speed);

    await sleep(CONFIG.typing.pause);

    index = (index + 1) % messages.length;
  }
}

/* ==========================================================================
   29. QUICK NAV CARDS
   ========================================================================== */

async function initializeCards() {
  if (!quickNavElement) {
    return;
  }

  const contents = await getNavigation();

  quickNavElement.innerHTML = "";

  contents.forEach((content) => {
    const card = createNavigationCard(content);

    quickNavElement.appendChild(card);
  });
}

function createNavigationCard(content) {
  const card = document.createElement("a");

  card.className = "cyber-card portal-name collapsible";
  card.href = content.url;
  card.textContent = content.name;

  const offsetX = Math.floor(Math.random() * 11) - 5;
  const offsetY = Math.floor(Math.random() * 13) - 6;
  const rotation = (Math.random() * 2 - 1).toFixed(2);

  card.style.setProperty("--offset-x", `${offsetX}px`);
  card.style.setProperty("--offset-y", `${offsetY}px`);
  card.style.setProperty("--rotation", `${rotation}deg`);

  return card;
}

/* ==========================================================================
   30. WINDOW EVENTS
   ========================================================================== */

function initializeWindowEvents() {
  window.addEventListener("resize", resizeCanvas, {
    passive: true,
  });

  window.addEventListener("mousemove", handleMouseMove, {
    passive: true,
  });

  window.addEventListener("mouseleave", handleMouseLeave, {
    passive: true,
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (state.animationFrame) {
        cancelAnimationFrame(state.animationFrame);

        state.animationFrame = null;
      }

      return;
    }

    if (!state.animationFrame) {
      animateBackground();
    }
  });
}

/* ==========================================================================
   31. INITIALIZATION
   ========================================================================== */

function initializeClock() {
  updateClock();
  updateDate();

  setInterval(updateClock, 1000);
  setInterval(updateDate, 60_000);
}

function initializeNetwork() {
  if (!canvas || !ctx) {
    console.warn("Network background canvas could not be initialized.");

    return;
  }

  resizeCanvas();
  animateBackground();
}

async function initialize() {
  initializeClock();
  initializeNetwork();
  initializeSearch();

  await initializeCards();

  initializeWindowEvents();
  initializeTyping();
}

/* ==========================================================================
   32. START APPLICATION
   ========================================================================== */

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initialize, {
    once: true,
  });
} else {
  initialize();
}
