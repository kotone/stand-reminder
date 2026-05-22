/**
 * 水晶幻境主题 (Crystal Kaleidoscope Theme)
 * WebGL 几何万花筒片段着色器，已针对性能、透明度（不遮挡工作）和内存清理进行深度优化
 */

const ICON_CRYSTAL = `
    <svg id="icon-crystal" class="stretch-icon crystal-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="38" stroke="rgba(168, 85, 247, 0.15)" stroke-width="1.5" />
        <circle cx="50" cy="50" r="32" stroke="rgba(236, 72, 153, 0.2)" stroke-width="1.5" stroke-dasharray="3 3" />
        
        <g class="crystal-body-group">
            <!-- Faceted crystal faces -->
            <polygon points="50,15 75,35 50,50" fill="url(#facet-grad-1)" />
            <polygon points="50,15 25,35 50,50" fill="url(#facet-grad-2)" />
            <polygon points="75,35 75,65 50,50" fill="url(#facet-grad-3)" />
            <polygon points="75,65 50,85 50,50" fill="url(#facet-grad-1)" />
            <polygon points="50,85 25,65 50,50" fill="url(#facet-grad-2)" />
            <polygon points="25,65 25,35 50,50" fill="url(#facet-grad-3)" />
        </g>
        
        <polygon points="50,22 70,38 70,62 50,78 30,62 30,38" stroke="rgba(255, 255, 255, 0.6)" stroke-width="1.5" class="crystal-inner-line" />
        <circle cx="50" cy="50" r="4" fill="#ffffff" class="crystal-center" />
        
        <defs>
            <linearGradient id="facet-grad-1" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#C084FC" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#8B5CF6" stop-opacity="0.3" />
            </linearGradient>
            <linearGradient id="facet-grad-2" x1="1" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#EC4899" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#C084FC" stop-opacity="0.3" />
            </linearGradient>
            <linearGradient id="facet-grad-3" x1="0" y1="1" x2="1" y2="0">
                <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.85" />
                <stop offset="100%" stop-color="#EC4899" stop-opacity="0.3" />
            </linearGradient>
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

    // 2. 注入水晶卡片图标
    iconSection.insertAdjacentHTML('beforeend', ICON_CRYSTAL);

    // 3. 生成折射水晶粒子
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle-diamond');
        
        const size = Math.random() * 6 + 4; // 4px - 10px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;

        const colors = [
            'linear-gradient(135deg, rgba(192, 132, 252, 0.75), rgba(236, 72, 153, 0.45))',
            'linear-gradient(135deg, rgba(139, 92, 246, 0.75), rgba(192, 132, 252, 0.45))',
            'linear-gradient(135deg, rgba(236, 72, 153, 0.7), rgba(139, 92, 246, 0.45))'
        ];
        const chosenColor = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = chosenColor;
        particle.style.boxShadow = `0 0 6px rgba(192, 132, 252, 0.2)`;

        particle.style.animationDuration = `${Math.random() * 4 + 6}s`; // 6s - 10s
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 8}s`;
        
        particlesContainer.appendChild(particle);
    }

    // 4. 初始化 WebGL 水晶万花筒着色器
    initCrystalShader();
}

/* ============================================
   WebGL 水晶着色器
   ============================================ */
function initCrystalShader() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn("WebGL not supported, falling back to CSS background.");
        return;
    }

    // 性能优化：使用 0.75x DPR 渲染，降低渲染所需的像素计算，保持桌面应用丝滑度
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

        #define S smoothstep
        #define T (0.112358 + time)
        #define TAU 6.2831853

        vec3 palette(float k) {
            vec3 a = vec3(0.5);
            vec3 b = a;
            vec3 c = a + a;
            vec3 d = vec3(0.3, 0.2, 0.2);
            return a + b * cos(TAU * (c * k + d));
        }

        // WebGL 1 不支持内建 round() 函数，此处进行手动实现
        vec2 myRound(vec2 x) {
            return floor(x + 0.5);
        }

        void main(void) {
            float mx = max(resolution.x, resolution.y);
            float mn = min(resolution.x, resolution.y);
            float pr = mx / mn;
            
            // 使用 gl_FragCoord 计算坐标
            vec2 uv = (gl_FragCoord.xy - 0.5 * resolution) / mn;
            vec2 p = uv * 4.5 / pr;

            vec3 col = vec3(0.0);
            const float n = 3.5;

            for (float i = 0.0; i < 6.0; i++) {
                p *= 2.0;
                p = p - n * clamp(myRound(p / n), -1.0, 1.0);
                float d = exp(-length(p * 0.2));

                d = log(1e-5 * d);
                d = pow(sin(d * 20.0 + T * 1.4), 2.0) * 0.125;
                d = abs(d);
                d = pow(5e-3 / d, 0.25);

                col += d * palette(-length(uv) + i * 0.1 - T * 0.7);
                col = pow(col, vec3(1.28));
            }

            col *= exp(-125e-5 * (length(uv)));
            col = pow(S(0.0, 20.0, col), vec3(0.4545));

            // 核心设计：为了不遮挡屏幕上的工作内容
            // 1. 让无色/黑色背景部分完全透明 (alpha 与亮度最大值成正比)
            // 2. 将发光晶格的最大不透明度控制在 0.25 左右。这使得背景非常通透，
            //    工作时，背后的编辑器文字依然能被一览无余地清晰阅读。
            float maxVal = max(col.r, max(col.g, col.b));
            float alpha = clamp(maxVal * 0.85, 0.0, 0.25);

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

    // 经典三角形网格顶点
    const vertices = new Float32Array([
        -1.0, -1.0,
         1.0, -1.0,
        -1.0,  1.0,
        -1.0,  1.0,
         1.0, -1.0,
         1.0,  1.0
    ]);
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
        // 生命周期管理：当切换主题后，退出循环并销毁 WebGL，防止内存与显存泄漏
        if (!document.body.classList.contains('theme-crystal')) {
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
