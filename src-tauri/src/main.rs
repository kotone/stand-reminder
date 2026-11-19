#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowBuilder, WindowUrl,
};
use std::time::Duration;
use tokio::sync::{mpsc, oneshot};
use tokio::time::{sleep_until, Instant};

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

enum ReminderCommand {
    // Tray actions reuse the most recent interval.
    Start { minutes: Option<u64> },
    Stop,
    AlertReady(String),
    GetNextTime(oneshot::Sender<Option<u64>>),
}

struct ReminderCommands {
    sender: mpsc::UnboundedSender<ReminderCommand>,
}

struct ReminderRun {
    id: u64,
    elapsed: u64,
    alert_shown: bool,
    tick_at: Instant,
}

const TICK_INTERVAL: Duration = Duration::from_secs(1);

fn now_secs() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or(std::time::Duration::ZERO)
        .as_secs()
}

fn update_tray(app_handle: &tauri::AppHandle, running: bool, alert_shown: bool) {
    let tray = app_handle.tray_handle();
    let _ = tray.get_item("start").set_enabled(!running);
    let _ = tray.get_item("stop").set_enabled(running);
    let _ = tray.get_item("next").set_enabled(alert_shown);
}

async fn run_reminders(
    app_handle: tauri::AppHandle,
    mut commands: mpsc::UnboundedReceiver<ReminderCommand>,
) {
    // One task owns both the countdown and every alert window operation.
    let mut run: Option<ReminderRun> = None;
    let mut run_id = 0;
    let mut minutes = 45u64;
    let mut next_timestamp = None;

    loop {
        let command = if let Some(active) = run.as_mut() {
            tokio::select! {
                biased;
                command = commands.recv() => command,
                _ = sleep_until(active.tick_at) => {
                    let target = minutes.saturating_mul(60);
                    if is_locked() {
                        active.elapsed = 0;
                        next_timestamp = Some(now_secs().saturating_add(target));
                    } else if !active.alert_shown {
                        active.elapsed += 1;
                        if active.elapsed >= target {
                            create_alerts(&app_handle, active.id);
                            active.alert_shown = true;
                            next_timestamp = None;
                            update_tray(&app_handle, true, true);
                        }
                    }
                    active.tick_at = Instant::now() + TICK_INTERVAL;
                    continue;
                }
            }
        } else {
            commands.recv().await
        };

        match command {
            Some(ReminderCommand::Start { minutes: new_minutes }) => {
                close_alerts(&app_handle);
                minutes = new_minutes.unwrap_or(minutes);
                run_id += 1;
                run = Some(ReminderRun {
                    id: run_id,
                    elapsed: 0,
                    alert_shown: false,
                    tick_at: Instant::now() + TICK_INTERVAL,
                });
                next_timestamp = Some(now_secs().saturating_add(minutes.saturating_mul(60)));
                update_tray(&app_handle, true, false);
                let _ = app_handle.emit_all(
                    "reminder-started",
                    serde_json::json!({ "minutes": minutes, "fromTray": new_minutes.is_none() }),
                );
            }
            Some(ReminderCommand::Stop) => {
                run = None;
                next_timestamp = None;
                close_alerts(&app_handle);
                update_tray(&app_handle, false, false);
                let _ = app_handle.emit_all("reminder-stopped", ());
            }
            Some(ReminderCommand::AlertReady(label)) => {
                // A closing WebView may still deliver a readiness message.
                let is_current_alert = run.as_ref().map_or(false, |active| {
                    active.alert_shown && label.starts_with(alert_prefix(active.id).as_str())
                });
                if is_current_alert {
                    if let Some(window) = app_handle.get_window(&label) {
                        let _ = window.show();
                    }
                }
            }
            Some(ReminderCommand::GetNextTime(reply)) => {
                let _ = reply.send(next_timestamp);
            }
            None => break,
        }
    }
}

const REMINDER_UNAVAILABLE: &str = "Reminder task is unavailable";

#[tauri::command]
fn start_reminder(minutes: u64, state: tauri::State<ReminderCommands>) -> Result<(), &'static str> {
    state
        .sender
        .send(ReminderCommand::Start { minutes: Some(minutes) })
        .map_err(|_| REMINDER_UNAVAILABLE)
}

#[tauri::command]
fn stop_reminder(state: tauri::State<ReminderCommands>) -> Result<(), &'static str> {
    state.sender.send(ReminderCommand::Stop).map_err(|_| REMINDER_UNAVAILABLE)
}

#[tauri::command]
fn alert_ready(
    window: tauri::Window,
    state: tauri::State<ReminderCommands>,
) -> Result<(), &'static str> {
    state
        .sender
        .send(ReminderCommand::AlertReady(window.label().to_owned()))
        .map_err(|_| REMINDER_UNAVAILABLE)
}

#[tauri::command]
fn show_settings(app_handle: tauri::AppHandle) {
    if let Some(window) = app_handle.get_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
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

fn alert_prefix(run_id: u64) -> String {
    format!("alert_{}_", run_id)
}

fn create_alerts(app_handle: &tauri::AppHandle, run_id: u64) {
    let prefix = alert_prefix(run_id);
    if let Some(main_window) = app_handle.get_window("main") {
        if let Ok(monitors) = main_window.available_monitors() {
            for (idx, monitor) in monitors.iter().enumerate() {
                let label = format!("{}{}", prefix, idx);
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
                .visible(false)
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
            let _ = window.hide();
            let _ = window.close();
        }
    }
}

#[tauri::command]
async fn get_next_reminder_time(app_handle: tauri::AppHandle) -> Result<Option<u64>, &'static str> {
    let (reply, time) = oneshot::channel();
    app_handle
        .state::<ReminderCommands>()
        .sender
        .send(ReminderCommand::GetNextTime(reply))
        .map_err(|_| REMINDER_UNAVAILABLE)?;
    time.await.map_err(|_| REMINDER_UNAVAILABLE)
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
    let (sender, receiver) = mpsc::unbounded_channel();

    tauri::Builder::default()
        .manage(ReminderCommands { sender })
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
                    "start" | "next" => {
                        let _ = app
                            .state::<ReminderCommands>()
                            .sender
                            .send(ReminderCommand::Start { minutes: None });
                    }
                    "stop" => {
                        let _ = app.state::<ReminderCommands>().sender.send(ReminderCommand::Stop);
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
            alert_ready,
            show_settings,
            get_next_reminder_time
        ])
        .setup(move |app| {
            tauri::async_runtime::spawn(run_reminders(app.handle(), receiver));
            // Initially show settings window
            show_settings(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .unwrap_or_else(|e| {
            #[cfg(windows)]
            {
                use windows::Win32::UI::WindowsAndMessaging::{
                    MessageBoxW, MB_OK, MB_ICONERROR,
                };
                use windows::core::HSTRING;
                let msg = HSTRING::from(format!("程序启动失败：{}\n\n请确认已安装 WebView2 Runtime。", e));
                let title = HSTRING::from("StandReminder 错误");
                unsafe {
                    MessageBoxW(None, &msg, &title, MB_OK | MB_ICONERROR);
                }
            }
            #[cfg(not(windows))]
            {
                eprintln!("error while running tauri application: {}", e);
            }
        });
}
