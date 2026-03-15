"""
╔═══════════════════════════════════════════════════════════════╗
║           GOOGLE AI & SERVICES INTEGRATION                    ║
║  Gemini AI + YouTube + Drive + Calendar + Search Console      ║
╚═══════════════════════════════════════════════════════════════╝

Integrates Google's powerful AI and services into the MCP Server:
- Gemini 3 Pro: Latest AI model (Nov 2025) for chat, code, multimodal
- Gemini 2.5 Flash: Fast, balanced model with thinking capabilities
- YouTube Data API: Upload, manage videos
- Google Drive: File storage and management
- Google Calendar: Event scheduling
- Search Console: SEO performance data

🆕 NEW FEATURES (Nov 2025):
- Google Search Grounding: Real-time web search
- Thinking Mode: Advanced reasoning for complex tasks
- Structured Output: JSON Schema responses
- Function Calling: Connect to external tools
- Image Generation (Nano Banana): Create/edit images
- Video Generation (Veo 3.1): Create videos with audio

Author: Long Sang Automation
Updated: November 29, 2025
SDK: google-genai (NEW) + google-api-python-client
"""

import os
import json
import asyncio
import logging
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

# Google GenAI SDK (NEW - recommended by Google Nov 2025)
try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

# Legacy SDK fallback
try:
    import google.generativeai as genai_legacy
    LEGACY_AVAILABLE = True
except ImportError:
    LEGACY_AVAILABLE = False

# Google API imports for other services
try:
    from google.oauth2 import service_account
    from google.oauth2.credentials import Credentials
    from googleapiclient.discovery import build
    from googleapiclient.http import MediaFileUpload, MediaIoBaseUpload
    GOOGLE_AVAILABLE = True
except ImportError:
    GOOGLE_AVAILABLE = False

logger = logging.getLogger(__name__)

# ════════════════════════════════════════════════════════════
# CONFIGURATION
# ════════════════════════════════════════════════════════════

# Load from parent .env
from dotenv import load_dotenv
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(env_path)

# Google Service Account
GOOGLE_SERVICE_ACCOUNT_JSON = os.getenv('GOOGLE_SERVICE_ACCOUNT_JSON', '{}')

# YouTube OAuth
YOUTUBE_CLIENT_ID = os.getenv('YOUTUBE_CLIENT_ID', '')
YOUTUBE_CLIENT_SECRET = os.getenv('YOUTUBE_CLIENT_SECRET', '')
YOUTUBE_ACCESS_TOKEN = os.getenv('YOUTUBE_ACCESS_TOKEN', '')
YOUTUBE_REFRESH_TOKEN = os.getenv('YOUTUBE_REFRESH_TOKEN', '')
YOUTUBE_CHANNEL_ID = os.getenv('YOUTUBE_CHANNEL_ID', '')

# Google Drive
GOOGLE_DRIVE_REFRESH_TOKEN = os.getenv('GOOGLE_DRIVE_REFRESH_TOKEN', '')

# Analytics & Search Console
GOOGLE_ANALYTICS_PROPERTY_ID = os.getenv('GOOGLE_ANALYTICS_PROPERTY_ID', '')
GOOGLE_SEARCH_CONSOLE_PROPERTY_URL = os.getenv('GOOGLE_SEARCH_CONSOLE_PROPERTY_URL', '')

# Gemini API Key (get from Google AI Studio)
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY', '')


# ════════════════════════════════════════════════════════════
# GEMINI AI CLIENT (Using NEW google-genai SDK)
# ════════════════════════════════════════════════════════════

