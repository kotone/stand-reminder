/**
 * 律动几何主题 (Pulse Geometric Theme)
 */

const ICON_PULSE = `
    <svg id="icon-pulse-geom" class="stretch-icon pulse-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Rotating outer diamond frame -->
        <rect x="25" y="25" width="50" height="50" rx="8" stroke="rgba(168, 85, 247, 0.3)" stroke-width="2" class="pulse-outer-frame" />
        
        <!-- Flowing pulse line (ECG/wave) -->
        <path d="M 15 50 H 32 L 40 25 L 48 75 L 56 35 L 62 55 L 68 50 H 85" stroke="url(#pulse-line-grad)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="pulse-wave-line" />
        
        <!-- Pulsing nodes on the wave peak & center -->
        <circle cx="40" cy="25" r="3" fill="#ec4899" class="pulse-node" />
        <circle cx="48" cy="75" r="3" fill="#8b5cf6" class="pulse-node" />
        <polygon points="50,45 55,50 50,55 45,50" fill="url(#pulse-core-grad)" class="pulse-center-diamond" />
        
        <defs>
            <linearGradient id="pulse-line-grad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stop-color="#8b5cf6" />
                <stop offset="50%" stop-color="#ec4899" />
                <stop offset="100%" stop-color="#06b6d4" />
            </linearGradient>
            <radialGradient id="pulse-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="100%" stop-color="#ec4899" />
            </radialGradient>
        </defs>
    </svg>`;

const PALETTE = [
    { type: 'solid', value: '#a78bfa' }, // Purple
    { type: 'solid', value: '#ec4899' }, // Pink
    { type: 'solid', value: '#06b6d4' }, // Cyan
    { type: 'solid', value: '#6366f1' }, // Indigo
    { type: 'solid', value: '#34d399' }, // Emerald
    { type: 'solid', value: '#facc15' }, // Yellow
    { type: 'solid', value: '#f97316' }, // Orange
    { type: 'gradient', stops: ['#8b5cf6', '#ec4899'] }, // Violet to Pink
    { type: 'gradient', stops: ['#06b6d4', '#6366f1'] }, // Cyan to Indigo
    { type: 'gradient', stops: ['#ec4899', '#f97316'] }, // Pink to Orange
    { type: 'gradient', stops: ['#3b82f6', '#8b5cf6'] }, // Blue to Purple
    { type: 'gradient', stops: ['#34d399', '#06b6d4'] }, // Green to Cyan
];

const SHAPE_TYPES = ['circle', 'pill', 'star', 'circle', 'pill'];

let animationFrameId = null;
let resizeListener = null;
let intervalId = null;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. Clean up previous loops if any
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
    }
    if (intervalId) {
        clearInterval(intervalId);
    }

    // 2. Inject icon
    iconSection.insertAdjacentHTML('beforeend', ICON_PULSE);

    // 3. Start 2D Canvas theme logic
    initCanvas();
}

