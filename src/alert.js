/**
 * 提醒页面核心调度器
 * 根据用户选择的主题动态加载对应的 CSS 和 JS 模块
 */

/* ============================================
   通用运动建议配置（每 10 秒轮播）
   ============================================ */
const exerciseTips = [
    { title: '颈部舒缓放松', desc: '双肩下沉，将头部缓缓向左侧倾斜，感受右侧拉伸，保持3秒。然后换右侧重复。' },
    { title: '双肩绕圈放松', desc: '双臂自然下垂，双肩由前向上、向后画圈绕行，重复5次，随后反方向画圈5次。' },
    { title: '双手向上拉伸', desc: '十指交叉，掌心向上翻转。吸气时手臂努力向上推，挺拔脊柱，呼气还原，重复3次。' },
    { title: '手腕关节活动', desc: '双手前伸，缓慢做手腕绕圈运动，顺时针10圈，逆时针10圈，放松前臂肌肉。' },
    { title: '踮脚站立伸展', desc: '站起身，双脚并拢，缓慢踮起脚尖至最高点，保持2秒后缓缓放下，重复10次。' },
    { title: '扩胸开肩运动', desc: '双手在身后十指交扣，手臂伸直向后上方抬起，挺胸抬头，感受胸部和肩部拉伸，保持5秒。' },
    { title: '臀肌激活挤压', desc: '用力收紧臀部肌肉，保持5秒后完全放松，重复10次。激活臀肌，稳定骨盆与下背部。' },
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
    const bgStyle = localStorage.getItem('bgStyle') || 'zen';
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
    // 每 10 秒轮播，存储 ID 以便窗口关闭前清理，防止多次触发时叠加多个 interval
    const tipIntervalId = setInterval(rotateTip, 10000);
    window.addEventListener('beforeunload', () => clearInterval(tipIntervalId), { once: true });

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
