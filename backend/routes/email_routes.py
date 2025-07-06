import smtplib
import os
import fitz  # PyMuPDF
import docx  # python-docx
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
from db import get_db_connection
from models import EmailLog  
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from email.mime.base import MIMEBase
from email import encoders
import mimetypes

email_bp = Blueprint("email", __name__)

# Allowed file extensions and upload folder
ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Environment variables
EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS", "jaypatil1965@gmail.com")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "zcqjydkosxtpcjpj")
GEMINI_API_KEY = "AIzaSyBq7sDIOg7hyww-mmKdNRk8u8CC5cYP--w"
genai.configure(api_key=GEMINI_API_KEY)
GEMINI_MODEL = "models/gemini-2.5-pro"

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    ext = file_path.rsplit(".", 1)[1].lower()
    try:
        if ext == "pdf":
            doc = fitz.open(file_path)
            return "\n".join([page.get_text() for page in doc])
        elif ext == "docx":
            docx_file = docx.Document(file_path)
            return "\n".join([para.text for para in docx_file.paragraphs])
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as file:
                return file.read()
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return ""

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

    Important Instructions:
    - ONLY return the generated text
    - Do NOT include any explanations, comments, or suggestions
    - No metadata or extra formatting
    """

def refine_advanced_text(text, tone='professional', length='medium', language='English'):
    tone_mapping = {
        'professional': "Enhance the text to sound more professional, precise, and formal.",
        'friendly': "Modify the text to sound warmer, more conversational, and approachable.",
        'formal': "Revise the text to be more structured, traditional, and academically oriented.",
        'casual': "Adjust the text to be more relaxed, informal, and personal."
    }
    length_mapping = {
        'short': "Condense the text while preserving key information. Aim to reduce overall length.",
        'medium': "Refine and balance the text, ensuring it's neither too brief nor too verbose.",
        'long': "Expand on key points, add more context and detail where appropriate."
    }
    language_mapping = {
        'English': "Ensure the text follows standard American English grammar and style.",
        'Spanish': "Adapt the text to standard Spanish language conventions.",
        'German': "Modify the text to align with standard German language guidelines.",
        'French': "Revise the text to conform to standard French language rules."
    }
    return f"""
    Task: Refine the following text with specific guidelines:

    Original Text:
    {text}

    Guidelines:
    1. Tone: {tone_mapping.get(tone)}
    2. Length: {length_mapping.get(length)}
    3. Language: {language_mapping.get(language)}

    Important Instructions:
    - ONLY return the refined text
    - No headers, markdown, or extra content
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
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(generate_advanced_prompt(prompt, tone, length, language))
        if not response.text:
            return jsonify({"error": "Empty response from Gemini"}), 500
        EmailLog(user_id, response.text, "generated")
        return jsonify({
            "email_content": response.text,
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
    elif "text" in request.form:
        email_content = request.form["text"]

    if not email_content:
        return jsonify({"error": "Empty content"}), 400

    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        prompt = refine_advanced_text(email_content, tone, length, language)
        response = model.generate_content(prompt)
        if not response.text:
            return jsonify({"error": "Empty response from Gemini"}), 500

        refined = response.text.strip().lstrip('# ').lstrip('Refined Text:').strip()
        EmailLog(user_id, refined, "refined")
        return jsonify({
            "refined_email": refined,
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
        return jsonify({"error": "Missing recipient, subject, or email content"}), 400

    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(email_content, "plain"))

    if 'attachments' in request.files:
        for file in request.files.getlist('attachments'):
            if file.filename:
                mimetype, _ = mimetypes.guess_type(file.filename)
                if not mimetype:
                    mimetype = 'application/octet-stream'
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
        EmailLog(user_id, email_content, "sent")
        return jsonify({"message": "Email sent successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