class GeminiClient:
    """
    Google Gemini AI client for chat, code generation, and multimodal tasks.

    🆕 Updated Nov 2025 to use NEW google-genai SDK with:
    - Thinking Mode (advanced reasoning)
    - Google Search Grounding (real-time web search)
    - Structured Output (JSON Schema)
    - Function Calling

    Available Models:
    - gemini-3-pro-preview: Most intelligent, best multimodal
    - gemini-2.5-pro: Strong reasoning, code, math
    - gemini-2.5-flash: Fast, balanced, 1M context (DEFAULT)
    - gemini-2.5-flash-lite: Fastest, cost-effective
    """

    # Ad-specific style presets for advertising images
    AD_STYLE_PRESETS = {
        "product": {
            "description": "Professional product photography with clean background, studio lighting, high quality",
            "keywords": "professional product photography, clean white background, studio lighting, high resolution, commercial quality"
        },
        "lifestyle": {
            "description": "Lifestyle photography showing product in real-world context, natural lighting, authentic feel",
            "keywords": "lifestyle photography, natural setting, authentic, real-world context, warm lighting, relatable"
        },
        "testimonial": {
            "description": "Portrait photography with friendly, trustworthy appearance, professional but approachable",
            "keywords": "portrait photography, friendly expression, trustworthy, professional, approachable, natural lighting"
        },
        "social": {
            "description": "Social media optimized image, vibrant colors, eye-catching, modern aesthetic",
            "keywords": "vibrant colors, eye-catching, modern aesthetic, social media optimized, bold design, engaging"
        },
        "minimalist": {
            "description": "Minimalist design with clean lines, simple composition, elegant and sophisticated",
            "keywords": "minimalist design, clean lines, simple composition, elegant, sophisticated, modern"
        }
    }

    def __init__(self):
        self.available = False
        self.client = None
        self.model_name = "gemini-2.5-flash"  # Default model

        if not GENAI_AVAILABLE and not LEGACY_AVAILABLE:
            logger.warning("Google AI library not installed. Run: pip install google-genai")
            return

        if not GEMINI_API_KEY:
            logger.warning("GEMINI_API_KEY not configured")
            return

        try:
            if GENAI_AVAILABLE:
                # NEW SDK (recommended)
                os.environ["GEMINI_API_KEY"] = GEMINI_API_KEY
                self.client = genai.Client()
                self.use_new_sdk = True
                logger.info("✅ Gemini AI client initialized (NEW google-genai SDK)")
            else:
                # Legacy fallback
                genai_legacy.configure(api_key=GEMINI_API_KEY)
                self.model = genai_legacy.GenerativeModel(self.model_name)
                self.use_new_sdk = False
                logger.info("✅ Gemini AI client initialized (legacy SDK)")

            self.available = True

        except Exception as e:
            logger.error(f"Failed to initialize Gemini: {e}")

    async def chat(
        self,
        message: str,
        system_prompt: str = None,
        history: List[Dict] = None,
        temperature: float = 1.0,  # Gemini 3 recommends 1.0
        max_tokens: int = 4096,
        enable_thinking: bool = True,  # 🆕 Thinking mode
        enable_search: bool = False,   # 🆕 Google Search grounding
        model: str = None
    ) -> Dict:
        """
        Chat with Gemini AI.

        Args:
            message: User message
            system_prompt: Optional system instructions
            history: Previous conversation history
            temperature: Creativity (0-2, default 1.0 for Gemini 3)
            max_tokens: Max response length
            enable_thinking: Enable thinking mode for complex reasoning
            enable_search: Enable Google Search grounding for real-time info
            model: Override model (gemini-3-pro-preview, gemini-2.5-pro, etc.)
        """
        if not self.available:
            return {"success": False, "error": "Gemini not available"}

        try:
            use_model = model or self.model_name

            if self.use_new_sdk:
                # Build config for NEW SDK
                config_dict = {
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                }

                # Add system instruction
                if system_prompt:
                    config_dict["system_instruction"] = system_prompt

                # Add thinking config
                if enable_thinking:
                    config_dict["thinking_config"] = types.ThinkingConfig(
                        thinking_budget=-1  # Dynamic thinking
                    )

                # Add tools
                tools = []
                if enable_search:
                    tools.append(types.Tool(google_search=types.GoogleSearch()))

                if tools:
                    config_dict["tools"] = tools

                config = types.GenerateContentConfig(**config_dict)

                # Generate response
                response = self.client.models.generate_content(
                    model=use_model,
                    contents=message,
                    config=config
                )

                result = {
                    "success": True,
                    "response": response.text,
                    "model": use_model,
                    "thinking_enabled": enable_thinking,
                    "search_enabled": enable_search,
                }

                # Add usage metadata if available
                if hasattr(response, 'usage_metadata'):
                    result["usage"] = {
                        "prompt_tokens": response.usage_metadata.prompt_token_count,
                        "response_tokens": response.usage_metadata.candidates_token_count,
                        "thoughts_tokens": getattr(response.usage_metadata, 'thoughts_token_count', 0)
                    }

                # Add grounding metadata if search was used
                if enable_search and hasattr(response, 'candidates'):
                    candidate = response.candidates[0]
                    if hasattr(candidate, 'grounding_metadata'):
                        gm = candidate.grounding_metadata
                        result["sources"] = []
                        if hasattr(gm, 'grounding_chunks'):
                            for chunk in gm.grounding_chunks:
                                if hasattr(chunk, 'web'):
                                    result["sources"].append({
                                        "title": chunk.web.title,
                                        "uri": chunk.web.uri
                                    })

                return result

            else:
                # Legacy SDK fallback
                full_prompt = message
                if system_prompt:
                    full_prompt = f"{system_prompt}\n\nUser: {message}"

                generation_config = genai_legacy.GenerationConfig(
                    temperature=temperature,
                    max_output_tokens=max_tokens,
                )

                response = self.model.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )

                return {
                    "success": True,
                    "response": response.text,
                    "model": use_model,
                    "sdk": "legacy"
                }

        except Exception as e:
            logger.error(f"Gemini chat error: {e}")
            return {"success": False, "error": str(e)}

    async def chat_with_search(
        self,
        message: str,
        system_prompt: str = None
    ) -> Dict:
        """
        🆕 Chat with Google Search grounding for real-time information.

        The model will automatically search Google when needed and cite sources.
        """
        return await self.chat(
            message=message,
            system_prompt=system_prompt,
            enable_search=True
        )

    async def generate_code(
        self,
        task: str,
        language: str = "python",
        context: str = None,
        use_pro_model: bool = False
    ) -> Dict:
        """
        Generate code using Gemini with thinking mode.

        Args:
            task: Description of what code should do
            language: Programming language
            context: Additional context or existing code
            use_pro_model: Use gemini-2.5-pro for complex code
        """
        if not self.available:
            return {"success": False, "error": "Gemini not available"}

        system_prompt = f"""You are an expert {language} programmer.
Generate clean, well-documented, production-ready code.
Follow best practices and include error handling.
Only output the code, no explanations unless asked."""

        prompt = f"Task: {task}"
        if context:
            prompt += f"\n\nContext/Existing code:\n```\n{context}\n```"

        # Use pro model for complex code
        model = "gemini-2.5-pro" if use_pro_model else self.model_name

        result = await self.chat(
            message=prompt,
            system_prompt=system_prompt,
            temperature=0.3,
            enable_thinking=True,  # Enable thinking for better code
            model=model
        )

        if result.get("success"):
            # Extract code from response
            code = result["response"]
            # Clean up markdown code blocks if present
            if f"```{language}" in code:
                code = code.split(f"```{language}")[1].split("```")[0]
            elif "```" in code:
                code = code.split("```")[1].split("```")[0]

            result["code"] = code.strip()

        return result

    async def analyze_image(
        self,
        image_path: str,
        prompt: str = "Describe this image in detail"
    ) -> Dict:
        """
        Analyze an image using Gemini Vision.

        Args:
            image_path: Path to image file
            prompt: Question about the image
        """
        if not self.available:
            return {"success": False, "error": "Gemini not available"}

        try:
            import PIL.Image

            image = PIL.Image.open(image_path)

            if self.use_new_sdk:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=[prompt, image]
                )
            else:
                response = self.model.generate_content([prompt, image])

            return {
                "success": True,
                "response": response.text,
                "image_path": image_path
            }

        except Exception as e:
            logger.error(f"Gemini vision error: {e}")
            return {"success": False, "error": str(e)}

    async def summarize(
        self,
        text: str,
        style: str = "concise"  # concise, detailed, bullet_points
    ) -> Dict:
        """Summarize text content with thinking mode."""
        styles = {
            "concise": "Summarize in 2-3 sentences",
            "detailed": "Provide a comprehensive summary with key points",
            "bullet_points": "Summarize as bullet points (max 7 points)"
        }

        prompt = f"{styles.get(style, styles['concise'])}:\n\n{text}"
        return await self.chat(prompt, temperature=0.3, enable_thinking=True)

    async def translate(
        self,
        text: str,
        target_language: str = "Vietnamese",
        preserve_formatting: bool = True
    ) -> Dict:
        """Translate text to another language."""
        prompt = f"Translate to {target_language}"
        if preserve_formatting:
            prompt += " (preserve markdown formatting)"
        prompt += f":\n\n{text}"

        return await self.chat(prompt, temperature=0.2)

    async def structured_output(
        self,
        prompt: str,
        json_schema: Dict,
        model: str = None
    ) -> Dict:
        """
        🆕 Generate structured JSON output following a schema.

        Args:
            prompt: The task description
            json_schema: JSON Schema for the expected output
            model: Override model
        """
        if not self.available or not self.use_new_sdk:
            return {"success": False, "error": "Structured output requires new SDK"}

        try:
            use_model = model or self.model_name

            config = types.GenerateContentConfig(
                response_mime_type="application/json",
                response_json_schema=json_schema
            )

            response = self.client.models.generate_content(
                model=use_model,
                contents=prompt,
                config=config
            )

            # Parse JSON response
            import json
            result_json = json.loads(response.text)

            return {
                "success": True,
                "data": result_json,
                "model": use_model
            }

        except Exception as e:
            logger.error(f"Structured output error: {e}")
            return {"success": False, "error": str(e)}

    async def generate_image(
        self,
        prompt: str,
        aspect_ratio: str = "1:1",
        output_path: str = None,
        style: str = None,
        ad_style: str = None
    ) -> Dict:
        """
        🆕 Generate image using Gemini Image Generation (Nano Banana).

        Args:
            prompt: Description of the image to generate
            aspect_ratio: "1:1", "16:9", "9:16", "4:3", "3:4"
            output_path: Optional path to save image (auto-generated if not provided)
            style: Optional style hint (e.g., "photorealistic", "cartoon", "oil painting")
            ad_style: Optional ad-specific style preset ("product", "lifestyle", "testimonial", "social", "minimalist")

        Returns:
            Dict with success, image_path, and metadata
        """
        if not self.available or not self.use_new_sdk:
            return {"success": False, "error": "Image generation requires new SDK"}

        try:
            # Try Vertex AI Imagen first (requires Service Account + billing)
            try:
                import vertexai
                from vertexai.preview.vision_models import ImageGenerationModel
                import tempfile

                # Setup credentials from Service Account
                sa_json = GOOGLE_SERVICE_ACCOUNT_JSON
                if sa_json and sa_json != '{}':
                    sa = json.loads(sa_json)
                    project_id = sa.get('project_id')

                    # Write SA to temp file
                    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
                        json.dump(sa, f)
                        sa_path = f.name

                    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = sa_path

                    vertexai.init(project=project_id, location='us-central1')

                    model = ImageGenerationModel.from_pretrained('imagen-3.0-generate-001')

                    # Enhance prompt with ad-specific style if provided
                    full_prompt = prompt
                    if ad_style and ad_style in self.AD_STYLE_PRESETS:
                        preset = self.AD_STYLE_PRESETS[ad_style]
                        full_prompt = f"{prompt}. {preset['description']}. {preset['keywords']}"
                    elif style:
                        full_prompt = f"{prompt}. Style: {style}"

                    images = model.generate_images(
                        prompt=full_prompt,
                        number_of_images=1,
                        aspect_ratio=aspect_ratio,
                    )

                    # Cleanup temp file
                    os.unlink(sa_path)

                    if images.images:
                        # Generate output path if not provided
                        if not output_path:
                            from datetime import datetime as dt
                            timestamp = dt.now().strftime("%Y%m%d_%H%M%S")
                            output_dir = Path(__file__).parent / "generated_images"
                            output_dir.mkdir(exist_ok=True)
                            output_path = str(output_dir / f"imagen_{timestamp}.png")

                        images.images[0].save(output_path)

                        return {
                            "success": True,
                            "image_path": output_path,
                            "prompt": prompt,
                            "full_prompt": full_prompt,
                            "aspect_ratio": aspect_ratio,
                            "ad_style": ad_style,
                            "style": style,
                            "model": "imagen-3.0-generate-001",
                            "provider": "vertex_ai"
                        }

            except Exception as vertex_error:
                logger.warning(f"Vertex AI Imagen failed, trying Gemini: {vertex_error}")

            # Fallback to Gemini image generation
            image_model = "gemini-2.0-flash-exp"

            # Enhance prompt with ad-specific style if provided
            full_prompt = prompt
            if ad_style and ad_style in self.AD_STYLE_PRESETS:
                preset = self.AD_STYLE_PRESETS[ad_style]
                full_prompt = f"{prompt}. {preset['description']}. {preset['keywords']}"
            elif style:
                full_prompt = f"{prompt}. Style: {style}"

            config = types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )

            response = self.client.models.generate_content(
                model=image_model,
                contents=full_prompt,
                config=config
            )

            # Process response to extract image
            result = {
                "success": False,
                "error": "No image generated"
            }

            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data is not None:
                    # Got image data
                    import base64
                    from datetime import datetime

                    # Generate output path if not provided
                    if not output_path:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        output_dir = Path(__file__).parent / "generated_images"
                        output_dir.mkdir(exist_ok=True)
                        output_path = str(output_dir / f"gemini_image_{timestamp}.png")

                    # Save image
                    image_data = part.inline_data.data
                    with open(output_path, "wb") as f:
                        f.write(image_data)

                    result = {
                        "success": True,
                        "image_path": output_path,
                        "prompt": prompt,
                        "full_prompt": full_prompt,
                        "aspect_ratio": aspect_ratio,
                        "ad_style": ad_style,
                        "style": style,
                        "model": image_model,
                        "provider": "gemini"
                    }
                    break
                elif hasattr(part, 'text') and part.text:
                    result["text_response"] = part.text

            return result

        except Exception as e:
            logger.error(f"Image generation error: {e}")
            return {"success": False, "error": str(e)}

    async def edit_image(
        self,
        image_path: str,
        edit_prompt: str,
        output_path: str = None
    ) -> Dict:
        """
        🆕 Edit an existing image using Gemini.

        Args:
            image_path: Path to the image to edit
            edit_prompt: Description of the edit to make
            output_path: Optional path to save edited image

        Returns:
            Dict with success, image_path, and metadata
        """
        if not self.available or not self.use_new_sdk:
            return {"success": False, "error": "Image editing requires new SDK"}

        try:
            import PIL.Image

            # Load original image
            image = PIL.Image.open(image_path)
            image_model = "gemini-2.0-flash-exp"

            config = types.GenerateContentConfig(
                response_modalities=["TEXT", "IMAGE"],
            )

            response = self.client.models.generate_content(
                model=image_model,
                contents=[edit_prompt, image],
                config=config
            )

            result = {
                "success": False,
                "error": "No edited image generated"
            }

            for part in response.candidates[0].content.parts:
                if hasattr(part, 'inline_data') and part.inline_data is not None:
                    from datetime import datetime

                    if not output_path:
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        output_dir = Path(__file__).parent / "generated_images"
                        output_dir.mkdir(exist_ok=True)
                        output_path = str(output_dir / f"gemini_edited_{timestamp}.png")

                    image_data = part.inline_data.data
                    with open(output_path, "wb") as f:
                        f.write(image_data)

                    result = {
                        "success": True,
                        "image_path": output_path,
                        "original_path": image_path,
                        "edit_prompt": edit_prompt,
                        "model": image_model
                    }
                    break
                elif hasattr(part, 'text') and part.text:
                    result["text_response"] = part.text

            return result

        except Exception as e:
            logger.error(f"Image editing error: {e}")
            return {"success": False, "error": str(e)}

    async def extract_data(
        self,
        text: str,
        data_type: str = "auto"
    ) -> Dict:
        """
        🆕 Extract structured data from text automatically.

        Args:
            text: Text to extract data from
            data_type: Type of data to extract:
                - "auto": Auto-detect (default)
                - "contact": Extract contact info (name, email, phone)
                - "product": Extract product info (name, price, description)
                - "event": Extract event info (title, date, location)
                - "custom": Use AI to determine best structure

        Returns:
            Dict with extracted data in JSON format
        """
        if not self.available or not self.use_new_sdk:
            return {"success": False, "error": "Data extraction requires new SDK"}

        # Define schemas based on data_type
        schemas = {
            "contact": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "email": {"type": "string"},
                    "phone": {"type": "string"},
                    "company": {"type": "string"},
                    "title": {"type": "string"},
                    "address": {"type": "string"}
                }
            },
            "product": {
                "type": "object",
                "properties": {
                    "name": {"type": "string"},
                    "price": {"type": "number"},
                    "currency": {"type": "string"},
                    "description": {"type": "string"},
                    "category": {"type": "string"},
                    "features": {"type": "array", "items": {"type": "string"}}
                }
            },
            "event": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "date": {"type": "string"},
                    "time": {"type": "string"},
                    "location": {"type": "string"},
                    "description": {"type": "string"},
                    "organizer": {"type": "string"}
                }
            }
        }

        try:
            if data_type == "auto" or data_type == "custom":
                # Let AI determine structure
                prompt = f"""Analyze this text and extract all relevant structured data.
Return as a JSON object with appropriate fields.

Text:
{text}"""
                result = await self.chat(prompt, temperature=0.1)

                if result.get("success"):
                    # Try to parse JSON from response
                    response_text = result["response"]
                    if "```json" in response_text:
                        json_str = response_text.split("```json")[1].split("```")[0]
                        data = json.loads(json_str)
                    elif "{" in response_text:
                        start = response_text.index("{")
                        end = response_text.rindex("}") + 1
                        data = json.loads(response_text[start:end])
                    else:
                        data = {"raw": response_text}

                    return {
                        "success": True,
                        "data": data,
                        "data_type": "auto"
                    }
            else:
                # Use predefined schema
                schema = schemas.get(data_type)
                if not schema:
                    return {"success": False, "error": f"Unknown data type: {data_type}"}

                prompt = f"Extract {data_type} information from this text:\n{text}"
                return await self.structured_output(prompt, schema)

        except Exception as e:
            logger.error(f"Data extraction error: {e}")
            return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# YOUTUBE CLIENT