function initCanvas() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let grid = null;
    let waves = [];
    let maskRects = [];
    let frameCount = 0;
    // gradient 缓存映射：key = 每个 shape 的唯一标识（由 color.stops 拼接）
    // value = CanvasGradient 对象
    const gradientCache = new Map();

    // Configurable animation variables
    const gap = 44;
    const speedIn = 0.55;
    const speedOut = 0.65;
    const restScale = 0.08;
    const minHoverScale = 0.8;
    const maxHoverScale = 2.5;
    const waveSpeed = 650; // pixels per second
    const waveWidth = 220;

    function rnd(min, max) { return Math.random() * (max - min) + min; }
    function rndInt(min, max) { return Math.floor(rnd(min, max + 1)); }
    function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

    function durationToFactor(seconds) {
        if (seconds <= 0) return 1;
        return 1 - Math.pow(0.05, 1 / (60 * seconds));
    }

    function drawCircle(ctx, size) {
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawPill(ctx, size) {
        const w = size * 0.48;
        const h = size;
        ctx.beginPath();
        ctx.roundRect(-w, -h, w * 2, h * 2, w);
        ctx.fill();
    }

    function drawStar(ctx, size, points, innerRatio) {
        ctx.beginPath();
        for (let i = 0; i < points * 2; i++) {
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const r = i % 2 === 0 ? size : size * innerRatio;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    function drawShape(ctx, shape) {
        switch (shape.type) {
            case 'circle': return drawCircle(ctx, shape.size / 1.5);
            case 'pill': return drawPill(ctx, shape.size / 1.4);
            case 'star': return drawStar(ctx, shape.size, shape.points, shape.innerRatio);
        }
    }

    function resolveFill(ctx, shape) {
        // 直接读取每个 shape 预缓存的填充色，避免每帧重新创建 CanvasGradient 对象
        return shape.cachedFill;
    }

    function randomStarProps() {
        return {
            points: rndInt(4, 8),
            innerRatio: rnd(0.18, 0.45),
        };
    }

    function buildGrid() {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const cols = Math.floor(W / gap);
        const rows = Math.floor(H / gap);
        const offsetX = (W - (cols - 1) * gap) / 2;
        const offsetY = (H - (rows - 1) * gap) / 2;
        const shapes = [];

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const type = pick(SHAPE_TYPES);
                const shape = {
                    x: offsetX + col * gap,
                    y: offsetY + row * gap,
                    type: type,
                    color: pick(PALETTE),
                    angle: rnd(0, Math.PI * 2),
                    size: gap * 0.38,
                    scale: restScale,
                    maxScale: rnd(minHoverScale, maxHoverScale),
                    cachedFill: null,  // 将在 rebuildFillCache() 中填充
                };
                if (type === 'star') Object.assign(shape, randomStarProps());
                shapes.push(shape);
            }
        }

        return { shapes, width: W, height: H };
    }

    // 重建 gradient 缓存：每次 resize 后调用一次，后续每帧直接读取 shape.cachedFill
    function rebuildFillCache() {
        if (!grid) return;
        // 清除旧缓存，释放上一个尺寸的 gradient 对象
        gradientCache.clear();

        const shapes = grid.shapes;
        for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            const colorDef = shape.color;
            if (colorDef.type === 'solid') {
                shape.cachedFill = colorDef.value;
            } else {
                // gradient 缓存以 stops 作为 key，相同配色的形状共享同一对象
                const key = colorDef.stops.join('|') + '|' + shape.size;
                if (!gradientCache.has(key)) {
                    // 以 shape.size 为半径基准创建一次，多个同配色共享它
                    // 注意：CanvasGradient 坐标系是 shape 的本地坐标系（ctx.save/translate/scale 后）
                    const size = shape.size;
                    const grad = ctx.createRadialGradient(0, -size * 0.3, 0, 0, size * 0.3, size * 1.5);
                    grad.addColorStop(0, colorDef.stops[0]);
                    grad.addColorStop(1, colorDef.stops[1]);
                    gradientCache.set(key, grad);
                }
                shape.cachedFill = gradientCache.get(key);
            }
        }
    }

    function init() {
        const W = window.innerWidth;
        const H = window.innerHeight;
        const dpr = window.devicePixelRatio || 1;

        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);

        grid = buildGrid();
        // resize 后重建 gradient 缓存（仅此一次创建，每帧不再重建）
        rebuildFillCache();
    }

    resizeListener = init;
    window.addEventListener('resize', init);
    init();

    function triggerWave(x, y) {
        x = x !== undefined ? x : window.innerWidth / 2;
        y = y !== undefined ? y : window.innerHeight / 2;
        waves.push({ x, y, startTime: performance.now() });
    }

    // Trigger initial wave immediately
    triggerWave();

    // Trigger wave periodically at the center
    intervalId = setInterval(() => {
        triggerWave(window.innerWidth / 2, window.innerHeight / 2);
    }, 3500);

    function tick() {
        // 停止执行：当前主题不再激活时，同时清理 interval，防止内存泄漏
        if (!document.body.classList.contains('theme-pulse')) {
            clearInterval(intervalId);
            intervalId = null;
            return;
        }

        const shapes = grid.shapes;
        const width = grid.width;
        const height = grid.height;
        const now = performance.now();

        ctx.clearRect(0, 0, width, height);

        frameCount++;
        // Query card rect every 10 frames to avoid high layout thrashing
        if (frameCount % 10 === 0 || maskRects.length === 0) {
            const card = document.querySelector('.glass-card');
            if (card) {
                maskRects = [card.getBoundingClientRect()];
            } else {
                maskRects = [];
            }
        }

        const maxDist = Math.sqrt(width * width + height * height);
        waves = waves.filter(w => {
            return (now - w.startTime) / 1000 * waveSpeed < maxDist + waveWidth;
        });

        for (let i = 0; i < shapes.length; i++) {
            const shape = shapes[i];
            const pad = gap / 2;

            // Mask shapes inside the glass card to make sure they do not overlap
            const masked = maskRects.some(r => {
                return shape.x >= r.left - pad && shape.x <= r.right + pad &&
                    shape.y >= r.top - pad && shape.y <= r.bottom + pad;
            });

            if (masked) {
                shape.scale += (0 - shape.scale) * durationToFactor(speedOut);
                if (shape.scale < 0.005) shape.scale = 0;
                continue;
            }

            let waveInfluence = 0;
            for (let j = 0; j < waves.length; j++) {
                const wave = waves[j];
                const waveRadius = (now - wave.startTime) / 1000 * waveSpeed;
                const wdx = shape.x - wave.x;
                const wdy = shape.y - wave.y;
                const wdist = Math.sqrt(wdx * wdx + wdy * wdy);
                const t = 1 - Math.abs(wdist - waveRadius) / waveWidth;
                if (t > 0) waveInfluence = Math.max(waveInfluence, Math.sin(Math.PI * t));
            }

            const target = restScale + waveInfluence * (shape.maxScale - restScale);
            const factor = target > shape.scale ? durationToFactor(speedIn) : durationToFactor(speedOut);
            shape.scale += (target - shape.scale) * factor;

            if (shape.scale < 0.01) continue;

            ctx.save();
            ctx.translate(shape.x, shape.y);
            ctx.rotate(shape.angle);
            ctx.scale(shape.scale, shape.scale);
            ctx.fillStyle = resolveFill(ctx, shape);
            drawShape(ctx, shape);
            ctx.restore();
        }

        animationFrameId = requestAnimationFrame(tick);
    }

    animationFrameId = requestAnimationFrame(tick);
}
