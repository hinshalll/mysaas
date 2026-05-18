import json
import re
from typing import Dict, Any

def process_json(raw_text: str, action: str = "Format") -> Dict[str, Any]:
    result = {
        "status": "success",
        "output": "",
        "error_details": None
    }

    if not raw_text.strip():
        result["status"] = "error"
        result["error_details"] = "Input is empty. Please paste some JSON."
        return result

    try:
        # 1. Try to parse it normally
        parsed_json = json.loads(raw_text)
        
        # --- THE BUG FIX IS HERE ---
        if action in ["Format", "Auto-Repair"]:
            # If they clicked Repair, but it's ALREADY valid, just format it!
            result["output"] = json.dumps(parsed_json, indent=4)
            if action == "Auto-Repair":
                result["status"] = "already_valid"
                result["error_details"] = "JSON was already valid! No repairs needed."
                
        elif action == "Minify":
            result["output"] = json.dumps(parsed_json, separators=(',', ':'))
            
    except json.JSONDecodeError as e:
        if action != "Auto-Repair":
            result["status"] = "error"
            result["error_details"] = f"Syntax Error at Line {e.lineno}, Column {e.colno}: {e.msg}"
            return result
            
        try:
            repaired_text = re.sub(r"(?<!\\)'", '"', raw_text)
            repaired_text = re.sub(r",(\s*[\]}])", r"\1", repaired_text)
            repaired_text = re.sub(r'([{,]\s*)([A-Za-z0-9_]+)(\s*:)', r'\1"\2"\3', repaired_text)

            parsed_repaired = json.loads(repaired_text)
            
            result["output"] = json.dumps(parsed_repaired, indent=4)
            result["status"] = "repaired"
            result["error_details"] = "Auto-Repair successful! Trailing commas or quote errors were fixed."
            
        except json.JSONDecodeError as repair_error:
            result["status"] = "fatal_error"
            result["error_details"] = f"JSON is severely broken. Could not auto-repair. Error: {repair_error.msg}"

    return result