# ════════════════════════════════════════════════════════════

class YouTubeClient:
    """YouTube Data API client for video management."""

    def __init__(self):
        self.available = False
        self.service = None

        if not GOOGLE_AVAILABLE:
            logger.warning("Google API library not installed")
            return

        if not YOUTUBE_ACCESS_TOKEN:
            logger.warning("YouTube credentials not configured")
            return

        try:
            credentials = Credentials(
                token=YOUTUBE_ACCESS_TOKEN,
                refresh_token=YOUTUBE_REFRESH_TOKEN,
                token_uri="https://oauth2.googleapis.com/token",
                client_id=YOUTUBE_CLIENT_ID,
                client_secret=YOUTUBE_CLIENT_SECRET
            )

            self.service = build('youtube', 'v3', credentials=credentials)
            self.available = True
            logger.info("✅ YouTube client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize YouTube: {e}")

    async def get_channel_stats(self) -> Dict:
        """Get channel statistics."""
        if not self.available:
            return {"success": False, "error": "YouTube not available"}

        try:
            response = self.service.channels().list(
                part='snippet,statistics,contentDetails',
                id=YOUTUBE_CHANNEL_ID
            ).execute()

            if response.get('items'):
                channel = response['items'][0]
                stats = channel['statistics']

                return {
                    "success": True,
                    "channel_id": YOUTUBE_CHANNEL_ID,
                    "title": channel['snippet']['title'],
                    "description": channel['snippet'].get('description', ''),
                    "subscribers": int(stats.get('subscriberCount', 0)),
                    "total_views": int(stats.get('viewCount', 0)),
                    "video_count": int(stats.get('videoCount', 0)),
                    "thumbnail": channel['snippet']['thumbnails']['default']['url']
                }

            return {"success": False, "error": "Channel not found"}

        except Exception as e:
            logger.error(f"YouTube channel stats error: {e}")
            return {"success": False, "error": str(e)}

    async def list_videos(self, max_results: int = 10) -> Dict:
        """List recent videos from the channel."""
        if not self.available:
            return {"success": False, "error": "YouTube not available"}

        try:
            response = self.service.search().list(
                part='snippet',
                channelId=YOUTUBE_CHANNEL_ID,
                order='date',
                type='video',
                maxResults=max_results
            ).execute()

            videos = []
            for item in response.get('items', []):
                videos.append({
                    "id": item['id']['videoId'],
                    "title": item['snippet']['title'],
                    "description": item['snippet']['description'][:200],
                    "published_at": item['snippet']['publishedAt'],
                    "thumbnail": item['snippet']['thumbnails']['medium']['url']
                })

            return {
                "success": True,
                "videos": videos,
                "total": len(videos)
            }

        except Exception as e:
            logger.error(f"YouTube list videos error: {e}")
            return {"success": False, "error": str(e)}

    async def get_video_analytics(self, video_id: str) -> Dict:
        """Get analytics for a specific video."""
        if not self.available:
            return {"success": False, "error": "YouTube not available"}

        try:
            response = self.service.videos().list(
                part='statistics,snippet',
                id=video_id
            ).execute()

            if response.get('items'):
                video = response['items'][0]
                stats = video['statistics']

                return {
                    "success": True,
                    "video_id": video_id,
                    "title": video['snippet']['title'],
                    "views": int(stats.get('viewCount', 0)),
                    "likes": int(stats.get('likeCount', 0)),
                    "comments": int(stats.get('commentCount', 0)),
                    "published_at": video['snippet']['publishedAt']
                }

            return {"success": False, "error": "Video not found"}

        except Exception as e:
            logger.error(f"YouTube video analytics error: {e}")
            return {"success": False, "error": str(e)}

    async def upload_video(
        self,
        file_path: str,
        title: str,
        description: str = "",
        tags: List[str] = None,
        privacy: str = "private"  # private, unlisted, public
    ) -> Dict:
        """
        Upload a video to YouTube.

        Args:
            file_path: Path to video file
            title: Video title
            description: Video description
            tags: List of tags
            privacy: Privacy status
        """
        if not self.available:
            return {"success": False, "error": "YouTube not available"}

        try:
            body = {
                'snippet': {
                    'title': title,
                    'description': description,
                    'tags': tags or [],
                    'categoryId': '22'  # People & Blogs
                },
                'status': {
                    'privacyStatus': privacy,
                    'selfDeclaredMadeForKids': False
                }
            }

            media = MediaFileUpload(
                file_path,
                mimetype='video/*',
                resumable=True
            )

            request = self.service.videos().insert(
                part='snippet,status',
                body=body,
                media_body=media
            )

            response = request.execute()

            return {
                "success": True,
                "video_id": response['id'],
                "url": f"https://youtube.com/watch?v={response['id']}",
                "title": title,
                "privacy": privacy
            }

        except Exception as e:
            logger.error(f"YouTube upload error: {e}")
            return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# GOOGLE DRIVE CLIENT
