#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
    WindowBuilder, WindowUrl,
};
use std::sync::{Arc, Mutex};
use std::time::Duration;
use tokio::sync::mpsc;

struct AppState {
    sender: Mutex<Option<mpsc::Sender<()>>>,
}

#[tauri::command]
fn start_reminder(minutes: u64, app_handle: tauri::AppHandle, state: tauri::State<AppState>) {
    // Stop existing timer
    stop_reminder(state.clone());

    let (tx, mut rx) = mpsc::channel(1);
    *state.sender.lock().unwrap() = Some(tx);

    tauri::async_runtime::spawn(async move {
        let duration = Duration::from_secs(minutes * 60);
        loop {
            tokio::select! {
                _ = tokio::time::sleep(duration) => {
                    // Time to show alert
                    show_alerts(&app_handle);
                    
                    // Alerts auto close after 10 seconds
                    let app_clone = app_handle.clone();
                    tauri::async_runtime::spawn(async move {
                        tokio::time::sleep(Duration::from_secs(10)).await;
                        close_alerts(&app_clone);
                    });
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
fn stop_reminder(state: tauri::State<AppState>) {
    let mut sender_opt = state.sender.lock().unwrap();
    if let Some(sender) = sender_opt.take() {
        let _ = sender.try_send(());
    }
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
    let quit = CustomMenuItem::new("quit".to_string(), "退出程序");
    let show = CustomMenuItem::new("show".to_string(), "打开设置");
    let start = CustomMenuItem::new("start".to_string(), "启动提醒");
    let stop = CustomMenuItem::new("stop".to_string(), "停止提醒");
    
    let tray_menu = SystemTrayMenu::new()
        .add_item(show)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(start)
        .add_item(stop)
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(quit);
        
    let tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .manage(AppState {
            sender: Mutex::new(None),
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
                        // Default 45 mins if triggered from tray
                        start_reminder(45, app.clone(), app.state::<AppState>());
                    }
                    "stop" => {
                        stop_reminder(app.state::<AppState>());
                        close_alerts(app);
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
