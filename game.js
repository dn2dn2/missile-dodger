const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreVal = document.getElementById('scoreVal');
const starVal = document.getElementById('starVal');
const destroyedVal = document.getElementById('destroyedVal');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const finalScoreVal = document.getElementById('finalScoreVal');
const finalDestroyedVal = document.getElementById('finalDestroyedVal');

let width, height;
let gameRunning = false;
let score = 0;
let starsCollected = 0;
let missilesDestroyed = 0;
let timeAlive = 0; // ms
let lastTime = 0;

let player;
let missiles = [];
let items = [];
let particles = [];
let bgStars = [];
let currentStar = null;

let mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
let missileSpawnTimer = 0;
let missileSpawnInterval = 1800;
let itemSpawnTimer = 0;
let itemSpawnInterval = 20000;

// ==========================================
// TẠO HÌNH ẢNH MÁY BAY & TÊN LỬA (VECTOR THIẾT KẾ CAO CẤP)
// ==========================================
const planeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">
  <defs>
    <linearGradient id="fuselageGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#1e293b"/>
      <stop offset="25%" stop-color="#334155"/>
      <stop offset="50%" stop-color="#64748b"/>
      <stop offset="75%" stop-color="#475569"/>
      <stop offset="100%" stop-color="#1e293b"/>
    </linearGradient>
    <linearGradient id="wingGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="40%" stop-color="#1e293b"/>
      <stop offset="70%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#64748b"/>
    </linearGradient>
    <linearGradient id="cockpitGlass" x1="20%" y1="0%" x2="80%" y2="100%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
      <stop offset="25%" stop-color="#00f2fe" stop-opacity="0.9"/>
      <stop offset="70%" stop-color="#0369a1" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#082f49" stop-opacity="1"/>
    </linearGradient>
    <linearGradient id="jetBurner" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#00f2fe" stop-opacity="0"/>
      <stop offset="40%" stop-color="#38bdf8" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Luồng nhiệt động cơ phản lực kép -->
  <path d="M 6,52 L 22,54 L 22,58 L 6,60 Z" fill="url(#jetBurner)" filter="url(#neonGlow)" opacity="0.85"/>
  <path d="M 6,60 L 22,62 L 22,66 L 6,68 Z" fill="url(#jetBurner)" filter="url(#neonGlow)" opacity="0.85"/>

  <!-- Vòi xả kim loại titan -->
  <rect x="20" y="52" width="10" height="7" rx="1.5" fill="#0f172a" stroke="#00f2fe" stroke-width="0.8"/>
  <rect x="20" y="61" width="10" height="7" rx="1.5" fill="#0f172a" stroke="#00f2fe" stroke-width="0.8"/>

  <!-- Cánh đuôi đứng kép (Twin Tail Fins) -->
  <polygon points="12,38 34,42 42,48 20,48" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <line x1="12" y1="38" x2="34" y2="42" stroke="#00f2fe" stroke-width="1.2" filter="url(#neonGlow)"/>
  <polygon points="12,82 34,78 42,72 20,72" fill="#1e293b" stroke="#334155" stroke-width="1"/>
  <line x1="12" y1="82" x2="34" y2="78" stroke="#00f2fe" stroke-width="1.2" filter="url(#neonGlow)"/>

  <!-- Cánh chính Delta Wing khí động học -->
  <polygon points="26,50 48,22 66,22 80,48 64,54" fill="url(#wingGrad)" stroke="#475569" stroke-width="1"/>
  <polyline points="48,22 66,22 80,48" stroke="#00f2fe" stroke-width="1.2" fill="none" opacity="0.85"/>
  <line x1="52" y1="32" x2="72" y2="48" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>

  <polygon points="26,70 48,98 66,98 80,72 64,66" fill="url(#wingGrad)" stroke="#475569" stroke-width="1"/>
  <polyline points="48,98 66,98 80,72" stroke="#00f2fe" stroke-width="1.2" fill="none" opacity="0.85"/>
  <line x1="52" y1="88" x2="72" y2="72" stroke="#38bdf8" stroke-width="0.8" opacity="0.6"/>

  <!-- Thân tiêm kích tàng hình đa giác -->
  <path d="M 24,53 L 38,46 L 70,44 L 100,53 L 118,60 L 100,67 L 70,76 L 38,74 L 24,67 L 24,53 Z" 
        fill="url(#fuselageGrad)" stroke="#64748b" stroke-width="1.2"/>

  <!-- Sống lưng kim loại giữa thân -->
  <line x1="30" y1="60" x2="114" y2="60" stroke="#94a3b8" stroke-width="1.2" stroke-linecap="round"/>

  <!-- Hốc hút gió tàng hình (Stealth Intakes) -->
  <polygon points="46,47 62,45 60,50 48,51" fill="#090d16" stroke="#00f2fe" stroke-width="0.7"/>
  <polygon points="46,73 62,75 60,70 48,69" fill="#090d16" stroke="#00f2fe" stroke-width="0.7"/>

  <!-- Buồng lái kính vòm 3D phát quang -->
  <path d="M 68,54 C 82,54 94,56 100,60 C 94,64 82,66 68,66 C 58,66 58,54 68,54 Z" 
        fill="url(#cockpitGlass)" stroke="#38bdf8" stroke-width="1.2" filter="url(#neonGlow)"/>
  <!-- Điểm phản chiếu ánh sáng kính -->
  <ellipse cx="80" cy="57" rx="10" ry="2.2" fill="#ffffff" opacity="0.75" transform="rotate(-5 80 57)"/>

  <!-- Mắt cảm biến định vị mũi máy bay -->
  <circle cx="116" cy="60" r="1.8" fill="#00f2fe" filter="url(#neonGlow)"/>