# ════════════════════════════════════════════════════════════

class GoogleDriveClient:
    """Google Drive API client for file management."""

    def __init__(self):
        self.available = False
        self.service = None

        if not GOOGLE_AVAILABLE:
            logger.warning("Google API library not installed")
            return

        try:
            # Use service account for Drive
            service_account_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=['https://www.googleapis.com/auth/drive']
            )

            self.service = build('drive', 'v3', credentials=credentials)
            self.available = True
            logger.info("✅ Google Drive client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Drive: {e}")

    async def list_files(
        self,
        folder_id: str = None,
        query: str = None,
        max_results: int = 20
    ) -> Dict:
        """List files in Drive."""
        if not self.available:
            return {"success": False, "error": "Drive not available"}

        try:
            q = []
            if folder_id:
                q.append(f"'{folder_id}' in parents")
            if query:
                q.append(f"name contains '{query}'")
            q.append("trashed = false")

            response = self.service.files().list(
                q=" and ".join(q),
                pageSize=max_results,
                fields="files(id, name, mimeType, size, modifiedTime, webViewLink)"
            ).execute()

            files = []
            for f in response.get('files', []):
                files.append({
                    "id": f['id'],
                    "name": f['name'],
                    "type": f['mimeType'],
                    "size": f.get('size', 'N/A'),
                    "modified": f.get('modifiedTime'),
                    "link": f.get('webViewLink')
                })

            return {
                "success": True,
                "files": files,
                "total": len(files)
            }

        except Exception as e:
            logger.error(f"Drive list error: {e}")
            return {"success": False, "error": str(e)}

    async def upload_file(
        self,
        file_path: str,
        folder_id: str = None,
        name: str = None
    ) -> Dict:
        """Upload a file to Drive."""
        if not self.available:
            return {"success": False, "error": "Drive not available"}

        try:
            file_name = name or Path(file_path).name

            file_metadata = {'name': file_name}
            if folder_id:
                file_metadata['parents'] = [folder_id]

            media = MediaFileUpload(file_path, resumable=True)

            file = self.service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id, webViewLink'
            ).execute()

            return {
                "success": True,
                "file_id": file['id'],
                "link": file.get('webViewLink'),
                "name": file_name
            }

        except Exception as e:
            logger.error(f"Drive upload error: {e}")
            return {"success": False, "error": str(e)}

    async def create_folder(self, name: str, parent_id: str = None) -> Dict:
        """Create a folder in Drive."""
        if not self.available:
            return {"success": False, "error": "Drive not available"}

        try:
            file_metadata = {
                'name': name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_id:
                file_metadata['parents'] = [parent_id]

            folder = self.service.files().create(
                body=file_metadata,
                fields='id, webViewLink'
            ).execute()

            return {
                "success": True,
                "folder_id": folder['id'],
                "link": folder.get('webViewLink'),
                "name": name
            }

        except Exception as e:
            logger.error(f"Drive create folder error: {e}")
            return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# GOOGLE CALENDAR CLIENT
# ════════════════════════════════════════════════════════════

class GoogleCalendarClient:
    """Google Calendar API client."""

    def __init__(self):
        self.available = False
        self.service = None

        if not GOOGLE_AVAILABLE:
            return

        try:
            service_account_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=['https://www.googleapis.com/auth/calendar']
            )

            self.service = build('calendar', 'v3', credentials=credentials)
            self.available = True
            logger.info("✅ Google Calendar client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Calendar: {e}")

    async def list_events(
        self,
        calendar_id: str = 'primary',
        days_ahead: int = 7
    ) -> Dict:
        """List upcoming calendar events."""
        if not self.available:
            return {"success": False, "error": "Calendar not available"}

        try:
            now = datetime.utcnow()
            time_min = now.isoformat() + 'Z'
            time_max = (now + timedelta(days=days_ahead)).isoformat() + 'Z'

            response = self.service.events().list(
                calendarId=calendar_id,
                timeMin=time_min,
                timeMax=time_max,
                maxResults=20,
                singleEvents=True,
                orderBy='startTime'
            ).execute()

            events = []
            for event in response.get('items', []):
                start = event['start'].get('dateTime', event['start'].get('date'))
                events.append({
                    "id": event['id'],
                    "title": event.get('summary', 'No title'),
                    "start": start,
                    "end": event['end'].get('dateTime', event['end'].get('date')),
                    "location": event.get('location', ''),
                    "link": event.get('htmlLink')
                })

            return {
                "success": True,
                "events": events,
                "total": len(events)
            }

        except Exception as e:
            logger.error(f"Calendar list error: {e}")
            return {"success": False, "error": str(e)}

    async def create_event(
        self,
        title: str,
        start_time: str,
        end_time: str,
        description: str = "",
        location: str = "",
        calendar_id: str = 'primary'
    ) -> Dict:
        """Create a calendar event."""
        if not self.available:
            return {"success": False, "error": "Calendar not available"}

        try:
            event = {
                'summary': title,
                'location': location,
                'description': description,
                'start': {
                    'dateTime': start_time,
                    'timeZone': 'Asia/Ho_Chi_Minh',
                },
                'end': {
                    'dateTime': end_time,
                    'timeZone': 'Asia/Ho_Chi_Minh',
                },
            }

            created = self.service.events().insert(
                calendarId=calendar_id,
                body=event
            ).execute()

            return {
                "success": True,
                "event_id": created['id'],
                "link": created.get('htmlLink'),
                "title": title
            }

        except Exception as e:
            logger.error(f"Calendar create error: {e}")
            return {"success": False, "error": str(e)}


