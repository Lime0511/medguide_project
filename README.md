# MedGuide — Medication Reminder Application

MedGuide is a cross-platform mobile application built with **Ionic + Angular + Capacitor** that helps users manage and track their medication schedules.  
Users can create reminders, edit schedules, receive alerts, and visually manage all medications in a clean, modern interface.


## Key Features

### **Medication Management**
- Add new medication reminders  
- Choose times, names, and dosage  
- Edit or delete reminders  
- Bulk-select reminders for mass deletion  

### **Schedule Overview**
- Homepage displays all active reminders  
- Real-time updates whenever a reminder is edited  
- Clean UI with color coding  

### **Reminder Alerts**
- Local notifications (per-device)  
- Reminders persist even if the app restarts  

### **User Interface**
- Uses Ionic components for consistent cross-platform UI  
- Custom fonts and styles  
- Supports light and dark mode  
- Clean, simple, and accessible design  



## Installation & Setup Guide
Follow these steps to set up and run the MedGuide application on your development machine.

### 1. Install Node.js (Required)
Download and install the latest LTS version of Node.js:  
https://nodejs.org/

This installs:
- Node.js  
- npm (Node Package Manager)

Verify:
```bash
node -v
npm -v

### 2. Install Python

Download from: https://www.python.org/downloads/

Verify in Terminal with:
python --version

### 3. Install the Ionic CLI (Global)

in Terminal with:
npm install -g @ionic/cli

Check version:

ionic -v

### 4. Navigate Into the Project Folder

in Terminal:

C:\Users\YourName\Downloads\foldername


### 5. Install Project Dependencies

npm install

### 6. Sync Capacitor (For Android/iOS builds)

npx cap sync

### 7. Run the Application in Browser

ionic serve
