# 💬 Real-Time Chat Application

<p align="center">
  <img src="https://img.shields.io/badge/Status-Active-success?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Real--Time-WebSockets-blue?style=for-the-badge&logo=socket.io"/>
  <img src="https://img.shields.io/badge/Frontend-Next.js-black?style=for-the-badge&logo=next.js"/>
  <img src="https://img.shields.io/badge/Backend-Django-green?style=for-the-badge&logo=django"/>
</p>

<p align="center">
  ⚡ Full-stack real-time chat app with modern UI & instant messaging
</p>

---

## 🚀 Overview

This is a **full-stack real-time chat application** built using:

* ⚡ **WebSockets** for instant messaging
* 🎨 **Modern UI (Glassmorphism + Animations)**
* 🔁 **REST API + WebSocket hybrid architecture**

💡 Messages update instantly without page refresh — just like **WhatsApp / Messenger**

---

## 🎯 Key Highlights

✔️ Real-time communication using **Django Channels**
✔️ Clean and animated UI using **Framer Motion**
✔️ Full-stack architecture (Frontend + Backend + API)
✔️ Production-style project structure

---

## ✨ Features

* ⚡ Instant messaging (WebSockets)
* ⌨️ Typing indicator
* ✅ Delivered & Seen status
* 💾 Username persistence (localStorage)
* 🎨 Glassmorphism UI design
* 🎬 Smooth animations (Framer Motion)
* 📡 Load previous messages (REST API)
* 📱 Fully responsive design

---

## 🛠️ Tech Stack

### 🎨 Frontend

<p>
  <img src="https://skillicons.dev/icons?i=nextjs,react,ts,tailwind"/>
</p>

* Next.js
* React
* TypeScript
* Tailwind CSS
* Framer Motion
* Lucide Icons

---

### ⚙️ Backend

<p>
  <img src="https://skillicons.dev/icons?i=django,python"/>
</p>

* Django
* Django REST Framework
* Django Channels
* Daphne (ASGI Server)

---

### 🗄️ Database

* SQLite (Development)

---

## 🧠 Architecture

```
Client (Next.js)
        │
        ├── REST API (load old messages)
        │
        └── WebSocket (real-time messages)
                │
        Django Channels (ASGI)
                │
            Database
```

---

## 📁 Project Structure

```
Real-Time-Chat-Application
│
├── frontend
│   └── chatapp-frontend
│
├── backend
│   ├── chatproject
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

---

## ⚙️ Installation Guide

### 🔽 Clone Repository

```bash
git clone https://github.com/ramesh1290/Real-Time-Chat-Application.git
cd Real-Time-Chat-Application
```

---

## 🧠 Backend Setup

```bash
cd backend
python -m venv venv
```

### ▶️ Activate Environment

**Windows**

```bash
venv\Scripts\activate
```

**Mac/Linux**

```bash
source venv/bin/activate
```

### 📦 Install Dependencies

```bash
pip install -r requirements.txt
```

### 🛠️ Migrate Database

```bash
python manage.py migrate
```

### 🚀 Run Server

```bash
python manage.py runserver
```

📍 Backend → http://127.0.0.1:8000

---

## 🎨 Frontend Setup

```bash
cd frontend/chatapp-frontend
npm install
npm run dev
```

📍 Frontend → http://localhost:3000

---

## 🔌 WebSocket Endpoint

```
ws://127.0.0.1:8000/ws/chat/
```

---

## 🌐 API Endpoint

```
http://127.0.0.1:8000/api/messages/
```

---

## 📸 Preview

> 🚀 Add screenshots or GIF here (VERY IMPORTANT)

```
Drag & drop images here after uploading
```

---

## 🌍 Live Demo

> 🔗 Add your deployed link here

```
https://your-live-project-url.com
```

---

## 💡 Future Improvements

* 🔐 JWT Authentication
* 🔑 Google & GitHub OAuth Login
* 📎 File/Image Sharing
* 🎤 Voice Messages
* 👥 Private Chat Rooms
* 🔔 Notifications system

---

## 🧑‍💻 Author

👤 **Ramesh Chhetri Adhikari**
🚀 Full Stack Developer

---

## ⭐ Support

If you like this project:

* ⭐ Star the repo
* 🍴 Fork it
* 🚀 Share it

---

## 🔥 Final Note

This project demonstrates:

✔️ Real-time system design
✔️ WebSocket integration
✔️ Full-stack development skills
✔️ UI/UX attention

💯 *Built with consistency & real-world learning*