# ════════════════════════════════════════════════════════════
# SEARCH CONSOLE CLIENT
# ════════════════════════════════════════════════════════════

class SearchConsoleClient:
    """Google Search Console API client for SEO data."""

    def __init__(self):
        self.available = False
        self.service = None
        self.site_url = GOOGLE_SEARCH_CONSOLE_PROPERTY_URL

        if not GOOGLE_AVAILABLE:
            return

        try:
            service_account_info = json.loads(GOOGLE_SERVICE_ACCOUNT_JSON)
            credentials = service_account.Credentials.from_service_account_info(
                service_account_info,
                scopes=['https://www.googleapis.com/auth/webmasters.readonly']
            )

            self.service = build('searchconsole', 'v1', credentials=credentials)
            self.available = True
            logger.info("✅ Search Console client initialized")
        except Exception as e:
            logger.error(f"Failed to initialize Search Console: {e}")

    async def get_search_analytics(
        self,
        days: int = 28,
        dimensions: List[str] = None
    ) -> Dict:
        """Get search analytics data."""
        if not self.available:
            return {"success": False, "error": "Search Console not available"}

        try:
            end_date = datetime.now()
            start_date = end_date - timedelta(days=days)

            request = {
                'startDate': start_date.strftime('%Y-%m-%d'),
                'endDate': end_date.strftime('%Y-%m-%d'),
                'dimensions': dimensions or ['query'],
                'rowLimit': 25
            }

            response = self.service.searchanalytics().query(
                siteUrl=self.site_url,
                body=request
            ).execute()

            rows = []
            for row in response.get('rows', []):
                rows.append({
                    "keys": row.get('keys', []),
                    "clicks": row.get('clicks', 0),
                    "impressions": row.get('impressions', 0),
                    "ctr": round(row.get('ctr', 0) * 100, 2),
                    "position": round(row.get('position', 0), 1)
                })

            return {
                "success": True,
                "site_url": self.site_url,
                "period": f"{start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}",
                "rows": rows,
                "total": len(rows)
            }

        except Exception as e:
            logger.error(f"Search Console error: {e}")
            return {"success": False, "error": str(e)}

    async def get_top_pages(self, days: int = 28) -> Dict:
        """Get top performing pages."""
        return await self.get_search_analytics(days=days, dimensions=['page'])

    async def get_top_queries(self, days: int = 28) -> Dict:
        """Get top search queries."""
        return await self.get_search_analytics(days=days, dimensions=['query'])


