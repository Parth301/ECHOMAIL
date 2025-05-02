import tempfile
import smtplib
import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
import mimetypes
import requests
from PyPDF2 import PdfReader

from db import get_db_connection
from models import EmailLog

email_bp = Blueprint("email", __name__)
ALLOWED_EXTENSIONS = {"txt", "pdf"}
UPLOAD_FOLDER = tempfile.mkdtemp()

EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS", "jaypatil1965@gmail.com")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "zcqjydkosxtpcjpj")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyB86qZ63GF9PXz6Q8EJkJPvEvv7DjrHnxw")

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    ext = file_path.rsplit(".", 1)[1].lower()
    try:
        if ext == "pdf":
            reader = PdfReader(file_path)
            return "".join(page.extract_text() or "" for page in reader.pages)
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as f:
                return f.read()
    except Exception as e:
        print(f"Error extracting text: {e}")
    return ""

def call_gemini_api(prompt):
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key={GEMINI_API_KEY}"
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {GEMINI_API_KEY}"
    }
    body = {
        "contents": [{"parts": [{"text": prompt}]}]
    }
    res = requests.post(url, headers=headers, json=body)
    data = res.json()
    return data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")

def generate_advanced_prompt(base_prompt, tone='professional', length='medium', language='English'):
    tone_mapping = {
        'professional': "Use a formal, concise, and professional tone.",
        'friendly': "Use a warm, conversational, and approachable tone.",
        'formal': "Use a highly structured and traditional formal tone.",
        'casual': "Use a relaxed, informal, and personal tone."
    }

    length_mapping = {
        'short': "Keep the email brief and to the point, under 100 words.",
        'medium': "Aim for a balanced email length, around 150-250 words.",
        'long': "Provide a comprehensive and detailed email, approximately 300-400 words."
    }

    language_mapping = {
        'English': "Write the email in standard American English.",
        'Spanish': "Write the email in standard Spanish.",
        'German': "Write the email in standard German.",
        'French': "Write the email in standard French."
    }

    return f"""
    Task: Generate an email based on the following requirements:

    Original Prompt: {base_prompt}

    Tone Guidelines: {tone_mapping.get(tone)}
    Length Specification: {length_mapping.get(length)}
    Language: {language_mapping.get(language)}

    Please generate an email that adheres to these specific guidelines.
    """

def refine_advanced_text(text, tone='professional', length='medium', language='English'):
    tone_mapping = {
        'professional': "Enhance the text to sound more professional, precise, and formal.",
        'friendly': "Modify the text to sound warmer, more conversational, and approachable.",
        'formal': "Revise the text to be more structured, traditional, and academically oriented.",
        'casual': "Adjust the text to be more relaxed, informal, and personal."
    }

    length_mapping = {
        'short': "Condense the text while preserving key information.",
        'medium': "Refine and balance the text.",
        'long': "Expand on key points and add detail where appropriate."
    }

    language_mapping = {
        'English': "Use standard American English grammar.",
        'Spanish': "Use standard Spanish.",
        'German': "Use standard German.",
        'French': "Use standard French."
    }

    return f"""
    Task: Refine the following text with specific guidelines:

    Original Text:
    {text}

    Refinement Guidelines:
    1. Tone: {tone_mapping.get(tone)}
    2. Length: {length_mapping.get(length)}
    3. Language: {language_mapping.get(language)}

    Instructions:
    - ONLY return the refined text
    - No extra explanations or formatting

    Refined Text:
    """

@email_bp.route("/generate", methods=["POST"])
@jwt_required()
@cross_origin()
def generate():
    data = request.get_json()
    user_id = get_jwt_identity()["id"]
    prompt = data.get("prompt", "")
    tone = data.get("tone", "professional")
    length = data.get("length", "medium")
    language = data.get("language", "English")

    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    try:
        advanced_prompt = generate_advanced_prompt(prompt, tone, length, language)
        response_text = call_gemini_api(advanced_prompt)

        if not response_text:
            return jsonify({"error": "Empty Gemini response"}), 500

        EmailLog(user_id, response_text, "generated")
        return jsonify({
            "email_content": response_text,
            "settings": {"tone": tone, "length": length, "language": language}
        })
    except Exception as e:
        return jsonify({"error": f"Backend error: {str(e)}"}), 500

@email_bp.route("/refine", methods=["POST"])
@jwt_required()
@cross_origin()
def refine_email():
    user_id = get_jwt_identity()["id"]
    tone = request.form.get("tone", "professional")
    length = request.form.get("length", "medium")
    language = request.form.get("language", "English")

    if "file" not in request.files and "text" not in request.form:
        return jsonify({"error": "No file or text provided"}), 400

    email_content = ""
    if "file" in request.files:
        file = request.files["file"]
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            email_content = extract_text_from_file(file_path)
            os.remove(file_path)
        else:
            return jsonify({"error": "Invalid file format"}), 400
    else:
        email_content = request.form["text"]

    if not email_content:
        return jsonify({"error": "Empty content"}), 400

    try:
        advanced_prompt = refine_advanced_text(email_content, tone, length, language)
        response_text = call_gemini_api(advanced_prompt)

        if not response_text:
            return jsonify({"error": "Empty Gemini response"}), 500

        refined_email = response_text.strip().lstrip("# ").lstrip("Refined Text:").strip()
        EmailLog(user_id, refined_email, "refined")

        return jsonify({
            "refined_email": refined_email,
            "settings": {"tone": tone, "length": length, "language": language}
        })
    except Exception as e:
        return jsonify({"error": f"Backend error: {str(e)}"}), 500

@email_bp.route("/send", methods=["POST"])
@jwt_required()
@cross_origin()
def send_email():
    user_id = get_jwt_identity()["id"]
    recipient = request.form.get("recipient")
    subject = request.form.get("subject")
    email_content = request.form.get("email_content")

    if not recipient or not subject or not email_content:
        return jsonify({"error": "Missing recipient, subject, or content"}), 400

    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(email_content, "plain"))

    if 'attachments' in request.files:
        for file in request.files.getlist('attachments'):
            if file.filename:
                mimetype, _ = mimetypes.guess_type(file.filename)
                mimetype = mimetype or 'application/octet-stream'
                maintype, subtype = mimetype.split('/', 1)
                part = MIMEBase(maintype, subtype)
                part.set_payload(file.read())
                encoders.encode_base64(part)
                part.add_header('Content-Disposition', 'attachment', filename=file.filename)
                msg.attach(part)

    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, recipient, msg.as_string())
        server.quit()

        EmailLog(user_id=user_id, email_content=email_content, action="sent")
        return jsonify({"message": "Email sent successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
