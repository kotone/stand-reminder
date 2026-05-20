const { invoke } = window.__TAURI__.tauri;
const { appWindow } = window.__TAURI__.window;

document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const intervalInput = document.getElementById('interval');
    const statusText = document.getElementById('status-text');
    const closeBtn = document.getElementById('close-btn');

    // Load saved settings
    const savedInterval = localStorage.getItem('interval') || 45;
    const savedRunning = localStorage.getItem('isRunning');
    // First launch: savedRunning is null, default to false
    const isRunning = savedRunning === 'true';
    
    intervalInput.value = savedInterval;
    toggleSwitch.checked = isRunning;
    
    updateStatusText();

    if (isRunning) {
        startReminder();
    }

    closeBtn.addEventListener('click', async () => {
        await appWindow.hide(); // Hide to tray
    });

    toggleSwitch.addEventListener('change', (e) => {
        const checked = e.target.checked;
        localStorage.setItem('isRunning', checked);
        
        if (checked) {
            startReminder();
        } else {
            stopReminder();
        }
        updateStatusText();
    });

    intervalInput.addEventListener('change', (e) => {
        let val = parseInt(e.target.value);
        if (isNaN(val) || val < 1) val = 1;
        e.target.value = val;
        localStorage.setItem('interval', val);
        
        if (toggleSwitch.checked) {
            // Restart with new interval
            startReminder();
        }
    });

    function updateStatusText() {
        const container = document.querySelector('.status-container');
        if (toggleSwitch.checked) {
            statusText.textContent = `每 ${intervalInput.value} 分钟提醒一次`;
            if (container) container.classList.add('active');
        } else {
            statusText.textContent = '已停止';
            if (container) container.classList.remove('active');
        }
    }

    async function startReminder() {
        const minutes = parseInt(intervalInput.value) || 45;
        await invoke('start_reminder', { minutes });
    }

    async function stopReminder() {
        await invoke('stop_reminder');
    }
});
