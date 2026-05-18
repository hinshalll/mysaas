import markdown
import re
import html
from playwright.sync_api import sync_playwright

def generate_document(content: str, is_html: bool, theme: str, export_format: str) -> bytes:
    if is_html:
        html_body = content 
    else:
        html_body = markdown.markdown(content, extensions=['fenced_code', 'tables'])

    theme_css = ""
    if theme == "academic":
        theme_css = """
        body { font-family: 'Georgia', serif; line-height: 1.7; color: #333; font-size: 11pt; padding: 1in; }
        h1 { font-size: 24pt; font-weight: bold; margin-bottom: 6px; }
        h2 { font-size: 16pt; font-style: italic; border-bottom: 1px solid #ccc; margin-top: 24px; }
        blockquote { border-left: 3px solid #666; padding-left: 12px; font-style: italic; color: #555; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt; }
        th, td { border: 1px solid #444; padding: 10px; text-align: left; }
        th { background-color: #f4f4f4; font-weight: bold; }
        """
    elif theme == "minimalist":
        theme_css = """
        body { font-family: 'Courier New', monospace; line-height: 1.5; color: #000; font-size: 10pt; padding: 1in; }
        h1 { font-size: 18pt; text-transform: uppercase; border-bottom: 1px dashed #000; padding-bottom: 10px; }
        h2 { font-size: 14pt; margin-top: 20px; }
        blockquote { border-left: 1px dashed #000; padding-left: 10px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { border: 1px dashed #000; padding: 8px; text-align: left; }
        th { font-weight: bold; border-bottom: 2px solid #000; }
        """
    else: # modern
        theme_css = """
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #222; font-size: 11pt; padding: 1in; }
        h1 { font-size: 28pt; font-weight: 700; letter-spacing: -0.02em; color: #111; margin-bottom: 10px; }
        h2 { font-size: 18pt; font-weight: 600; color: #333; margin-top: 24px; }
        blockquote { border-left: 4px solid #6366f1; padding-left: 16px; font-style: italic; background: #f8fafc; padding: 10px 16px; }
        code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
        pre { background: #1e293b; color: #fff; padding: 16px; border-radius: 8px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; margin: 24px 0; font-size: 10.5pt; border-radius: 8px; overflow: hidden; }
        th, td { border: 1px solid #e2e8f0; padding: 12px 16px; text-align: left; }
        th { background-color: #f8fafc; font-weight: 600; color: #0f172a; }
        tr:nth-child(even) { background-color: #fbfcfd; }
        """

    full_html = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>{theme_css}</style></head>
    <body>{html_body}</body>
    </html>
    """

    if export_format == "pdf":
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.set_content(full_html)
            pdf_bytes = page.pdf(format="A4", print_background=True)
            browser.close()
            return pdf_bytes
            
    elif export_format in ["html", "docx"]:
        return full_html.encode('utf-8')
    elif export_format == "txt":
        text_only = re.sub(r'<[^>]+>', '', html_body)
        return html.unescape(text_only).encode('utf-8')
    else:
        return content.encode('utf-8')