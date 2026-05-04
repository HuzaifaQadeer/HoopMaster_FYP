<div align="center">

# 🏀 HoopMaster

### AI-Powered Basketball Training & Coaching Platform

*Personalised coaching for every player. No court required.*

[![React Native](https://img.shields.io/badge/React_Native-0.73-61DAFB?style=flat-square&logo=react)](https://reactnative.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.0.3-000000?style=flat-square&logo=flask)](https://flask.palletsprojects.com/)
[![Node.js](https://img.shields.io/badge/Node.js-20.12-339933?style=flat-square&logo=nodedotjs)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-5.0-47A248?style=flat-square&logo=mongodb)](https://www.mongodb.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-FF6F00?style=flat-square&logo=google)](https://mediapipe.dev/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

</div>

---

## What is HoopMaster?

HoopMaster is a cross-platform mobile application that brings AI-driven basketball coaching to any player with a smartphone. Upload a practice video, get instant technique feedback. Join challenges, track your progress, and chat with a coaching bot — all without paying for a personal coach.

Built as a Final Year Project at **COMSATS University Islamabad** (BS Software Engineering, 2025).

---

## Features

### 🎥 AI Video Analysis
Upload drill videos and get automated feedback powered by computer vision. The system extracts your skeletal joint angles frame-by-frame, compares them against expert reference data, and returns a performance score with an annotated output video highlighting exactly where your form breaks down.

### 🏋️ Training Courses
Browse a structured library of drills and workout programmes. Set your skill level, customise your schedule, and track completion history as you progress through tiers.

### 🤖 Coaching Chatbot
A 24/7 natural-language coaching assistant that answers questions on technique, game rules, tactics, and injury guidance — contextualised to your training history and performance data.

### 🏆 Community & Challenges
A social hub with community challenges, leaderboards, achievement badges, and a social feed. Post your progress, compete with other players, and get voted up by the community.

### 📊 Athlete Portfolio
Track and showcase your stats — training hours, field-goal percentage, vertical jump — alongside achievements, social links, and team affiliation. Set it public or private.

### 💳 Subscription Management
Free tier with ads. Premium tier with full access. Secure in-app payment processing via Stripe.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Mobile App | React Native 0.73 (iOS & Android) |
| Admin Dashboard | Next.js 14.2 |
| API Gateway | Node.js 20.12 + Express 4.19 |
| AI Microservice | Python + Flask 3.0.3 |
| Database | MongoDB 5.0 |
| Video Processing | OpenCV 7.0 |
| Pose Estimation | MediaPipe Pose |
| ML Framework | PyTorch 2.6.0 |
| Auth | JWT (access + refresh token rotation) |
| Payments | Stripe SDK |
| Push Notifications | Firebase Cloud Messaging |
| Storage | AWS S3-compatible object storage |
| Chatbot | OpenAI API (prompt-engineered for basketball domain) |
| Design | Figma |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│               React Native Mobile App               │
│                  (iOS & Android)                    │
└────────────────────┬────────────────────────────────┘
                     │ REST / HTTPS
┌────────────────────▼────────────────────────────────┐
│            Node.js / Express API Gateway            │
│         JWT Auth  ·  Routing  ·  Rate Limiting      │
└──────┬──────────────────────┬───────────────────────┘
       │                      │
┌──────▼──────┐       ┌───────▼──────────────────────┐
│  Domain     │       │     Flask AI Microservice     │
│  Services   │       │                              │
│  ─────────  │       │  OpenCV  →  MediaPipe Pose   │
│  Users      │       │     ↓                        │
│  Courses    │       │  Joint Angle Extraction       │
│  Community  │       │     ↓                        │
│  Portfolio  │       │  PyTorch Scoring Model        │
│  Payments   │       │     ↓                        │
└──────┬──────┘       │  Annotated Video Output       │
       │              └───────────────────────────────┘
┌──────▼──────┐
│   MongoDB   │
│  (Primary   │
│  Data Store)│
└─────────────┘
```

---

## AI Pipeline — How It Works

1. **Frame Extraction** — OpenCV samples the uploaded video at 30fps
2. **Pose Estimation** — MediaPipe Pose detects 33 skeletal landmarks per frame
3. **Joint Angle Computation** — Time-series of angles computed for shoulder, elbow, wrist, hip, knee, and ankle joints
4. **Reference Comparison** — Observed curves compared against expert-derived reference curves for the target drill type
5. **Scoring** — A performance score (0–100) is generated alongside a ranked list of corrective suggestions
6. **Output** — Annotated video returned with skeleton overlay and highlighted deviations


---

## Getting Started

### Prerequisites

- Node.js 20+
- Python 3.10+
- MongoDB 5.0+
- React Native CLI
- Android Studio / Xcode

### 1. Clone the repository

```bash
git clone https://github.com/AunAfzal/HoopMaster.git
cd hoopmaster
```

### 2. Set up the API Gateway

```bash
cd api-gateway
npm install
cp .env.example .env
# Fill in your MongoDB URI, JWT secret, Stripe keys, FCM credentials
npm run dev
```

### 3. Set up the AI Microservice

```bash
cd ai-service
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# Fill in your OpenAI API key and storage credentials
flask run
```

### 4. Set up the Mobile App

```bash
cd mobile
npm install
# iOS
cd ios && pod install && cd ..
npx react-native run-ios
# Android
npx react-native run-android
```

### 5. Set up the Admin Dashboard

```bash
cd admin-dashboard
npm install
npm run dev
```

---

## Environment Variables

### API Gateway `.env`
```
MONGODB_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
STRIPE_SECRET_KEY=
FCM_SERVER_KEY=
AI_SERVICE_URL=http://localhost:5000
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

### AI Service `.env`
```
OPENAI_API_KEY=
S3_BUCKET=
S3_ACCESS_KEY=
S3_SECRET_KEY=
```

---

## Modules Overview

| Module | Description |
|---|---|
| Video Drill Assessment | Analyses uploaded drill clips, scores technique, returns annotated video |
| Game Performance Analysis | Extracts per-player stats from unstructured game footage |
| Training Courses | Structured drill library with skill-level progression |
| Social Hub | Feed, posts, comments, community challenges, leaderboards |
| Coaching Chatbot | NLP-based coaching assistant contextualised to user history |
| Athlete Portfolio | Personal stats dashboard with public/private visibility |
| Subscription Management | Free/premium tiers, Stripe payments, admin discount controls |
| Admin Dashboard | Content moderation, challenge management, analytics |

---

## Team

| Name | Role |
|---|---|
| Raja Huzaifa Qadeer Dhanyal | AI Pipeline, Video Analysis, Backend Microservices |
| Muhammad Aun Afzal | Mobile App, API Gateway, Database Design |

**Supervisor:** Mr. Amir Shabbir Pare
**Institution:** COMSATS University Islamabad — Department of Computer Science
**Year:** 2025

---


<div align="center">
  <sub>Built with 🏀 at COMSATS University Islamabad · 2025</sub>
</div>
