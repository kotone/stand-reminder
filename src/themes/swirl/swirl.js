/**
 * 时空漩涡主题 (Swirl Cosmic Theme)
 * WebGL2 着色器动画，已针对性能与工作区透明度进行大幅优化
 */

const ICON_SWIRL = `
    <svg id="icon-swirl" class="stretch-icon swirl-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <!-- Starry background dots inside the icon -->
        <circle cx="20" cy="30" r="1" fill="#fff" opacity="0.6" />
        <circle cx="80" cy="40" r="1.5" fill="#fff" opacity="0.8" />
        <circle cx="30" cy="75" r="1" fill="#fff" opacity="0.5" />
        <circle cx="75" cy="80" r="1" fill="#fff" opacity="0.7" />

        <!-- Spiral arms -->
        <path d="M 50 50 C 45 40, 30 35, 20 45 C 10 55, 15 70, 30 75" stroke="url(#swirl-arm-grad)" stroke-width="2.5" stroke-linecap="round" class="swirl-arm-1" />
        <path d="M 50 50 C 55 60, 70 65, 80 55 C 90 45, 85 30, 70 25" stroke="url(#swirl-arm-grad)" stroke-width="2.5" stroke-linecap="round" class="swirl-arm-2" />
        
        <!-- Central bright core -->
        <circle cx="50" cy="50" r="7" fill="url(#swirl-core-grad)" class="swirl-core" />
        <circle cx="50" cy="50" r="15" fill="rgba(6, 182, 212, 0.15)" filter="blur(4px)" class="swirl-glow" />

        <defs>
            <linearGradient id="swirl-arm-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#06b6d4" />
                <stop offset="50%" stop-color="#8b5cf6" />
                <stop offset="100%" stop-color="#ec4899" />
            </linearGradient>
            <radialGradient id="swirl-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#fff" />
                <stop offset="40%" stop-color="#06b6d4" />
                <stop offset="100%" stop-color="rgba(139, 92, 246, 0)" />
            </radialGradient>
        </defs>
    </svg>`;

const vertexShaderSource = `#version 300 es
precision highp float;
in vec4 position;
void main() {
    gl_Position = position;
}`;

