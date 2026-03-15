#!/usr/bin/env python3
"""
Test new Gemini features: Structured Output, Image Generation, Data Extraction
"""
import asyncio
import json
from google_integration import (
    gemini_extract_data,
    gemini_structured,
    gemini_generate_image,
    gemini_edit_image
)


async def main():
    print("=" * 60)
    print("🧪 TESTING NEW GEMINI FEATURES")
    print("=" * 60)
    
    # Test 1: Extract Contact Data
    print("\n📝 Test 1: Extract Contact Data")
    contact_text = """
    Xin chào, tôi là Nguyễn Văn Long
    Email: longvn@longsang.vn
    Điện thoại: 0909 123 456
    Công ty: Long Sang Tech JSC
    Chức vụ: CEO & Founder
    """
    result = await gemini_extract_data(contact_text, "contact")
    if result.get("success"):
        print(f"   Extracted: {json.dumps(result.get('data', {}), indent=2, ensure_ascii=False)}")
        print("   ✅ Contact extraction OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 2: Extract Product Data
    print("\n📝 Test 2: Extract Product Data")
    product_text = """
    iPhone 16 Pro Max 256GB - Titan Đen
    Giá: 34.990.000 VND
    Màn hình: 6.9 inch Super Retina XDR
    Chip: A18 Pro
    Camera: 48MP + 12MP + 12MP
    Pin: 4685 mAh
    """
    result = await gemini_extract_data(product_text, "product")
    if result.get("success"):
        print(f"   Extracted: {json.dumps(result.get('data', {}), indent=2, ensure_ascii=False)}")
        print("   ✅ Product extraction OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 3: Auto Extract (AI determines structure)
    print("\n📝 Test 3: Auto Extract (AI determines structure)")
    auto_text = """
    Hội thảo AI & Automation 2025
    Ngày: 15/12/2025, 9:00 - 17:00
    Địa điểm: GEM Center, Quận 1, TP.HCM
    Diễn giả: Dr. Nguyễn AI Expert
    Phí tham dự: 500.000 VND
    """
    result = await gemini_extract_data(auto_text, "auto")
    if result.get("success"):
        print(f"   Extracted: {json.dumps(result.get('data', {}), indent=2, ensure_ascii=False)}")
        print("   ✅ Auto extraction OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 4: Structured Output with Custom Schema
    print("\n📝 Test 4: Structured Output with Custom Schema")
    schema = {
        "type": "object",
        "properties": {
            "company_name": {"type": "string"},
            "industry": {"type": "string"},
            "founded_year": {"type": "number"},
            "products": {
                "type": "array",
                "items": {"type": "string"}
            },
            "headquarters": {"type": "string"}
        }
    }
    result = await gemini_structured(
        "Tell me about Apple Inc in Vietnamese",
        schema
    )
    if result.get("success"):
        print(f"   Structured: {json.dumps(result.get('data', {}), indent=2, ensure_ascii=False)}")
        print("   ✅ Structured output OK!")
    else:
        print(f"   ❌ Error: {result.get('error')}")
    
    # Test 5: Image Generation
    print("\n📝 Test 5: Image Generation (Nano Banana)")
    print("   Note: This may take 10-20 seconds...")
    result = await gemini_generate_image(
        "A modern minimalist logo for a Vietnamese tech company called 'Long Sang Tech', blue and white colors",
        aspect_ratio="1:1",
        style="minimalist vector"
    )
    if result.get("success"):
        print(f"   Image saved to: {result.get('image_path')}")
        print("   ✅ Image generation OK!")
    else:
        print(f"   ⚠️ Note: {result.get('error')}")
        print("   (Image generation may require specific API access)")
    
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS COMPLETED!")
    print("=" * 60)
    
    # Summary
    print("\n📊 New Features Summary:")
    print("   - gemini_extract: Extract structured data from text")
    print("   - gemini_json: Generate JSON with custom schema")
    print("   - gemini_image: Generate images (requires API access)")
    print("   - gemini_edit_image: Edit existing images")


if __name__ == "__main__":
    asyncio.run(main())
