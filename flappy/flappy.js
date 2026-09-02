const canvas = document.getElementById('game-canvas');
const ctx    = canvas.getContext('2d');

let W, H;

function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', () => { resize(); if (state === 'idle') drawIdle(); });

const uiEl      = document.getElementById('ui');
const scoreChip = document.getElementById('score-chip');
const startBtn  = document.getElementById('start-btn');
const muteBtn   = document.getElementById('mute-btn');
const muteIcon  = document.getElementById('mute-icon');

let gameStarted = false;

function hideUI() { uiEl.classList.add('hidden'); }
function showUI() { uiEl.classList.remove('hidden'); }

let muted = false;

muteBtn.addEventListener('click', () => {
    muted = !muted;
    muteIcon.src = muted ? 'src/icons/mute.png' : 'src/icons/unmute.png';
    muteIcon.alt = muted ? 'mute' : 'unmute';
});

function playSound(file) {
    if (muted) return;
    const audio = new Audio('src/sounds/' + file);
    audio.play().catch(() => {});
}

function playFlap()  { playSound('flap.mp3');  }
function playScore() { playSound('score.mp3'); }
function playDie()   { playSound('die.mp3');   }

const birdImg = new Image();
birdImg.src = 'src/sanzu.png';

const CFG = {
    gravity:      0.42,
    flapForce:   -7.8,
    pipeWidth:    64,
    pipeSpeed:    2.8,
    pipeInterval: 88,
    groundH:      56,
    birdSize:     38,
};

function pipeGap() { return Math.max(140, H * 0.22); }

let bird, pipes, score, best, frame, animId, state;

best = 0;

function initBird() {
    bird = { x: W * 0.28, y: H * 0.46, vy: 0, rot: 0 };
}

function resetGame() {
    initBird();
    pipes = [];
    score = 0;
    frame = 0;
    scoreChip.textContent = '0';
}

function spawnPipe() {
    const gap    = pipeGap();
    const usable = H - CFG.groundH - 60;
    const topH   = 40 + Math.random() * (usable - gap - 40);
    pipes.push({ x: W + CFG.pipeWidth, topH, scored: false });
}

function drawBackground() {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.05)';
    ctx.lineWidth = 1;
    for (let y = 0; y < H; y += 44) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
}

function drawPipe(p) {
    const pw      = CFG.pipeWidth;
    const gap     = pipeGap();
    const bottomY = p.topH + gap;

    ctx.fillStyle = '#c0c0c0';
    ctx.fillRect(p.x, 0, pw, p.topH);
    ctx.fillRect(p.x, bottomY, pw, H - bottomY - CFG.groundH);

    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(p.x - 5, p.topH - 14, pw + 10, 14);
    ctx.fillRect(p.x - 5, bottomY, pw + 10, 14);
}

function drawGround() {
    ctx.fillStyle = '#d0d0d0';
    ctx.fillRect(0, H - CFG.groundH, W, CFG.groundH);
    ctx.fillStyle = '#a0a0a0';
    ctx.fillRect(0, H - CFG.groundH, W, 2);
}

function drawBird() {
    const s = CFG.birdSize;
    ctx.save();
    ctx.translate(bird.x, bird.y);
    bird.rot = Math.min(Math.PI / 2, Math.max(-0.42, bird.rot + bird.vy * 0.04));
    ctx.rotate(bird.rot);
    if (birdImg.complete && birdImg.naturalWidth > 0) {
        ctx.drawImage(birdImg, -s / 2, -s / 2, s, s);
    } else {
        ctx.fillStyle = '#000000';
        ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}

function drawIdle() {
    drawBackground();
    drawGround();
    bird.y = H * 0.46 + Math.sin(Date.now() / 500) * 7;
    drawBird();
}

function hitTest() {
    const r   = CFG.birdSize / 2 - 5;
    const gap = pipeGap();

    if (bird.y + r >= H - CFG.groundH || bird.y - r <= 0) return true;

    for (const p of pipes) {
        const pw = CFG.pipeWidth;
        if (
            bird.x + r > p.x &&
            bird.x - r < p.x + pw &&
            (bird.y - r < p.topH || bird.y + r > p.topH + gap)
        ) return true;
    }
    return false;
}

function flap() {
    if (state === 'dead') return;
    if (state === 'idle') { startGame(); return; }
    bird.vy = CFG.flapForce;
    playFlap();
}

function onDead() {
    state       = 'dead';
    gameStarted = false;
    if (score > best) best = score;

    playDie();

    setTimeout(() => {
        uiEl.innerHTML = `
            <h1>Flappy</h1>
            <p class="gameover-score">Score &nbsp; ${score}</p>
            ${best > 0 ? `<p class="gameover-best">Best &nbsp; ${best}</p>` : ''}
            <button id="start-btn">Play again</button>
            <a class="gh-link" href="https://github.com/heysanzu" target="_blank" rel="noopener">GitHub ↗</a>
        `;
        document.getElementById('start-btn').addEventListener('click', flap);
        showUI();
        state = 'idle';
    }, 550);
}

function loop() {
    animId = requestAnimationFrame(loop);

    if (state === 'idle') { drawIdle(); return; }
    if (state === 'dead') return;

    frame++;

    if (frame % CFG.pipeInterval === 0) spawnPipe();

    for (const p of pipes) {
        p.x -= CFG.pipeSpeed;
        if (!p.scored && p.x + CFG.pipeWidth < bird.x) {
            p.scored = true;
            score++;
            scoreChip.textContent = score;
            playScore();
        }
    }

    pipes = pipes.filter(p => p.x + CFG.pipeWidth > -10);

    bird.vy += CFG.gravity;
    bird.y  += bird.vy;

    if (hitTest()) { onDead(); return; }

    drawBackground();
    pipes.forEach(drawPipe);
    drawGround();
    drawBird();
}

function startGame() {
    gameStarted = true;
    resetGame();
    hideUI();
    state = 'playing';
}

document.addEventListener('keydown', e => {
    if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); flap(); }
});

canvas.addEventListener('pointerdown', e => { e.preventDefault(); flap(); });

startBtn.addEventListener('click', flap);

resetGame();
state = 'idle';
loop();
