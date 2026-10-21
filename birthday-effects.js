(() => {
  'use strict';

  // Birthday effects: confetti bursts and balloons drifting up. Decorative only.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const COLORS = ['#f2a7bd', '#c7637d', '#f6c86b', '#9fd8c5', '#a9c7f2', '#ffffff', '#f4b183'];

  const style = document.createElement('style');
  style.textContent = `
    .bday-confetti { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 2147483000; }
    .bday-balloons { position: fixed; inset: 0; overflow: hidden; pointer-events: none; z-index: -1; }
    .bday-balloon {
      position: absolute; bottom: -120px; width: 46px; height: 58px; border-radius: 50% 50% 48% 48%;
      opacity: .78; animation: bday-rise linear forwards;
      box-shadow: inset -7px -9px 0 rgba(0, 0, 0, .07), inset 6px 7px 10px rgba(255, 255, 255, .45);
    }
    .bday-balloon::before {
      content: ""; position: absolute; left: 50%; bottom: -5px; transform: translateX(-50%);
      border: 5px solid transparent; border-bottom-color: inherit; border-top: 0;
    }
    .bday-balloon::after {
      content: ""; position: absolute; left: 50%; top: 100%; width: 1px; height: 64px;
      background: rgba(112, 58, 80, .3);
    }
    @keyframes bday-rise {
      0% { transform: translate(0, 0) rotate(-4deg); }
      25% { transform: translate(14px, -30vh) rotate(4deg); }
      50% { transform: translate(-10px, -60vh) rotate(-4deg); }
      75% { transform: translate(12px, -90vh) rotate(3deg); }
      100% { transform: translate(0, calc(-100vh - 220px)) rotate(-2deg); }
    }
    @media (max-width: 600px) { .bday-balloon { width: 36px; height: 46px; } }
  `;
  document.head.appendChild(style);

  // Confetti
  const canvas = document.createElement('canvas');
  canvas.className = 'bday-confetti';
  canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  let pieces = [];
  let frame = 0;

  function resize() {
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = innerWidth * ratio;
    canvas.height = innerHeight * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function burst(count = 150) {
    if (!canvas.isConnected) {
      document.body.appendChild(canvas);
      resize();
    }
    // A modal dialog sits in the top layer, so draw inside it to stay visible.
    const modal = [...document.querySelectorAll('dialog[open]')].find(d => d.matches(':modal'));
    const host = modal || document.body;
    if (canvas.parentNode !== host) host.appendChild(canvas);
    for (let i = 0; i < count; i++) {
      const fromLeft = i % 2 === 0;
      pieces.push({
        x: fromLeft ? -10 : innerWidth + 10,
        y: innerHeight * (0.55 + Math.random() * 0.3),
        vx: (fromLeft ? 1 : -1) * (4 + Math.random() * 7),
        vy: -(9 + Math.random() * 9),
        size: 5 + Math.random() * 6,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        spin: Math.random() * Math.PI,
        vspin: (Math.random() - 0.5) * 0.3,
        round: Math.random() < 0.3,
        life: 0
      });
    }
    if (!frame) frame = requestAnimationFrame(draw);
  }

  function draw() {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    pieces = pieces.filter(p => p.y < innerHeight + 30 && p.life < 420);
    for (const p of pieces) {
      p.life++;
      p.vy += 0.22;
      p.vx *= 0.985;
      p.x += p.vx + Math.sin(p.life / 12) * 0.6;
      p.y += p.vy;
      p.spin += p.vspin;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.spin);
      ctx.fillStyle = p.color;
      if (p.round) {
        ctx.beginPath();
        ctx.arc(0, 0, p.size / 2.4, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2 * Math.abs(Math.cos(p.spin)) + 1);
      }
      ctx.restore();
    }
    if (pieces.length) {
      frame = requestAnimationFrame(draw);
    } else {
      frame = 0;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
  }

  window.addEventListener('resize', () => { if (canvas.isConnected) resize(); });

  // Balloons
  const sky = document.createElement('div');
  sky.className = 'bday-balloons';
  sky.setAttribute('aria-hidden', 'true');
  // The garden page paints its own sky, so balloons float just above it there.
  if (document.getElementById('garden')) sky.style.zIndex = '1';
  document.body.appendChild(sky);

  function balloon() {
    if (document.hidden || sky.childElementCount >= 7) return;
    const b = document.createElement('span');
    const color = COLORS[Math.floor(Math.random() * (COLORS.length - 1))];
    b.className = 'bday-balloon';
    b.style.left = `${4 + Math.random() * 88}%`;
    b.style.background = color;
    b.style.borderBottomColor = color;
    b.style.animationDuration = `${11 + Math.random() * 7}s`;
    b.addEventListener('animationend', () => b.remove());
    sky.appendChild(b);
  }

  for (let i = 0; i < 3; i++) setTimeout(balloon, 400 + i * 900);
  setInterval(balloon, 2600);

  // Triggers: page load, and every time a greeting card opens.
  setTimeout(() => burst(120), 900);
  const watcher = new MutationObserver(records => {
    if (records.some(r => r.target.open)) setTimeout(() => burst(), 150);
  });
  document.querySelectorAll('dialog').forEach(d => watcher.observe(d, { attributes: true, attributeFilter: ['open'] }));
})();