</svg>`;

const missileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 24">
  <defs>
    <linearGradient id="redMissileBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="25%" stop-color="#e2e8f0"/>
      <stop offset="65%" stop-color="#94a3b8"/>
      <stop offset="100%" stop-color="#334155"/>
    </linearGradient>
    <linearGradient id="redWarhead" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#b91c1c"/>
      <stop offset="50%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#ff0844"/>
    </linearGradient>
    <linearGradient id="rocketFlame" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(255,255,255,0)"/>
      <stop offset="30%" stop-color="#ff7b00" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#ff0844"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Ngọn lửa phản lực siêu thanh ở đuôi -->
  <polygon points="2,12 14,8 14,16" fill="url(#rocketFlame)" filter="url(#redGlow)"/>

  <!-- Vòi phun xả khí -->
  <rect x="13" y="8.5" width="5" height="7" rx="1" fill="#1e293b" stroke="#475569" stroke-width="0.8"/>

  <!-- 4 Cánh lái ổn định phía đuôi -->
  <polygon points="15,9 26,2 30,8.5 18,8.5" fill="#334155" stroke="#ff0844" stroke-width="0.8"/>
  <polygon points="15,15 26,22 30,15.5 18,15.5" fill="#334155" stroke="#ff0844" stroke-width="0.8"/>

  <!-- Thân chính hợp kim trụ tròn -->
  <rect x="17" y="7.5" width="45" height="9" rx="1.5" fill="url(#redMissileBody)" stroke="#334155" stroke-width="0.7"/>

  <!-- Vạch sọc nhận diện quân sự -->
  <rect x="35" y="7.5" width="4" height="9" fill="#ff0844"/>
  <rect x="41" y="7.5" width="2" height="9" fill="#0f172a"/>
  <rect x="45" y="7.5" width="2" height="9" fill="#0f172a"/>

  <!-- Cánh điều hướng phía trước -->
  <polygon points="52,7.5 58,4 60,7.5" fill="#1e293b" stroke="#ff0844" stroke-width="0.7"/>
  <polygon points="52,16.5 58,20 60,16.5" fill="#1e293b" stroke="#ff0844" stroke-width="0.7"/>

  <!-- Đầu đạn khí động học -->
  <path d="M 62,7.5 Q 74,10 78,12 Q 74,14 62,16.5 Z" fill="url(#redWarhead)" stroke="#b91c1c" stroke-width="0.8"/>

  <!-- Mắt cảm biến hồng ngoại phát sáng -->
  <circle cx="77" cy="12" r="2" fill="#ffffff" filter="url(#redGlow)"/>
</svg>`;

const purpleMissileSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 24">
  <defs>
    <linearGradient id="purpleMissileBody" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#e9d5ff"/>
      <stop offset="30%" stop-color="#a855f7"/>
      <stop offset="70%" stop-color="#581c87"/>
      <stop offset="100%" stop-color="#2e1065"/>
    </linearGradient>
    <linearGradient id="purpleWarhead" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#581c87"/>
      <stop offset="50%" stop-color="#a855f7"/>
      <stop offset="100%" stop-color="#f0abfc"/>
    </linearGradient>
    <linearGradient id="plasmaFlame" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="rgba(192,132,252,0)"/>
      <stop offset="30%" stop-color="#a855f7" stop-opacity="0.8"/>
      <stop offset="70%" stop-color="#c084fc"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="purpleGlow" x="-25%" y="-25%" width="150%" height="150%">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>

  <!-- Ngọn lửa xung Plasma tím ở đuôi -->
  <polygon points="1,12 15,7.5 15,16.5" fill="url(#plasmaFlame)" filter="url(#purpleGlow)"/>

  <!-- Vòi phun từ trường Plasma -->
  <rect x="13" y="8" width="5" height="8" rx="1.5" fill="#1e1035" stroke="#c084fc" stroke-width="1"/>

  <!-- Cánh lái tàng hình góc vát -->
  <polygon points="14,8 24,1 32,8 20,8" fill="#2e1065" stroke="#c084fc" stroke-width="1" filter="url(#purpleGlow)"/>
  <polygon points="14,16 24,23 32,16 20,16" fill="#2e1065" stroke="#c084fc" stroke-width="1" filter="url(#purpleGlow)"/>

  <!-- Thân tên lửa Nano-Carbon -->
  <rect x="17" y="7" width="45" height="10" rx="2" fill="url(#purpleMissileBody)" stroke="#a855f7" stroke-width="0.9"/>

  <!-- Rãnh dẫn năng lượng cực quang -->
  <line x1="22" y1="12" x2="58" y2="12" stroke="#ffffff" stroke-width="1" filter="url(#purpleGlow)"/>
  <line x1="30" y1="9" x2="48" y2="9" stroke="#f0abfc" stroke-width="0.8"/>
  <line x1="30" y1="15" x2="48" y2="15" stroke="#f0abfc" stroke-width="0.8"/>

  <!-- Cánh lái trước -->
  <polygon points="50,7 56,3 58,7" fill="#3b0764" stroke="#c084fc" stroke-width="0.8"/>
  <polygon points="50,17 56,21 58,17" fill="#3b0764" stroke="#c084fc" stroke-width="0.8"/>

  <!-- Đầu dẫn đường Plasma siêu dẫn -->
  <path d="M 62,7 Q 74,9.5 79,12 Q 74,14.5 62,17 Z" fill="url(#purpleWarhead)" stroke="#c084fc" stroke-width="1"/>

  <!-- Lõi Plasma phát sáng rực rỡ -->
  <circle cx="77" cy="12" r="2.5" fill="#ffffff" filter="url(#purpleGlow)"/>
