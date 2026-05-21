/**
 * 极光流光主题 (Aurora Aura Theme)
 */

const ICON_NECK = `
    <svg id="icon-neck" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="32" r="10" stroke="white" stroke-width="4" class="neck-head" />
        <path d="M25 75 C 35 55, 65 55, 75 75" stroke="white" stroke-width="4" stroke-linecap="round" class="neck-body" />
        <path d="M30 25 Q 40 12 50 12 Q 60 12 70 25" stroke="rgba(255,255,255,0.6)" stroke-width="2" stroke-dasharray="4 4" stroke-linecap="round" />
        <path d="M27 21 L31 26 L25 26 Z" fill="rgba(255,255,255,0.8)" />
        <path d="M73 21 L69 26 L75 26 Z" fill="rgba(255,255,255,0.8)" />
    </svg>`;

const ICON_SHOULDER = `
    <svg id="icon-shoulder" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="25" r="9" stroke="white" stroke-width="4" class="shoulder-head" />
        <path d="M25 65 C 35 48, 65 48, 75 65" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M 22 58 A 8 8 0 1 1 22 58.1" stroke="rgba(255,255,255,0.9)" stroke-width="3.5" stroke-linecap="round" class="shoulder-spin-left" />
        <path d="M 78 58 A 8 8 0 1 1 78 58.1" stroke="rgba(255,255,255,0.9)" stroke-width="3.5" stroke-linecap="round" class="shoulder-spin-right" />
    </svg>`;

const ICON_STRETCH = `
    <svg id="icon-stretch" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="38" r="9" stroke="white" stroke-width="4" class="stretch-head" />
        <path d="M35 80 C 42 62, 58 62, 65 80" stroke="white" stroke-width="4" stroke-linecap="round" />
        <path d="M25 55 Q 35 45 42 22 Q 47 10 50 10 Q 53 10 58 22 Q 65 45 75 55" stroke="white" stroke-width="4" stroke-linecap="round" class="stretch-arms" />
        <path d="M50 3 L50 7" stroke="rgba(255,255,255,0.9)" stroke-width="2" stroke-linecap="round" class="sparkle-1" />
        <path d="M42 5 L45 8" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" class="sparkle-2" />
        <path d="M58 5 L55 8" stroke="rgba(255,255,255,0.7)" stroke-width="2" stroke-linecap="round" class="sparkle-3" />
    </svg>`;

const AURORA_WAVES = `
    <div class="aura-waves">
        <svg viewBox="0 0 1440 800" preserveAspectRatio="none">
            <defs>
                <linearGradient id="aurora-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="rgba(6, 182, 212, 0)" />
                    <stop offset="30%" stop-color="rgba(6, 182, 212, 0.45)" />
                    <stop offset="65%" stop-color="rgba(16, 185, 129, 0.45)" />
                    <stop offset="85%" stop-color="rgba(139, 92, 246, 0.35)" />
                    <stop offset="100%" stop-color="rgba(236, 72, 153, 0)" />
                </linearGradient>
                <linearGradient id="aurora-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stop-color="rgba(16, 185, 129, 0)" />
                    <stop offset="40%" stop-color="rgba(52, 211, 153, 0.4)" />
                    <stop offset="75%" stop-color="rgba(6, 182, 212, 0.4)" />
                    <stop offset="100%" stop-color="rgba(139, 92, 246, 0)" />
                </linearGradient>
                <linearGradient id="aurora-grad-3" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stop-color="rgba(139, 92, 246, 0)" />
                    <stop offset="35%" stop-color="rgba(217, 70, 239, 0.35)" />
                    <stop offset="70%" stop-color="rgba(244, 63, 94, 0.35)" />
                    <stop offset="100%" stop-color="rgba(251, 191, 36, 0)" />
                </linearGradient>
            </defs>
            <path d="M-100 250 C 350 50, 750 450, 1150 150 C 1350 50, 1550 200, 1600 250 L 1600 800 L -100 800 Z" fill="url(#aurora-grad-1)" class="aurora-wave-1" />
            <path d="M-100 350 C 450 550, 850 150, 1250 450 C 1450 550, 1550 350, 1600 300 L 1600 800 L -100 800 Z" fill="url(#aurora-grad-2)" class="aurora-wave-2" />
            <path d="M-100 150 C 250 350, 650 100, 1050 300 C 1250 400, 1450 150, 1600 200 L 1600 800 L -100 800 Z" fill="url(#aurora-grad-3)" class="aurora-wave-3" />
        </svg>
    </div>`;

const exercises = [
    { iconId: 'icon-neck', title: '颈部舒缓放松', desc: '双肩下沉，将头部缓缓向左侧倾斜，感受右侧拉伸，保持3秒。然后换右侧重复。' },
    { iconId: 'icon-shoulder', title: '双肩绕圈放松', desc: '双臂自然下垂。双肩由前向上、向后画圈绕行，重复5次，随后反方向画圈5次。' },
    { iconId: 'icon-stretch', title: '双手向上拉伸', desc: '十指交叉，掌心向上翻转。吸气时手臂努力向上推，挺拔脊柱，呼气还原，重复3次。' },
];

const iconMap = {
    'icon-neck': ICON_NECK,
    'icon-shoulder': ICON_SHOULDER,
    'icon-stretch': ICON_STRETCH,
};

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 注入极光波浪背景
    themeEffectsLayer.insertAdjacentHTML('beforeend', AURORA_WAVES);

    // 2. 注入所有运动图标
    for (const key in iconMap) {
        iconSection.insertAdjacentHTML('beforeend', iconMap[key]);
    }

    // 3. 生成极光粒子
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle-aura');
        const size = Math.random() * 6 + 3;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        const colors = ['rgba(236, 72, 153, 0.45)', 'rgba(139, 92, 246, 0.45)', 'rgba(6, 182, 212, 0.45)'];
        particle.style.background = colors[Math.floor(Math.random() * colors.length)];
        particle.style.boxShadow = `0 0 8px ${particle.style.background}`;
        particle.style.animationDuration = `${Math.random() * 6 + 8}s`;
        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 8}s`;
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        particlesContainer.appendChild(particle);
    }

    // 4. 随机选择运动提示
    const chosen = exercises[Math.floor(Math.random() * exercises.length)];
    return { iconId: chosen.iconId, title: chosen.title, desc: chosen.desc };
}
