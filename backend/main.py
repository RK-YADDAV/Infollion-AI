import uuid
import base64
import io
import os
from typing import Optional

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from google import genai
from google.genai import types
from PyPDF2 import PdfReader
from PIL import Image

# Load environment variables (API key)
load_dotenv()

# Read the API key from the .env file securely
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Fail fast if the API key is missing
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY is not set. Please check your .env file.")

# Initialize the new Google GenAI client
client = genai.Client(api_key=GEMINI_API_KEY)

# In-memory dictionary to store chat contexts
sessions: dict = {}

# Initialize the FastAPI backend app
app = FastAPI(title="Gemini Chatbot API")

# Allow requests from any origin (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def _get_or_create_session(chat_id: Optional[str] = None) -> tuple[str, dict]:
    # Reuse the session if the user already has one
    if chat_id and chat_id in sessions:
        return chat_id, sessions[chat_id]
    
    # Create a new session with a unique UUID if none exists
    new_id = chat_id or str(uuid.uuid4())
    sessions[new_id] = {
        "history": [],
        "doc_text": None,
        "image_data": None,
        "image_mime": None,
    }
    return new_id, sessions[new_id]

@app.post("/chat")
async def chat(chat_id: str = Form(None), message: str = Form(...)):
    # Retrieve the existing session or start a new one
    cid, session = _get_or_create_session(chat_id)
    
    # This list will hold the prompt, images, documents, and history
    parts: list = []

    # Inject the PDF or Text document context if one was uploaded
    if session["doc_text"]:
        parts.append(f"[Uploaded Document Context]\n{session['doc_text']}\n[End Document Context]\n\n")

    # Inject the uploaded image into the generation request using the new SDK types
    if session["image_data"]:
        parts.append(
            types.Part.from_bytes(
                data=session["image_data"],
                mime_type=session["image_mime"],
            )
        )

    # Reconstruct the prior conversation turns to give the model context
    history_text = ""
    for msg in session["history"]:
        role = "User" if msg["role"] == "user" else "Assistant"
        history_text += f"{role}: {msg['text']}\n"

    # Add the history to the prompt if it exists
    if history_text:
        parts.append(f"[Conversation History]\n{history_text}[End History]\n\n")

    # Add the newest message from the user
    parts.append(f"User: {message}")
    
    # Save the user's message to memory
    session["history"].append({"role": "user", "text": message})

    try:
        # Call the Gemini 2.5 Flash model explicitly using the client
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=parts,
        )
        bot_text = response.text
    except Exception as e:
        # Gracefully capture any API errors for debugging
        bot_text = f"⚠️ Gemini API error: {str(e)}"

    # Save the assistant's reply to memory
    session["history"].append({"role": "bot", "text": bot_text})
    
    return {"chat_id": cid, "reply": bot_text}

@app.post("/upload-doc")
async def upload_doc(chat_id: str = Form(None), file: UploadFile = File(...)):
    # Retrieve the user's session
    cid, session = _get_or_create_session(chat_id)
    filename = file.filename.lower()
    raw = await file.read()

    # Parse PDFs by extracting text from each page
    if filename.endswith(".pdf"):
        try:
            reader = PdfReader(io.BytesIO(raw))
            text = "\n".join(page.extract_text() or "" for page in reader.pages)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Failed to read PDF: {e}")
    # Decode plain text files
    elif filename.endswith(".txt"):
        text = raw.decode("utf-8", errors="replace")
    else:
        raise HTTPException(status_code=400, detail="Only PDF and TXT files are supported.")

    # Save the parsed text into the session memory
    session["doc_text"] = text
    # Inject a system notification into the history so the model knows a file was uploaded
    session["history"].append({"role": "bot", "text": f"📄 Document **{file.filename}** uploaded successfully."})
    
    return {"chat_id": cid, "filename": file.filename, "char_count": len(text)}

@app.post("/upload-image")
async def upload_image(chat_id: str = Form(None), file: UploadFile = File(...)):
    # Retrieve the user's session
    cid, session = _get_or_create_session(chat_id)
    filename = file.filename.lower()
    
    # Reject unsupported image types
    if not (filename.endswith(".png") or filename.endswith(".jpg") or filename.endswith(".jpeg")):
        raise HTTPException(status_code=400, detail="Only PNG and JPG images are supported.")

    raw = await file.read()

    # Validate that the uploaded bytes form an actual image
    try:
        img = Image.open(io.BytesIO(raw))
        img.verify()
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    # Determine the correct MIME type
    mime = "image/png" if filename.endswith(".png") else "image/jpeg"
    # Store raw bytes and MIME type in memory for later generation calls
    session["image_data"] = raw
    session["image_mime"] = mime
    
    # Generate a base64 string so the frontend can preview the uploaded image
    b64 = base64.b64encode(raw).decode("utf-8")
    
    # Inject a system notification into the history
    session["history"].append({"role": "bot", "text": f"🖼️ Image **{file.filename}** uploaded successfully."})

    return {
        "chat_id": cid,
        "filename": file.filename,
        "preview": f"data:{mime};base64,{b64}",
    }

@app.post("/reset")
async def reset(chat_id: str = Form(None)):
    # Delete the user's session from the dictionary to clear history and uploads
    if chat_id and chat_id in sessions:
        del sessions[chat_id]
    new_id, _ = _get_or_create_session()
    return {"chat_id": new_id}

@app.get("/chats")
async def list_chats():
    result = []
    # Loop through all sessions and grab the first message to use as a preview title
    for cid, s in sessions.items():
        first_msg = next((m["text"] for m in s["history"] if m["role"] == "user"), "New Chat")
        result.append({"chat_id": cid, "preview": first_msg[:60]})
    return result

if __name__ == "__main__":
    import uvicorn
    # Start the server on port 8000
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)