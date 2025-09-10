"""
Email notification service for food waste tracker
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from datetime import datetime
from app.models.models import Item, Organization, User

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def _get_email_settings():
    """Load SMTP settings from environment variables with sensible defaults."""
    return {
        "SMTP_SERVER": os.getenv("SMTP_SERVER", "smtp.gmail.com"),
        "SMTP_PORT": int(os.getenv("SMTP_PORT", "587")),
        "EMAIL_USER": os.getenv("EMAIL_USER"),
        "EMAIL_PASSWORD": os.getenv("EMAIL_PASSWORD"),
        "FROM_EMAIL": os.getenv("FROM_EMAIL"),
        "EMAIL_SENDING": os.getenv("EMAIL_SENDING", "0"),  # '1' to enable real sending
    }


def send_email(to_email: str, subject: str, html_content: str, text_content: str = None):
    """Send an email via SMTP. Falls back to logging if not configured."""
    settings = _get_email_settings()
    should_send = settings["EMAIL_SENDING"] == "1" and settings["EMAIL_USER"] and settings["EMAIL_PASSWORD"]

    # Always log what we're attempting
    logger.info(f"📧 EMAIL TO: {to_email}")
    logger.info(f"📧 SUBJECT: {subject}")
    logger.info(f"📧 CONTENT: {(text_content or html_content)[:200]}...")

    if not should_send:
        logger.info("✳️ Email sending disabled or not configured; logged only. Set EMAIL_SENDING=1 and SMTP creds to enable.")
        return True

    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = settings["FROM_EMAIL"] or settings["EMAIL_USER"]
        msg['To'] = to_email

        if text_content:
            msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))

        with smtplib.SMTP(settings["SMTP_SERVER"], settings["SMTP_PORT"]) as server:
            server.starttls()
            server.login(settings["EMAIL_USER"], settings["EMAIL_PASSWORD"])
            server.sendmail(msg['From'], [to_email], msg.as_string())

        logger.info(f"✅ Email sent successfully to {to_email}")
        return True

    except Exception as e:
        logger.error(f"❌ Failed to send email to {to_email}: {str(e)}")
        return False


def send_claim_notification_to_claimer(item: Item, organization: Organization, claimer_email: str, claimer_name: str):
    """Send notification to the person who claimed the item"""
    
    # Format pickup time
    pickup_info = ""
    if item.ready_at:
        pickup_info += f"Ready from: {item.ready_at.strftime('%B %d, %Y at %I:%M %p')}\n"
    if item.expires_at:
        pickup_info += f"Must be picked up by: {item.expires_at.strftime('%B %d, %Y at %I:%M %p')}\n"
    if item.pickup_window:
        pickup_info += f"Pickup window: {item.pickup_window}\n"
    
    # Create HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
            .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .item-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .contact-info {{ background-color: #e8f5e8; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; }}
            .important {{ color: #d32f2f; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🎉 Claim Confirmed!</h1>
        </div>
        
        <div class="content">
            <h2>Hi {claimer_name},</h2>
            <p>Great news! You've successfully claimed a food item. Here are all the details you need for pickup:</p>
            
            <div class="item-details">
                <h3>📦 Item Details</h3>
                <p><strong>Item:</strong> {item.title}</p>
                {f'<p><strong>Description:</strong> {item.description}</p>' if item.description else ''}
                {f'<p><strong>Quantity:</strong> {item.quantity}</p>' if item.quantity else ''}
                {f'<p><strong>Storage:</strong> {item.storage_type}</p>' if item.storage_type else ''}
                {f'<p><strong>Category:</strong> {item.category}</p>' if item.category else ''}
            </div>
            
            <div class="contact-info">
                <h3>🏪 Pickup Location & Contact</h3>
                <p><strong>Organization:</strong> {organization.name}</p>
                <p><strong>Type:</strong> {organization.type}</p>
                {f'<p><strong>Address:</strong> {organization.address}</p>' if organization.address else ''}
                {f'<p><strong>Phone:</strong> {organization.phone}</p>' if organization.phone else ''}
                {f'<p><strong>Email:</strong> {organization.email}</p>' if organization.email else ''}
            </div>
            
            {f'<div class="item-details"><h3>⏰ Pickup Schedule</h3><p>{pickup_info}</p></div>' if pickup_info else ''}
            
            <p class="important">⚠️ Important: Please contact the organization directly to coordinate the exact pickup time and any special instructions.</p>
            
            <p>Thank you for helping reduce food waste! 🌱</p>
        </div>
        
        <div class="footer">
            <p>This email was sent by FoodBridge. If you have any issues, please contact support.</p>
        </div>
    </body>
    </html>
    """
    
    # Create text content
    text_content = f"""
    CLAIM CONFIRMED!
    
    Hi {claimer_name},
    
    You've successfully claimed: {item.title}
    {f'Description: {item.description}' if item.description else ''}
    
    PICKUP DETAILS:
    Organization: {organization.name} ({organization.type})
    {f'Address: {organization.address}' if organization.address else ''}
    {f'Phone: {organization.phone}' if organization.phone else ''}
    {f'Email: {organization.email}' if organization.email else ''}
    
    {pickup_info if pickup_info else ''}
    
    IMPORTANT: Please contact the organization directly to coordinate pickup.
    
    Thank you for helping reduce food waste!
    
    - FoodBridge Team
    """
    
    subject = f"✅ Food Claim Confirmed: {item.title}"
    return send_email(claimer_email, subject, html_content, text_content)


