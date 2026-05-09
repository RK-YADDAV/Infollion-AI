# Infollion AI

A minimal web-based chatbot powered by **Google Gemini API**. Supports text conversation, document upload (PDF/TXT), image upload (PNG/JPG), and session-based chat context.

![Tech Stack](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=flat-square)
![Tech Stack](https://img.shields.io/badge/Backend-Python%20%2B%20FastAPI-009688?style=flat-square)
![Tech Stack](https://img.shields.io/badge/AI-Google%20Gemini%20API-4285F4?style=flat-square)

---

## Features

- 💬 **Chat Interface** — Send text messages and receive AI responses
- 📄 **Document Upload** — Upload PDF/TXT files for Q&A
- 🖼️ **Image Upload** — Upload PNG/JPG images for visual analysis
- 🧠 **Chat Context** — Maintains conversation history per session
- 🔄 **New Chat / Reset** — Start fresh with a clean context
- 📋 **Chat Sidebar** — View and switch between active chats (bonus)
- ⏳ **Loading Indicators** — Visual feedback during uploads and API calls (bonus)
- 🖼️ **Image Preview** — See uploaded images inline (bonus)

---

## Project Structure

```
gemini-chatbot/
├── backend/
│   ├── main.py              # FastAPI server
│   ├── requirements.txt     # Python dependencies
│   └── .env.example         # API key template
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── App.css
│       └── components/
│           ├── ChatSidebar.jsx
│           ├── ChatWindow.jsx
│           ├── MessageBubble.jsx
│           └── InputBar.jsx
└── README.md
```

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+** and npm
- **Google Gemini API Key** — Get one at [Google AI Studio](https://aistudio.google.com/apikey)

---

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/gemini-chatbot.git
cd gemini-chatbot
```

### 2. Set Up the Backend

```bash
cd backend

# Create a virtual environment (recommended)
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure your API key
cp .env.example .env
# Edit .env and replace YOUR_GEMINI_API_KEY with your actual key
```

### 3. Set Up the Frontend

```bash
cd ../frontend

# Install dependencies
npm install
```

---

## How to Set Your Gemini API Key

1. Navigate to the `backend/` directory.
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Open `.env` in a text editor and replace the placeholder:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```
4. Save the file.

---

## Running the Application

### Start the Backend (Terminal 1)

```bash
cd backend
python main.py
```

The API server will start at **http://localhost:8000**.

### Start the Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

The app will open at **http://localhost:5173**.

> The Vite dev server proxies API requests to the FastAPI backend automatically.

---

## API Endpoints

| Method | Endpoint         | Description                          |
|--------|-----------------|--------------------------------------|
| POST   | `/chat`          | Send a message and get a response    |
| POST   | `/upload-doc`    | Upload a PDF/TXT document            |
| POST   | `/upload-image`  | Upload a PNG/JPG image               |
| POST   | `/reset`         | Start a new chat session             |
| GET    | `/chats`         | List all active chat sessions        |

---

## Example Usage

### 1. Document Q&A

1. Click the **📄** button and upload a PDF or TXT file.
2. Type: *"Summarize the document."*
3. The bot generates a summary from the extracted text.
4. Ask follow-up questions like: *"What was the third point mentioned?"*
5. The bot answers using document context + prior conversation.

### 2. Image Q&A

1. Click the **🖼️** button and upload a PNG or JPG image.
2. Type: *"What's in the image?"*
3. The bot describes the contents of the image.
4. Ask follow-ups like: *"Is there a person in the image?"*

### 3. Context Reset

1. Have a conversation or upload files.
2. Click **＋ New Chat** in the sidebar.
3. The bot starts completely fresh — no memory of previous uploads or messages.

---

## Tech Stack

| Layer     | Technology            |
|-----------|----------------------|
| Frontend  | React 18, Vite 5     |
| Backend   | Python, FastAPI      |
| AI Model  | Google Gemini 1.5 Flash |
| PDF Parsing | PyPDF2             |
| Markdown  | react-markdown       |

---

## Notes

- Chat state is stored **in memory only** — it does not persist across server restarts.
- No database, authentication, or deployment setup is required.
- The dummy API key `YOUR_GEMINI_API_KEY` must be replaced with a real key for the Gemini API to work.
