"""
AI Email Assistant
Auto-classify and draft replies for incoming emails

Long Sang Academy - AI Agent Starter Kit
"""

import os
import time
import yaml
from openai import OpenAI
from datetime import datetime
import json

class EmailAssistant:
    def __init__(self, config_path='config.yaml'):
        """Initialize the email assistant"""
        with open(config_path, 'r') as f:
            self.config = yaml.safe_load(f)
        
        # Initialize OpenAI
        self.client = OpenAI(api_key=self.config['openai']['api_key'])
        
        # Stats tracking
        self.emails_processed = 0
        self.start_time = datetime.now()
        
        print("🤖 AI Email Assistant initialized!")
        print(f"📧 Monitoring: {self.config['email']['address']}")
        print(f"⏰ Check interval: {self.config['email']['check_interval']}s")
        
    def classify_email(self, subject, body):
        """Classify email into sales/support/complaint"""
        prompt = f"""Classify this email into ONE category: sales, support, or complaint.

Subject: {subject}
Body: {body}

Rules:
- sales: inquiries about pricing, buying, quotes
- support: help requests, how-to questions, technical issues  
- complaint: negative feedback, refund requests, dissatisfaction

Return ONLY the category name, nothing else."""

        response = self.client.chat.completions.create(
            model=self.config['openai']['model'],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=10,
            temperature=0.1
        )
        
        category = response.choices[0].message.content.strip().lower()
        return category if category in ['sales', 'support', 'complaint'] else 'support'
    
    def generate_reply(self, category, subject, body, sender):
        """Generate personalized reply based on category"""
        template = self.config['templates'].get(category, self.config['templates']['support'])
        
        prompt = f"""You are a professional email assistant.

Generate a reply to this email using this template as a guide:

Template: {template}

Email Details:
From: {sender}
Subject: {subject}
Body: {body}

Instructions:
- Use the template structure but personalize it
- Reference specific points from their email
- Be professional and friendly
- Keep it concise (2-3 paragraphs max)
- Sign off as "{self.config['agent']['name']}"
- Write in {self.config['agent']['language']}

Return ONLY the email reply, nothing else."""

        response = self.client.chat.completions.create(
            model=self.config['openai']['model'],
            messages=[{"role": "user", "content": prompt}],
            max_tokens=self.config['openai']['max_tokens'],
            temperature=self.config['openai']['temperature']
        )
        
        return response.choices[0].message.content.strip()
    
    def process_email(self, email_data):
        """Process single email: classify and generate reply"""
        print(f"\n{'='*60}")
        print(f"📨 NEW EMAIL")
        print(f"From: {email_data['sender']}")
        print(f"Subject: {email_data['subject']}")
        print(f"{'='*60}")
        
        # Classify
        print("\n🏷️  Classifying...")
        category = self.classify_email(email_data['subject'], email_data['body'])
        print(f"✅ Category: {category.upper()}")
        
        # Generate reply
        print("\n✍️  Generating reply...")
        reply = self.generate_reply(
            category,
            email_data['subject'],
            email_data['body'],
            email_data['sender']
        )
        
        print(f"\n{'='*60}")
        print("📤 DRAFT REPLY:")
        print(f"{'='*60}")
        print(reply)
        print(f"{'='*60}")
        
        # Get approval if auto_reply is False
        if not self.config['agent']['auto_reply']:
            print("\n⏸️  Auto-reply is disabled. What would you like to do?")
            print("  [a] Approve & send")
            print("  [e] Edit before sending")
            print("  [s] Skip this email")
            
            choice = input("\nYour choice: ").strip().lower()
            
            if choice == 'a':
                self.send_email(email_data['sender'], reply)
                print("✅ Email sent!")
            elif choice == 'e':
                print("\nEnter your edited version (press Enter twice when done):")
                lines = []
                while True:
                    line = input()
                    if line == '' and len(lines) > 0 and lines[-1] == '':
                        break
                    lines.append(line)
                edited_reply = '\n'.join(lines[:-1])
                self.send_email(email_data['sender'], edited_reply)
                print("✅ Email sent!")
            else:
                print("⏭️  Skipped")
        else:
            self.send_email(email_data['sender'], reply)
            print("✅ Email sent automatically!")
        
        self.emails_processed += 1
        
    def send_email(self, to, body):
        """Send email (mock implementation - integrate with real email API)"""
        # TODO: Integrate with Gmail API, SendGrid, or SMTP
        print(f"\n📧 [MOCK] Sending to: {to}")
        print(f"Body: {body[:100]}...")
        
        # In production, you would:
        # - Use Gmail API to send
        # - Or use SendGrid/Mailgun
        # - Or use SMTP directly
        
    def get_stats(self):
        """Get assistant statistics"""
        uptime = datetime.now() - self.start_time
        return {
            'status': 'healthy',
            'emails_processed': self.emails_processed,
            'uptime_seconds': int(uptime.total_seconds()),
            'uptime_human': str(uptime).split('.')[0]
        }
    
    def check_inbox(self):
        """Check inbox for new emails (mock implementation)"""
        # TODO: Integrate with Gmail API
        # For now, return mock data for testing
        
        mock_emails = [
            {
                'sender': 'client@example.com',
                'subject': 'Pricing inquiry for 10 licenses',
                'body': 'Hi, I\'m interested in your product. How much for 10 user licenses? Need quote ASAP.'
            }
        ]
        
        # In production:
        # from google.oauth2.credentials import Credentials
        # from googleapiclient.discovery import build
        # service = build('gmail', 'v1', credentials=creds)
        # results = service.users().messages().list(userId='me', labelIds=['INBOX'], q='is:unread').execute()
        
        return mock_emails  # Return real emails in production
    
    def run(self):
        """Main loop - check inbox and process emails"""
        print(f"\n{'='*60}")
        print("🚀 AI EMAIL ASSISTANT STARTED")
        print(f"{'='*60}")
        print(f"⏰ Checking inbox every {self.config['email']['check_interval']} seconds")
        print(f"🤖 Agent: {self.config['agent']['name']}")
        print(f"🌐 Language: {self.config['agent']['language']}")
        print(f"🔒 Auto-reply: {'Enabled' if self.config['agent']['auto_reply'] else 'Disabled (manual approval)'}")
        print(f"{'='*60}\n")
        
        try:
            while True:
                print(f"\n[{datetime.now().strftime('%H:%M:%S')}] 🔍 Checking inbox...")
                
                emails = self.check_inbox()
                
                if emails:
                    print(f"✅ Found {len(emails)} new email(s)")
                    for email in emails:
                        self.process_email(email)
                else:
                    print("📭 No new emails")
                
                print(f"\n💤 Sleeping for {self.config['email']['check_interval']} seconds...")
                print(f"📊 Stats: {self.emails_processed} emails processed, uptime: {self.get_stats()['uptime_human']}")
                
                time.sleep(self.config['email']['check_interval'])
                
        except KeyboardInterrupt:
            print(f"\n\n{'='*60}")
            print("🛑 SHUTTING DOWN...")
            print(f"📊 Final Stats: {self.emails_processed} emails processed")
            print(f"⏰ Total uptime: {self.get_stats()['uptime_human']}")
            print("👋 Goodbye!")
            print(f"{'='*60}\n")


if __name__ == "__main__":
    # Check for config file
    if not os.path.exists('config.yaml'):
        print("❌ Error: config.yaml not found!")
        print("📝 Please create config.yaml from config.yaml.example")
        exit(1)
    
    # Initialize and run
    assistant = EmailAssistant()
    assistant.run()