# ════════════════════════════════════════════════════════════
# UNIFIED GOOGLE CLIENT
# ════════════════════════════════════════════════════════════

class GoogleClient:
    """Unified Google services client."""

    def __init__(self):
        self.gemini = GeminiClient()
        self.youtube = YouTubeClient()
        self.drive = GoogleDriveClient()
        self.calendar = GoogleCalendarClient()
        self.search_console = SearchConsoleClient()

        self.status = {
            "gemini": self.gemini.available,
            "youtube": self.youtube.available,
            "drive": self.drive.available,
            "calendar": self.calendar.available,
            "search_console": self.search_console.available
        }

        available_count = sum(1 for v in self.status.values() if v)
        logger.info(f"Google services initialized: {available_count}/5 available")

    @property
    def is_available(self) -> bool:
        return any(self.status.values())

    def get_status(self) -> Dict:
        return {
            "available": self.is_available,
            "services": self.status
        }


# Initialize global client
google_client = GoogleClient()


# ════════════════════════════════════════════════════════════
# MCP TOOL WRAPPERS
# ════════════════════════════════════════════════════════════

async def gemini_chat(
    message: str,
    system_prompt: str = None,
    temperature: float = 0.7
) -> Dict:
    """Chat with Gemini AI."""
    return await google_client.gemini.chat(message, system_prompt, temperature=temperature)


