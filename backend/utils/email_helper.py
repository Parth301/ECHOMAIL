import smtplib

GMAIL_USER = ("jaypatil1965@gmail.com")  # Your Gmail address
GMAIL_PASS = ("zcqjydkosxtpcjpj")  # Your App Password

def send_email(recipient, subject, body):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        server.login(GMAIL_USER, GMAIL_PASS)
        
        message = f"Subject: {subject}\n\n{body}"
        server.sendmail(GMAIL_USER, recipient, message)
        server.quit()
        
        return True, "Email sent successfully!"
    except Exception as e:
        return False, str(e)