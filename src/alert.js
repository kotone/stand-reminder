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

    setTimeout(() => {
        document.body.classList.add('intensified');
        borderElem.classList.add('intensified');
    }, 10000);
});
