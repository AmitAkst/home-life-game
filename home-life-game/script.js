(function () {
  "use strict";

  const canvas = document.getElementById("canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const panel = document.getElementById("panel");
  const panelTitle = document.getElementById("panelTitle");
  const panelMessage = document.getElementById("panelMessage");
  const choicesEl = document.getElementById("choices");
  const hintEl = document.getElementById("hint");
  const restartBtn = document.getElementById("restart");

  const W = canvas.width;
  const H = canvas.height;
  const DOOR = { x: 355, y: 255, w: 90, h: 145 };
  const MOM_START = { x: 100, y: 360 };
  const ANDY_SPOT = { x: 300, y: 375 };
  const SOFA_SEAT = { x: 655, y: 355 };

  const CHOICE = {
    PACIFIER: "pacifier",
    LIFT: "lift",
    PHONE: "phone",
  };

  const CHOICE_TEXT = {
    pacifier: "לתת לו ציצי",
    lift: "להרים את אנדי",
    phone: "להתקשר לעמית להתלונן",
  };

  let scene = "outside";
  let andyHappy = false;
  let andyArmsUp = false;
  let andyHidden = false;
  let loriCrying = false;
  let momAnim = null;
  let momOnPhone = false;
  let momMouthOpen = false;
  let momNursing = false;
  let cryLoop = null;
  let phoneMumbleActive = false;
  let audioCtx = null;

  function getAudio() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
  }

  function resumeAudio() {
    const ac = getAudio();
    if (ac.state === "suspended") {
      return ac.resume();
    }
    return Promise.resolve();
  }

  function stopCryLoop() {
    if (cryLoop) {
      cryLoop.active = false;
      clearTimeout(cryLoop.timer);
      cryLoop = null;
    }
  }

  function startBabyCry() {
    stopCryLoop();
    const ac = getAudio();
    cryLoop = { active: true };

    function whimper() {
      if (!cryLoop || !cryLoop.active) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const filter = ac.createBiquadFilter();

      osc.type = "sine";
      osc.frequency.setValueAtTime(320 + Math.random() * 40, t);
      osc.frequency.linearRampToValueAtTime(380 + Math.random() * 30, t + 0.2);
      osc.frequency.linearRampToValueAtTime(290, t + 0.55);

      filter.type = "lowpass";
      filter.frequency.value = 700;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.035, t + 0.08);
      gain.gain.linearRampToValueAtTime(0.025, t + 0.35);
      gain.gain.linearRampToValueAtTime(0, t + 0.7);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.75);

      cryLoop.timer = setTimeout(whimper, 900 + Math.random() * 700);
    }

    whimper();
  }

  function startGirlCry() {
    stopCryLoop();
    const ac = getAudio();
    cryLoop = { active: true };

    function whimper() {
      if (!cryLoop || !cryLoop.active) return;
      const t = ac.currentTime;
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(480, t);
      osc.frequency.linearRampToValueAtTime(560, t + 0.15);
      osc.frequency.linearRampToValueAtTime(420, t + 0.5);
      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.04, t + 0.06);
      gain.gain.linearRampToValueAtTime(0, t + 0.55);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc.stop(t + 0.6);
      cryLoop.timer = setTimeout(whimper, 1000 + Math.random() * 600);
    }

    whimper();
  }

  function playHappyYay() {
    const ac = getAudio();
    const t = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(780, t + 0.25);
    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t);
    osc.stop(t + 0.42);
  }

  function playPhoneMumble() {
    phoneMumbleActive = true;
    const ac = getAudio();
    let step = 0;

    function syllable() {
      if (!phoneMumbleActive || !momOnPhone) return;
      momMouthOpen = step % 2 === 0;
      const t = ac.currentTime;

      const osc = ac.createOscillator();
      const osc2 = ac.createOscillator();
      const gain = ac.createGain();
      const filter = ac.createBiquadFilter();

      const base = 220 + Math.random() * 100;
      osc.type = "sine";
      osc2.type = "sine";
      osc.frequency.setValueAtTime(base, t);
      osc.frequency.linearRampToValueAtTime(base * 1.3, t + 0.06);
      osc.frequency.linearRampToValueAtTime(base * 0.85, t + 0.18);
      osc2.frequency.setValueAtTime(base * 1.5, t);

      filter.type = "bandpass";
      filter.frequency.value = 900;
      filter.Q.value = 1.2;

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.setValueAtTime(0.12, t + 0.1);
      gain.gain.linearRampToValueAtTime(0, t + 0.22);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(ac.destination);
      osc.start(t);
      osc2.start(t);
      osc.stop(t + 0.24);
      osc2.stop(t + 0.24);

      step += 1;
      setTimeout(syllable, 110 + Math.random() * 90);
    }

    syllable();
  }

  function stopPhoneMumble() {
    phoneMumbleActive = false;
  }

  function hidePanel() {
    panel.classList.add("hidden");
    panelMessage.classList.add("hidden");
    panelTitle.textContent = "";
    choicesEl.innerHTML = "";
  }

  function showPanel(title, ids, handler) {
    panelTitle.textContent = title;
    panelMessage.classList.add("hidden");
    choicesEl.innerHTML = "";

    ids.forEach(function (id) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-btn";
      btn.textContent = CHOICE_TEXT[id];
      btn.addEventListener("mousedown", function (e) {
        e.preventDefault();
        e.stopPropagation();
      });
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        e.stopPropagation();
        resumeAudio().then(function () {
          handler(id);
        });
      });
      choicesEl.appendChild(btn);
    });

    panel.classList.remove("hidden");
  }

  function showMessageOnly(text) {
    choicesEl.innerHTML = "";
    panelTitle.textContent = "";
    panelMessage.textContent = text;
    panelMessage.classList.remove("hidden");
    panel.classList.remove("hidden");
  }

  function drawCuteEye(x, y, irisColor, size) {
    size = size || 1;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(x, y, 5 * size, 6 * size, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = irisColor;
    ctx.beginPath();
    ctx.arc(x, y + 1, 3.2 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a1a1a";
    ctx.beginPath();
    ctx.arc(x, y + 1, 1.6 * size, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(x + 1.2 * size, y - 0.5 * size, 0.9 * size, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawLori(x, y) {
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = "#f8bbd0";
    ctx.beginPath();
    ctx.ellipse(0, 12, 24, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fce4d6";
    ctx.beginPath();
    ctx.arc(0, -22, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffeb3b";
    ctx.beginPath();
    ctx.moveTo(-24, -28);
    ctx.quadraticCurveTo(0, -62, 24, -28);
    ctx.quadraticCurveTo(0, -18, -24, -28);
    ctx.fill();
    ctx.fillRect(-24, -38, 48, 28);

    ctx.fillStyle = "#7e57c2";
    ctx.fillRect(-22, 28, 44, 32);
    ctx.fillStyle = "#9575cd";
    ctx.fillRect(-24, 22, 48, 12);

    drawCuteEye(-9, -24, "#42a5f5", 1);
    drawCuteEye(9, -24, "#42a5f5", 1);

    ctx.fillStyle = "#ffab91";
    ctx.beginPath();
    ctx.ellipse(-16, -16, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(16, -16, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    if (loriCrying) {
      ctx.fillStyle = "#81d4fa";
      ctx.beginPath();
      ctx.ellipse(-9, -16, 2, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(9, -16, 2, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#555";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -12, 7, 0.2 * Math.PI, 0.8 * Math.PI);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#e57373";
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.arc(0, -14, 6, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawAndy(x, y, scale, opts) {
    opts = opts || {};
    scale = scale || 1;
    const crying = opts.crying !== undefined ? opts.crying : !andyHappy && scene === "inside";
    const armsUp = andyArmsUp;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    ctx.fillStyle = "#fff9c4";
    ctx.beginPath();
    ctx.ellipse(0, 14, 20, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#fce4d6";
    ctx.beginPath();
    ctx.arc(0, -10, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#e65100";
    ctx.beginPath();
    ctx.arc(0, -16, 16, Math.PI + 0.4, -0.4);
    ctx.fill();
    ctx.fillRect(-15, -20, 30, 8);

    drawCuteEye(-7, -12, "#6d4c41", 0.85);
    drawCuteEye(7, -12, "#6d4c41", 0.85);

    ctx.fillStyle = "#ffccbc";
    ctx.beginPath();
    ctx.ellipse(-13, -4, 5, 3, 0, 0, Math.PI * 2);
    ctx.ellipse(13, -4, 5, 3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#fce4d6";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    if (armsUp) {
      ctx.beginPath();
      ctx.moveTo(-16, 6);
      ctx.lineTo(-28, -16);
      ctx.moveTo(16, 6);
      ctx.lineTo(28, -16);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(-16, 8);
      ctx.lineTo(-22, 22);
      ctx.moveTo(16, 8);
      ctx.lineTo(22, 22);
      ctx.stroke();
    }

    if (opts.pacifier) {
      ctx.fillStyle = "#ec407a";
      ctx.beginPath();
      ctx.arc(0, -2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f48fb1";
      ctx.fillRect(-2, -2, 4, 8);
    } else if (crying) {
      ctx.fillStyle = "#81d4fa";
      ctx.beginPath();
      ctx.ellipse(-7, -6, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(7, -6, 2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#666";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(0, 0, 6, 5, 0, 0, Math.PI);
      ctx.stroke();
    } else if (andyHappy) {
      ctx.strokeStyle = "#e57373";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -2, 5, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawMom(x, y, opts) {
    opts = opts || {};
    const sitting = opts.sitting;
    const onPhone = opts.onPhone;
    const nursing = opts.nursing;
    const carrying = opts.carrying;
    const mouthOpen = opts.mouthOpen;

    ctx.save();
    ctx.translate(x, y);

    if (sitting) {
      ctx.fillStyle = "#7986cb";
      ctx.fillRect(-28, -10, 56, 38);
      ctx.fillStyle = "#5c6bc0";
      ctx.fillRect(-30, -18, 60, 14);
    } else {
      ctx.fillStyle = "#7986cb";
      ctx.beginPath();
      ctx.moveTo(-20, -18);
      ctx.lineTo(20, -18);
      ctx.lineTo(24, 28);
      ctx.lineTo(-24, 28);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#5d4037";
      ctx.fillRect(-10, 28, 8, 22);
      ctx.fillRect(2, 28, 8, 22);
    }

    ctx.fillStyle = "#fce4d6";
    ctx.beginPath();
    ctx.arc(0, -36, 17, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#4a148c";
    ctx.beginPath();
    ctx.ellipse(0, -42, 20, 15, 0, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(-20, -50, 40, 18);

    drawCuteEye(-7, -38, "#5d4037", 0.9);
    drawCuteEye(7, -38, "#5d4037", 0.9);

    if (onPhone) {
      ctx.fillStyle = "#37474f";
      ctx.fillRect(16, -46, 11, 20);
      ctx.strokeStyle = "#fce4d6";
      ctx.lineWidth = 5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(10, -40);
      ctx.lineTo(20, -46);
      ctx.stroke();
      if (mouthOpen) {
        ctx.fillStyle = "#c62828";
        ctx.beginPath();
        ctx.ellipse(-1, -30, 5, 6, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (nursing) {
      ctx.strokeStyle = "#888";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-4, -28);
      ctx.lineTo(4, -28);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "#e57373";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, -30, 4, 0.1 * Math.PI, 0.9 * Math.PI);
      ctx.stroke();
    }

    if (carrying) {
      drawAndy(8, -58, 0.8, { crying: false, pacifier: false });
    }
    if (nursing) {
      drawAndy(18, -5, 0.75, { crying: false, pacifier: true });
    }

    ctx.restore();
  }

  function drawOutside() {
    const grd = ctx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, "#7ec8e3");
    grd.addColorStop(1, "#b8e4f0");
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#7cb342";
    ctx.fillRect(0, H - 70, W, 70);
    ctx.fillStyle = "#558b2f";
    ctx.beginPath();
    ctx.arc(120, H - 50, 35, 0, Math.PI * 2);
    ctx.arc(680, H - 45, 42, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffe0b2";
    ctx.fillRect(200, 200, 400, 230);
    ctx.fillStyle = "#8d6e63";
    ctx.beginPath();
    ctx.moveTo(170, 210);
    ctx.lineTo(400, 115);
    ctx.lineTo(630, 210);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(DOOR.x, DOOR.y, DOOR.w, DOOR.h);
    ctx.fillStyle = "#ffd54f";
    ctx.beginPath();
    ctx.arc(DOOR.x + 14, DOOR.y + DOOR.h / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawRoomBase() {
    ctx.fillStyle = "#fff8f0";
    ctx.fillRect(0, 0, W, H - 75);
    ctx.fillStyle = "#ffe0b2";
    ctx.fillRect(0, 0, W, 20);

    ctx.fillStyle = "#bcaaa4";
    ctx.fillRect(0, H - 75, W, 75);
    ctx.fillStyle = "#ffab91";
    ctx.beginPath();
    ctx.ellipse(400, H - 28, 130, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#5c6bc0";
    ctx.fillRect(600, 295, 120, 70);
    ctx.fillStyle = "#3f51b5";
    ctx.fillRect(600, 285, 120, 18);
    ctx.fillStyle = "#7986cb";
    ctx.fillRect(615, 310, 90, 45);

    ctx.fillStyle = "#8d6e63";
    ctx.fillRect(120, 315, 95, 50);
    ctx.fillStyle = "#6d4c41";
    ctx.fillRect(115, 308, 105, 12);

    ctx.fillStyle = "#ef5350";
    ctx.beginPath();
    ctx.arc(210, H - 35, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffca28";
    ctx.fillRect(250, H - 48, 20, 18);
    ctx.fillStyle = "#66bb6a";
    ctx.fillRect(275, H - 48, 20, 18);
    ctx.fillStyle = "#a1887f";
    ctx.beginPath();
    ctx.ellipse(460, H - 32, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function getMomDrawState() {
    if (momOnPhone) {
      return { x: 640, y: 360, opts: { onPhone: true, mouthOpen: momMouthOpen } };
    }
    if (momAnim) {
      return {
        x: momAnim.x,
        y: momAnim.y,
        opts: {
          carrying: momAnim.carrying,
          sitting: momAnim.sitting,
          nursing: momAnim.nursing,
        },
      };
    }
    if (momNursing) {
      return { x: SOFA_SEAT.x, y: SOFA_SEAT.y, opts: { sitting: true, nursing: true } };
    }
    return { x: MOM_START.x, y: MOM_START.y, opts: {} };
  }

  function drawInside() {
    drawRoomBase();
    drawLori(530, 335);

    if (!andyHidden && !momAnim && !momNursing) {
      drawAndy(ANDY_SPOT.x, ANDY_SPOT.y, 1);
    }

    const mom = getMomDrawState();
    drawMom(mom.x, mom.y, mom.opts);

    if (momAnim && momAnim.carrying && !momAnim.sitting) {
      /* andy drawn on mom */
    } else if (momNursing) {
      /* andy drawn on mom nursing */
    }
  }

  function render() {
    try {
      ctx.clearRect(0, 0, W, H);
      if (scene === "outside") drawOutside();
      else drawInside();
    } catch (err) {
      ctx.fillStyle = "#fff3e0";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#c62828";
      ctx.font = "18px Segoe UI, Arial";
      ctx.textAlign = "center";
      ctx.fillText("שגיאה במשחק", W / 2, H / 2 - 10);
      ctx.font = "14px Segoe UI, Arial";
      ctx.fillText(err.message, W / 2, H / 2 + 20);
    }
    requestAnimationFrame(render);
  }

  function moveMom(from, to, speed, onDone) {
    momAnim = {
      x: from.x,
      y: from.y,
      carrying: false,
      sitting: false,
      nursing: false,
    };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.max(1, Math.ceil(dist / speed));
    let step = 0;

    const interval = setInterval(function () {
      step += 1;
      const t = step / steps;
      momAnim.x = from.x + dx * t;
      momAnim.y = from.y + dy * t;
      if (step >= steps) {
        clearInterval(interval);
        momAnim.x = to.x;
        momAnim.y = to.y;
        onDone();
      }
    }, 30);
  }

  function runPacifierScene(onComplete) {
    andyHidden = true;
    momAnim = { x: MOM_START.x, y: MOM_START.y, carrying: false, sitting: false, nursing: false };

    moveMom(MOM_START, ANDY_SPOT, 4, function () {
      momAnim.carrying = true;
      moveMom(ANDY_SPOT, SOFA_SEAT, 3.5, function () {
        momAnim.carrying = false;
        momAnim.sitting = true;
        momAnim.nursing = true;
        momNursing = true;
        momAnim = null;
        stopCryLoop();
        andyHappy = true;
        andyArmsUp = false;
        andyHidden = false;
        playHappyYay();
        window.setTimeout(onComplete, 1200);
      });
    });
  }

  function runLiftScene(onComplete) {
    andyHidden = true;
    momAnim = { x: MOM_START.x, y: MOM_START.y, carrying: false, sitting: false, nursing: false };

    moveMom(MOM_START, ANDY_SPOT, 4, function () {
      momAnim.carrying = true;
      stopCryLoop();
      window.setTimeout(function () {
        andyHappy = true;
        andyArmsUp = true;
        playHappyYay();
        onComplete();
      }, 1000);
    });
  }

  function resetGame() {
    stopCryLoop();
    stopPhoneMumble();
    scene = "outside";
    andyHappy = false;
    andyArmsUp = false;
    andyHidden = false;
    loriCrying = false;
    momAnim = null;
    momOnPhone = false;
    momMouthOpen = false;
    momNursing = false;
    hidePanel();
    canvas.classList.add("clickable");
    restartBtn.classList.add("hidden");
    setHint("לחץ על דלת הבית כדי להיכנס");
  }

  function enterHouse() {
    scene = "inside";
    canvas.classList.remove("clickable");
    restartBtn.classList.remove("hidden");
    setHint("");
    resumeAudio();
    window.setTimeout(startAndyDilemma, 1000);
  }

  function startAndyDilemma() {
    momOnPhone = false;
    momNursing = false;
    momAnim = null;
    andyHappy = false;
    andyArmsUp = false;
    andyHidden = false;
    loriCrying = false;
    stopPhoneMumble();
    startBabyCry();
    showPanel("אנדי בוכה", [CHOICE.PACIFIER, CHOICE.LIFT, CHOICE.PHONE], handleChoice);
  }

  function showAndyStoppedThen(onAfter) {
    showMessageOnly("אנדי הפסיק לבכות");
    window.setTimeout(function () {
      hidePanel();
      if (onAfter) {
        window.setTimeout(onAfter, 2000);
      }
    }, 2000);
  }

  function handleChoice(id) {
    hidePanel();

    if (id === CHOICE.PACIFIER) {
      momOnPhone = false;
      stopPhoneMumble();
      runPacifierScene(function () {
        showAndyStoppedThen(null);
      });
      return;
    }

    if (id === CHOICE.LIFT) {
      momOnPhone = false;
      stopPhoneMumble();
      runLiftScene(function () {
        showAndyStoppedThen(function () {
          momAnim = null;
          andyHidden = false;
          loriCrying = true;
          startGirlCry();
          showPanel("לורי בוכה", [], function () {});
        });
      });
      return;
    }

    if (id === CHOICE.PHONE) {
      momOnPhone = true;
      momAnim = null;
      momNursing = false;
      if (!cryLoop) startBabyCry();
      playPhoneMumble();
      window.setTimeout(function () {
        showPanel("אנדי בוכה", [CHOICE.PACIFIER, CHOICE.LIFT, CHOICE.PHONE], handleChoice);
      }, 600);
    }
  }

  canvas.addEventListener("click", function (event) {
    if (scene !== "outside") return;
    resumeAudio();
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left) * (canvas.width / rect.width);
    const y = (event.clientY - rect.top) * (canvas.height / rect.height);
    if (x >= DOOR.x && x <= DOOR.x + DOOR.w && y >= DOOR.y && y <= DOOR.y + DOOR.h) {
      enterHouse();
    }
  });

  restartBtn.addEventListener("click", resetGame);

  canvas.classList.add("clickable");
  setHint("לחץ על דלת הבית כדי להיכנס");
  render();
})();
