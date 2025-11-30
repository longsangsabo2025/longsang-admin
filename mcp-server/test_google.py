"""
Test Google Integration for MCP Server
Run: python test_google.py
"""

import asyncio
import sys
from pathlib import Path

# Add parent for .env access
sys.path.insert(0, str(Path(__file__).parent.parent))

async def main():
    print("=" * 60)
    print("  GOOGLE INTEGRATION TEST")
    print("=" * 60)
    
    try:
        from google_integration import google_client
        
        # Check status
        status = google_client.get_status()
        print("\n📊 Service Status:")
        print("-" * 40)
        for service, available in status.get("services", {}).items():
            icon = "✅" if available else "❌"
            print(f"  {icon} {service.title()}: {'Available' if available else 'Not configured'}")
        
        # Test Gemini if available
        if status.get("services", {}).get("gemini"):
            print("\n🤖 Testing Gemini AI...")
            print("-" * 40)
            
            result = await google_client.gemini.chat(
                "Say hello in Vietnamese and English in one sentence",
                temperature=0.5
            )
            
            if result.get("success"):
                print(f"  Response: {result.get('response')[:200]}")
                print(f"  Model: {result.get('model')}")
            else:
                print(f"  Error: {result.get('error')}")
        
        # Test YouTube if available
        if status.get("services", {}).get("youtube"):
            print("\n📺 Testing YouTube...")
            print("-" * 40)
            
            result = await google_client.youtube.get_channel_stats()
            
            if result.get("success"):
                print(f"  Channel: {result.get('title')}")
                print(f"  Subscribers: {result.get('subscribers'):,}")
                print(f"  Total Views: {result.get('total_views'):,}")
                print(f"  Videos: {result.get('video_count')}")
            else:
                print(f"  Error: {result.get('error')}")
        
        # Test Drive if available
        if status.get("services", {}).get("drive"):
            print("\n📁 Testing Google Drive...")
            print("-" * 40)
            
            result = await google_client.drive.list_files(max_results=5)
            
            if result.get("success"):
                print(f"  Files found: {result.get('total')}")
                for f in result.get('files', [])[:3]:
                    print(f"    - {f.get('name')}")
            else:
                print(f"  Error: {result.get('error')}")
        
        print("\n" + "=" * 60)
        print("  TEST COMPLETE!")
        print("=" * 60)
        
    except ImportError as e:
        print(f"\n❌ Import Error: {e}")
        print("  Make sure to install: pip install -r requirements.txt")
    except Exception as e:
        print(f"\n❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(main())
