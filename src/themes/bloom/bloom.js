/**
 * 绚丽绽放主题 (Bloom Flowing Theme)
 * WebGL 繁花片段着色器，已针对性能、透明度（不遮挡工作）和内存清理进行深度优化
 */

const ICON_BLOOM = `
    <svg id="icon-bloom" class="stretch-icon bloom-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="38" stroke="rgba(236, 72, 153, 0.15)" stroke-width="2" />
        <circle cx="50" cy="50" r="30" stroke="rgba(244, 63, 94, 0.2)" stroke-width="1.5" stroke-dasharray="4 4" />
        
        <g class="bloom-petals-outer">
            <!-- 4 outer petals -->
            <path d="M 50 15 C 38 35 38 35 50 50 C 62 35 62 35 50 15 Z" fill="url(#petal-grad-1)" />
            <path d="M 50 85 C 38 65 38 65 50 50 C 62 65 62 65 50 85 Z" fill="url(#petal-grad-1)" />
            <path d="M 15 50 C 35 38 35 38 50 50 C 35 62 35 62 15 50 Z" fill="url(#petal-grad-1)" />
            <path d="M 85 50 C 65 38 65 38 50 50 C 65 62 65 62 85 50 Z" fill="url(#petal-grad-1)" />
        </g>
        
        <g class="bloom-petals-inner">
            <!-- 4 inner diagonal petals, rotated 45 degrees -->
            <path d="M 50 25 C 42 38 42 38 50 50 C 58 38 58 38 50 25 Z" fill="url(#petal-grad-2)" transform="rotate(45 50 50)" />
            <path d="M 50 75 C 42 62 42 62 50 50 C 58 62 58 62 50 75 Z" fill="url(#petal-grad-2)" transform="rotate(45 50 50)" />
            <path d="M 25 50 C 38 42 38 42 50 50 C 38 58 38 58 25 50 Z" fill="url(#petal-grad-2)" transform="rotate(45 50 50)" />
            <path d="M 75 50 C 62 42 62 42 50 50 C 62 58 62 58 75 50 Z" fill="url(#petal-grad-2)" transform="rotate(45 50 50)" />
        </g>
        
        <circle cx="50" cy="50" r="10" fill="url(#bloom-core-grad)" class="bloom-core" />
        
        <defs>
            <linearGradient id="petal-grad-1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FF2E93" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#FF8A00" stop-opacity="0.3" />
            </linearGradient>
            <linearGradient id="petal-grad-2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#FF8A00" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#FF2E93" stop-opacity="0.4" />
            </linearGradient>
            <radialGradient id="bloom-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#FFFFFF" />
                <stop offset="40%" stop-color="#FF8A00" />
                <stop offset="100%" stop-color="rgba(255, 46, 147, 0)" />
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

    // 2. 注入呼吸花朵图标
    iconSection.insertAdjacentHTML('beforeend', ICON_BLOOM);

    // 3. 生成浮动花瓣粒子
    const particleCount = 16;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle-petal');
        const size = Math.random() * 8 + 5; // 5px - 13px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const colors = [
            'linear-gradient(135deg, rgba(255, 46, 147, 0.75), rgba(255, 138, 0, 0.45))',
            'linear-gradient(135deg, rgba(236, 72, 153, 0.75), rgba(244, 63, 94, 0.45))',
            'linear-gradient(135deg, rgba(251, 146, 60, 0.7), rgba(236, 72, 153, 0.45))'
        ];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = chosenColor;
        particle.style.boxShadow = `0 0 6px rgba(255, 46, 147, 0.25)`;

        particle.style.animationDuration = `${Math.random() * 5 + 7}s`; // 7s - 12s
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 10}s`;
        
        const initialAngle = Math.random() * 40 + 25; // 25deg - 65deg
        particle.style.transform = `rotate(${initialAngle}deg)`;

        particlesContainer.appendChild(particle);
    }

    // 4. 初始化 WebGL 繁花着色器
    initBloomShader();
}

/* ============================================
   WebGL 繁花着色器
   ============================================ */
function initBloomShader() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn("WebGL not supported, falling back to CSS background.");
        return;
    }

    // 性能优化：降低渲染DPR，可缩减约50%的渲染像素计算，且半透明背景无需过高解析度
    const dpr = 0.75;

    const vsSource = `
        attribute vec2 a_position;
        varying vec2 texcoord;
        void main() {
            texcoord = a_position;
            gl_Position = vec4(a_position, 0.0, 1.0);
        }
    `;

    const fsSource = `
        #ifdef GL_FRAGMENT_PRECISION_HIGH
        precision highp float;
        #else
        precision mediump float;
        #endif

        varying vec2 texcoord;

        uniform vec2 resolution;
        uniform float time;

        #define T time
        #define S smoothstep

        #define PI 3.14159265359
        #define TAU 6.2831853072

        vec3 palette(float k) {
            vec3 a = vec3(.5);
            vec3 b = vec3(.5);
            vec3 c = vec3(1.0);
            vec3 d = vec3(.9,.416,.577);
            return a + b * cos(TAU * (c * k + d));
        }

        vec3 pattern(vec2 uv, float t) {
            float d = 1.0;
            vec3 col = vec3(0.0);

            // 循环3次计算繁花花瓣图案
            for (float i=0.0; i<3.0; i++) {
                float z = i == 0.0 ? t : 0.0;
                float r = length(uv);
                float l = log(r);
                float a = atan(uv.x, uv.y);

                bool cw = sign(t) > 0.0;

                vec2 p = vec2(
                    a - l + (cw ? z : 0.0),
                    a + l - (cw ? 0.0 : z)
                ) / PI;

                uv = fract(p * 2.0) - 0.5;
                d *= 1.0 - pow(r, 0.7);
                col += S(0.0, 1.0, d);

                float e = exp(-0.125 / distance(p / TAU, 0.85 / uv));
                e = log(1e-5 * e);
                e *= 1.125;
                e = pow(sin(e * 30.0) * 2.0, 2.0) * 0.125;
                e = abs(e);
                e = pow(5e-3 / e, 0.25);

                col -= 0.7 * e * palette(length(uv) + i * 0.025 + t * 0.25);
            }
            return col;
        }

        void main(void) {
            vec2 uv = texcoord * (resolution / max(resolution.x, resolution.y));
            vec3 col = pattern(uv * 0.5, T * 0.25);
            
            // 核心设计：为了不遮挡屏幕上的工作内容
            // 1. 让无色/黑色背景部分完全透明 (alpha 与亮度最大值成正比)
            // 2. 将亮部的最大不透明度控制在 0.26 左右。这使得背景非常通透，
            //    既能看到流动绽放的炫丽流光，又能让背后的编辑器代码清晰可见。
            float maxVal = max(col.r, max(col.g, col.b));
            float alpha = clamp(maxVal * 0.9, 0.0, 0.26);

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

    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]);
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
        if (!document.body.classList.contains('theme-bloom')) {
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
        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);
}
