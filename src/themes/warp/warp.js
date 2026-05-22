/**
 * 星空跃迁主题 (Warp Speed Theme)
 * WebGL 时空隧道片段着色器，已针对性能、透明度（不遮挡工作）和内存清理进行深度优化
 */

const ICON_WARP = `
    <svg id="icon-warp" class="stretch-icon warp-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="40" stroke="rgba(6, 182, 212, 0.2)" stroke-width="2" class="warp-ring-1" />
        <circle cx="50" cy="50" r="30" stroke="rgba(99, 102, 241, 0.35)" stroke-width="2" class="warp-ring-2" />
        <circle cx="50" cy="50" r="20" stroke="rgba(236, 72, 153, 0.45)" stroke-width="2" class="warp-ring-3" />
        
        <circle cx="50" cy="50" r="10" fill="url(#warp-core-grad)" class="warp-core" />
        
        <path d="M 50 15 L 50 25" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" class="warp-ray" />
        <path d="M 50 85 L 50 75" stroke="#22d3ee" stroke-width="2" stroke-linecap="round" class="warp-ray" />
        <path d="M 15 50 L 25 50" stroke="#ec4899" stroke-width="2" stroke-linecap="round" class="warp-ray" />
        <path d="M 85 50 L 75 50" stroke="#ec4899" stroke-width="2" stroke-linecap="round" class="warp-ray" />
        
        <defs>
            <radialGradient id="warp-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="60%" stop-color="#6366f1" />
                <stop offset="100%" stop-color="rgba(15, 23, 42, 0)" />
            </radialGradient>
        </defs>
    </svg>`;

let animationFrameId = null;
let resizeListener = null;
let gl = null;
let program = null;
let buffer = null;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 清理先前的 WebGL 渲染帧和事件监听
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
    }
    if (gl && program) {
        gl.useProgram(null);
        gl.deleteProgram(program);
        gl.deleteBuffer(buffer);
        gl = null;
        program = null;
    }

    // 2. 注入时空隧道图标
    iconSection.insertAdjacentHTML('beforeend', ICON_WARP);

    // 3. 生成时空跃迁粒子光带
    const particleCount = 12;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle-streak');
        
        const width = Math.random() * 1.5 + 0.8;
        const height = Math.random() * 80 + 50; // 50px - 130px
        particle.style.width = `${width}px`;
        particle.style.height = `${height}px`;

        particle.style.left = `${Math.random() * 110 - 10}vw`;
        particle.style.animationDuration = `${Math.random() * 2 + 2.5}s`; // 2.5s - 4.5s
        particle.style.animationDelay = `-${Math.random() * 5}s`;
        
        const initialAngle = 45 + (Math.random() * 8 - 4);
        particle.style.transform = `rotate(${initialAngle}deg)`;

        particlesContainer.appendChild(particle);
    }

    // 4. 初始化 WebGL 时空隧道着色器
    initWarpShader();
}

/* ============================================
   WebGL 时空隧道着色器
   ============================================ */
function initWarpShader() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn("WebGL not supported, falling back to CSS background.");
        return;
    }

    // 性能优化：使用 0.75x DPR 渲染，对于流动星空粒子背景，此举可极大地减少着色器计算量
    const dpr = 0.75;

    const vsSource = `
        attribute vec2 a_position;
        void main() {
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        uniform float time;
        uniform vec2 resolution;

        #define T time
        #define hue(a) (0.6 + 0.6 * cos(6.3 * (a) + vec3(0.0, 83.0, 21.0)))

        float rnd(float a) {
            vec2 p = fract(a * vec2(12.9898, 78.233));
            p += dot(p, p * 345.0);
            return fract(p.x * p.y);
        }

        vec3 pattern(vec2 uv) {
            vec3 col = vec3(0.0);
            for (float i=0.0; i<20.0; i++) {
                float a = rnd(i);
                vec2 n = vec2(a, fract(a * 34.56));
                vec2 p = sin(n * (T + 7.0) + T * 0.5);
                float d = dot(uv - p, uv - p);
                col += 0.00125 / d * hue(dot(uv, uv) + i * 0.125 + T);
            }
            return col;
        }

        void main(void) {
            vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / min(resolution.x, resolution.y);
            vec3 col = vec3(0.0);
            float s = 2.4;
            float a = atan(uv.x, uv.y);
            float b = length(uv);
            
            // 安全限制避免中心点除零计算
            b = max(b, 0.001);
            uv = vec2(a * 5.0 / 6.28318, 0.05 / tan(b) + T);
            uv = fract(uv) - 0.5;
            col += pattern(uv * s);

            // 核心设计：为了不遮挡屏幕上的工作内容
            // 1. 让无色/黑色背景部分完全透明 (alpha 与亮度最大值成比例)
            // 2. 将跃迁粒子的最大不透明度控制在 0.28 左右。这使得背景非常通透，
            //    用户在工作时，背后的编辑器文字依然能被一览无余地清晰阅读。
            float maxVal = max(col.r, max(col.g, col.b));
            float alpha = clamp(maxVal * 0.9, 0.0, 0.28);

            gl_FragColor = vec4(col, alpha);
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
        const prog = gl.createProgram();
        gl.attachShader(prog, vertexShader);
        gl.attachShader(prog, fragmentShader);
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
            console.error('Program link failed: ' + gl.getProgramInfoLog(prog));
            gl.deleteProgram(prog);
            return null;
        }
        return prog;
    }

    program = createProgram(gl, vsSource, fsSource);
    if (!program) return;
    gl.useProgram(program);

    const positionLocation = gl.getAttribLocation(program, 'a_position');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    // 使用顶点条带绘制
    const vertices = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    function resize() {
        const W = window.innerWidth;
        const H = window.innerHeight;
        canvas.width = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        gl.viewport(0, 0, canvas.width, canvas.height);
    }
    resizeListener = resize;
    window.addEventListener('resize', resize);
    resize();

    let startTime = performance.now();
    function render() {
        // 生命周期管理：当切换主题后，退出渲染循环并彻底释放资源，防止内存与显存泄漏
        if (!document.body.classList.contains('theme-warp')) {
            if (gl && program) {
                gl.useProgram(null);
                gl.deleteProgram(program);
                gl.deleteBuffer(buffer);
                gl = null;
                program = null;
            }
            return;
        }

        const delta = (performance.now() - startTime) / 1000;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.uniform1f(timeLocation, delta);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);
}
