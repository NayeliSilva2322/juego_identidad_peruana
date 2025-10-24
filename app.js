const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// *** AGREGAR DESDE AQUÍ ***
// Variables para responsive
let gameScale = 1;
let baseWidth = 900;
let baseHeight = 600;
let isMobile = false;

// Función para redimensionar el canvas
function resizeCanvas() {
  const containerWidth = window.innerWidth;
  const containerHeight = window.innerHeight * 0.7;

  const scaleX = containerWidth / baseWidth;
  const scaleY = containerHeight / baseHeight;
  gameScale = Math.min(scaleX, scaleY, 1);

  canvas.width = baseWidth;
  canvas.height = baseHeight;
  canvas.style.width = baseWidth * gameScale + "px";
  canvas.style.height = baseHeight * gameScale + "px";

  // Detectar dispositivo móvil
  isMobile =
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth < 768;

  // Mostrar/ocultar controles móviles
  const mobileControls = document.getElementById("mobileControls");
  if (mobileControls) {
    mobileControls.style.display = isMobile ? "flex" : "none";
  }
}

// Llamar al redimensionar
window.addEventListener("resize", resizeCanvas);
window.addEventListener("load", resizeCanvas);
resizeCanvas();

// ============================================
// VARIABLES DE IMÁGENES Y RECURSOS
// ============================================

// Rutas de imágenes (CAMBIAR AQUÍ TUS RUTAS)
const IMAGES = {
  // Fondos de niveles
  backgrounds: {
    costa: "../imagenes/costa_fondo.jpg",
    sierra: "../imagenes/sierra_fondo.jpg",
    selva: "../imagenes/fondo_selva.jpg",
  },
  // Platos típicos
  plates: {
    ceviche: "../imagenes/ceviche.jpg",
    lomoSaltado: "../imagenes/lomo_saltado.jpg",
    ajiGallina: "../imagenes/aji_de_gallina.jpg",
    cuy: "../imagenes/cuy_con_papas.jpg",
    chicharron: "../imagenes/chicharron.jpg",
    olluquito: "../imagenes/olluco.jpg",
    juane: "../imagenes/juane.jpg",
    suri: "../imagenes/suri.jpg",
    tacacho: "../imagenes/tacacho_cecina.jpg", // CORREGIDO: Agregado tacacho
  },
  // Personaje
  character: "../imagenes/icono_juego_peru.png",
};

// Configuración visual
const VISUAL_CONFIG = {
  backgroundOpacity: 0.7,
  platformBorderRadius: 10,
  platformShadow: true,
  plateShadow: true,
  glowEffect: true,
  particleEffects: true,
};

// Cargar imágenes
let loadedImages = {
  backgrounds: {},
  plates: {},
  character: null,
};

// Función para cargar todas las imágenes
function loadAllImages() {
  // Cargar fondos
  Object.keys(IMAGES.backgrounds).forEach((key) => {
    const img = new Image();
    img.src = IMAGES.backgrounds[key];
    img.onerror = () =>
      console.warn(`No se pudo cargar: ${IMAGES.backgrounds[key]}`);
    loadedImages.backgrounds[key] = img;
  });

  // Cargar platos
  Object.keys(IMAGES.plates).forEach((key) => {
    const img = new Image();
    img.src = IMAGES.plates[key];
    img.onerror = () =>
      console.warn(`No se pudo cargar: ${IMAGES.plates[key]}`);
    loadedImages.plates[key] = img;
  });

  // Cargar personaje
  const charImg = new Image();
  charImg.src = IMAGES.character;
  charImg.onerror = () =>
    console.warn(`No se pudo cargar: ${IMAGES.character}`);
  loadedImages.character = charImg;
}

// Llamar a la carga de imágenes
loadAllImages();

// ============================================
// ESTADO DEL JUEGO
// ============================================

let gameState = {
  currentLevel: 1,
  lives: 3,
  score: 0,
  isGameRunning: false,
  isPaused: false,
  collectedPlates: [],
  allDiscoveredPlates: [],
};