async def gemini_code(
    task: str,
    language: str = "python",
    context: str = None
) -> Dict:
    """Generate code with Gemini."""
    return await google_client.gemini.generate_code(task, language, context)


async def gemini_summarize(text: str, style: str = "concise") -> Dict:
    """Summarize text with Gemini."""
    return await google_client.gemini.summarize(text, style)


async def gemini_translate(
    text: str,
    target_language: str = "Vietnamese"
) -> Dict:
    """Translate text with Gemini."""
    return await google_client.gemini.translate(text, target_language)


async def gemini_search(
    query: str,
    system_prompt: str = None
) -> Dict:
    """
    Search using Gemini with Google Search grounding.
    Get real-time, up-to-date information from the web.
    """
    return await google_client.gemini.chat_with_search(query, system_prompt)


async def gemini_thinking(
    question: str,
    system_prompt: str = None
) -> Dict:
    """
    Deep reasoning with Gemini using Thinking mode.
    Best for complex problems requiring step-by-step analysis.
    """
    return await google_client.gemini.chat(
        question,
        system_prompt=system_prompt,
        enable_thinking=True
    )


async def gemini_extract_data(
    text: str,
    data_type: str = "auto"
) -> Dict:
    """
    Extract structured data from text using Gemini.

    Args:
        text: Text to extract data from
        data_type: "auto", "contact", "product", "event", or "custom"
    """
    return await google_client.gemini.extract_data(text, data_type)


