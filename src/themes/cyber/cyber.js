/**
 * 赛博霓虹主题 (Cyberpunk Grid Theme)
 */

const ICON_CYBER = `
    <svg id="icon-cyber-stretch" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="20" cy="20" r="1" fill="rgba(6, 182, 212, 0.3)" />
        <circle cx="80" cy="20" r="1" fill="rgba(6, 182, 212, 0.3)" />
        <circle cx="20" cy="80" r="1" fill="rgba(6, 182, 212, 0.3)" />
        <circle cx="80" cy="80" r="1" fill="rgba(6, 182, 212, 0.3)" />
        <path d="M 30 75 L 50 65 L 70 75" stroke="rgba(6, 182, 212, 0.4)" stroke-width="1" />
        <path d="M 50 25 L 50 65" stroke="rgba(236, 72, 153, 0.4)" stroke-width="1" />
        <circle cx="50" cy="22" r="8" stroke="#06B6D4" stroke-width="3" fill="#141419" class="cyber-head" />
        <path d="M25 60 L 38 48 L 50 54 L 62 48 L 75 60" stroke="#EC4899" stroke-width="3.5" stroke-linecap="round" class="cyber-arms" />
        <path d="M40 78 L 50 65 L 60 78" stroke="#06B6D4" stroke-width="3.5" stroke-linecap="round" />
        <circle cx="38" cy="48" r="3" fill="#06B6D4" class="cyber-joint-l" />
        <circle cx="62" cy="48" r="3" fill="#06B6D4" class="cyber-joint-r" />
        <circle cx="50" cy="54" r="3.5" fill="#EC4899" />
    </svg>`;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 注入扫描线
    themeEffectsLayer.insertAdjacentHTML('beforeend', '<div class="cyber-scanline"></div>');

    // 2. 注入图标
    iconSection.insertAdjacentHTML('beforeend', ICON_CYBER);

    // 3. 生成赛博粒子
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');

        if (Math.random() > 0.4) {
            particle.classList.add('particle-cube');
            const size = Math.random() * 6 + 4;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            const isCyan = Math.random() > 0.5;
            particle.style.background = isCyan ? 'rgba(6, 182, 212, 0.75)' : 'rgba(236, 72, 153, 0.75)';
            particle.style.boxShadow = isCyan ? '0 0 8px rgba(6, 182, 212, 0.5)' : '0 0 8px rgba(236, 72, 153, 0.5)';
            particle.style.animationDuration = `${Math.random() * 3 + 4}s`;
        } else {
            particle.classList.add('particle-binary');
            particle.textContent = Math.random() > 0.5 ? '1' : '0';
            const fontSize = Math.random() * 5 + 9;
            particle.style.fontSize = `${fontSize}px`;
            const isCyan = Math.random() > 0.5;
            particle.style.color = isCyan ? 'rgba(6, 182, 212, 0.8)' : 'rgba(236, 72, 153, 0.8)';
            particle.style.textShadow = isCyan ? '0 0 5px rgba(6, 182, 212, 0.6)' : '0 0 5px rgba(236, 72, 153, 0.6)';
            particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
        }

        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 8}s`;
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        particlesContainer.appendChild(particle);
    }

    // 4. 返回运动提示
    return {
        iconId: 'icon-cyber-stretch',
        title: '赛博关节激活',
        desc: '跟着赛博小人动画：双手往后拉伸，挤压肩胛骨，挺胸抬头，激活背部和肩关节，重复5次。'
    };
}
