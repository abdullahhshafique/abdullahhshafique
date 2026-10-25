(function() {
    const canvas = document.getElementById('petalCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let W, H, petals = [];

    function resize() {
        const dpr = Math.min(devicePixelRatio, 1.5);
        W = canvas.width = window.innerWidth * dpr;
        H = canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
    }

    resize();
    window.addEventListener('resize', resize);

    const count = window.innerWidth < 480 ? 30 : window.innerWidth < 768 ? 50 : 70;
    for (let i = 0; i < count; i++) {
        petals.push({
            x: Math.random(),
            y: Math.random(),
            r: 6 + Math.random() * 14,
            sp: 0.2 + Math.random() * 0.8,
            drift: Math.random() * Math.PI * 2,
            a: 0.3 + Math.random() * 0.5
        });
    }

    let petalDensity = 0,
        windAmt = 0;
// ── scroll blur: sharp → micro blur → full blur → stay → unblur ──
let scrollBlur = 0;
let currentBlur = 0;

function updateBlur() {
    const scrollY = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollY / docH;
    
    // Get section positions dynamically
    const systemsSection = document.getElementById('systems');
    const projectsSection = document.getElementById('projects');
    
    let archProgress = 0.18;
    let workProgress = 0.30;
    
    if (systemsSection) {
        archProgress = systemsSection.offsetTop / docH;
    }
    if (projectsSection) {
        workProgress = projectsSection.offsetTop / docH;
    }
    
    let targetBlur = 0;
    if (progress < archProgress) {
        // Hero to Architecture: completely sharp
        targetBlur = 0;
    } else if (progress < workProgress) {
        // Architecture to Work: micro blur 0 → 0.05
        const microRange = workProgress - archProgress;
        targetBlur = ((progress - archProgress) / microRange) * 0.05;
    } else if (progress < 0.55) {
        // Work through About: full blur 0.05 → 0.5
        const fullRange = 0.55 - workProgress;
        targetBlur = 0.05 + ((progress - workProgress) / fullRange) * 0.45;
    } else if (progress < 0.80) {
        // Unblur: 0.5 → 0
        targetBlur = 0.5 - ((progress - 0.55) / 0.25) * 0.5;
    } else {
        // Contact+: sharp again
        targetBlur = 0;
    }
    
    scrollBlur = Math.max(0, Math.min(0.5, targetBlur));
}

window.addEventListener('scroll', updateBlur, { passive: true });
updateBlur();

    function drawPetals(t) {
        ctx.clearRect(0, 0, W, H);
        
        // Smooth blur transition
        currentBlur += (scrollBlur - currentBlur) * 0.05;
        
        // Apply blur to entire canvas via CSS
        const blurPx = currentBlur * 10; // max 6px blur
        canvas.style.filter = `blur(${blurPx}px)`;
        canvas.style.opacity = String(1 - currentBlur * 0.2); // slight fade
        
        const dpr = Math.min(devicePixelRatio, 1.5);
        for (const p of petals) {
            const px = (p.x + Math.sin(t * 0.0003 * p.sp + p.drift) * 0.04 * (0.5 + windAmt * 2)) * W;
            const py = (((p.y + t * 0.00004 * p.sp) % 1)) * H;
            const size = p.r * dpr * (0.5 + petalDensity * 0.05);

            ctx.globalAlpha = p.a * petalDensity;
            const g = ctx.createRadialGradient(px, py, 0, px, py, size);
            g.addColorStop(0, 'rgba(247,196,218,0.9)');
            g.addColorStop(1, 'rgba(194,106,151,0)');

            ctx.fillStyle = g;
            ctx.beginPath();
            ctx.ellipse(px, py, size, size * 0.6, p.drift + t * 0.0002, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        if (!reduce) requestAnimationFrame(drawPetals);
    }

    if (!reduce) requestAnimationFrame(drawPetals);

    // expose for scroll updates
    window.__petalDensity = function(v) { petalDensity = Math.min(1, Math.max(0, v)); };
    window.__windAmt = function(v) { windAmt = Math.max(0, v); };
})();
