/**
 * 提醒页面核心调度器
 * 根据用户选择的主题动态加载对应的 CSS 和 JS 模块
 */

document.addEventListener('DOMContentLoaded', async () => {
    const borderElem = document.getElementById('borderElem');
    const centerElem = document.getElementById('centerElem');
    const particlesContainer = document.getElementById('particlesContainer');
    const themeEffectsLayer = document.getElementById('themeEffectsLayer');
    const iconSection = document.getElementById('iconSection');
    const footerText = document.getElementById('footerText');
    const guideStep = document.getElementById('guideStep');
    const guideText = document.getElementById('guideText');

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
        const { iconId, title, desc } = themeModule.initTheme(themeEffectsLayer, particlesContainer, iconSection);

        // 设置运动提示文案
        if (guideStep) guideStep.textContent = title;
        if (guideText) guideText.textContent = desc;

        // 显示选中的图标，隐藏其余
        document.querySelectorAll('.stretch-icon').forEach(icon => {
            if (icon.id === iconId) {
                icon.classList.remove('hidden');
            } else {
                icon.classList.add('hidden');
            }
        });
    } catch (e) {
        console.error(`Failed to load theme "${bgStyle}":`, e);
    }

    // 4. 显示已工作时长
    const savedInterval = localStorage.getItem('interval') || 45;
    if (footerText) {
        footerText.textContent = `已连续工作 ${savedInterval} 分钟，该起立伸展啦`;
    }

    // 5. 平滑多阶段过渡
    setTimeout(() => {
        borderElem.classList.add('active');
    }, 50);

    setTimeout(() => {
        centerElem.classList.add('show');
    }, 1000);

    // 6. 当样式加载完成后显示窗口，避免闪烁
    setTimeout(() => {
        if (window.__TAURI__) {
            window.__TAURI__.window.appWindow.show();
        }
    }, 150);
});
