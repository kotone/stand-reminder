/**
 * 提醒页面核心调度器
 * 根据用户选择的主题动态加载对应的 CSS 和 JS 模块
 */

/* ============================================
   通用运动建议配置（每 5 秒轮播）
   ============================================ */
const exerciseTips = [
    { title: '颈部舒缓放松', desc: '双肩下沉，将头部缓缓向左侧倾斜，感受右侧拉伸，保持3秒。然后换右侧重复。' },
    { title: '双肩绕圈放松', desc: '双臂自然下垂，双肩由前向上、向后画圈绕行，重复5次，随后反方向画圈5次。' },
    { title: '双手向上拉伸', desc: '十指交叉，掌心向上翻转。吸气时手臂努力向上推，挺拔脊柱，呼气还原，重复3次。' },
    { title: '腰部扭转舒展', desc: '坐直身体，左手放右膝外侧，右手扶椅背，缓缓向右扭转上身，保持5秒后换另一侧。' },
    { title: '手腕关节活动', desc: '双手前伸，缓慢做手腕绕圈运动，顺时针10圈，逆时针10圈，放松前臂肌肉。' },
    { title: '眼部远眺放松', desc: '闭目深呼吸3次，然后睁眼将视线投向窗外远方或绿色植物，保持20秒，缓解视疲劳。' },
    { title: '深呼吸调节', desc: '双脚平放地面，闭目用鼻吸气4秒（腹部隆起），屏息2秒，用嘴缓缓呼气6秒，重复5次。' },
    { title: '踮脚站立伸展', desc: '站起身，双脚并拢，缓慢踮起脚尖至最高点，保持2秒后缓缓放下，重复10次，促进下肢血液循环。' },
    { title: '扩胸开肩运动', desc: '双手在身后十指交扣，手臂伸直向后上方抬起，挺胸抬头，感受胸部和肩部拉伸，保持5秒。' },
    { title: '坐姿前屈放松', desc: '坐在椅子前半部分，双腿伸直，上身缓慢前倾，双手尽量触碰脚尖，保持5秒后起身。' },
];

document.addEventListener('DOMContentLoaded', async () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');
    const particlesContainer = document.getElementById('particlesContainer');
    const themeEffectsLayer = document.getElementById('themeEffectsLayer');
    const iconSection = document.getElementById('iconSection');
    const footerText = document.getElementById('footerText');
    const guideStep = document.getElementById('guideStep');
    const guideText = document.getElementById('guideText');
    const tipsContainer = document.querySelector('.tips-container');

    // 1. 获取主题设置
    const bgStyle = localStorage.getItem('bgStyle') || 'aura';
    document.body.className = 'theme-' + bgStyle;

    // 2. 动态注入主题 CSS
    const themeLink = document.createElement('link');
    themeLink.rel = 'stylesheet';
    themeLink.href = `themes/${bgStyle}/${bgStyle}.css`;
    document.head.appendChild(themeLink);

    // 3. 动态加载主题 JS 模块并初始化
    try {
        const themeModule = await import(`./themes/${bgStyle}/${bgStyle}.js`);
        themeModule.initTheme(themeEffectsLayer, particlesContainer, iconSection);
    } catch (e) {
        console.error(`Failed to load theme "${bgStyle}":`, e);
    }

    // 4. 初始化通用运动建议轮播
    let currentTipIndex = Math.floor(Math.random() * exerciseTips.length);

    function showTip(index) {
        const tip = exerciseTips[index];
        if (guideStep) guideStep.textContent = tip.title;
        if (guideText) guideText.textContent = tip.desc;
    }

    function rotateTip() {
        if (tipsContainer) tipsContainer.classList.add('tip-fade-out');

        setTimeout(() => {
            currentTipIndex = (currentTipIndex + 1) % exerciseTips.length;
            showTip(currentTipIndex);
            if (tipsContainer) {
                tipsContainer.classList.remove('tip-fade-out');
                tipsContainer.classList.add('tip-fade-in');
            }
            setTimeout(() => {
                if (tipsContainer) tipsContainer.classList.remove('tip-fade-in');
            }, 400);
        }, 400);
    }

    // 先显示第一条
    showTip(currentTipIndex);
    // 每 5 秒轮播
    setInterval(rotateTip, 5000);

    // 5. 显示已工作时长
    const savedInterval = localStorage.getItem('interval') || 45;
    if (footerText) {
        footerText.textContent = `已连续工作 ${savedInterval} 分钟，该起立伸展啦`;
    }

    // 6. 平滑多阶段过渡
    setTimeout(() => {
        borderElem.classList.add('active');
    }, 50);

    setTimeout(() => {
        centerElem.classList.add('show');
    }, 1000);

    // 7. 当样式加载完成后显示窗口，避免闪烁
    setTimeout(() => {
        if (window.__TAURI__) {
            window.__TAURI__.window.appWindow.show();
        }
    }, 150);
});
