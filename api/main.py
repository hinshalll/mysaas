from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import Response
import threading
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from engines.tool_ai_formatter import generate_document
from engines.tool_json import process_json

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow Vercel preview URLs or any domain for local/production cross-origin requests
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# The digital bouncer: Keeps free-tier RAM perfectly safe
pdf_lock = threading.Lock()

class DocumentRequest(BaseModel):
    content: str
    is_html: bool
    theme: str
    export_format: str

class JsonRequest(BaseModel):
    content: str
    action: str # "Format" | "Auto-Repair" | "Minify"

@app.post("/api/json")
def format_json_endpoint(request: JsonRequest):
    try:
        # Calls the in-memory parsing and regex repair helper
        result = process_json(request.content, request.action)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/format")
def format_document(request: DocumentRequest):
    try:
        # If multiple users click download, they wait in line here
        with pdf_lock:
            file_bytes = generate_document(
                content=request.content,
                is_html=request.is_html,
                theme=request.theme,
                export_format=request.export_format
            )
        
        mime_types = {
            "pdf": "application/pdf",
            "html": "text/html",
            "txt": "text/plain",
            "md": "text/markdown"
        }
        
        media_type = mime_types.get(request.export_format.lower(), "application/octet-stream")
        if request.export_format == "docx":
            media_type = "application/msword"

        return Response(content=file_bytes, media_type=media_type)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))