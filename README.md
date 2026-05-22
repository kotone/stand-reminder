# 站立提醒 (Stand Reminder)

<p align="center">
  <img src="src-tauri/icons/icon.png" alt="Stand Reminder Logo" width="128" height="128">
</p>

<p align="center">
  <strong>一个轻量级、优雅、智能的 Windows 桌面久坐提醒工具</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Tauri-1.5-blue.svg?style=flat-square&logo=tauri" alt="Tauri">
  <img src="https://img.shields.io/badge/Rust-2021-orange.svg?style=flat-square&logo=rust" alt="Rust">
  <img src="https://img.shields.io/badge/Platform-Windows-0078d7.svg?style=flat-square&logo=windows" alt="Windows">
  <img src="https://img.shields.io/badge/License-GPL--3.0-blue.svg?style=flat-square" alt="License">
</p>

---

## 🌟 项目简介

**Stand Reminder (站立提醒)** 是一款专为久坐办公族、开发者及电脑重度使用者设计的桌面健康守护工具。基于 **Tauri + Rust + Vanilla JS** 构建，它在保持极低系统资源占用的同时，通过极具现代感与艺术感的视觉动效，温柔、无感地引导你在长时间工作后起身活动，缓解身心疲劳。

---

## ✨ 核心特性

### 🎨 多主题与沉浸式引导
应用内置了多种精心设计的艺术风格，每种风格都配有专门定制的 **动态引导动画** 和 **主题专属漂浮粒子背景**。

### 🧠 智能锁屏与状态感知
*   **锁屏自动重置**：程序会在后台智能监测系统的锁定状态。当你锁屏离开电脑（例如去接水或开会）时，**计时器会自动重置并暂停**，当你返回并解锁电脑时重新开始计时，彻底杜绝“假警报”。
*   **多显示器完美适配**：利用 Windows 底层 API 动态枚举所有显示器的屏幕布局，精准计算每个屏幕的工作区边界（排除任务栏），让提醒光晕和粒子效果在所有显示器上同步完美呈现。

### 🔋 极简托盘与超低占用
*   **完整托盘控制**：支持系统右下角托盘控制。右键菜单提供“打开设置”、“启动/停止提醒”、“下一次（重新计时）”和“退出”功能。
*   **一键触达**：鼠标左键单击托盘图标即可快速唤起主设置面板。
*   **超低资源消耗**：得益于 Rust 和 Tauri 的优秀架构，程序运行内存占用极小，轻量无感。

---

## 🚀 安装与使用

> 下载地址: [https://github.com/kotone/stand-reminder/actions]

### 运行环境
*   **操作系统**：Windows 10 / Windows 11 (x64)
*   **系统组件**：由于基于 Tauri 开发，程序依赖 Windows 系统的 **WebView2 Runtime**。若系统未安装，程序在启动时会弹出友好提示并引导下载。

### 快捷控制说明
*   **启动提醒**：开始按照设定的时间周期进行倒计时。
*   **停止提醒**：随时暂停计时，并立即清理屏幕上的所有提醒光晕与卡片。
*   **下一次**：在提醒中或计时中，若你已经提前活动完毕，可随时点击“下一次”以立即重置计时，开启新一轮的倒计时。

---

## 🛠️ 开发者指南

如果你想自行编译或在此项目基础上进行二次开发，请参考以下指南。

### 前置要求
1.  安装 [Node.js](https://nodejs.org/) (推荐 LTS 版本)。
2.  安装 [Rust 与 Cargo](https://www.rust-lang.org/tools/install) (配置好 Windows MSVC 构建环境)。
3.  （可选）若在国内，建议配置 Cargo 和 NPM 的镜像源以加速依赖下载。

### 开发与构建步骤
```bash
# 1. 克隆仓库并进入项目根目录
cd stand-reminder

# 2. 安装前端依赖
npm install

# 3. 启动开发模式（支持热重载，便于调试 UI）
npm run tauri dev

# 4. 打包构建 Windows 安装程序 (.msi / .exe)
npm run tauri build
```
