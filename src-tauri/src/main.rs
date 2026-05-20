#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowBuilder, WindowUrl,
};
use std::sync::Mutex;
use std::time::Duration;
use tokio::sync::mpsc;

#[cfg(windows)]
use windows::Win32::System::StationsAndDesktops::{OpenInputDesktop, CloseDesktop, DESKTOP_CONTROL_FLAGS, DESKTOP_ACCESS_FLAGS};
#[cfg(windows)]
use windows::Win32::Graphics::Gdi::{EnumDisplayMonitors, GetMonitorInfoW, MONITORINFO, HDC, HMONITOR};
#[cfg(windows)]
use windows::Win32::Foundation::{RECT, LPARAM, BOOL};

#[cfg(windows)]
fn is_locked() -> bool {
    unsafe {
        // MAXIMUM_ALLOWED is 0x02000000
        let result = OpenInputDesktop(DESKTOP_CONTROL_FLAGS(0), false, DESKTOP_ACCESS_FLAGS(0x02000000));
        if let Ok(handle) = result {
            let _ = CloseDesktop(handle);
            false
        } else {
            true
        }
    }
}

#[cfg(not(windows))]
fn is_locked() -> bool {
    false
}

#[cfg(windows)]
unsafe extern "system" fn monitor_enum_proc(
    hmonitor: HMONITOR,
    _hdc: HDC,
    _lprect: *mut RECT,
    lparam: LPARAM,
) -> BOOL {
    let target_rect = &*(lparam.0 as *const RECT);
    let mut mi = MONITORINFO {
        cbSize: std::mem::size_of::<MONITORINFO>() as u32,
        ..Default::default()
    };
    if GetMonitorInfoW(hmonitor, &mut mi).0 != 0 {
        if mi.rcMonitor.left == target_rect.left && mi.rcMonitor.top == target_rect.top {
            let result = &mut *((lparam.0 as *mut RECT).offset(1));
            *result = mi.rcWork;
            return BOOL(0);
        }
    }
    BOOL(1)
}

#[cfg(windows)]
fn get_work_area(x: i32, y: i32, width: u32, height: u32) -> Option<(i32, i32, u32, u32)> {
    unsafe {
        let mut rects = [
            RECT { left: x, top: y, right: x + width as i32, bottom: y + height as i32 },
            RECT::default(),
        ];
        EnumDisplayMonitors(None, None, Some(monitor_enum_proc), LPARAM(rects.as_mut_ptr() as isize));
        let work = rects[1];
        if work.right > work.left && work.bottom > work.top {
            Some((work.left, work.top, (work.right - work.left) as u32, (work.bottom - work.top) as u32))
        } else {
            None
        }
    }
}

#[cfg(not(windows))]
fn get_work_area(_x: i32, _y: i32, _width: u32, _height: u32) -> Option<(i32, i32, u32, u32)> {
    None
}

struct AppState {
    sender: Mutex<Option<mpsc::Sender<()>>>,
    minutes: Mutex<u64>,
    next_timestamp: Mutex<Option<u64>>,
}

fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or(std::time::Duration::ZERO)
        .as_secs()
}

/// Internal stop: cancels timer + updates tray, but does NOT emit events to frontend.
/// Used when start_reminder calls stop internally to avoid UI flicker.
fn stop_reminder_internal(app_handle: &tauri::AppHandle, state: &AppState) {
    let mut sender_opt = state.sender.lock().unwrap();
    if let Some(sender) = sender_opt.take() {
        let _ = sender.try_send(());
    }
    *state.next_timestamp.lock().unwrap() = None;

    let tray = app_handle.tray_handle();
    let _ = tray.get_item("start").set_enabled(true);
    let _ = tray.get_item("stop").set_enabled(false);
    let _ = tray.get_item("next").set_enabled(false);

    close_alerts(app_handle);
}

#[tauri::command]
fn start_reminder(minutes: u64, app_handle: tauri::AppHandle, state: tauri::State<AppState>) {
    // Stop existing timer and close any alerts (internal, no event emitted)
    stop_reminder_internal(&app_handle, &state);

    *state.minutes.lock().unwrap() = minutes;
    *state.next_timestamp.lock().unwrap() = Some(now_secs() + minutes * 60);

    let tray = app_handle.tray_handle();
    let _ = tray.get_item("start").set_enabled(false);
    let _ = tray.get_item("stop").set_enabled(true);
    let _ = tray.get_item("next").set_enabled(false);

    let (tx, mut rx) = mpsc::channel(1);
    *state.sender.lock().unwrap() = Some(tx);

    tauri::async_runtime::spawn(async move {
        let target = minutes * 60;
        let mut elapsed = 0;
        let mut alert_shown = false;
        
        loop {
            tokio::select! {
                _ = tokio::time::sleep(Duration::from_secs(1)) => {
                    if is_locked() {
                        elapsed = 0;
                        let state = app_handle.state::<AppState>();
                        *state.next_timestamp.lock().unwrap() = Some(now_secs() + target);
                        continue;
                    }
                    
                    if !alert_shown {
                        elapsed += 1;
                        if elapsed >= target {
                            show_alerts(&app_handle);
                            let _ = app_handle.tray_handle().get_item("next").set_enabled(true);
                            alert_shown = true;
                            
                            let state = app_handle.state::<AppState>();
                            *state.next_timestamp.lock().unwrap() = None;
                        }
                    }
                }
                _ = rx.recv() => {
                    break;
                }
            }
        }
    });
}

