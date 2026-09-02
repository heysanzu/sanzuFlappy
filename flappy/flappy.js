(() => {
  const canvas  = document.getElementById("gameCanvas");
  const ctx     = canvas.getContext("2d");
  const overlay = document.getElementById("overlay");
  const startBtn     = document.getElementById("startBtn");
  const startLabel   = document.getElementById("startLabel");
  const overlayScore = document.getElementById("overlayScore");
  const overlayBest  = document.getElementById("overlayBest");
  const scoreDisplay = document.getElementById("scoreDisplay");

  // ── Config ──────────────────────────────────────────────────

  const CFG = {
    gravity:      0.38,
    flapForce:   -7.2,
    pipeWidth:    60,
    pipeGap:     165,
    pipeSpeed:    2.6,
    pipeInterval: 90,   // frames between pipe spawns
    birdSize:     36,
    groundH:      60,
  };

  // ── State ────────────────────────────────────────────────────

  let W, H;
  let bird, pipes, score, best, frame, animId;
  let gameState = "idle"; // idle | playing | dead

  // ── Audio ─────────────────────────────────────────────────────

  let audioCtx = null;

  function getAudio() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    return audioCtx;
  }

  // Try loading from src/sounds/ first; fall back to procedural synthesis
  function tryAudio(file, fallback) {
    const ac = getAudio();
    fetch(`src/sounds/${file}`)
      .then(r => {
        if (!r.ok) throw new Error("no file");
        return r.arrayBuffer();
      })
      .then(buf => ac.decodeAudioData(buf))
      .then(decoded => {
        const src = ac.createBufferSource();
        src.buffer = decoded;
        src.connect(ac.destination);
        src.start();
      })
      .catch(() => fallback(ac));
  }

  function synthFlap(ac) {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(520, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ac.currentTime + 0.12);
    gain.gain.setValueAtTime(0.25, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.14);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.15);
  }

  function synthScore(ac) {
    [660, 880].forEach((freq, i) => {
      const osc  = ac.createOscillator();
      const gain = ac.createGain();
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.type = "triangle";
      const t = ac.currentTime + i * 0.09;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.13);
    });
  }

  function synthDie(ac) {
    const osc  = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = "sawtooth";
    osc.frequency.setValueAtTime(300, ac.currentTime);
    osc.frequency.exponentialRampToValueAtTime(60, ac.currentTime + 0.35);
    gain.gain.setValueAtTime(0.3, ac.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.38);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + 0.4);
  }

  function playFlap()  { tryAudio("flap.mp3",  synthFlap);  }
  function playScore() { tryAudio("score.mp3", synthScore); }
  function playDie()   { tryAudio("die.mp3",   synthDie);   }

  // ── Bird image ────────────────────────────────────────────────

  const birdImg = new Image();
  birdImg.src = "src/sanzu.png";

  // ── Resize ────────────────────────────────────────────────────

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  // ── Init / Reset ──────────────────────────────────────────────

  function initBird() {
    bird = {
      x:   W * 0.28,
      y:   H * 0.45,
      vy:  0,
      rot: 0,
    };
  }

  function reset() {
    initBird();
    pipes = [];
    score = 0;
    frame = 0;
    scoreDisplay.textContent = "0";
  }

  // ── Pipes ──────────────────────────────────────────────────────

  function spawnPipe() {
    const usable  = H - CFG.groundH - 60;
    const topH    = 40 + Math.random() * (usable - CFG.pipeGap - 40);
    pipes.push({
      x:     W + CFG.pipeWidth,
      topH,
      scored: false,
    });
  }

  // ── Draw helpers ───────────────────────────────────────────────

  function drawPipe(p) {
    const { pipeWidth: pw, pipeGap: gap } = CFG;
    const bottomY = p.topH + gap;

    // Top pipe
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(p.x, 0, pw, p.topH);

    // Cap top
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(p.x - 4, p.topH - 14, pw + 8, 14);

    // Bottom pipe
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(p.x, bottomY, pw, H - bottomY - CFG.groundH);

    // Cap bottom
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(p.x - 4, bottomY, pw + 8, 14);
  }

  function drawBird() {
    const s = CFG.birdSize;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    // Clamp rotation: nose-up on flap, nose-down on fall
    bird.rot = Math.min(Math.PI / 2, Math.max(-0.4, bird.rot + bird.vy * 0.04));
    ctx.rotate(bird.rot);
    if (birdImg.complete && birdImg.naturalWidth > 0) {
      ctx.drawImage(birdImg, -s / 2, -s / 2, s, s);
    } else {
      ctx.fillStyle = "#f5f5f5";
      ctx.beginPath();
      ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawGround() {
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, H - CFG.groundH, W, CFG.groundH);
    ctx.fillStyle = "#2e2e2e";
    ctx.fillRect(0, H - CFG.groundH, W, 2);
  }

  // ── Collision ──────────────────────────────────────────────────

  function hitTest() {
    const r = CFG.birdSize / 2 - 4; // slight forgiveness

    // Ground / ceiling
    if (bird.y + r >= H - CFG.groundH || bird.y - r <= 0) return true;

    for (const p of pipes) {
      const pw = CFG.pipeWidth;
      if (
        bird.x + r > p.x &&
        bird.x - r < p.x + pw &&
        (bird.y - r < p.topH || bird.y + r > p.topH + CFG.pipeGap)
      ) return true;
    }
    return false;
  }

  // ── Flap ───────────────────────────────────────────────────────

  function flap() {
    if (gameState === "dead") return;
    if (gameState === "idle") {
      startGame();
      return;
    }
    bird.vy = CFG.flapForce;
    playFlap();
  }

  // ── Game loop ──────────────────────────────────────────────────

  function loop() {
    animId = requestAnimationFrame(loop);
    ctx.clearRect(0, 0, W, H);

    // Background
    ctx.fillStyle = "#0d0d0d";
    ctx.fillRect(0, 0, W, H);

    // Subtle grid lines (aesthetic)
    ctx.strokeStyle = "rgba(255,255,255,0.03)";
    ctx.lineWidth = 1;
    const step = 40;
    for (let y = 0; y < H; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }

    if (gameState === "playing") {
      frame++;

      // Spawn pipes
      if (frame % CFG.pipeInterval === 0) spawnPipe();

      // Move & score pipes
      for (const p of pipes) {
        p.x -= CFG.pipeSpeed;
        if (!p.scored && p.x + CFG.pipeWidth < bird.x) {
          p.scored = true;
          score++;
          scoreDisplay.textContent = score;
          playScore();
        }
      }

      // Remove off-screen pipes
      pipes = pipes.filter(p => p.x + CFG.pipeWidth > -10);

      // Bird physics
      bird.vy += CFG.gravity;
      bird.y  += bird.vy;

      // Collision
      if (hitTest()) {
        gameState = "dead";
        playDie();
        if (score > best) best = score;
        setTimeout(showGameOver, 600);
      }
    }

    // Idle: gentle bob
    if (gameState === "idle") {
      bird.y = H * 0.45 + Math.sin(Date.now() / 500) * 6;
    }

    // Draw
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();

    animId = animId; // keep reference
  }

  // ── Screen transitions ─────────────────────────────────────────

  function showOverlay() {
    overlay.classList.remove("hidden");
    scoreDisplay.classList.add("hidden");
  }

  function hideOverlay() {
    overlay.classList.add("hidden");
    scoreDisplay.classList.remove("hidden");
  }

  function showGameOver() {
    overlayScore.textContent = `Score  ${score}`;
    overlayScore.classList.remove("hidden");

    if (best > 0) {
      overlayBest.textContent = `Best  ${best}`;
      overlayBest.classList.remove("hidden");
    }

    startLabel.textContent = "Play again";
    showOverlay();
    gameState = "idle";
  }

  function startGame() {
    overlayScore.classList.add("hidden");
    overlayBest.classList.add("hidden");
    reset();
    hideOverlay();
    gameState = "playing";
  }

  // ── Input ──────────────────────────────────────────────────────

  document.addEventListener("keydown", e => {
    if (e.code === "Space" || e.code === "ArrowUp") {
      e.preventDefault();
      flap();
    }
  });

  canvas.addEventListener("pointerdown", e => {
    e.preventDefault();
    flap();
  });

  startBtn.addEventListener("click", () => {
    flap();
  });

  // ── Boot ───────────────────────────────────────────────────────

  best = 0;

  window.addEventListener("resize", () => {
    resize();
    if (gameState === "idle") initBird();
  });

  resize();
  reset();
  gameState = "idle";
  loop();
})();
