import smtplib
import os
import pdfplumber
import docx
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import google.generativeai as genai
from db import get_db_connection
from models import EmailLog  
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask_cors import cross_origin
from werkzeug.utils import secure_filename
from email.mime.application import MIMEApplication
from email.mime.base import MIMEBase
from email import encoders
import mimetypes

email_bp = Blueprint("email", __name__)

# Allowed file extensions and upload folder
ALLOWED_EXTENSIONS = {"txt", "pdf", "docx"}
UPLOAD_FOLDER = "uploads"

# Ensure the upload folder exists
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Load sensitive data from environment variables
EMAIL_ADDRESS = os.environ.get("EMAIL_ADDRESS", "jaypatil1965@gmail.com")
EMAIL_PASSWORD = os.environ.get("EMAIL_PASSWORD", "zcqjydkosxtpcjpj")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyB86qZ63GF9PXz6Q8EJkJPvEvv7DjrHnxw")

# Configure Google Gemini
genai.configure(api_key=GEMINI_API_KEY)

# Select the correct Gemini model
GEMINI_MODEL = "models/gemini-1.5-pro-002"

def allowed_file(filename):
    """
    Check if the file extension is allowed
    """
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

def extract_text_from_file(file_path):
    """
    Extract text content from different file types
    """
    ext = file_path.rsplit(".", 1)[1].lower()
    try:
        if ext == "pdf":
            with pdfplumber.open(file_path) as pdf:
                return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
        elif ext == "docx":
            doc = docx.Document(file_path)
            return "\n".join([para.text for para in doc.paragraphs])
        elif ext == "txt":
            with open(file_path, "r", encoding="utf-8") as file:
                return file.read()
    except Exception as e:
        print(f"Error extracting text from {file_path}: {e}")
    return ""

def generate_advanced_prompt(base_prompt, tone='professional', length='medium', language='English'):
    """
    Generate an enhanced prompt with advanced settings
    """
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
        'Spanish': "Write the email in standard spanish.",
        'German': "Write the email in standard german.",
        'French': "Write the email in standard french."
    }

    # Construct advanced prompt
    advanced_prompt = f"""
    Task: Generate an email based on the following requirements:

    Original Prompt: {base_prompt}

    Tone Guidelines: {tone_mapping.get(tone, tone_mapping['professional'])}

    Length Specification: {length_mapping.get(length, length_mapping['medium'])}

    Language: {language_mapping.get(language, language_mapping['English'])}

    Please generate an email that adheres to these specific guidelines.
    """

    return advanced_prompt

def refine_advanced_text(text, tone='professional', length='medium', language='English'):
    """
    Refine text with advanced settings
    """
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
        'Spanish': "Adapt the text to standard spanish language conventions.",
        'German': "Modify the text to align with standard german language guidelines.",
        'French': "Revise the text to conform to standard french language rules."
    }

    # Construct advanced refinement prompt
    advanced_prompt = f"""
    Task: Refine the following text with specific guidelines:

    Original Text:
    {text}

    Refinement Guidelines:
    1. Tone: {tone_mapping.get(tone, tone_mapping['professional'])}
    2. Length Adjustment: {length_mapping.get(length, length_mapping['medium'])}
    3. Language Styling: {language_mapping.get(language, language_mapping['English'])}

    Important Instructions:
    - ONLY return the refined text
    - Do NOT include any additional explanations, comments, or suggestions
    - Provide ONLY the refined email/text content
    - No metadata or extra information should be included

    Refined Text:
    """

    return advanced_prompt

@email_bp.route("/generate", methods=["POST"])
@jwt_required()
@cross_origin()
def generate():
    data = request.get_json()
    user_id = get_jwt_identity()["id"]  # Get user ID from JWT token

    # Extract advanced settings with default values
    prompt = data.get("prompt", "")
    tone = data.get("tone", "professional")
    length = data.get("length", "medium")
    language = data.get("language", "English")

    if not prompt:
        return jsonify({"error": "Missing prompt"}), 400

    try:
        # Generate advanced prompt
        advanced_prompt = generate_advanced_prompt(prompt, tone, length, language)
        
        model = genai.GenerativeModel(GEMINI_MODEL)
        response = model.generate_content(advanced_prompt)
        
        if not response.text:
            return jsonify({"error": "Gemini API returned empty response"}), 500
        
        # Log the generated email into the database
        EmailLog(user_id, response.text, "generated")

        return jsonify({
            "email_content": response.text,
            "settings": {
                "tone": tone,
                "length": length,
                "language": language
            }
        })

    except Exception as e:
        print(f"🔥 Error in generate(): {str(e)}")
        return jsonify({"error": f"Backend error: {str(e)}"}), 500

@email_bp.route("/refine", methods=["POST"])
@jwt_required()
@cross_origin()
def refine_email():
    user_id = get_jwt_identity()["id"]

    # Extract advanced settings
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
            os.remove(file_path)  # Clean up
        else:
            return jsonify({"error": "Invalid file format"}), 400

    elif "text" in request.form:
        email_content = request.form["text"]

    if not email_content:
        return jsonify({"error": "Could not extract content"}), 400

    # Use Gemini AI to refine the email with advanced settings
    try:
        model = genai.GenerativeModel(GEMINI_MODEL)
        
        # Generate advanced refinement prompt
        advanced_prompt = refine_advanced_text(email_content, tone, length, language)
        
        response = model.generate_content(advanced_prompt)

        if not response.text:
            return jsonify({"error": "Gemini API returned empty response"}), 500

        # Additional processing to ensure only refined text is returned
        refined_email = response.text.strip()
        
        # Optional: Additional cleaning if needed
        # Remove any potential markdown-style headers or formatting
        refined_email = refined_email.lstrip('# ').lstrip('Refined Text:').strip()

        # Log the refinement action
        EmailLog(user_id, refined_email, "refined")

        return jsonify({
            "refined_email": refined_email,
            "settings": {
                "tone": tone,
                "length": length,
                "language": language
            }
        })

    except Exception as e:
        return jsonify({"error": f"Backend error: {str(e)}"}), 500

# Existing send_email route remains the same
@email_bp.route("/send", methods=["POST"])
@jwt_required()
@cross_origin()
def send_email():
    user_id = get_jwt_identity()["id"]
    
    # Handle form data instead of JSON for file uploads
    recipient = request.form.get("recipient")
    subject = request.form.get("subject")
    email_content = request.form.get("email_content")
    
    if not recipient or not subject or not email_content:
        return jsonify({"error": "Missing recipient, subject, or email content"}), 400

    # Prepare email
    msg = MIMEMultipart()
    msg["From"] = EMAIL_ADDRESS
    msg["To"] = recipient
    msg["Subject"] = subject
    msg.attach(MIMEText(email_content, "plain"))
    
    # Handle attachments
    if 'attachments' in request.files:
        files = request.files.getlist('attachments')
        
        for file in files:
            if file.filename:
                # Get file mime type
                mimetype, _ = mimetypes.guess_type(file.filename)
                if mimetype is None:
                    mimetype = 'application/octet-stream'
                
                maintype, subtype = mimetype.split('/', 1)
                
                # Create the attachment
                attachment = MIMEBase(maintype, subtype)
                attachment.set_payload(file.read())
                encoders.encode_base64(attachment)
                attachment.add_header('Content-Disposition', 'attachment', 
                                     filename=file.filename)
                msg.attach(attachment)

    try:
        # Initialize SMTP server
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, recipient, msg.as_string())
        server.quit()

        # Log the email action
        EmailLog(user_id=user_id, email_content=email_content, action="sent")

        return jsonify({"message": "Email sent successfully!"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500