#[tauri::command]
fn stop_reminder(app_handle: tauri::AppHandle, state: tauri::State<AppState>) {
    stop_reminder_internal(&app_handle, &state);

    // Notify frontend to update UI toggle
    let _ = app_handle.emit_all("reminder-stopped", ());
}

#[tauri::command]
fn show_settings(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_window("main") {
        window.show().unwrap();
        window.set_focus().unwrap();
    } else {
        let _ = WindowBuilder::new(
            &app_handle,
            "main",
            WindowUrl::App("index.html".into()),
        )
        .title("StandReminder")
        .inner_size(320.0, 480.0)
        .resizable(false)
        .decorations(false)
        .transparent(true)
        .always_on_top(true)
        .center()
        .skip_taskbar(true)
        .build();
    }
}

fn show_alerts(app_handle: &tauri::AppHandle) {
    // Check if any alerts are already open and close them
    close_alerts(app_handle);

    if let Some(main_window) = app_handle.get_window("main") {
        if let Ok(monitors) = main_window.available_monitors() {
            for (idx, monitor) in monitors.iter().enumerate() {
                let label = format!("alert_{}", idx);
                let pos = monitor.position();
                let size = monitor.size();

                let (x, y, w, h) = if let Some(wa) = get_work_area(pos.x as i32, pos.y as i32, size.width, size.height) {
                    wa
                } else {
                    (pos.x as i32, pos.y as i32, size.width, size.height)
                };

                if let Ok(window) = WindowBuilder::new(
                    app_handle,
                    label,
                    WindowUrl::App("alert.html".into()),
                )
                .title("Alert")
                .position(x as f64, y as f64)
                .inner_size(w as f64, h as f64)
                .decorations(false)
                .transparent(true)
                .always_on_top(true)
                .skip_taskbar(true)
                .build()
                {
                    // Make it click-through
                    let _ = window.set_ignore_cursor_events(true);
                }
            }
        }
    }
}

fn close_alerts(app_handle: &tauri::AppHandle) {
    for (label, window) in app_handle.windows() {
        if label.starts_with("alert_") {
            let _ = window.close();
        }
    }
}

#[tauri::command]
fn get_next_reminder_time(state: tauri::State<AppState>) -> Option<u64> {
    *state.next_timestamp.lock().unwrap()
}

fn main() {
    let show = CustomMenuItem::new("show".to_string(), "打开设置");
    let start = CustomMenuItem::new("start".to_string(), "启动提醒");
    let stop = CustomMenuItem::new("stop".to_string(), "停止提醒").disabled();
    let next = CustomMenuItem::new("next".to_string(), "下一次").disabled();
    let quit = CustomMenuItem::new("quit".to_string(), "退出程序");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(start)
        .add_item(stop)
        .add_item(next)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
        
    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState {
            sender: Mutex::new(None),
            minutes: Mutex::new(45),
            next_timestamp: Mutex::new(None),
        })
        .system_tray(tray)
        .on_system_tray_event(|app, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => {
                match id.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    "show" => {
                        show_settings(app.clone());
                    }
                    "start" => {
                        let minutes = *app.state::<AppState>().minutes.lock().unwrap();
                        start_reminder(minutes, app.clone(), app.state::<AppState>());
                        let _ = app.emit_all("reminder-started", serde_json::json!({ "minutes": minutes }));
                    }
                    "stop" => {
                        stop_reminder(app.clone(), app.state::<AppState>());
                    }
                    "next" => {
                        let minutes = *app.state::<AppState>().minutes.lock().unwrap();
                        start_reminder(minutes, app.clone(), app.state::<AppState>());
                        let _ = app.emit_all("reminder-started", serde_json::json!({ "minutes": minutes }));
                    }
                    _ => {}
                }
            }
            SystemTrayEvent::LeftClick { .. } => {
                show_settings(app.clone());
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            start_reminder,
            stop_reminder,
            show_settings,
            get_next_reminder_time
        ])
        .setup(|app| {
            // Initially show settings window
            show_settings(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