</svg>`;

const planeImage = new Image();
planeImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(planeSvg);

const missileImage = new Image();
missileImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(missileSvg);

const purpleMissileImage = new Image();
purpleMissileImage.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(purpleMissileSvg);
// ==========================================

function initBgStars() {
    bgStars = [];
    for (let i = 0; i < 90; i++) {
        bgStars.push({
            x: Math.random() * width,
            y: Math.random() * height,
            size: Math.random() * 2 + 0.6,
            speed: Math.random() * 25 + 8,
            brightness: Math.random() * 0.7 + 0.3,
            twinkleSpeed: Math.random() * 0.04 + 0.01,
            phase: Math.random() * Math.PI * 2
        });
    }
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    initBgStars();
}
window.addEventListener('resize', resize);
resize();

window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

function drawBackground(dt) {
    ctx.fillStyle = '#060614';
    ctx.fillRect(0, 0, width, height);

    let neb1 = ctx.createRadialGradient(width * 0.2, height * 0.25, 40, width * 0.2, height * 0.25, width * 0.45);
    neb1.addColorStop(0, 'rgba(88, 28, 135, 0.22)');
    neb1.addColorStop(1, 'rgba(88, 28, 135, 0)');
    ctx.fillStyle = neb1;
    ctx.fillRect(0, 0, width, height);

    let neb2 = ctx.createRadialGradient(width * 0.8, height * 0.75, 40, width * 0.8, height * 0.75, width * 0.45);
    neb2.addColorStop(0, 'rgba(2, 132, 199, 0.20)');
    neb2.addColorStop(1, 'rgba(2, 132, 199, 0)');
    ctx.fillStyle = neb2;
    ctx.fillRect(0, 0, width, height);

    let neb3 = ctx.createRadialGradient(width * 0.5, height * 0.5, 30, width * 0.5, height * 0.5, width * 0.35);
    neb3.addColorStop(0, 'rgba(190, 24, 93, 0.14)');
    neb3.addColorStop(1, 'rgba(190, 24, 93, 0)');
    ctx.fillStyle = neb3;
    ctx.fillRect(0, 0, width, height);

    for (let s of bgStars) {
        s.y += s.speed * (dt / 1000);
        if (s.y > height) {
            s.y = 0;
            s.x = Math.random() * width;
        }
        s.phase += s.twinkleSpeed;
        let alpha = s.brightness + Math.sin(s.phase) * 0.25;
        alpha = Math.max(0.15, Math.min(1, alpha));

        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Player {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.radius = 18;
        this.baseSpeed = 350; 
        this.boostSpeed = 600; 
        this.shield = false;
        this.ghostTimer = 0;
        this.speedBoostTimer = 0;
        this.angle = 0;
    }

    update(dt) {
        let dx = mouse.x - this.x;
        let dy = mouse.y - this.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 5) {
            let currentSpeed = this.speedBoostTimer > 0 ? this.boostSpeed : this.baseSpeed;
            let moveDist = currentSpeed * (dt / 1000);
            if (moveDist > dist) {
                moveDist = dist;
            }
            this.x += (dx / dist) * moveDist;
            this.y += (dy / dist) * moveDist;
            this.angle = Math.atan2(dy, dx);
        }

        this.x = Math.max(this.radius, Math.min(width - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(height - this.radius, this.y));

        if (this.ghostTimer > 0) this.ghostTimer -= dt;
        if (this.speedBoostTimer > 0) this.speedBoostTimer -= dt;
        
        if (gameRunning && Math.random() > 0.5) {
            let tailX = this.x - Math.cos(this.angle) * 22;
            let tailY = this.y - Math.sin(this.angle) * 22;
            let color = this.speedBoostTimer > 0 ? '#00f2fe' : '#ff4b1f';
            particles.push(new Particle(tailX, tailY, color, 3, 0.4, 
                -Math.cos(this.angle) * 100, -Math.sin(this.angle) * 100));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.ghostTimer > 0) {
            ctx.globalAlpha = 0.4;
        }

        ctx.rotate(this.angle);
        
        if (this.speedBoostTimer > 0) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#00f2fe';
        }

        ctx.drawImage(planeImage, -32, -32, 64, 64);

        if (this.shield) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#00ff00';
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 15, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
            ctx.fill();
        }

        ctx.restore();
    }
}

class Missile {
    constructor(baseSpeed, isPurple = false, spawnX = null, spawnY = null) {
        this.isPurple = isPurple;
        
        if (spawnX !== null && spawnY !== null) {
            this.x = spawnX;
            this.y = spawnY;
        } else {
            let edge = Math.floor(Math.random() * 4);
            if (edge === 0) { this.x = Math.random() * width; this.y = -50; }
            else if (edge === 1) { this.x = width + 50; this.y = Math.random() * height; }
            else if (edge === 2) { this.x = Math.random() * width; this.y = height + 50; }
            else { this.x = -50; this.y = Math.random() * height; }
        }
        
        this.radius = isPurple ? 9 : 8;
        let speedMultiplier = isPurple ? 1.65 : 1.0;
        this.speed = (baseSpeed + Math.random() * 30) * speedMultiplier;
        this.angle = 0;
        this.turnSpeed = isPurple ? 2.2 : 1.8;
    }

    update(dt) {
        this.speed += (this.isPurple ? 20 : 15) * (dt / 1000); 
        
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        let targetAngle = Math.atan2(dy, dx);
        
        let angleDiff = targetAngle - this.angle;
        angleDiff = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));
        
        this.angle += angleDiff * this.turnSpeed * (dt / 1000);

        let vx = Math.cos(this.angle) * this.speed;
        let vy = Math.sin(this.angle) * this.speed;

        this.x += vx * (dt / 1000);
        this.y += vy * (dt / 1000);

        if (Math.random() > 0.4) {
            let tailX = this.x - Math.cos(this.angle) * 18;
            let tailY = this.y - Math.sin(this.angle) * 18;
            let trailColor = this.isPurple ? '#c084fc' : '#ffaa00';
            particles.push(new Particle(tailX, tailY, trailColor, 2.5, 0.5, 
                -Math.cos(this.angle) * 60, -Math.sin(this.angle) * 60));
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        ctx.shadowBlur = this.isPurple ? 16 : 10;
        ctx.shadowColor = this.isPurple ? '#c084fc' : '#ff0844';
        
        let img = this.isPurple ? purpleMissileImage : missileImage;
        ctx.drawImage(img, -20, -6, 40, 12);
        
        ctx.restore();
    }
}

class Item {
    constructor() {
        this.x = 50 + Math.random() * (width - 100);
        this.y = 50 + Math.random() * (height - 100);
        this.radius = 16;
        let types = ['speed', 'shield', 'ghost'];
        this.type = types[Math.floor(Math.random() * types.length)];
        this.life = 10000; 
    }

    update(dt) {
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let color = '#fff';
        if (this.type === 'speed') color = '#f6d365';
        if (this.type === 'shield') color = '#00ff00';
        if (this.type === 'ghost') color = '#c084fc';

        // 1. Quả cầu năng lượng nền mờ
        ctx.shadowBlur = 18;
        ctx.shadowColor = color;
        ctx.fillStyle = 'rgba(10, 10, 30, 0.75)';
        ctx.beginPath();
        ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // 2. Vẽ biểu tượng trực quan bên trong
        ctx.fillStyle = color;
        ctx.shadowBlur = 12;
        ctx.shadowColor = color;

        if (this.type === 'speed') {
            // Biểu tượng Tia sét ⚡
            ctx.beginPath();
            ctx.moveTo(2, -9);
            ctx.lineTo(-6, 0);
            ctx.lineTo(0, 0);
            ctx.lineTo(-2, 9);
            ctx.lineTo(6, 0);
            ctx.lineTo(0, 0);
            ctx.closePath();
            ctx.fill();
        } else if (this.type === 'shield') {
            // Biểu tượng Chiếc khiên 🛡️
            ctx.beginPath();
            ctx.moveTo(0, -9);
            ctx.lineTo(7, -6);
            ctx.lineTo(6, 3);
            ctx.lineTo(0, 9);
            ctx.lineTo(-6, 3);
            ctx.lineTo(-7, -6);
            ctx.closePath();
            ctx.fill();
            
            // Điểm sáng trung tâm của khiên
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(0, 0, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'ghost') {
            // Biểu tượng Bóng ma tàng hình 👻
            ctx.beginPath();
            ctx.arc(0, -2, 6, Math.PI, 0);
            ctx.lineTo(6, 6);
            ctx.lineTo(3, 3);
            ctx.lineTo(0, 6);
            ctx.lineTo(-3, 3);
            ctx.lineTo(-6, 6);
            ctx.closePath();
            ctx.fill();
            
            // Hai mắt bóng ma
            ctx.fillStyle = '#060614';
            ctx.beginPath();
            ctx.arc(-2.5, -2, 1.5, 0, Math.PI * 2);
            ctx.arc(2.5, -2, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }

        // 3. Vòng sóng năng lượng nhấp nháy bên ngoài
        ctx.globalAlpha = 0.4 + 0.4 * Math.sin(Date.now() / 150);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 6, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

class Star {
    constructor() {
        this.x = 100 + Math.random() * (width - 200);
        this.y = 100 + Math.random() * (height - 200);
        this.radius = 16;
        this.maxLife = 7000;
        this.life = this.maxLife;
    }

    update(dt) {
        this.life -= dt;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        
        let progress = Math.max(0, this.life / this.maxLife);
        let isUrgent = this.life < 2500;
        
        let starColor = isUrgent ? (Math.floor(Date.now() / 100) % 2 === 0 ? '#c084fc' : '#ffeb3b') : '#ffeb3b';
        let glowColor = isUrgent ? '#c084fc' : '#ffeb3b';
        
        ctx.shadowBlur = 20;
        ctx.shadowColor = glowColor;
        ctx.fillStyle = starColor;
        
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 15,
                       -Math.sin((18 + i * 72) * Math.PI / 180) * 15);
            ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 7,
                       -Math.sin((54 + i * 72) * Math.PI / 180) * 7);
        }
        ctx.closePath();
        ctx.fill();

        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 10, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
        ctx.strokeStyle = isUrgent ? '#c084fc' : '#ffeb3b';
        ctx.lineWidth = 3;
        ctx.stroke();

        ctx.globalAlpha = 0.3 + 0.3 * Math.sin(Date.now() / 150);
        ctx.beginPath();
        ctx.arc(0, 0, this.radius + 14, 0, Math.PI * 2);
        ctx.strokeStyle = isUrgent ? '#c084fc' : '#ffeb3b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color, size, lifeDuration, vx = null, vy = null) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.maxLife = lifeDuration;
        this.life = lifeDuration;
        
        if (vx !== null && vy !== null) {
            this.vx = vx + (Math.random() * 20 - 10);
            this.vy = vy + (Math.random() * 20 - 10);
        } else {
            let angle = Math.random() * Math.PI * 2;
            let speed = Math.random() * 150 + 50;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        }
    }

    update(dt) {
        this.x += this.vx * (dt / 1000);
        this.y += this.vy * (dt / 1000);
        this.life -= dt / 1000;
        
        this.vx *= 0.95;
        this.vy *= 0.95;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function spawnExplosion(x, y, color) {
    for (let i = 0; i < 40; i++) {
        particles.push(new Particle(x, y, color, Math.random() * 4 + 1, 0.5 + Math.random() * 0.8));
    }
}

function checkCollision(a, b) {
    let dx = a.x - b.x;
    let dy = a.y - b.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    return dist < (a.radius + b.radius);
}

function init() {
    player = new Player();
    missiles = [];
    items = [];
    particles = [];
    currentStar = new Star();
    score = 0;
    starsCollected = 0;
    timeAlive = 0;
    missileSpawnTimer = 0;
    missileSpawnInterval = 1800; 
    itemSpawnTimer = 0;
    itemSpawnInterval = 20000; 
    
    scoreVal.innerText = score;
    if(starVal) starVal.innerText = starsCollected;
    missilesDestroyed = 0;
    if(destroyedVal) destroyedVal.innerText = missilesDestroyed;
    
    mouse.x = width / 2;
    mouse.y = height / 2;
}

function startGame() {
    init();
    gameRunning = true;
    startScreen.classList.add('hidden');
    gameOverScreen.classList.add('hidden');
    lastTime = performance.now();
    requestAnimationFrame(gameLoop);
}

function gameOver() {
    gameRunning = false;
    spawnExplosion(player.x, player.y, '#ffffff');
    spawnExplosion(player.x, player.y, '#00f2fe');
    finalScoreVal.innerText = score;
    if(finalDestroyedVal) finalDestroyedVal.innerText = missilesDestroyed;
    setTimeout(() => {
        gameOverScreen.classList.remove('hidden');
    }, 1500);
}

function gameLoop(currentTime) {
    if (!gameRunning) return;

    let dt = currentTime - lastTime;
    lastTime = currentTime;
    timeAlive += dt;

    drawBackground(dt);

    let currentMissileBaseSpeed = 120 + (timeAlive / 1000) * 1.5;

    missileSpawnTimer += dt;
    if (missileSpawnTimer > missileSpawnInterval) {
        let purpleChance = Math.min(0.40, 0.15 + (timeAlive / 1000) * 0.003);
        
        let multiSpawnRoll = Math.random();
        let spawnCount = 1;
        
        let tripleChance = Math.min(0.25, 0.08 + (timeAlive / 1000) * 0.002);
        let doubleChance = Math.min(0.40, 0.20 + (timeAlive / 1000) * 0.003);

        if (multiSpawnRoll < tripleChance) {
            spawnCount = 3;
        } else if (multiSpawnRoll < tripleChance + doubleChance) {
            spawnCount = 2;
        }

        for (let s = 0; s < spawnCount; s++) {
            let isPurple = Math.random() < purpleChance;
            missiles.push(new Missile(currentMissileBaseSpeed, isPurple));
        }

        missileSpawnTimer = 0;
        missileSpawnInterval = Math.max(400, missileSpawnInterval - 8); 
    }

    itemSpawnTimer += dt;
    if (itemSpawnTimer > itemSpawnInterval) {
        items.push(new Item());
        itemSpawnTimer = 0;
        itemSpawnInterval = 20000 + Math.random() * 10000;
    }

    if (Math.floor(timeAlive / 100) > Math.floor((timeAlive - dt) / 100)) {
        score += 1;
        scoreVal.innerText = score;
    }

    player.update(dt);
    if(player.ghostTimer <= 0 || Math.floor(currentTime / 150) % 2 === 0) {
       player.draw(ctx);
    }
    
    if (currentStar) {
        currentStar.update(dt);
        currentStar.draw(ctx);
        
        if (checkCollision(player, currentStar)) {
            starsCollected++;
            if (starVal) starVal.innerText = starsCollected;
            
            score += 500;
            scoreVal.innerText = score;
            
            spawnExplosion(currentStar.x, currentStar.y, '#ffeb3b');
            currentStar = new Star();
        } else if (currentStar.life <= 0) {
            spawnExplosion(currentStar.x, currentStar.y, '#c084fc');
            missiles.push(new Missile(currentMissileBaseSpeed, true, currentStar.x, currentStar.y));
            currentStar = new Star();
        }
    }

    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.update(dt);
        item.draw(ctx);

        if (checkCollision(player, item)) {
            if (item.type === 'speed') player.speedBoostTimer = 4000;
            if (item.type === 'shield') player.shield = true;
            if (item.type === 'ghost') player.ghostTimer = 4500;
            
            score += 50;
            scoreVal.innerText = score;
            spawnExplosion(item.x, item.y, '#ffffff');
            items.splice(i, 1);
            continue;
        }

        if (item.life <= 0) {
            items.splice(i, 1);
        }
    }

    for (let i = missiles.length - 1; i >= 0; i--) {
        let m1 = missiles[i];
        m1.update(dt);
        m1.draw(ctx);

        if (player.ghostTimer <= 0 && checkCollision(player, m1)) {
            if (player.shield) {
                player.shield = false; 
                spawnExplosion(m1.x, m1.y, '#00ff00');
                missiles.splice(i, 1);
                missilesDestroyed++;
                if (destroyedVal) destroyedVal.innerText = missilesDestroyed;
                score += 100;
                continue;
            } else {
                gameOver();
                for(let p of particles) { p.update(dt); p.draw(ctx); }
                return;
            }
        }

        let destroyed = false;
        for (let j = i - 1; j >= 0; j--) {
            let m2 = missiles[j];
            if (checkCollision(m1, m2)) {
                let explosionColor = (m1.isPurple || m2.isPurple) ? '#c084fc' : '#ff0844';
                spawnExplosion(m1.x, m1.y, explosionColor);
                spawnExplosion(m1.x, m1.y, '#ffff00');
                missiles.splice(i, 1); 
                missiles.splice(j, 1); 
                missilesDestroyed += 2;
                if (destroyedVal) destroyedVal.innerText = missilesDestroyed;
                
                score += (m1.isPurple || m2.isPurple) ? 300 : 150; 
                scoreVal.innerText = score;
                destroyed = true;
                i--; 
                break;
            }
        }
        if (destroyed) continue;
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.update(dt);
        p.draw(ctx);
        if (p.life <= 0) particles.splice(i, 1);
    }

    requestAnimationFrame(gameLoop);
}

startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