// ============================================
// PLATOS TÍPICOS DEL PERÚ
// ============================================

const plates = [
  {
    name: "Ceviche",
    description:
      "Plato bandera del Perú, pescado marinado en limón con ají y cebolla",
    color: "#FFE4B5",
    emoji: "🐟",
    image: "ceviche",
  },
  {
    name: "Lomo Saltado",
    description:
      "Deliciosa fusión de carne salteada con papas fritas al estilo chifa",
    color: "#D2691E",
    emoji: "🥩",
    image: "lomoSaltado",
  },
  {
    name: "Ají de Gallina",
    description:
      "Cremoso guiso de gallina deshilachada en salsa de ají amarillo",
    color: "#FFD700",
    emoji: "🍗",
    image: "ajiGallina",
  },
  {
    name: "Cuy frito con Papas",
    description:
      "Delicioso plato con cuy frito y papas fritas de la sierra peruana",
    color: "#F0E68C",
    emoji: "🥔",
    image: "cuy",
  },
  {
    name: "Chicharron con mote",
    description: "Chicharrón con mote de chancho",
    color: "#8B4513",
    emoji: "🍖",
    image: "chicharron",
  },
  {
    name: "Olluquito serrano",
    description: "Olluquito serrano con huevo frito y trozos de carne",
    color: "#DC143C",
    emoji: "🍲",
    image: "olluquito",
  },
  {
    name: "Juane Selvatico",
    description:
      "Juane selvatico con carne de cerdo, cebolla y pimientos rojos",
    color: "#CD853F",
    emoji: "🌿🍗",
    image: "juane",
  },
  {
    name: "Suri",
    description:
      "Pequeño gusano selvatico con sabor delicioso representativo de la selva peruana",
    color: "#8B7355",
    emoji: "🪱🌴",
    image: "suri", // CORREGIDO: minúscula
  },
  {
    name: "Tacacho con Cecina",
    description: "Tacacho de platano con cecina seca",
    color: "#eed090ff",
    emoji: "🥩",
    image: "tacacho", // CORREGIDO: minúscula
  },
];

// ============================================
// CONFIGURACIÓN DE NIVELES
// ============================================

const levels = [
  {
    name: "Costa Peruana",
    backgroundKey: "costa",
    backgroundFallback: "#87CEEB",
    platformColor: "#D2B48C",
    platformAccent: "#8B7355",
    platforms: [
      { x: 0, y: 550, width: 300, height: 50 },
      { x: 400, y: 450, width: 200, height: 50 },
      { x: 700, y: 350, width: 200, height: 50 },
      { x: 300, y: 250, width: 250, height: 50 },
      { x: 650, y: 150, width: 250, height: 50 },
    ],
    plates: [plates[0], plates[1], plates[2]],
    speed: 4,
    jumpPower: 12,
    gravity: 0.5,
  },
  {
    name: "Sierra Andina",
    backgroundKey: "sierra",
    backgroundFallback: "#8B7355",
    platformColor: "#A0522D",
    platformAccent: "#654321",
    platforms: [
      { x: 0, y: 550, width: 250, height: 50 },
      { x: 350, y: 470, width: 180, height: 50 },
      { x: 650, y: 390, width: 180, height: 50 },
      { x: 450, y: 310, width: 150, height: 50 },
      { x: 150, y: 230, width: 180, height: 50 },
      { x: 600, y: 150, width: 200, height: 50 },
    ],
    plates: [plates[3], plates[4], plates[5]],
    speed: 5,
    jumpPower: 13,
    gravity: 0.55,
  },
  {
    name: "Selva Amazónica",
    backgroundKey: "selva",
    backgroundFallback: "#228B22",
    platformColor: "#654321",
    platformAccent: "#3d2817",
    platforms: [
      { x: 0, y: 550, width: 200, height: 50 },
      { x: 300, y: 480, width: 150, height: 50 },
      { x: 550, y: 410, width: 150, height: 50 },
      { x: 750, y: 340, width: 150, height: 50 },
      { x: 550, y: 270, width: 120, height: 50 },
      { x: 300, y: 200, width: 150, height: 50 },
      { x: 600, y: 130, width: 200, height: 50 },
    ],
    plates: [plates[6], plates[7], plates[8]],
    speed: 6,
    jumpPower: 14,
    gravity: 0.6,
  },
];