async def gemini_structured(
    prompt: str,
    json_schema: Dict
) -> Dict:
    """
    Generate structured JSON output following a schema.

    Args:
        prompt: The task description
        json_schema: JSON Schema for the expected output
    """
    return await google_client.gemini.structured_output(prompt, json_schema)


async def gemini_generate_image(
    prompt: str,
    aspect_ratio: str = "1:1",
    style: str = None,
    ad_style: str = None
) -> Dict:
    """
    Generate image using Gemini AI (Imagen 3.0 or Gemini image generation).

    Args:
        prompt: Description of the image to generate
        aspect_ratio: "1:1", "16:9", "9:16", "4:3", "3:4"
        style: Optional style (e.g., "photorealistic", "cartoon", "oil painting")
        ad_style: Optional ad-specific style preset ("product", "lifestyle", "testimonial", "social", "minimalist")
    """
    return await google_client.generate_image(prompt, aspect_ratio, None, style, ad_style)


async def gemini_edit_image(
    image_path: str,
    edit_prompt: str,
    output_path: str = None
) -> Dict:
    """
    Edit an existing image using Gemini AI.

    Args:
        image_path: Path to the image to edit
        edit_prompt: Description of the edit to make
        output_path: Optional path to save edited image
    """
    return await google_client.gemini.edit_image(image_path, edit_prompt, output_path)


async def youtube_stats() -> Dict:
    """Get YouTube channel statistics."""
    return await google_client.youtube.get_channel_stats()


async def youtube_videos(max_results: int = 10) -> Dict:
    """List recent YouTube videos."""
    return await google_client.youtube.list_videos(max_results)


async def youtube_upload(
    file_path: str,
    title: str,
    description: str = "",
    tags: str = "",
    privacy: str = "private"
) -> Dict:
    """Upload video to YouTube."""
    tags_list = [t.strip() for t in tags.split(",") if t.strip()] if tags else []
    return await google_client.youtube.upload_video(file_path, title, description, tags_list, privacy)


async def drive_list(folder_id: str = None, query: str = None) -> Dict:
    """List Google Drive files."""
    return await google_client.drive.list_files(folder_id, query)


async def drive_upload(file_path: str, folder_id: str = None) -> Dict:
    """Upload file to Google Drive."""
    return await google_client.drive.upload_file(file_path, folder_id)


async def calendar_events(days_ahead: int = 7) -> Dict:
    """List upcoming calendar events."""
    return await google_client.calendar.list_events(days_ahead=days_ahead)


async def calendar_create(
    title: str,
    start_time: str,
    end_time: str,
    description: str = "",
    location: str = ""
) -> Dict:
    """Create calendar event."""
    return await google_client.calendar.create_event(title, start_time, end_time, description, location)


async def seo_queries(days: int = 28) -> Dict:
    """Get top search queries from Search Console."""
    return await google_client.search_console.get_top_queries(days)


async def seo_pages(days: int = 28) -> Dict:
    """Get top pages from Search Console."""
    return await google_client.search_console.get_top_pages(days)


async def google_status() -> Dict:
    """Get status of all Google services."""
    return google_client.get_status()
