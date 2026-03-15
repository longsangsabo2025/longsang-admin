#!/usr/bin/env python3
"""
Test new gemini_search and gemini_thinking wrapper functions.
"""
import asyncio
from google_integration import gemini_search, gemini_thinking


async def main():
    print("=" * 60)
    print("🧪 TESTING NEW MCP TOOLS: gemini_search & gemini_thinking")
    print("=" * 60)
    
    # Test 1: gemini_search
    print("\n📝 Test 1: gemini_search (Google Search Grounding)")
    print("   Query: 'Giá vàng SJC hôm nay'")
    result = await gemini_search("Giá vàng SJC hôm nay")
    if result.get("success"):
        response = result.get("response", "")
        sources = result.get("sources", [])
        print(f"   Response: {response[:150]}...")
        print(f"   Sources: {len(sources)} source(s)")
        for src in sources[:3]:
            print(f"      - {src.get('title', 'N/A')}")
        print("   ✅ gemini_search OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 2: gemini_thinking
    print("\n📝 Test 2: gemini_thinking (Deep Reasoning)")
    print("   Question: 'Tính 127 * 83 và giải thích cách tính'")
    result = await gemini_thinking("Tính 127 * 83 và giải thích cách tính")
    if result.get("success"):
        response = result.get("response", "")
        thinking_tokens = result.get("thinking_tokens", 0)
        print(f"   Response: {response[:200]}...")
        print(f"   Thinking tokens: {thinking_tokens}")
        print("   ✅ gemini_thinking OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 3: gemini_search with system prompt
    print("\n📝 Test 3: gemini_search với system prompt (Vietnamese)")
    result = await gemini_search(
        "Bitcoin price today",
        system_prompt="Always respond in Vietnamese"
    )
    if result.get("success"):
        response = result.get("response", "")
        print(f"   Response: {response[:150]}...")
        print("   ✅ gemini_search with system prompt OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 4: gemini_thinking complex problem
    print("\n📝 Test 4: gemini_thinking (Complex Problem)")
    question = """
    Một công ty có 100 nhân viên. 60% là nam, 40% là nữ.
    Trong số nam có 25% làm IT, trong số nữ có 30% làm IT.
    Hỏi tổng số nhân viên IT là bao nhiêu?
    """
    result = await gemini_thinking(question.strip())
    if result.get("success"):
        response = result.get("response", "")
        thinking_tokens = result.get("thinking_tokens", 0)
        print(f"   Response: {response[:300]}...")
        print(f"   Thinking tokens: {thinking_tokens}")
        print("   ✅ Complex reasoning OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    print("\n" + "=" * 60)
    print("🎉 ALL NEW TOOLS TESTS COMPLETED!")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(main())