// ============================================
// JUGADOR
// ============================================

let player = {
  x: 50,
  y: 450,
  width: 40,
  height: 60,
  color: "#C1272D",
  velocityX: 0,
  velocityY: 0,
  isJumping: false,
  isOnGround: false,
};

// ============================================
// CONTROLES
// ============================================

const keys = {
  left: false,
  right: false,
  space: false,
};

// ============================================
// PARTÍCULAS (EFECTOS VISUALES)
// ============================================

let particles = [];

function createParticles(x, y, color) {
  if (!VISUAL_CONFIG.particleEffects) return;

  for (let i = 0; i < 15; i++) {
    particles.push({
      x: x,
      y: y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      life: 1,
      color: color,
      size: Math.random() * 4 + 2,
    });
  }
}

function updateParticles() {
  particles = particles.filter((p) => p.life > 0);
  particles.forEach((p) => {
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.2;
    p.life -= 0.02;
  });
}

function drawParticles() {
  particles.forEach((p) => {
    ctx.save();
    ctx.globalAlpha = p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  });
}

// ============================================
// EVENTOS DE PANTALLAS
// ============================================

// CORREGIDO: Verificar que los elementos existan antes de agregar listeners
function initEventListeners() {
  const startBtn = document.getElementById("startBtn");
  const continueBtn = document.getElementById("continueBtn");
  const nextLevelBtn = document.getElementById("nextLevelBtn");
  const retryBtn = document.getElementById("retryBtn");
  const mainMenuBtn = document.getElementById("mainMenuBtn");
  const playAgainBtn = document.getElementById("playAgainBtn");

  if (startBtn) startBtn.addEventListener("click", startGame);
  if (continueBtn) continueBtn.addEventListener("click", hidePlateScreen);
  if (nextLevelBtn) nextLevelBtn.addEventListener("click", nextLevel);
  if (retryBtn) retryBtn.addEventListener("click", retryLevel);
  if (mainMenuBtn) mainMenuBtn.addEventListener("click", showMainMenu);
  if (playAgainBtn) playAgainBtn.addEventListener("click", startGame);

  // *** AGREGAR ESTA LÍNEA ***
  initMobileControls();
}

// Inicializar listeners cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initEventListeners);
} else {
  initEventListeners();
}

// ============================================
// CONTROLES DEL TECLADO
// ============================================

document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft") keys.left = true;
  if (e.key === "ArrowRight") keys.right = true;
  if (e.key === " " || e.key === "ArrowUp") {
    e.preventDefault();
    keys.space = true;
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === " " || e.key === "ArrowUp") keys.space = false;
});

// ============================================
// CONTROLES MÓVILES (TÁCTILES)
// ============================================

let touchControls = {
  leftPressed: false,
  rightPressed: false,
  jumpPressed: false,
};

