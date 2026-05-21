document.addEventListener('DOMContentLoaded', () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');
    const particlesContainer = document.getElementById('particlesContainer');
    const footerText = document.getElementById('footerText');
    const guideStep = document.getElementById('guideStep');
    const guideText = document.getElementById('guideText');

    // 1. Get saved background style (default to 'aura')
    const bgStyle = localStorage.getItem('bgStyle') || 'aura';
    document.body.className = 'theme-' + bgStyle;

    // 2. Select appropriate exercise/animation based on theme
    const auraExercises = [
        {
            iconId: 'icon-neck',
            title: '颈部舒缓放松',
            desc: '双肩下沉，将头部缓缓向左侧倾斜，感受右侧拉伸，保持3秒。然后换右侧重复。'
        },
        {
            iconId: 'icon-shoulder',
            title: '双肩绕圈放松',
            desc: '双臂自然下垂。双肩由前向上、向后画圈绕行，重复5次，随后反方向画圈5次。'
        },
        {
            iconId: 'icon-stretch',
            title: '双手向上拉伸',
            desc: '十指交叉，掌心向上翻转。吸气时手臂努力向上推，挺拔脊柱，呼气还原，重复3次。'
        }
    ];

    let chosenIconId = '';
    
    if (bgStyle === 'zen') {
        chosenIconId = 'icon-zen-breathe';
        guideStep.textContent = '呼吸冥想静心';
        guideText.textContent = '跟随屏幕中央的禅意呼吸光环：吸气4秒（光环胀大），呼气4秒（光环缩小）。放松大脑。';
        initBlackHole();
    } else if (bgStyle === 'cyber') {
        chosenIconId = 'icon-cyber-stretch';
        guideStep.textContent = '赛博关节激活';
        guideText.textContent = '跟着赛博小人动画：双手往后拉伸，挤压肩胛骨，挺胸抬头，激活背部和肩关节，重复5次。';
    } else if (bgStyle === 'forest') {
        chosenIconId = 'icon-forest-sprout';
        guideStep.textContent = '眺望远方与全身舒展';
        guideText.textContent = '站直身体，闭目深呼吸。然后睁开眼，将视线投向窗外的远方或绿色植物，感受植物摇曳，放松双眼。';
    } else {
        // Default: aura
        const randomIdx = Math.floor(Math.random() * auraExercises.length);
        const chosenExercise = auraExercises[randomIdx];
        chosenIconId = chosenExercise.iconId;
        guideStep.textContent = chosenExercise.title;
        guideText.textContent = chosenExercise.desc;
    }

    // Show the chosen icon
    document.querySelectorAll('.stretch-icon').forEach(icon => {
        if (icon.id === chosenIconId) {
            icon.classList.remove('hidden');
        } else {
            icon.classList.add('hidden');
        }
    });

    // Show saved working duration if available
    const savedInterval = localStorage.getItem('interval') || 45;
    if (footerText) {
        footerText.textContent = `已连续工作 ${savedInterval} 分钟，该起立伸展啦`;
    }

    // 3. Generate soft background floating particles based on theme
    const particleCount = 20; // Slightly increased for richer aesthetics
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        
        if (bgStyle === 'zen') {
            particle.classList.add('particle-star');
            const size = Math.random() * 3.5 + 1.2; // 1.2px to 4.7px
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            
            // Randomize star colors: white, soft purple, soft cyan
            const colors = ['#ffffff', '#c084fc', '#38bdf8'];
            const chosenColor = colors[Math.floor(Math.random() * colors.length)];
            particle.style.background = chosenColor;
            particle.style.boxShadow = `0 0 8px ${chosenColor}, 0 0 12px rgba(255, 255, 255, 0.3)`;
            
            particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
        } else if (bgStyle === 'cyber') {
            if (Math.random() > 0.4) {
                // Spawn Cyber block
                particle.classList.add('particle-cube');
                const size = Math.random() * 6 + 4; // 4px to 10px
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                const isCyan = Math.random() > 0.5;
                particle.style.background = isCyan ? 'rgba(6, 182, 212, 0.75)' : 'rgba(236, 72, 153, 0.75)';
                particle.style.boxShadow = isCyan ? '0 0 8px rgba(6, 182, 212, 0.5)' : '0 0 8px rgba(236, 72, 153, 0.5)';
                particle.style.animationDuration = `${Math.random() * 3 + 4}s`;
            } else {
                // Spawn Binary digit (0 or 1)
                particle.classList.add('particle-binary');
                particle.textContent = Math.random() > 0.5 ? '1' : '0';
                const fontSize = Math.random() * 5 + 9; // 9px to 14px
                particle.style.fontSize = `${fontSize}px`;
                const isCyan = Math.random() > 0.5;
                particle.style.color = isCyan ? 'rgba(6, 182, 212, 0.8)' : 'rgba(236, 72, 153, 0.8)';
                particle.style.textShadow = isCyan ? '0 0 5px rgba(6, 182, 212, 0.6)' : '0 0 5px rgba(236, 72, 153, 0.6)';
                particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
            }
        } else if (bgStyle === 'forest') {
            if (Math.random() > 0.5) {
                // Spawn Leaf
                particle.classList.add('particle-leaf');
                const size = Math.random() * 10 + 6; // 6px to 16px
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.background = Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.55)' : 'rgba(16, 185, 129, 0.5)';
                particle.style.transform = `rotate(${Math.random() * 360}deg)`;
                particle.style.animationDuration = `${Math.random() * 5 + 6}s`;
            } else {
                // Spawn Shimmering Dewdrop
                particle.classList.add('particle-dewdrop');
                const size = Math.random() * 3 + 2; // 2px to 5px
                particle.style.width = `${size}px`;
                particle.style.height = `${size}px`;
                particle.style.background = 'rgba(255, 255, 255, 0.8)';
                particle.style.boxShadow = '0 0 6px rgba(52, 211, 153, 0.8), 0 0 10px rgba(255, 255, 255, 0.6)';
                particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
            }
        } else {
            // Default: aura
            particle.classList.add('particle-aura');
            const size = Math.random() * 6 + 3;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            const colors = ['rgba(236, 72, 153, 0.45)', 'rgba(139, 92, 246, 0.45)', 'rgba(6, 182, 212, 0.45)'];
            particle.style.background = colors[Math.floor(Math.random() * colors.length)];
            particle.style.boxShadow = `0 0 8px ${particle.style.background}`;
            particle.style.animationDuration = `${Math.random() * 6 + 8}s`;
        }
        
        particle.style.left = `${Math.random() * 100}vw`;
        
        const delay = Math.random() * 8;
        particle.style.animationDelay = `-${delay}s`;
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        
        particlesContainer.appendChild(particle);
    }

    // 4. Smooth multi-stage transitions
    setTimeout(() => {
        borderElem.classList.add('active');
    }, 50);

    setTimeout(() => {
        centerElem.classList.add('show');
    }, 1000);

    // Show window only when fully styled and ready to avoid flash/snapping
    setTimeout(() => {
        if (window.__TAURI__) {
            window.__TAURI__.window.appWindow.show();
        }
    }, 150);

    function initBlackHole() {
        const canvas = document.getElementById('glcanvas');
        if (!canvas) return;

        const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false });
        if (!gl) {
            console.warn("WebGL not supported, falling back to static/CSS background.");
            return;
        }

        // Vertex shader: simple pass-through of positions.
        const vsSource = `
            attribute vec2 a_position;
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
            }
        `;

        // Fragment shader: computes a background image layer and an animated layer,
        // then blends them (animation on top at 50% opacity), with brightness boosting.
        // We calculate alpha based on color brightness to support Tauri window transparency.
        const fsSource = `
            precision mediump float;
            uniform float t;
            uniform vec2 r;  // resolution

            // Custom tanh function for vec2 since built-in tanh is unavailable in WebGL GLSL.
            vec2 myTanh(vec2 x) {
                vec2 ex = exp(x);
                vec2 emx = exp(-x);
                return (ex - emx) / (ex + emx);
            }

            void main() {
                vec4 o_bg = vec4(0.0);
                vec4 o_anim = vec4(0.0);

                // ---------------------------
                // Background (Image) Layer
                // ---------------------------
                {
                    // Use gl_FragCoord.xy (pixel coordinates).
                    vec2 p_img = (gl_FragCoord.xy * 2.0 - r) / r.y * mat2(1.0, -1.0, 1.0, 1.0);
                    vec2 l_val = myTanh(p_img * 5.0 + 2.0);
                    l_val = min(l_val, l_val * 3.0);
                    vec2 clamped = clamp(l_val, -2.0, 0.0);
                    float diff_y = clamped.y - l_val.y;
                    // Avoid division by zero with a small epsilon:
                    float safe_px = abs(p_img.x) < 0.001 ? 0.001 : p_img.x;
                    float term = (0.1 - max(0.01 - dot(p_img, p_img) / 200.0, 0.0) * (diff_y / safe_px)) / abs(length(p_img) - 0.7);

                    o_bg += vec4(term);

                    // Ensure non-negative values:
                    o_bg *= max(o_bg, vec4(0.0));
                }

                // ---------------------------
                // Foreground (Animation) Layer
                // ---------------------------
                {
                    vec2 p_anim = (gl_FragCoord.xy * 2.0 - r) / r.y / 0.7;
                    vec2 d = vec2(-1.0, 1.0);
                    float denom = 0.1 + 5.0 / dot(5.0 * p_anim - d, 5.0 * p_anim - d);
                    vec2 c = p_anim * mat2(1.0, 1.0, d.x / denom, d.y / denom);
                    vec2 v = c;
                    // Apply a time-varying transformation:
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

                // ---------------------------
                // Blend Layers: animation at 50% opacity over image.
                // Boost brightness.
                // ---------------------------
                vec4 finalColor = mix(o_bg, o_anim, 0.5) * 1.5;
                finalColor = clamp(finalColor, 0.0, 1.0);
                
                // Calculate transparency based on color brightness (max color component)
                float alpha = max(finalColor.r, max(finalColor.g, finalColor.b));
                
                // Set final color with custom alpha (capped at 0.85 for a softer look)
                gl_FragColor = vec4(finalColor.rgb, clamp(alpha, 0.0, 0.85));
            }
        `;

        // Shader compilation utility.
        function createShader(gl, type, source) {
            const shader = gl.createShader(type);
            gl.shaderSource(shader, source);
            gl.compileShader(shader);
            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
                console.error('Shader compile failed with: ' + gl.getShaderInfoLog(shader));
                gl.deleteShader(shader);
                return null;
            }
            return shader;
        }

        // Program creation utility.
        function createProgram(gl, vsSource, fsSource) {
            const vertexShader = createShader(gl, gl.VERTEX_SHADER, vsSource);
            const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fsSource);
            if (!vertexShader || !fragmentShader) return null;
            
            const program = gl.createProgram();
            gl.attachShader(program, vertexShader);
            gl.attachShader(program, fragmentShader);
            gl.linkProgram(program);
            if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
                console.error('Program failed to link: ' + gl.getProgramInfoLog(program));
                gl.deleteProgram(program);
                return null;
            }
            return program;
        }

        const program = createProgram(gl, vsSource, fsSource);
        if (!program) return;
        gl.useProgram(program);

        // Get attribute and uniform locations.
        const positionLocation = gl.getAttribLocation(program, 'a_position');
        const timeLocation = gl.getUniformLocation(program, 't');
        const resolutionLocation = gl.getUniformLocation(program, 'r');

        // Set up a full-screen quad.
        const vertices = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
            -1,  1,
             1, -1,
             1,  1,
        ]);
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // Resize canvas.
        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        }

        window.addEventListener('resize', resize);
        resize();

        let startTime = performance.now();
        let animationFrameId;

        // Render loop.
        function render() {
            let currentTime = performance.now();
            let delta = (currentTime - startTime) / 1000;
            
            gl.clearColor(0.0, 0.0, 0.0, 0.0);
            gl.clear(gl.COLOR_BUFFER_BIT);
            
            gl.uniform1f(timeLocation, delta);
            gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
            gl.drawArrays(gl.TRIANGLES, 0, 6);
            
            animationFrameId = requestAnimationFrame(render);
        }
        animationFrameId = requestAnimationFrame(render);
    }
});
