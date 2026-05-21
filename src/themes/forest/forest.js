/**
 * 森林朝露主题 (Forest Morning Theme)
 */

const ICON_FOREST = `
    <svg id="icon-forest-sprout" class="stretch-icon" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M 25 80 Q 50 74 75 80" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" />
        <path d="M 50 80 Q 52 50 42 30" stroke="#10B981" stroke-width="4.5" stroke-linecap="round" class="sprout-stem" />
        <path d="M 45 48 C 30 45, 26 30, 44 38 Z" fill="#34D399" stroke="#10B981" stroke-width="1.5" class="sprout-leaf-l" />
        <path d="M 49 38 C 65 35, 68 20, 50 28 Z" fill="#34D399" stroke="#10B981" stroke-width="1.5" class="sprout-leaf-r" />
        <circle cx="50" cy="35" r="15" fill="rgba(251, 191, 36, 0.15)" filter="blur(4px)" class="sprout-sun" />
    </svg>`;

const SUNBEAMS_HTML = `
    <div class="forest-sunbeams">
        <div class="sunbeam sunbeam-1"></div>
        <div class="sunbeam sunbeam-2"></div>
        <div class="sunbeam sunbeam-3"></div>
    </div>`;

const TREES_HTML = `
    <div class="forest-growth-layer">
        <svg class="bg-tree tree-1" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="tree-trunk" d="M 50 120 L 50 60" stroke="#10B981" stroke-width="4" stroke-linecap="round" />
            <path class="tree-branch branch-1" d="M 50 90 Q 35 80 30 75" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
            <path class="tree-branch branch-2" d="M 50 80 Q 65 70 70 65" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
            <circle class="tree-foliage foliage-1" cx="50" cy="50" r="18" fill="rgba(52, 211, 153, 0.35)" />
            <circle class="tree-foliage foliage-2" cx="35" cy="70" r="12" fill="rgba(16, 185, 129, 0.3)" />
            <circle class="tree-foliage foliage-3" cx="65" cy="60" r="12" fill="rgba(52, 211, 153, 0.25)" />
        </svg>
        <svg class="bg-tree tree-2" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="tree-trunk" d="M 50 120 L 50 45" stroke="#059669" stroke-width="5" stroke-linecap="round" />
            <circle class="tree-foliage foliage-1" cx="50" cy="35" r="22" fill="rgba(16, 185, 129, 0.3)" />
            <circle class="tree-foliage foliage-2" cx="50" cy="20" r="15" fill="rgba(52, 211, 153, 0.35)" />
        </svg>
        <svg class="bg-tree tree-3" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="tree-trunk" d="M 50 120 L 50 55" stroke="#10B981" stroke-width="4.5" stroke-linecap="round" />
            <path class="tree-branch branch-1" d="M 50 95 Q 30 85 25 80" stroke="#10B981" stroke-width="3" stroke-linecap="round" />
            <circle class="tree-foliage foliage-1" cx="50" cy="45" r="20" fill="rgba(52, 211, 153, 0.3)" />
            <circle class="tree-foliage foliage-2" cx="25" cy="75" r="10" fill="rgba(16, 185, 129, 0.25)" />
        </svg>
        <svg class="bg-tree tree-4" viewBox="0 0 100 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path class="tree-trunk" d="M 50 120 L 50 65" stroke="#059669" stroke-width="4" stroke-linecap="round" />
            <circle class="tree-foliage foliage-1" cx="50" cy="55" r="16" fill="rgba(16, 185, 129, 0.35)" />
            <circle class="tree-foliage foliage-2" cx="50" cy="40" r="12" fill="rgba(52, 211, 153, 0.25)" />
        </svg>
    </div>`;

export function initTheme(themeEffectsLayer, particlesContainer, iconSection) {
    // 1. 注入阳光光束
    themeEffectsLayer.insertAdjacentHTML('beforeend', SUNBEAMS_HTML);

    // 2. 注入树木（需要放在 marquee-border 的兄弟节点位置以便 CSS ~ 选择器生效）
    const borderElem = document.getElementById('borderElem');
    borderElem.insertAdjacentHTML('afterend', TREES_HTML);

    // 3. 注入嫩芽图标
    iconSection.insertAdjacentHTML('beforeend', ICON_FOREST);

    // 4. 生成树叶和露珠粒子
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');

        if (Math.random() > 0.5) {
            particle.classList.add('particle-leaf');
            const size = Math.random() * 10 + 6;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = Math.random() > 0.5 ? 'rgba(52, 211, 153, 0.55)' : 'rgba(16, 185, 129, 0.5)';
            particle.style.transform = `rotate(${Math.random() * 360}deg)`;
            particle.style.animationDuration = `${Math.random() * 5 + 6}s`;
        } else {
            particle.classList.add('particle-dewdrop');
            const size = Math.random() * 3 + 2;
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.background = 'rgba(255, 255, 255, 0.8)';
            particle.style.boxShadow = '0 0 6px rgba(52, 211, 153, 0.8), 0 0 10px rgba(255, 255, 255, 0.6)';
            particle.style.animationDuration = `${Math.random() * 4 + 4}s`;
        }

        particle.style.left = `${Math.random() * 100}vw`;
        particle.style.animationDelay = `-${Math.random() * 8}s`;
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        particlesContainer.appendChild(particle);
    }

    // 5. 返回运动提示
    return {
        iconId: 'icon-forest-sprout',
        title: '眺望远方与全身舒展',
        desc: '站直身体，闭目深呼吸。然后睁开眼，将视线投向窗外的远方或绿色植物，感受植物摇曳，放松双眼。'
    };
}
