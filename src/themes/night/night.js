/**
 * 极夜幻境主题 (Night Mirage Theme)
 * Fragment Shader by Matthias Hurrle (@atzedent)
 */

const ICON_NIGHT = `
    <svg id="icon-night-eye" class="stretch-icon night-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="50" r="30" stroke="#818CF8" stroke-width="2" stroke-dasharray="4 4" class="night-ring" />
        <path d="M20 50 C 35 30, 65 30, 80 50 C 65 70, 35 70, 20 50 Z" stroke="#C084FC" stroke-width="2.5" fill="none" />
        <circle cx="50" cy="50" r="10" fill="url(#night-core-grad)" class="night-pupil" />
        <defs>
            <radialGradient id="night-core-grad" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stop-color="#C084FC" />
                <stop offset="100%" stop-color="#818CF8" />
            </radialGradient>
        </defs>
    </svg>`;

const vsSource = `#version 300 es
in vec2 position;
out vec2 texcoord;
void main() {
    gl_Position = vec4(position, 0.0, 1.0);
    texcoord = position;
}
`;

const fsSource = `#version 300 es
  /*********
   * made by Matthias Hurrle (@atzedent)
   */
  #ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
  #else
  precision mediump float;
  #endif

  out vec4 fragColor;
  in vec2 texcoord;

  uniform vec2 resolution;
  uniform float time;

  #define T (time)
  #define S smoothstep

  #define TAU 6.2831853072

  mat2 rot(float a) {
    float s=sin(a), c=cos(a);
    return mat2(c,-s,s,c);
  }

  vec3 palette(float k) {
    vec3
    a = vec3(.5,.5,.5),
      b = vec3(.5,.5,.5),
      c = vec3(1, 1, 1),
      d = vec3(.0,.1,.2);

    return a+b*cos(TAU*(c*k+d));
  }

  void main(void) {
    vec2 uv = texcoord * (resolution / max(resolution.x, resolution.y));
    vec3 col = vec3(0);
    vec2 p=uv;

    p = normalize(p)*log(length(p)*.05);
    p *= rot(log(length(uv))-T*.6);

    vec2 z = vec2(1, atan(p.y, p.x)/TAU*6.);
    z = mod(z, 2.)-1.;
    vec2 q = uv;
    for (float i= .0; i<4.; i++) {
      q=fract(q*2.)-.5;
      float d=exp(-.125/log(length(q)));
      d=sin(d*40.-T*1.4);
      d=pow(d, 8.);
      d=abs(d);
      col += max(.0, d);
    }

    col.xz *= rot(z.y+z.x);
    col.xy *= rot(T*.3+cos(z.x)+sin(z.y));
    col = mix(vec3(z.x,cos(z.x-z.y),z.y),vec3((col.r+col.g+col.b)/3.,z), z.y);
    col = exp(-col*1.2);
    col = sqrt(vec3(col.r*col.r+col.g*col.g+col.b*col.b))/3.;
    col *= palette(5.2+sqrt(col.r*col.r+col.g*col.g+col.b*col.b)/3.);

    // Calculate relative luminance of the pixel
    float luminance = dot(col, vec3(0.299, 0.587, 0.114));
    // Make the dark background transparent while keeping bright lines visible
    float alpha = smoothstep(0.15, 0.45, luminance) * 0.75;
    fragColor = vec4(col, alpha);
  }

`;

// 提升为模块级变量，确保 initTheme() 入口处可以访问并释放
let gl = null;
let program = null;
let buffer = null;
let animationFrameId = null;
let resizeListener = null;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 清理先前的渲染帧
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
    }
    // 2. 清理先前的 resize 事件监听
    if (resizeListener) {
        window.removeEventListener('resize', resizeListener);
        resizeListener = null;
    }
    // 3. 清理先前的 WebGL 资源（解决切换主题时的显存泄漏）
    if (gl && program) {
        gl.useProgram(null);
        gl.deleteProgram(program);
        gl.deleteBuffer(buffer);
        program = null;
        buffer = null;
        gl = null;
    }

    // 4. Inject center icon
    iconSection.insertAdjacentHTML('beforeend', ICON_NIGHT);

    // 5. Initialize WebGL2
    initWebGL();
}

function initWebGL() {
    const canvas = document.getElementById('glcanvas');
    if (!canvas) return;

    // Use WebGL2 context (since shader is #version 300 es)
    gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) {
        console.warn("WebGL2 not supported, shader compilation might fail.");
        return;
    }

    // 性能优化：使用 0.75x DPR 渲染，与其他 WebGL 主题保持一致，
    // 减少约 44% 的片段着色器计算量，在保持极夜旋转效果清晰度的同时显著降低 GPU 负载
    const dpr = 0.75;

    function createShader(glCtx, type, source) {
        const shader = glCtx.createShader(type);
        glCtx.shaderSource(shader, source);
        glCtx.compileShader(shader);
        if (!glCtx.getShaderParameter(shader, glCtx.COMPILE_STATUS)) {
            console.error('Shader compile failed: ' + glCtx.getShaderInfoLog(shader));
            glCtx.deleteShader(shader);
            return null;
        }
        return shader;
    }

    function createProgram(glCtx, vs, fs) {
        const vertexShader = createShader(glCtx, glCtx.VERTEX_SHADER, vs);
        const fragmentShader = createShader(glCtx, glCtx.FRAGMENT_SHADER, fs);
        if (!vertexShader || !fragmentShader) return null;
        const prog = glCtx.createProgram();
        glCtx.attachShader(prog, vertexShader);
        glCtx.attachShader(prog, fragmentShader);
        glCtx.linkProgram(prog);
        if (!glCtx.getProgramParameter(prog, glCtx.LINK_STATUS)) {
            console.error('Program link failed: ' + glCtx.getProgramInfoLog(prog));
            glCtx.deleteProgram(prog);
            return null;
        }
        // 链接完成后即可删除 shader 对象，释放其内存
        glCtx.detachShader(prog, vertexShader);
        glCtx.detachShader(prog, fragmentShader);
        glCtx.deleteShader(vertexShader);
        glCtx.deleteShader(fragmentShader);
        return prog;
    }

    program = createProgram(gl, vsSource, fsSource);
    if (!program) return;

    const positionLocation = gl.getAttribLocation(program, 'position');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');

    const vertices = new Float32Array([
        -1, -1,
         1, -1,
        -1,  1,
        -1,  1,
         1, -1,
         1,  1
    ]);
    buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // 初始化时绑定 program/buffer，渲染循环中不再重复调用
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

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
        // 生命周期管理：切换主题后释放所有 WebGL 资源，防止显存泄漏
        if (!document.body.classList.contains('theme-night')) {
            if (gl && program) {
                gl.useProgram(null);
                gl.deleteProgram(program);
                gl.deleteBuffer(buffer);
                program = null;
                buffer = null;
                gl = null;
            }
            return;
        }

        const delta = (performance.now() - startTime) / 1000;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.uniform1f(timeLocation, delta);
        gl.uniform2f(resolutionLocation, canvas.width, canvas.height);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
        animationFrameId = requestAnimationFrame(render);
    }
    animationFrameId = requestAnimationFrame(render);
}
