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

struct AppState {
    sender: Mutex<Option<mpsc::Sender<()>>>,
    minutes: Mutex<u64>,
}

#[tauri::command]
fn start_reminder(minutes: u64, app_handle: tauri::AppHandle, state: tauri::State<AppState>) {
    // Stop existing timer and close any alerts
    stop_reminder(app_handle.clone(), state.clone());

    *state.minutes.lock().unwrap() = minutes;

    let tray = app_handle.tray_handle();
    let _ = tray.get_item("start").set_enabled(false);
    let _ = tray.get_item("stop").set_enabled(true);
    let _ = tray.get_item("next").set_enabled(false);

    let (tx, mut rx) = mpsc::channel(1);
    *state.sender.lock().unwrap() = Some(tx);

    tauri::async_runtime::spawn(async move {
        let duration = Duration::from_secs(minutes * 60);
        loop {
            tokio::select! {
                _ = tokio::time::sleep(duration) => {
                    // Time to show alert
                    show_alerts(&app_handle);
                    // Enable "next" when alert is shown
                    let _ = app_handle.tray_handle().get_item("next").set_enabled(true);
                    
                    // Note: We removed the auto-close logic here.
                    // The alert will stay until the user clicks "next" or "stop".
                }
                _ = rx.recv() => {
                    // Timer stopped
                    break;
                }
            }
        }
    });
}

#[tauri::command]
fn stop_reminder(app_handle: tauri::AppHandle, state: tauri::State<AppState>) {
    let mut sender_opt = state.sender.lock().unwrap();
    if let Some(sender) = sender_opt.take() {
        let _ = sender.try_send(());
    }
    
    let tray = app_handle.tray_handle();
    let _ = tray.get_item("start").set_enabled(true);
    let _ = tray.get_item("stop").set_enabled(false);
    let _ = tray.get_item("next").set_enabled(false);
    
    close_alerts(&app_handle);
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
        .inner_size(320.0, 450.0)
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

                if let Ok(window) = WindowBuilder::new(
                    app_handle,
                    label,
                    WindowUrl::App("alert.html".into()),
                )
                .title("Alert")
                .position(pos.x as f64, pos.y as f64)
                .inner_size(size.width as f64, size.height as f64)
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
            minutes: Mutex::new(45), // Default value
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
                    }
                    "stop" => {
                        stop_reminder(app.clone(), app.state::<AppState>());
                    }
                    "next" => {
                        let minutes = *app.state::<AppState>().minutes.lock().unwrap();
                        start_reminder(minutes, app.clone(), app.state::<AppState>());
                    }
                    _ => {}
                }
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            start_reminder,
            stop_reminder,
            show_settings
        ])
        .setup(|app| {
            // Initially show settings window
            show_settings(app.handle());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
