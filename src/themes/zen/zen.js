/**
 * 星空冥想主题 (Zen Cosmic Theme)
 */

const ICON_ZEN = `
    <svg id="icon-zen-breathe" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="38" stroke="rgba(192, 132, 252, 0.2)" stroke-width="2" />
        <circle cx="50" cy="50" r="30" stroke="rgba(192, 132, 252, 0.4)" stroke-width="1.5" stroke-dasharray="3 3" />
        <circle cx="50" cy="50" r="20" fill="url(#zen-core-grad)" class="zen-breathe-core" />
        <circle cx="50" cy="50" r="20" stroke="rgba(139, 92, 246, 0.6)" stroke-width="2" class="zen-ripple-1" />
        <circle cx="50" cy="50" r="20" stroke="rgba(236, 72, 153, 0.4)" stroke-width="1.5" class="zen-ripple-2" />
        <defs>
            <radialGradient id="zen-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#EC4899" />
                <stop offset="50%" stop-color="#8B5CF6" />
                <stop offset="100%" stop-color="rgba(139, 92, 246, 0)" />
            </radialGradient>
        </defs>
    </svg>`;

const CELESTIAL_HTML = `
    <div class="zen-celestial-container">
        <div class="celestial-orbit orbit-1">
            <div class="orbiting-planet planet-sub-1"></div>
            <div class="orbiting-planet planet-sub-3"></div>
        </div>
        <div class="celestial-orbit orbit-2">
            <div class="orbiting-planet planet-sub-2"></div>
            <div class="orbiting-planet planet-sub-4"></div>
        </div>
        <div class="celestial-orbit orbit-3">
            <div class="orbiting-planet planet-sub-5"></div>
        </div>
        <div class="celestial-body main-planet planet-tr">
            <div class="planet-ring ring-pink"></div>
        </div>
        <div class="celestial-body main-planet planet-bl">
            <div class="planet-ring ring-cyan"></div>
        </div>
    </div>`;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 注入流星
    themeEffectsLayer.insertAdjacentHTML('beforeend', '<div class="zen-shooting-star"></div>');

    // 2. 注入天体轨道与星球
    themeEffectsLayer.insertAdjacentHTML('beforeend', CELESTIAL_HTML);

    // 3. 注入呼吸环图标
    iconSection.insertAdjacentHTML('beforeend', ICON_ZEN);

    // 4. 生成星空粒子
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle-star');
        const size = Math.random() * 3.5 + 1.2;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const colors = ['#ffffff', '#c084fc', '#38bdf8'];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = chosenColor;
        particle.style.boxShadow = `0 0 8px ${chosenColor}, 0 0 12px rgba(255, 255, 255, 0.3)`;

        particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 8}s`;
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        particlesContainer.appendChild(particle);
    }

    // 5. 初始化 WebGL 黑洞
    initBlackHole();
}

/* ============================================
   WebGL 黑洞着色器
   ============================================ */
function initBlackHole() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn("WebGL not supported, falling back to CSS background.");
        return;
    }

    const vsSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        precision mediump float;
        uniform float t;
        uniform vec2 r;

        vec2 myTanh(vec2 x) {
            vec2 ex = exp(x);
            vec2 emx = exp(-x);
            return (ex - emx) / (ex + emx);
        }

        void main() {
            vec4 o_bg = vec4(0.0);
            vec4 o_anim = vec4(0.0);

            {
                vec2 p_img = (gl_FragCoord.xy * 2.0 - r) / r.y * mat2(1.0, -1.0, 1.0, 1.0);
                vec2 l_val = myTanh(p_img * 5.0 + 2.0);
                l_val = min(l_val, l_val * 3.0);
                vec2 clamped = clamp(l_val, -2.0, 0.0);
                float diff_y = clamped.y - l_val.y;
                float safe_px = abs(p_img.x) < 0.001 ? 0.001 : p_img.x;
                float term = (0.1 - max(0.01 - dot(p_img, p_img) / 200.0, 0.0) * (diff_y / safe_px)) / abs(length(p_img) - 0.7);
                o_bg += vec4(term);
                o_bg *= max(o_bg, vec4(0.0));
            }

            {
                vec2 p_anim = (gl_FragCoord.xy * 2.0 - r) / r.y / 0.7;
                vec2 d = vec2(-1.0, 1.0);
                float denom = 0.1 + 5.0 / dot(5.0 * p_anim - d, 5.0 * p_anim - d);
                vec2 c = p_anim * mat2(1.0, 1.0, d.x / denom, d.y / denom);
                vec2 v = c;
                v *= mat2(cos(log(length(v)) + t * 0.2 + vec4(0.0, 33.0, 11.0, 0.0))) * 5.0;
                vec4 animAccum = vec4(0.0);
                for (int i = 1; i <= 9; i++) {
                    float fi = float(i);
                    animAccum += sin(vec4(v.x, v.y, v.y, v.x)) + vec4(1.0);
                    v += 0.7 * sin(vec2(v.y, v.x) * fi + t) / fi + 0.5;
                }
                vec4 animTerm = 1.0 - exp(-exp(c.x * vec4(0.6, -0.4, -1.0, 0.0))
                                / animAccum
                                / (0.1 + 0.1 * pow(length(sin(v / 0.3) * 0.2 + c * vec2(1.0, 2.0)) - 1.0, 2.0))
                                / (1.0 + 7.0 * exp(0.3 * c.y - dot(c, c)))
                                / (0.03 + abs(length(p_anim) - 0.7)) * 0.2);
                o_anim += animTerm;
            }

            vec4 finalColor = mix(o_bg, o_anim, 0.5) * 1.5;
            finalColor = clamp(finalColor, 0.0, 1.0);
            float alpha = max(finalColor.r, max(finalColor.g, finalColor.b));
            gl_FragColor = vec4(finalColor.rgb, clamp(alpha, 0.0, 0.85));
        }
    `;

    function createShader(gl, type, source) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compile failed: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(gl, vs, fs) {
        const vertexShader = createShader(gl, gl.VERTEX_SHADER, vs);
        const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fs);
        if (!vertexShader || !fragmentShader) return null;
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link failed: ' + gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
            return null;
        }
        return program;
    }

    const program = createProgram(gl, vsSource, fsSource);
    if (!program) return;
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 't');
    const resolutionLocation = gl.getUniformLocation(program, 'r');

    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    }
    window.addEventListener('resize', resize);
    resize();

    let startTime = performance.now();
    function render() {
        const delta = (performance.now() - startTime) / 1000;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform1f(timeLocation, delta);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        requestAnimationFrame(render);
    }
    requestAnimationFrame(render);
}
