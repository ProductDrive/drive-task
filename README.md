# Drive Task App

A modern, minimalist task manager built with **React Native (Expo)**. Create, edit, and manage tasks with alarms — plus seamless import of tasks from your **Google Calendar**.

---

## ✨ Features

✅ Inline editing of task titles and descriptions  
✅ Task prioritization ⭐  
✅ Alarm-style local notifications  
✅ Date & time picker (AM/PM format)  
✅ Repeat & Share tasks  
✅ Import Google Calendar events  
✅ Offline-friendly (local storage)  

---

## 🖼️ Demo

> Coming soon: Add your own GIF or screenshots

---

## 📦 Tech Stack

- **React Native + Expo**
- **TypeScript**
- **AsyncStorage** – local task persistence
- **@react-native-community/datetimepicker**
- **expo-notifications** – for alarms
- **expo-auth-session** – Google sign-in
- **Google Calendar API**

---

## 📲 Setup Instructions

### 1. **Clone the Repository**
```bash
git clone https://github.com/your-username/task-alarm-app.git
cd task-alarm-app
```

### 2. **Install Dependencies**
```bash
npm install
# or
yarn
```

### 3. **Setup Google OAuth**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Enable **Google Calendar API**
- Create OAuth Client ID for **Web App**
- Use redirect URI:
  ```
  https://auth.expo.io/@your-username/your-app-slug
  ```

### 4. **Add Your Google Credentials**

In `utils/googleAuth.ts`:
```ts
const clientId = 'YOUR_CLIENT_ID.apps.googleusercontent.com';
```

---

## 🚀 Run the App

### In development:
```bash
npx expo start
```

> Scan the QR code with Expo Go (iOS/Android)

---

## 🔔 Notifications

Tasks trigger **alarm-like notifications** when due.  
You must grant notification permission on first launch.

### Schedule logic:
- Tasks created or imported will automatically schedule a local alarm
- Tasks with due date in the past are ignored
- Cancelling/rescheduling a task will cancel/reschedule its notification

---

## 🔑 Google Calendar Sync

### Import Tasks:
- Press 📥 `Import Google Calendar` button in the app
- Sign in with Google
- Upcoming events are converted into local tasks
- Tasks retain their due dates and titles

---

## 🧪 Testing

- All task CRUD operations work offline
- Google Calendar requires an active internet connection
- Notifications tested on:
  - Android (alarm trigger, background & foreground)
  - iOS (make sure to enable notifications in settings)

---

## 📁 Project Structure

```
.
├── App.tsx
├── utils/
│   ├── storage.ts          # load/save tasks
│   ├── taskModel.ts        # Task type
│   ├── notification.ts     # Notification scheduling
│   ├── googleAuth.ts       # OAuth logic
│   └── calendarService.ts  # Pull calendar events
├── components/
│   └── TaskCard.tsx        # (optional) reusable task component
└── screens/
    └── HomeScreen.tsx
```

---

## 📌 Roadmap

- [ ] iCloud / Google Drive sync
- [ ] Tag-based sorting
- [ ] Calendar view of tasks
- [ ] Search and filters
- [ ] Dark mode toggle

---

## 🧑‍💻 Author

**Afe Kunle**  
📧 your@email.com  
🔗 [LinkedIn](https://linkedin.com/in/yourprofile)  
🐦 [Twitter](https://twitter.com/yourhandle)

---

## 🪪 License

MIT License. Feel free to use, fork, or contribute!