function initMobileControls() {
  const leftBtn = document.getElementById("btnLeft");
  const rightBtn = document.getElementById("btnRight");
  const jumpBtn = document.getElementById("btnJump");

  if (leftBtn) {
    leftBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys.left = true;
      touchControls.leftPressed = true;
      leftBtn.style.transform = "scale(0.9)";
    });
    leftBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keys.left = false;
      touchControls.leftPressed = false;
      leftBtn.style.transform = "scale(1)";
    });
    leftBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      keys.left = true;
    });
    leftBtn.addEventListener("mouseup", (e) => {
      e.preventDefault();
      keys.left = false;
    });
  }

  if (rightBtn) {
    rightBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys.right = true;
      touchControls.rightPressed = true;
      rightBtn.style.transform = "scale(0.9)";
    });
    rightBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keys.right = false;
      touchControls.rightPressed = false;
      rightBtn.style.transform = "scale(1)";
    });
    rightBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      keys.right = true;
    });
    rightBtn.addEventListener("mouseup", (e) => {
      e.preventDefault();
      keys.right = false;
    });
  }

  if (jumpBtn) {
    jumpBtn.addEventListener("touchstart", (e) => {
      e.preventDefault();
      keys.space = true;
      touchControls.jumpPressed = true;
      jumpBtn.style.transform = "scale(0.9)";
    });
    jumpBtn.addEventListener("touchend", (e) => {
      e.preventDefault();
      keys.space = false;
      touchControls.jumpPressed = false;
      jumpBtn.style.transform = "scale(1)";
    });
    jumpBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      keys.space = true;
    });
    jumpBtn.addEventListener("mouseup", (e) => {
      e.preventDefault();
      keys.space = false;
    });
  }
}

// Prevenir zoom en móvil
document.addEventListener(
  "touchstart",
  function (e) {
    if (e.touches.length > 1) {
      e.preventDefault();
    }
  },
  { passive: false }
);

let lastTouchEnd = 0;
document.addEventListener(
  "touchend",
  function (e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  },
  false
);

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft") keys.left = false;
  if (e.key === "ArrowRight") keys.right = false;
  if (e.key === " " || e.key === "ArrowUp") keys.space = false;
});

// ============================================
// FUNCIONES PRINCIPALES
// ============================================

function startGame() {
  console.log("Iniciando juego..."); // Debug

  gameState.currentLevel = 1;
  gameState.lives = 3;
  gameState.score = 0;
  gameState.collectedPlates = [];
  gameState.allDiscoveredPlates = [];
  gameState.isGameRunning = true;
  particles = [];

  hideAllScreens();

  const gameScreen = document.getElementById("gameScreen");
  if (gameScreen) {
    gameScreen.classList.remove("hidden");
  } else {
    console.error("No se encontró el elemento gameScreen");
    return;
  }

  loadLevel(1);
  gameLoop();
}

function loadLevel(levelNum) {
  console.log("Cargando nivel:", levelNum); // Debug

  gameState.currentLevel = levelNum;
  gameState.score = 0;
  gameState.collectedPlates = [];
  particles = [];

  const level = levels[levelNum - 1];

  // Resetear jugador
  player.x = 50;
  player.y = 450;
  player.velocityX = 0;
  player.velocityY = 0;
  player.isJumping = false;
  player.isOnGround = false;

  // Colocar platos en las plataformas
  currentPlatePlates = level.plates.map((plate, index) => {
    const platform =
      level.platforms[index + 1] || level.platforms[level.platforms.length - 1];
    return {
      x: platform.x + platform.width / 2 - 25,
      y: platform.y - 50,
      width: 50,
      height: 50,
      data: plate,
      collected: false,
      floatOffset: Math.random() * Math.PI * 2,
    };
  });

  updateUI();
}

function updateUI() {
  const levelDisplay = document.getElementById("levelDisplay");
  const scoreDisplay = document.getElementById("scoreDisplay");
  const totalPlates = document.getElementById("totalPlates");
  const livesDisplay = document.getElementById("livesDisplay");

  if (levelDisplay) levelDisplay.textContent = gameState.currentLevel;
  if (scoreDisplay) scoreDisplay.textContent = gameState.score;
  if (totalPlates)
    totalPlates.textContent = levels[gameState.currentLevel - 1].plates.length;
  if (livesDisplay) livesDisplay.textContent = gameState.lives;
}

// ============================================
// BUCLE PRINCIPAL DEL JUEGO
// ============================================

let currentPlatePlates = [];
let animationTime = 0;

function gameLoop() {
  if (!gameState.isGameRunning) return;

  animationTime += 0.05;
  update();
  draw();

  requestAnimationFrame(gameLoop);
}

