import streamlit as st
import re
from ui.src.app.tools.universal_ai_formatter.engine import generate_document
from ui.src.app.tools.json_formatter_validator.engine import process_json

# --- GLOBAL CONFIGURATION ---
GLOBAL_APP_NAME = "MySaaS"

st.set_page_config(page_title=f"{GLOBAL_APP_NAME} Prototype", layout="wide")
st.sidebar.title("🛠️ SaaS Tools")

selected_tool = st.sidebar.radio(
    "Select a Tool to Test:",
    ["1. Universal AI Formatter", "2. JSON Formatter & Validator"]
)

st.sidebar.write("---")
st.sidebar.caption("Prototype Environment")

# --- HELPER: DYNAMIC FILE NAMING ---
def generate_smart_filename(text: str, extension: str) -> str:
    """Scans the text for a title and generates a clean filename."""
    match = re.search(r'^#+\s+(.*)', text, re.MULTILINE)
    
    if match:
        raw_heading = match.group(1).strip()
        clean_heading = re.sub(r'[^\w\s-]', '', raw_heading)
        words = clean_heading.split()[:3]
        topic_slug = "_".join(words)
    else:
        topic_slug = "Formatted_Document"
        
    return f"{GLOBAL_APP_NAME}_{topic_slug}.{extension.lower()}"

# --- TOOL 1: UNIVERSAL AI FORMATTER ---
if selected_tool == "1. Universal AI Formatter":
    st.title("Universal AI-to-Doc Formatter")
    st.write("Convert raw AI output into 5 premium formats with custom themes.")
    
    user_text = st.text_area("Paste your AI output here:", height=300)
    
    col1, col2 = st.columns(2)
    with col1:
        doc_theme = st.selectbox("Document Style Theme:", ["Modern (Dark Code Blocks)", "Academic (Clean)", "Minimalist"])
    with col2:
        export_format = st.selectbox("Export Format:", ["PDF", "DOCX", "HTML", "TXT", "MD"])
    
    if st.button(f"Generate {export_format}", type="primary"):
        if not user_text.strip():
            st.error("Please paste some text first!")
        else:
            with st.spinner(f"Formatting as {export_format}..."):
                try:
                    mime_types = {
                        "PDF": "application/pdf",
                        "DOCX": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                        "HTML": "text/html",
                        "TXT": "text/plain",
                        "MD": "text/markdown"
                    }
                    
                    file_bytes = generate_document(user_text, doc_theme, export_format)
                    smart_file_name = generate_smart_filename(user_text, export_format)
                    
                    st.success(f"✅ {export_format} Generated Successfully!")
                    st.download_button(
                        label=f"⬇️ Download {smart_file_name}",
                        data=file_bytes,
                        file_name=smart_file_name,
                        mime=mime_types[export_format]
                    )
                except Exception as e:
                    st.error(f"An error occurred: {e}")

# --- TOOL 2: JSON FORMATTER & VALIDATOR ---
elif selected_tool == "2. JSON Formatter & Validator":
    st.title("JSON Formatter, Validator & Repair")
    st.write("Prettify messy JSON, minify for production, or auto-repair broken payloads.")
    
    # NEW UI: Let the user choose between Pasting or Uploading
    input_method = st.radio("Input Method:", ["Paste Text", "Upload JSON File"], horizontal=True)
    
    user_json = ""
    
    if input_method == "Paste Text":
        user_json = st.text_area("Paste your JSON here:", height=250)
    else:
        uploaded_file = st.file_uploader("Drag and drop your .json file here", type=["json"])
        if uploaded_file is not None:
            # Read the file bytes and decode it back into a standard string
            user_json = uploaded_file.read().decode('utf-8')
            st.success("File loaded! Select an action below.")
    
    st.write("---")
    
    col1, col2, col3 = st.columns(3)
    with col1:
        format_btn = st.button("✨ Format & Validate", type="primary", use_container_width=True)
    with col2:
        repair_btn = st.button("🔧 Auto-Repair Broken JSON", use_container_width=True)
    with col3:
        minify_btn = st.button("📦 Minify (Compress)", use_container_width=True)
        
    action = None
    if format_btn: action = "Format"
    if repair_btn: action = "Auto-Repair"
    if minify_btn: action = "Minify"
    
    if action:
        # Pass the extracted text directly into our existing backend engine
        result = process_json(user_json, action)
        
        st.write("---")
        st.subheader("Result:")
        
        if result["status"] == "success":
            st.success("✅ Valid JSON!")
            st.code(result["output"], language="json")
            
        # --- NEW UI HANDLER FOR THE BUG FIX ---
        elif result["status"] == "already_valid":
            st.success(f"✅ {result['error_details']}")
            st.code(result["output"], language="json")
            
        elif result["status"] == "repaired":
            st.warning(f"⚠️ {result['error_details']}")
            st.code(result["output"], language="json")
            
        elif result["status"] in ["error", "fatal_error"]:
            st.error(f"❌ {result['error_details']}")
            
        if result["output"]:
            st.download_button(
                label=f"⬇️ Download {GLOBAL_APP_NAME}_Data.json",
                data=result["output"],
                file_name=f"{GLOBAL_APP_NAME}_Formatted_Data.json",
                mime="application/json"
            )