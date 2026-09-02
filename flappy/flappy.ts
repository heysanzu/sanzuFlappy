@font-face {
    font-family: "SanzuFont";
    src: url("https://raw.githubusercontent.com/heysanzu/sanzu/main/fonts/comic_sans_regular.ttf") format("truetype");
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
*, *::before, *::after { box-sizing: border-box; }
html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
    background: #ffffff;
    font-family: "SanzuFont", "Comic Sans MS", cursive, roboto;
    color: #000000;
}
canvas {
    display: block;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
}
#ui {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #000000;
    color: #ffffff;
    padding: clamp(10px, 2vw, 20px) clamp(12px, 2.5vw, 24px);
    border-radius: 10px;
    border: 2px solid #000000;
    z-index: 10;
    width: clamp(200px, 42vw, 340px);
    text-align: center;
    opacity: 1;
    transition: opacity 0.15s ease;
    pointer-events: auto;
}
#ui.hidden {
    opacity: 0;
    pointer-events: none;
}
h1 {
    margin: 0 0 clamp(6px, 1.2vw, 12px) 0;
    font-size: clamp(1.4rem, 4vw, 2.2rem);
    text-align: center;
    color: #ffffff;
    border-bottom: 2px solid #ffffff;
    padding-bottom: clamp(4px, 0.8vw, 8px);
}
p {
    font-size: clamp(0.7rem, 2vw, 1rem);
    text-align: center;
    margin: clamp(4px, 1vw, 8px) 0;
    color: #aaaaaa;
    line-height: 1.4;
}
#start-btn {
    display: block;
    font-family: 'SanzuFont', 'Comic Sans MS', cursive;
    font-size: clamp(1rem, 3vw, 1.4rem);
    padding: clamp(6px, 1.2vw, 10px) clamp(12px, 2.5vw, 20px);
    margin: clamp(8px, 1.5vw, 14px) auto 0;
    background: #ffffff;
    color: #000000;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    width: 100%;
    transition: background 0.2s, color 0.2s;
}
#start-btn:hover,
#start-btn:active {
    background: #aaaaaa;
    color: #000000;
}
#ui a.gh-link {
    display: block;
    font-size: clamp(0.65rem, 1.8vw, 0.9rem);
    color: #777777;
    text-decoration: none;
    margin-top: clamp(6px, 1.2vw, 10px);
    border-top: 1px solid #333333;
    padding-top: clamp(5px, 1vw, 8px);
    text-align: center;
}
#ui a.gh-link:hover { color: #ffffff; }
#score-chip {
    position: fixed;
    top: clamp(8px, 2vw, 20px);
    right: clamp(8px, 2vw, 20px);
    background: #000000;
    color: #ffffff;
    font-family: 'SanzuFont', 'Comic Sans MS', cursive;
    font-size: clamp(1rem, 3vw, 1.5rem);
    padding: clamp(6px, 1.2vw, 12px) clamp(10px, 2vw, 20px);
    border-radius: 8px;
    z-index: 20;
    pointer-events: none;
    letter-spacing: 0.02em;
}
#mute-btn {
    position: fixed;
    bottom: clamp(10px, 2vw, 18px);
    right: clamp(10px, 2vw, 18px);
    background: #000000;
    border: none;
    border-radius: 50%;
    width: clamp(36px, 6vw, 48px);
    height: clamp(36px, 6vw, 48px);
    cursor: pointer;
    z-index: 30;
    display: flex;
    align-items: center;
    justify-content: center;
    opacity: 0.75;
    transition: opacity 0.2s;
}
#mute-btn:hover { opacity: 1; }
#mute-btn img {
    width: 55%;
    height: 55%;
    object-fit: contain;
}
.gameover-score {
    font-size: clamp(1rem, 3vw, 1.4rem) !important;
    color: #ffffff !important;
    font-weight: bold;
}
.gameover-best {
    font-size: clamp(0.7rem, 2vw, 1rem) !important;
    color: #aaaaaa !important;
}
