"""
Test NEW Google GenAI SDK Features (Nov 2025)
- Basic chat
- Thinking mode
- Google Search grounding
- Structured output
"""

import os
import asyncio
from pathlib import Path
from dotenv import load_dotenv

# Load .env from parent
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

from google import genai
from google.genai import types

# Get API key
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY

print("=" * 60)
print("🧪 TESTING NEW google-genai SDK")
print("=" * 60)

client = genai.Client()

# Test 1: Basic Chat
print("\n📝 Test 1: Basic Chat")
try:
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is 2 + 2? Answer in one word."
    )
    print(f"Response: {response.text}")
    print("✅ Basic chat works!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 2: Chat with System Instruction
print("\n📝 Test 2: System Instructions")
try:
    config = types.GenerateContentConfig(
        system_instruction="You are a helpful assistant. Always answer in Vietnamese.",
        temperature=0.7
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is the capital of France?",
        config=config
    )
    print(f"Response: {response.text}")
    print("✅ System instructions work!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 3: Thinking Mode
print("\n📝 Test 3: Thinking Mode")
try:
    config = types.GenerateContentConfig(
        thinking_config=types.ThinkingConfig(
            thinking_budget=-1  # Dynamic
        )
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is 15 * 17?",
        config=config
    )
    print(f"Response: {response.text}")
    if hasattr(response, 'usage_metadata'):
        thoughts = getattr(response.usage_metadata, 'thoughts_token_count', 0)
        print(f"Thinking tokens used: {thoughts}")
    print("✅ Thinking mode works!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Google Search Grounding
print("\n📝 Test 4: Google Search Grounding")
try:
    config = types.GenerateContentConfig(
        tools=[types.Tool(google_search=types.GoogleSearch())]
    )
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="What is the current weather in Ho Chi Minh City?",
        config=config
    )
    print(f"Response: {response.text[:200]}...")
    
    # Check for grounding metadata
    if hasattr(response, 'candidates') and response.candidates:
        candidate = response.candidates[0]
        if hasattr(candidate, 'grounding_metadata'):
            gm = candidate.grounding_metadata
            if hasattr(gm, 'grounding_chunks') and gm.grounding_chunks:
                print(f"Sources found: {len(gm.grounding_chunks)}")
    print("✅ Google Search grounding works!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 5: Structured Output
print("\n📝 Test 5: Structured Output (JSON)")
try:
    json_schema = {
        "type": "object",
        "properties": {
            "name": {"type": "string"},
            "capital": {"type": "string"},
            "population": {"type": "integer"}
        },
        "required": ["name", "capital", "population"]
    }
    
    config = types.GenerateContentConfig(
        response_mime_type="application/json",
        response_json_schema=json_schema
    )
    
    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents="Give me information about Vietnam",
        config=config
    )
    
    import json
    data = json.loads(response.text)
    print(f"Structured Response: {json.dumps(data, indent=2)}")
    print("✅ Structured output works!")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 6: Multi-turn Chat
print("\n📝 Test 6: Multi-turn Chat")
try:
    chat = client.chats.create(model="gemini-2.5-flash")
    
    response1 = chat.send_message("My name is Long Sang")
    print(f"Response 1: {response1.text}")
    
    response2 = chat.send_message("What is my name?")
    print(f"Response 2: {response2.text}")
    
    print("✅ Multi-turn chat works!")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("🎉 ALL TESTS COMPLETED!")
print("=" * 60)
