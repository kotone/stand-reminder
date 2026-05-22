const { invoke } = window.__TAURI__.tauri;
const { appWindow } = window.__TAURI__.window;
const { listen } = window.__TAURI__.event;

document.addEventListener('DOMContentLoaded', () => {
    const toggleSwitch = document.getElementById('toggle-switch');
    const intervalInput = document.getElementById('interval');
    const statusText = document.getElementById('status-text');
    const closeBtn = document.getElementById('close-btn');
    const bgStyleSelect = document.getElementById('bg-style');
    const nextReminderEl = document.getElementById('next-reminder');

    // --- Window drag support ---
    // CSS `-webkit-app-region: drag` is unreliable on Windows with transparent Tauri windows.
    // Use Tauri's JS API instead for reliable window dragging.
    const container = document.querySelector('.container');
    const noDragSelectors = 'input, select, button, .switch, .close-btn, .card';
    container.addEventListener('mousedown', (e) => {
        // Don't start drag if user clicked on an interactive element
        if (e.target.closest(noDragSelectors)) return;
        appWindow.startDragging();
    });

    // Load saved settings
    const savedInterval = localStorage.getItem('interval') || 45;
    const savedRunning = localStorage.getItem('isRunning');
    const savedBgStyle = localStorage.getItem('bgStyle') || 'zen';
    // First launch: savedRunning is null, default to false
    const isRunning = savedRunning === 'true';
    
    intervalInput.value = savedInterval;
    toggleSwitch.checked = isRunning;
    if (bgStyleSelect) {
        bgStyleSelect.value = savedBgStyle;
        bgStyleSelect.addEventListener('change', (e) => {
            localStorage.setItem('bgStyle', e.target.value);
        });
    }
    
    updateStatusText();

    if (isRunning) {
        startReminder();
    }

    // Listen for backend events (e.g. tray stop/start)
    listen('reminder-stopped', () => {
        toggleSwitch.checked = false;
        localStorage.setItem('isRunning', false);
        updateStatusText();
    });

    listen('reminder-started', (event) => {
        toggleSwitch.checked = true;
        localStorage.setItem('isRunning', true);
        if (event.payload && event.payload.minutes) {
            intervalInput.value = event.payload.minutes;
            localStorage.setItem('interval', event.payload.minutes);
        }
        updateStatusText();
    });

    closeBtn.addEventListener('click', async () => {
        await appWindow.hide(); // Hide to tray
    });

    toggleSwitch.addEventListener('change', async (e) => {
        const checked = e.target.checked;
        localStorage.setItem('isRunning', checked);
        
        if (checked) {
            await startReminder();
        } else {
            await stopReminder();
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
        updateStatusText();
    });

    async function updateStatusText() {
        const container = document.querySelector('.status-container');
        if (toggleSwitch.checked) {
            statusText.textContent = `每 ${intervalInput.value} 分钟提醒一次`;
            if (container) container.classList.add('active');
            if (nextReminderEl) nextReminderEl.style.display = 'block';
            
            try {
                const nextTimestamp = await invoke('get_next_reminder_time');
                if (nextTimestamp && nextReminderEl) {
                    const nextTime = new Date(nextTimestamp * 1000);
                    const hours = String(nextTime.getHours()).padStart(2, '0');
                    const mins = String(nextTime.getMinutes()).padStart(2, '0');
                    nextReminderEl.textContent = `下次提醒时间：${hours}:${mins}`;
                } else if (nextReminderEl) {
                    nextReminderEl.textContent = '下次提醒时间：--:--';
                }
            } catch (e) {
                console.error(e);
            }
        } else {
            statusText.textContent = '已停止';
            if (container) container.classList.remove('active');
            if (nextReminderEl) {
                nextReminderEl.style.display = 'none';
            }
        }
    }

    async function startReminder() {
        const minutes = parseInt(intervalInput.value) || 45;
        await invoke('start_reminder', { minutes });
        updateStatusText();
    }

    async function stopReminder() {
        await invoke('stop_reminder');
        updateStatusText();
    }

    // Refresh next reminder time when window gets focus (e.g. after unlock)
    appWindow.onFocusChanged(({ payload: isFocused }) => {
        if (isFocused) {
            updateStatusText();
        }
    });
});