function update() {
  const level = levels[gameState.currentLevel - 1];

  // Movimiento horizontal
  if (keys.left) {
    player.velocityX = -level.speed;
  } else if (keys.right) {
    player.velocityX = level.speed;
  } else {
    player.velocityX *= 0.8;
  }

  // Salto
  if (keys.space && player.isOnGround) {
    player.velocityY = -level.jumpPower;
    player.isJumping = true;
    player.isOnGround = false;
  }

  // Aplicar gravedad
  player.velocityY += level.gravity;

  // Aplicar velocidades
  player.x += player.velocityX;
  player.y += player.velocityY;

  // Límites laterales
  if (player.x < 0) player.x = 0;
  if (player.x + player.width > canvas.width)
    player.x = canvas.width - player.width;

  // Detección de caída
  if (player.y > canvas.height) {
    gameOver();
    return;
  }

  // Colisión con plataformas
  player.isOnGround = false;
  level.platforms.forEach((platform) => {
    if (checkPlatformCollision(player, platform)) {
      player.y = platform.y - player.height;
      player.velocityY = 0;
      player.isJumping = false;
      player.isOnGround = true;
    }
  });

  // Colisión con platos
  currentPlatePlates.forEach((plate) => {
    if (!plate.collected && checkCollision(player, plate)) {
      plate.collected = true;
      gameState.score++;
      gameState.collectedPlates.push(plate.data);
      gameState.allDiscoveredPlates.push(plate.data);

      createParticles(plate.x + 25, plate.y + 25, plate.data.color);

      showPlateScreen(plate.data);
      updateUI();

      if (gameState.score === level.plates.length) {
        setTimeout(() => {
          levelComplete();
        }, 1500);
      }
    }
  });

  updateParticles();
}

// ============================================
// FUNCIÓN DE DIBUJO
// ============================================

function draw() {
  const level = levels[gameState.currentLevel - 1];

  // Dibujar fondo
  const bgImage = loadedImages.backgrounds[level.backgroundKey];
  if (bgImage && bgImage.complete) {
    ctx.save();
    ctx.globalAlpha = VISUAL_CONFIG.backgroundOpacity;
    ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  } else {
    ctx.fillStyle = level.backgroundFallback;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  drawLevelDecorations();

  level.platforms.forEach((platform) => {
    drawPlatform(platform, level.platformColor, level.platformAccent);
  });

  currentPlatePlates.forEach((plate) => {
    if (!plate.collected) {
      drawPlate(plate);
    }
  });

  drawPlayer();
  drawParticles();
}

// ============================================
// FUNCIONES DE DIBUJO MEJORADAS
// ============================================

function drawPlatform(platform, mainColor, accentColor) {
  ctx.save();

  if (VISUAL_CONFIG.platformShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 5;
  }

  ctx.fillStyle = mainColor;
  ctx.beginPath();
  roundRect(
    ctx,
    platform.x,
    platform.y,
    platform.width,
    platform.height,
    VISUAL_CONFIG.platformBorderRadius
  );
  ctx.fill();

  ctx.shadowColor = "transparent";

  const gradient = ctx.createLinearGradient(
    0,
    platform.y,
    0,
    platform.y + platform.height
  );
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.2)");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  roundRect(
    ctx,
    platform.x,
    platform.y,
    platform.width,
    platform.height,
    VISUAL_CONFIG.platformBorderRadius
  );
  ctx.fill();

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRect(
    ctx,
    platform.x,
    platform.y,
    platform.width,
    platform.height,
    VISUAL_CONFIG.platformBorderRadius
  );
  ctx.stroke();

  ctx.restore();
}

