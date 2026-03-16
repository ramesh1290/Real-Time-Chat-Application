# Real-Time Chat Application

A **Real-Time Chat Application** built using **WebSockets** with a modern animated UI.

This project demonstrates how to build a **full-stack real-time system** using a **Next.js frontend** and **Django Channels backend**.

Users can send and receive messages instantly without refreshing the page.

---

# Features

* Real-time messaging using **WebSockets**
* Typing indicator
* Message **Delivered / Seen** status
* Username stored in **localStorage**
* Modern **Glassmorphism UI**
* Smooth **Framer Motion animations**
* REST API to load previous messages
* Responsive design for desktop and mobile

---

# Tech Stack

## Frontend

* Next.js
* React
* TypeScript
* TailwindCSS
* Framer Motion
* Lucide Icons

## Backend

* Django
* Django REST Framework
* Django Channels
* Daphne (ASGI server)

## Database

* SQLite (development)

---

# Project Structure

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

# Installation

## Clone the repository

```
git clone https://github.com/ramesh1290/Real-Time-Chat-Application.git
cd Real-Time-Chat-Application
```

---

# Backend Setup (Django)

Navigate to backend folder:

```
cd backend
```

Create virtual environment:

```
python -m venv venv
```

Activate virtual environment

### Windows

```
venv\Scripts\activate
```

### Mac / Linux

```
source venv/bin/activate
```

Install dependencies:

```
pip install -r requirements.txt
```

Run migrations:

```
python manage.py migrate
```

Start Django server:

```
python manage.py runserver
```

Backend will run at:

```
http://127.0.0.1:8000
```

---

# Frontend Setup (Next.js)

Navigate to frontend folder:

```
cd frontend/chatapp-frontend
```

Install dependencies:

```
npm install
```

Run development server:

```
npm run dev
```

Frontend will run at:

```
http://localhost:3000
```

---

# WebSocket Endpoint

```
ws://127.0.0.1:8000/ws/chat/
```

Used for real-time communication between clients.

---

# API Endpoint

Load previous chat messages:

```
http://127.0.0.1:8000/api/messages/
```

---