const fragmentShaderSource = `#version 300 es
/*********
* Original made by Matthias Hurrle (@atzedent)
* Optimized for Stand Reminder (reduced iterations & transparent workspace integration)
*/
precision highp float;
out vec4 O;
uniform float time;
uniform vec2 resolution;
uniform vec2 move;
#define FC gl_FragCoord.xy
#define R resolution
#define T time
#define N normalize
#define S smoothstep
#define MN min(R.x,R.y)
#define rot(a) mat2(cos((a)-vec4(0,11,33,0)))
#define csqr(a) vec2(a.x*a.x-a.y*a.y,2.*a.x*a.y)

float rnd(vec3 p) {
    p=fract(p*vec3(12.9898,78.233,156.34));
    p+=dot(p,p+34.56);
    return fract(p.x*p.y*p.z);
}

float swirls(in vec3 p) {
    float d=.0;
    vec3 c=p;
    // PERFORMANCE OPTIMIZATION: Loop iterations reduced from 9.0 to 6.0
    for(float i=min(.0,time); i<6.; i++) {
        p=.7*abs(p)/dot(p,p)-.7;
        p.yz=csqr(p.yz);
        p=p.zxy;
        d+=exp(-19.*abs(dot(p,c)));
    }
    return d;
}

vec3 march(in vec3 p, vec3 rd) {
    float d=.2, t=.0, c=.0, k=mix(.9,1.,rnd(rd)),
    maxd=length(p)-1.;
    vec3 col=vec3(0);
    // PERFORMANCE OPTIMIZATION: Loop iterations reduced from 120.0 to 60.0
    for(float i=min(.0,time); i<60.; i++) {
        t+=d*exp(-2.*c)*k;
        c=swirls(p+rd*t);
        if (t<5e-2 || t>maxd) break;
        col+=vec3(c*c,c/1.05,c)*8e-3;
    }
    return col;
}

float rnd(vec2 p) {
    p=fract(p*vec2(12.9898,78.233));
    p+=dot(p,p+34.56);
    return fract(p.x*p.y);
}

vec3 sky(vec2 p, bool anim) {
    p.x-=.17-(anim?2e-4*T:.0);
    p*=500.;
    vec2 id=floor(p), gv=fract(p)-.5;
    float n=rnd(id), d=length(gv);
    if (n<.975) return vec3(0);
    return vec3(S(3e-2*n,1e-3*n,d*d));
}

void cam(inout vec3 p) {
    p.yz*=rot(move.y*6.3/MN-T*.05);
    p.xz*=rot(-move.x*6.3/MN+T*.025);
}

void main() {
    vec2 uv=(FC-.5*R)/MN;
    vec3 col=vec3(0),
    p=vec3(0,0,-16),
    rd=N(vec3(uv,1)), rdd=rd;
    cam(p); cam(rd);
    col=march(p,rd);
    col=S(-.2,.9,col);
    vec2 sn=.5+vec2(atan(rdd.x,rdd.z),atan(length(rdd.xz),rdd.y))/6.28318;
    col=max(col,vec3(sky(sn,true)+sky(2.+sn*2.,true)));
    float t=min((time-.5)*.3,1.);
    uv=FC/R*2.-1.;
    uv*=.7;
    float v=pow(dot(uv,uv),1.8);
    col=mix(col,vec3(0),v);
    col=mix(vec3(0),col,t);
    
    // WORKSPACE TRANSPARENCY OPTIMIZATION:
    // Determine relative luminance to map alpha. Omit default max(col, 0.08) fill.
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));
    float alpha = smoothstep(0.01, 0.25, luminance) * 0.85;
    O = vec4(col, alpha);
}`;

let gl = null;
let program = null;
let buffer = null;
let animationFrameId = null;
let resizeListener = null;
let startTime = 0;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. Cleanup previous tasks
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

    // 2. Inject Swirl Galaxy SVG Icon
    iconSection.insertAdjacentHTML('beforeend', ICON_SWIRL);

    // 3. Initialize WebGL2
    initWebGL();
}

function initWebGL() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    // Use alpha context for transparency
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.error('WebGL2 is not supported in this browser.');
        return;
    }

    // PERFORMANCE OPTIMIZATION: Downsample DPR to 0.7 to save 50%+ rendering pixels
    const dpr = 0.7;

    // Compile shader helper
    function compileShader(source, type) {
        const shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    const vs = compileShader(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compileShader(fragmentShaderSource, gl.FRAGMENT_SHADER);
    if (!vs || !fs) return;

    program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        return;
    }

    // Free shaders
    gl.detachShader(program, vs);
    gl.detachShader(program, fs);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    // Setup full-screen quad vertices
    const vertices = new Float32Array([
        -1.0,  1.0,
        -1.0, -1.0,
         1.0,  1.0,
         1.0, -1.0
    ]);

    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    // Cache uniform locations
    const uResolution = gl.getUniformLocation(program, 'resolution');
    const uTime = gl.getUniformLocation(program, 'time');
    const uMove = gl.getUniformLocation(program, 'move');

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

    startTime = performance.now();

    function render(now) {
        // Stop animating if the theme has changed
        if (!document.body.classList.contains('theme-swirl')) {
            gl.useProgram(null);
            gl.deleteProgram(program);
            gl.deleteBuffer(buffer);
            gl = null;
            program = null;
            return;
        }

        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(program);
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

        gl.uniform2f(uResolution, canvas.width, canvas.height);
        gl.uniform1f(uTime, (now - startTime) * 0.001);
        gl.uniform2f(uMove, 0.0, 0.0); // Keep camera auto-rotating without mouse movement

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        animationFrameId = requestAnimationFrame(render);
    }

    animationFrameId = requestAnimationFrame(render);
}