def send_claim_notification_to_donor(item: Item, organization: Organization, claimer_email: str, claimer_name: str, claimer_phone: str = None):
    """Send notification to the organization/donor about the new claim"""
    
    if not organization.email:
        logger.warning(f"No email configured for organization {organization.name}")
        return False
    
    # Create HTML email content
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
            .header {{ background-color: #2196F3; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .item-details {{ background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .contact-info {{ background-color: #e3f2fd; padding: 15px; border-radius: 5px; margin: 15px 0; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; }}
            .action-needed {{ color: #ff9800; font-weight: bold; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🔔 New Food Claim</h1>
        </div>
        
        <div class="content">
            <h2>Hi {organization.name} team,</h2>
            <p>Great news! Someone has claimed one of your food donations:</p>
            
            <div class="item-details">
                <h3>📦 Claimed Item</h3>
                <p><strong>Item:</strong> {item.title}</p>
                {f'<p><strong>Description:</strong> {item.description}</p>' if item.description else ''}
                {f'<p><strong>Quantity:</strong> {item.quantity}</p>' if item.quantity else ''}
                <p><strong>Claimed on:</strong> {datetime.now().strftime('%B %d, %Y at %I:%M %p')}</p>
            </div>
            
            <div class="contact-info">
                <h3>👤 Claimer Contact Information</h3>
                <p><strong>Name:</strong> {claimer_name}</p>
                <p><strong>Email:</strong> {claimer_email}</p>
                {f'<p><strong>Phone:</strong> {claimer_phone}</p>' if claimer_phone else ''}
            </div>
            
            <p class="action-needed">⚡ Action Required: Please contact {claimer_name} to arrange pickup details and timing.</p>
            
            <p>Thank you for participating in food waste reduction! 🌱</p>
        </div>
        
        <div class="footer">
            <p>This notification was sent by FoodBridge. Manage your preferences in your account settings.</p>
        </div>
    </body>
    </html>
    """
    
    # Create text content
    text_content = f"""
    NEW FOOD CLAIM NOTIFICATION
    
    Hi {organization.name} team,
    
    Someone has claimed your food donation:
    
    ITEM: {item.title}
    {f'Description: {item.description}' if item.description else ''}
    Claimed on: {datetime.now().strftime('%B %d, %Y at %I:%M %p')}
    
    CLAIMER CONTACT:
    Name: {claimer_name}
    Email: {claimer_email}
    {f'Phone: {claimer_phone}' if claimer_phone else ''}
    
    ACTION REQUIRED: Please contact {claimer_name} to arrange pickup.
    
    Thank you for reducing food waste!
    
    - FoodBridge Team
    """
    
    subject = f"🔔 New Claim for '{item.title}' - Action Required"
    return send_email(organization.email, subject, html_content, text_content)


def send_registration_welcome_email(user: User):
    """Send welcome email to newly registered users"""
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; }}
            .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .feature {{ background-color: #f9f9f9; padding: 10px; margin: 10px 0; border-radius: 5px; }}
            .footer {{ background-color: #f1f1f1; padding: 15px; text-align: center; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>🌱 Welcome to FoodBridge!</h1>
        </div>
        
        <div class="content">
            <h2>Hi {user.name},</h2>
            <p>Welcome to our community! You're now part of the movement to reduce food waste and help your community.</p>
            
            <h3>What you can do:</h3>
            <div class="feature">🔍 <strong>Browse Food:</strong> Find free food near you</div>
            <div class="feature">📦 <strong>Claim Items:</strong> Reserve food for pickup</div>
            <div class="feature">📊 <strong>Track History:</strong> See your impact over time</div>
            <div class="feature">🤝 <strong>Connect:</strong> Coordinate with local food donors</div>
            
            <p>Start exploring and making a difference today!</p>
        </div>
        
        <div class="footer">
            <p>Thank you for joining FoodBridge. Together, we can reduce food waste!</p>
        </div>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to FoodBridge!
    
    Hi {user.name},
    
    Welcome to our community! You're now part of the movement to reduce food waste.
    
    What you can do:
    - Browse food available near you
    - Claim items for pickup
    - Track your impact over time
    - Connect with local food donors
    
    Start exploring and making a difference today!
    
    - FoodBridge Team
    """
    
    subject = "🌱 Welcome to FoodBridge!"
    return send_email(user.email, subject, html_content, text_content)
