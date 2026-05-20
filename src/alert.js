document.addEventListener('DOMContentLoaded', () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');
    const particlesContainer = document.getElementById('particlesContainer');
    const footerText = document.getElementById('footerText');

    // 1. Dynamic Exercise Database
    const exercises = [
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

    // 2. Select a random exercise and display it
    const randomIdx = Math.floor(Math.random() * exercises.length);
    const chosenExercise = exercises[randomIdx];

    // Show the chosen icon
    document.querySelectorAll('.stretch-icon').forEach(icon => {
        if (icon.id === chosenExercise.iconId) {
            icon.classList.remove('hidden');
        } else {
            icon.classList.add('hidden');
        }
    });

    // Update text content
    document.getElementById('guideStep').textContent = chosenExercise.title;
    document.getElementById('guideText').textContent = chosenExercise.desc;

    // Show saved working duration if available
    const savedInterval = localStorage.getItem('interval') || 45;
    if (footerText) {
        footerText.textContent = `已连续工作 ${savedInterval} 分钟，该起立伸展啦`;
    }

    // 3. Generate soft background floating particles
    const particleCount = 18;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        const size = Math.random() * 6 + 3; // 3px to 9px
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${Math.random() * 100}vw`;
        
        const delay = Math.random() * 8;
        const duration = Math.random() * 5 + 7; // 7s to 12s
        particle.style.animationDelay = `-${delay}s`; // Start immediately at random state
        particle.style.animationDuration = `${duration}s`;
        
        particle.style.opacity = Math.random() * 0.4 + 0.15;
        
        particlesContainer.appendChild(particle);
    }

    // 4. Smooth multi-stage transitions
    // Stage 1: Immediate light active aura
    setTimeout(() => {
        borderElem.classList.add('active');
    }, 50);

    // Stage 2: Central glass card slides up with spring
    setTimeout(() => {
        centerElem.classList.add('show');
    }, 1000);

    // Stage 3: Intensify aura (more intense colors) after 10s
    setTimeout(() => {
        borderElem.classList.add('intensified');
    }, 10000);
});