function drawPlate(plate) {
  plate.floatOffset += 0.05;
  const floatY = Math.sin(plate.floatOffset) * 5;
  const drawY = plate.y + floatY;

  ctx.save();

  if (VISUAL_CONFIG.plateShadow) {
    ctx.shadowColor = "rgba(0, 0, 0, 0.4)";
    ctx.shadowBlur = 15;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 8;
  }

  ctx.fillStyle = plate.data.color;
  ctx.beginPath();
  ctx.arc(plate.x + 25, drawY + 25, 28, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowColor = "transparent";

  if (VISUAL_CONFIG.glowEffect) {
    const glowIntensity = Math.sin(animationTime * 2) * 0.3 + 0.7;
    ctx.strokeStyle = `rgba(255, 255, 255, ${glowIntensity})`;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(plate.x + 25, drawY + 25, 30, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = "#333";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(plate.x + 25, drawY + 25, 28, 0, Math.PI * 2);
  ctx.stroke();

  const plateImage = loadedImages.plates[plate.data.image];
  if (plateImage && plateImage.complete) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(plate.x + 25, drawY + 25, 25, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(plateImage, plate.x, drawY, 50, 50);
    ctx.restore();
  } else {
    ctx.font = "bold 32px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#333";
    ctx.fillText(plate.data.emoji, plate.x + 25, drawY + 25);
  }

  ctx.restore();
}

function drawPlayer() {
  ctx.save();

  ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 4;

  const charImage = loadedImages.character;
  if (charImage && charImage.complete) {
    ctx.drawImage(charImage, player.x, player.y, player.width, player.height);
  } else {
    ctx.shadowColor = "transparent";

    const bodyGradient = ctx.createLinearGradient(
      player.x,
      player.y + 20,
      player.x,
      player.y + 50
    );
    bodyGradient.addColorStop(0, "#E63946");
    bodyGradient.addColorStop(1, "#C1272D");
    ctx.fillStyle = bodyGradient;
    ctx.fillRect(player.x + 10, player.y + 20, 20, 30);

    ctx.fillStyle = "#D2691E";
    ctx.beginPath();
    ctx.arc(player.x + 20, player.y + 15, 12, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#C1272D";
    ctx.fillRect(player.x + 10, player.y + 3, 20, 10);
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(player.x + 12, player.y + 5, 16, 6);

    ctx.fillStyle = "#C1272D";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(player.x + 13 + i * 6, player.y + 6, 2, 4);
    }

    ctx.fillStyle = "#1E3A8A";
    ctx.fillRect(player.x + 12, player.y + 50, 7, 10);
    ctx.fillRect(player.x + 21, player.y + 50, 7, 10);

    ctx.fillStyle = "#000000";
    roundRect(ctx, player.x + 10, player.y + 58, 9, 4, 2);
    ctx.fill();
    roundRect(ctx, player.x + 21, player.y + 58, 9, 4, 2);
    ctx.fill();

    ctx.fillStyle = "#E63946";
    ctx.fillRect(player.x + 5, player.y + 25, 5, 15);
    ctx.fillRect(player.x + 30, player.y + 25, 5, 15);
  }

  ctx.restore();
}

function drawLevelDecorations() {
  const level = gameState.currentLevel;

  if (level === 1) {
    ctx.save();
    const sunGradient = ctx.createRadialGradient(800, 80, 10, 800, 80, 50);
    sunGradient.addColorStop(0, "#FFD700");
    sunGradient.addColorStop(0.5, "#FFA500");
    sunGradient.addColorStop(1, "rgba(255, 165, 0, 0.3)");
    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(800, 80, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.strokeStyle = "rgba(70, 130, 180, 0.4)";
    ctx.lineWidth = 4;
    for (let i = 0; i < 900; i += 50) {
      ctx.beginPath();
      ctx.arc(i + ((animationTime * 20) % 50), 580, 20, Math.PI, 0);
      ctx.stroke();
    }
  } else if (level === 2) {
    ctx.save();

    const grad1 = ctx.createLinearGradient(0, 250, 150, 400);
    grad1.addColorStop(0, "#A0522D");
    grad1.addColorStop(1, "#8B4513");
    ctx.fillStyle = grad1;
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.lineTo(150, 250);
    ctx.lineTo(300, 400);
    ctx.fill();

    const grad2 = ctx.createLinearGradient(200, 200, 350, 400);
    grad2.addColorStop(0, "#CD853F");
    grad2.addColorStop(1, "#A0522D");
    ctx.fillStyle = grad2;
    ctx.beginPath();
    ctx.moveTo(200, 400);
    ctx.lineTo(350, 200);
    ctx.lineTo(500, 400);
    ctx.fill();

    ctx.fillStyle = "#FFFFFF";
    ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(130, 270);
    ctx.lineTo(150, 250);
    ctx.lineTo(170, 270);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(330, 220);
    ctx.lineTo(350, 200);
    ctx.lineTo(370, 220);
    ctx.fill();

    ctx.restore();
  } else if (level === 3) {
    ctx.save();

    for (let i = 0; i < 5; i++) {
      const x = 100 + i * 180;
      const sway = Math.sin(animationTime + i) * 5;

      const trunkGrad = ctx.createLinearGradient(x, 400, x + 20, 400);
      trunkGrad.addColorStop(0, "#654321");
      trunkGrad.addColorStop(0.5, "#8B4513");
      trunkGrad.addColorStop(1, "#654321");
      ctx.fillStyle = trunkGrad;
      ctx.fillRect(x + sway, 400, 20, 100);

      const leafGrad = ctx.createRadialGradient(
        x + 10 + sway,
        380,
        10,
        x + 10 + sway,
        380,
        45
      );
      leafGrad.addColorStop(0, "#32CD32");
      leafGrad.addColorStop(0.7, "#228B22");
      leafGrad.addColorStop(1, "#006400");
      ctx.fillStyle = leafGrad;
      ctx.beginPath();
      ctx.arc(x + 10 + sway, 380, 45, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(50, 205, 50, 0.6)";
    for (let i = 0; i < 8; i++) {
      const x = 50 + i * 110;
      const height = 20 + Math.sin(animationTime + i) * 5;
      ctx.fillRect(x, 550 - height, 15, 30 + height);
    }

    ctx.restore();
  }
}

// ============================================
// FUNCIONES AUXILIARES
// ============================================

function roundRect(ctx, x, y, width, height, radius) {
  if (width < 2 * radius) radius = width / 2;
  if (height < 2 * radius) radius = height / 2;
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

// ============================================
// COLISIONES
// ============================================

function checkCollision(obj1, obj2) {
  return (
    obj1.x < obj2.x + obj2.width &&
    obj1.x + obj1.width > obj2.x &&
    obj1.y < obj2.y + obj2.height &&
    obj1.y + obj1.height > obj2.y
  );
}

function checkPlatformCollision(player, platform) {
  return (
    player.x < platform.x + platform.width &&
    player.x + player.width > platform.x &&
    player.y + player.height >= platform.y &&
    player.y + player.height <= platform.y + 20 &&
    player.velocityY >= 0
  );
}

// ============================================
// PANTALLAS DE EVENTOS
// ============================================

function showPlateScreen(plate) {
  gameState.isGameRunning = false;

  const plateScreen = document.getElementById("plateScreen");
  const plateImage = document.getElementById("plateImage");
  const plateName = document.getElementById("plateName");
  const plateDescription = document.getElementById("plateDescription");

  if (!plateScreen || !plateImage || !plateName || !plateDescription) {
    console.error("No se encontraron elementos de la pantalla de platos");
    gameState.isGameRunning = true;
    return;
  }

  const realPlateImage = loadedImages.plates[plate.image];
  if (realPlateImage && realPlateImage.complete) {
    plateImage.style.backgroundImage = `url(${realPlateImage.src})`;
    plateImage.innerHTML = "";
  } else {
    plateImage.style.background = plate.color;
    plateImage.style.backgroundImage = "none";
    plateImage.innerHTML = `<div style="font-size: 100px; line-height: 200px;">${plate.emoji}</div>`;
  }

  plateName.textContent = plate.name;
  plateDescription.textContent = plate.description;

  plateScreen.classList.remove("hidden");
}

function hidePlateScreen() {
  const plateScreen = document.getElementById("plateScreen");
  if (plateScreen) {
    plateScreen.classList.add("hidden");
  }
  gameState.isGameRunning = true;
  gameLoop();
}

function levelComplete() {
  gameState.isGameRunning = false;

  const completeScreen = document.getElementById("levelCompleteScreen");
  const completeMessage = document.getElementById("completeMessage");
  const statsPlates = document.getElementById("statsPlates");

  if (!completeScreen || !completeMessage || !statsPlates) {
    console.error(
      "No se encontraron elementos de la pantalla de nivel completado"
    );
    return;
  }

  const level = levels[gameState.currentLevel - 1];
  completeMessage.textContent = `¡Has conquistado ${level.name}!`;
  statsPlates.textContent = gameState.score;

  completeScreen.classList.remove("hidden");
}

function nextLevel() {
  const completeScreen = document.getElementById("levelCompleteScreen");
  if (completeScreen) {
    completeScreen.classList.add("hidden");
  }

  if (gameState.currentLevel < 3) {
    gameState.currentLevel++;
    loadLevel(gameState.currentLevel);
    gameState.isGameRunning = true;
    gameLoop();
  } else {
    showVictoryScreen();
  }
}

function showVictoryScreen() {
  gameState.isGameRunning = false;
  hideAllScreens();

  const victoryScreen = document.getElementById("victoryScreen");
  const discoveredPlates = document.getElementById("discoveredPlates");

  if (!victoryScreen || !discoveredPlates) {
    console.error("No se encontraron elementos de la pantalla de victoria");
    return;
  }

  discoveredPlates.innerHTML = "";
  gameState.allDiscoveredPlates.forEach((plate) => {
    const plateDiv = document.createElement("div");
    plateDiv.className = "discovered-plate";
    plateDiv.title = plate.name;

    const realImage = loadedImages.plates[plate.image];
    if (realImage && realImage.complete) {
      plateDiv.style.backgroundImage = `url(${realImage.src})`;
      plateDiv.style.backgroundSize = "cover";
      plateDiv.style.backgroundPosition = "center";
    } else {
      plateDiv.style.background = plate.color;
      plateDiv.innerHTML = `<div style="font-size: 40px; line-height: 80px;">${plate.emoji}</div>`;
    }

    discoveredPlates.appendChild(plateDiv);
  });

  victoryScreen.classList.remove("hidden");
}

function gameOver() {
  gameState.isGameRunning = false;
  gameState.lives--;

  if (gameState.lives <= 0) {
    hideAllScreens();
    const gameOverScreen = document.getElementById("gameOverScreen");
    if (gameOverScreen) {
      gameOverScreen.classList.remove("hidden");
    }
  } else {
    updateUI();
    loadLevel(gameState.currentLevel);
    setTimeout(() => {
      gameState.isGameRunning = true;
      gameLoop();
    }, 1000);
  }
}

function retryLevel() {
  const gameOverScreen = document.getElementById("gameOverScreen");
  if (gameOverScreen) {
    gameOverScreen.classList.add("hidden");
  }

  gameState.lives = 3;
  loadLevel(gameState.currentLevel);

  const gameScreen = document.getElementById("gameScreen");
  if (gameScreen) {
    gameScreen.classList.remove("hidden");
  }

  gameState.isGameRunning = true;
  gameLoop();
}

function showMainMenu() {
  hideAllScreens();
  const startScreen = document.getElementById("startScreen");
  if (startScreen) {
    startScreen.classList.remove("hidden");
  }
}

function hideAllScreens() {
  const screens = [
    "startScreen",
    "gameScreen",
    "plateScreen",
    "levelCompleteScreen",
    "gameOverScreen",
    "victoryScreen",
  ];

  screens.forEach((screenId) => {
    const screen = document.getElementById(screenId);
    if (screen) {
      screen.classList.add("hidden");
    }
  });
}
