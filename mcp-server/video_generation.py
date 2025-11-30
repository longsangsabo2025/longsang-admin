"""
╔═══════════════════════════════════════════════════════════════╗
║           VIDEO GENERATION SERVICE                            ║
║  Phase 2: Generate short-form video ads (15-60s)             ║
╚═══════════════════════════════════════════════════════════════╝

Approach 1 (MVP): FFmpeg image slideshow
Approach 2 (Future): OpenV/Waver AI video generation
"""

import os
import subprocess
import json
import logging
from pathlib import Path
from typing import Optional, Dict, List, Tuple
from datetime import datetime

logger = logging.getLogger(__name__)


# Check if FFmpeg is available
def find_ffmpeg() -> Optional[str]:
    """Find FFmpeg executable path"""
    # Common FFmpeg locations
    possible_paths = [
        "ffmpeg",  # In PATH
        "C:\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\Program Files\\ffmpeg\\bin\\ffmpeg.exe",
        "C:\\Program Files (x86)\\ffmpeg\\bin\\ffmpeg.exe",
    ]

    for path in possible_paths:
        try:
            result = subprocess.run(
                [path, "-version"], capture_output=True, text=True, timeout=5
            )
            if result.returncode == 0:
                return path
        except (subprocess.TimeoutExpired, FileNotFoundError):
            continue

    return None


def check_ffmpeg_available() -> Tuple[bool, Optional[str]]:
    """Check if FFmpeg is installed and available"""
    ffmpeg_path = find_ffmpeg()
    return (ffmpeg_path is not None, ffmpeg_path)


FFMPEG_AVAILABLE, FFMPEG_PATH = check_ffmpeg_available()


class VideoGenerationService:
    """
    Video generation service for ad campaigns

    Phase 2 MVP: FFmpeg image slideshow
    Future: OpenV/Waver AI video generation
    """

    def __init__(self):
        self.ffmpeg_available, self.ffmpeg_path = check_ffmpeg_available()
        self.output_dir = Path(__file__).parent / "generated_videos"
        self.output_dir.mkdir(exist_ok=True)

        if not self.ffmpeg_available:
            logger.warning("FFmpeg not available. Video generation will be limited.")
        else:
            logger.info(f"FFmpeg found at: {self.ffmpeg_path}")

    async def generate_video_from_images(
        self,
        image_paths: List[str],
        output_path: Optional[str] = None,
        duration: int = 15,  # seconds
        fps: int = 30,
        transition: str = "fade",  # fade, slide, none
        audio_path: Optional[str] = None,
        aspect_ratio: str = "9:16",  # TikTok/Reels format
    ) -> Dict:
        """
        Generate video from multiple images using FFmpeg

        Args:
            image_paths: List of image file paths
            output_path: Optional output path
            duration: Total video duration in seconds
            fps: Frames per second
            transition: Transition type between images
            audio_path: Optional background audio
            aspect_ratio: Video aspect ratio (9:16, 16:9, 1:1)

        Returns:
            Dict with success, video_path, and metadata
        """
        if not self.ffmpeg_available:
            return {
                "success": False,
                "error": "FFmpeg not available. Please install FFmpeg.",
            }

        if not image_paths:
            return {"success": False, "error": "At least one image is required"}

        try:
            # Generate output path if not provided
            if not output_path:
                timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                output_path = str(self.output_dir / f"ad_video_{timestamp}.mp4")

            # Calculate duration per image
            num_images = len(image_paths)
            duration_per_image = duration / num_images

            # Create FFmpeg filter complex for slideshow
            # Scale images to aspect ratio and create slideshow
            filter_complex = self._build_filter_complex(
                image_paths, duration_per_image, fps, transition, aspect_ratio
            )

            # Build FFmpeg command
            ffmpeg_cmd = self.ffmpeg_path or "ffmpeg"
            cmd = [
                ffmpeg_cmd,
                "-y",  # Overwrite output
                "-f",
                "lavfi",
                "-i",
                f"color=c=black:s={self._get_resolution(aspect_ratio)}:d={duration}",
            ]

            # Add images as inputs
            for img_path in image_paths:
                if not os.path.exists(img_path):
                    return {"success": False, "error": f"Image not found: {img_path}"}
                cmd.extend(
                    ["-loop", "1", "-t", str(duration_per_image), "-i", img_path]
                )

            # Add audio if provided
            audio_index = None
            if audio_path and os.path.exists(audio_path):
                audio_index = len(image_paths)
                cmd.extend(["-i", audio_path])

            # Add filter complex
            cmd.extend(["-filter_complex", filter_complex])

            # Map video output
            cmd.extend(["-map", "[final]"])

            # Add audio mapping if audio provided
            if audio_index is not None:
                cmd.extend(["-map", f"{audio_index}:a", "-shortest"])

            # Output settings
            cmd.extend(
                [
                    "-c:v",
                    "libx264",
                    "-preset",
                    "medium",
                    "-crf",
                    "23",
                    "-pix_fmt",
                    "yuv420p",
                    "-r",
                    str(fps),
                    output_path,
                ]
            )

            # Run FFmpeg
            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=300  # 5 minutes max
            )

            if result.returncode != 0:
                logger.error(f"FFmpeg error: {result.stderr}")
                return {
                    "success": False,
                    "error": f"FFmpeg failed: {result.stderr[:200]}",
                }

            if not os.path.exists(output_path):
                return {"success": False, "error": "Video file was not created"}

            # Get video info
            video_info = self._get_video_info(output_path)

            return {
                "success": True,
                "video_path": output_path,
                "duration": duration,
                "fps": fps,
                "aspect_ratio": aspect_ratio,
                "num_images": num_images,
                "audio": audio_path is not None,
                "file_size": os.path.getsize(output_path),
                "info": video_info,
                "method": "ffmpeg_slideshow",
            }

        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Video generation timed out"}
        except Exception as e:
            logger.error(f"Video generation error: {e}")
            return {"success": False, "error": str(e)}

    def _build_filter_complex(
        self,
        image_paths: List[str],
        duration_per_image: float,
        fps: int,
        transition: str,
        aspect_ratio: str,
    ) -> str:
        """Build FFmpeg filter complex for slideshow"""
        resolution = self._get_resolution(aspect_ratio)
        num_images = len(image_paths)

        filters = []

        # Scale and pad each image to match aspect ratio
        for i, img_path in enumerate(image_paths):
            filters.append(
                f"[{i}:v]scale={resolution}:force_original_aspect_ratio=decrease,"
                f"pad={resolution}:(ow-iw)/2:(oh-ih)/2,"
                f"setpts=PTS-STARTPTS,fps={fps}[v{i}]"
            )

        # Create slideshow with transitions
        if transition == "fade" and num_images > 1:
            # Fade transitions between images
            concat_inputs = []
            for i in range(num_images - 1):
                if i == 0:
                    concat_inputs.append(f"[v{i}]")
                # Add fade transition
                fade_duration = 0.5  # 0.5 second fade
                concat_inputs.append(
                    f"[v{i}][v{i+1}]xfade=transition=fade:duration={fade_duration}:offset={duration_per_image * (i + 1) - fade_duration}[f{i}]"
                )

            # Final concat
            filter_complex = ";".join(filters) + ";" + ";".join(concat_inputs)
            filter_complex += f";[f{num_images-2}]trim=duration={duration_per_image * num_images}[final]"
        else:
            # Simple concat without transitions
            concat_parts = []
            for i in range(num_images):
                concat_parts.append(f"[v{i}]")
            filter_complex = ";".join(filters)
            filter_complex += (
                f";{'concat=n={num_images}:v=1:a=0[final]'.join(concat_parts)}"
            )
            filter_complex = filter_complex.replace("[final]", f"[{num_images}:v]")

        return filter_complex

    def _get_resolution(self, aspect_ratio: str) -> str:
        """Get resolution string for aspect ratio"""
        resolutions = {
            "9:16": "1080x1920",  # TikTok/Reels vertical
            "16:9": "1920x1080",  # YouTube/YouTube Shorts horizontal
            "1:1": "1080x1080",  # Instagram square
            "4:5": "1080x1350",  # Instagram portrait
        }
        return resolutions.get(aspect_ratio, "1920x1080")

    def _get_video_info(self, video_path: str) -> Dict:
        """Get video information using ffprobe"""
        try:
            ffprobe_cmd = (self.ffmpeg_path or "ffprobe").replace("ffmpeg", "ffprobe")
            cmd = [
                ffprobe_cmd,
                "-v",
                "quiet",
                "-print_format",
                "json",
                "-show_format",
                "-show_streams",
                video_path,
            ]

            result = subprocess.run(cmd, capture_output=True, text=True, timeout=10)

            if result.returncode == 0:
                return json.loads(result.stdout)
            return {}
        except Exception as e:
            logger.warning(f"Could not get video info: {e}")
            return {}

    async def generate_ad_video(
        self,
        product_info: Dict,
        ad_style: str = "product",
        duration: int = 15,
        aspect_ratio: str = "9:16",
        num_images: int = 3,
        include_text: bool = True,
        google_client=None,  # Pass google_client from server
    ) -> Dict:
        """
        Generate ad video from product info

        Args:
            product_info: Product information dict
            ad_style: Ad style preset
            duration: Video duration in seconds
            aspect_ratio: Video aspect ratio
            num_images: Number of images to generate
            include_text: Whether to include text overlays
            google_client: Google client instance (optional)

        Returns:
            Dict with success, video_path, and metadata
        """
        try:
            # Step 1: Generate images using Google Imagen
            if google_client is None:
                try:
                    from google_integration import google_client as gc

                    google_client = gc
                except ImportError:
                    return {"success": False, "error": "Google Imagen not available"}

            if (
                not hasattr(google_client, "is_available")
                or not google_client.is_available
            ):
                return {"success": False, "error": "Google Imagen not available"}

            # Generate multiple images
            image_paths = []
            prompts = self._generate_video_prompts(product_info, ad_style, num_images)

            for i, prompt in enumerate(prompts):
                image_result = await google_client.generate_image(
                    prompt=prompt, aspect_ratio=aspect_ratio, ad_style=ad_style
                )

                if image_result.get("success") and image_result.get("image_path"):
                    image_paths.append(image_result["image_path"])
                else:
                    logger.warning(
                        f"Failed to generate image {i+1}: {image_result.get('error')}"
                    )

            if not image_paths:
                return {"success": False, "error": "Failed to generate any images"}

            # Step 2: Create video from images
            video_result = await self.generate_video_from_images(
                image_paths=image_paths,
                duration=duration,
                aspect_ratio=aspect_ratio,
                transition="fade",
            )

            if video_result.get("success"):
                video_result["product_info"] = product_info
                video_result["ad_style"] = ad_style
                video_result["generated_images"] = image_paths

            return video_result

        except Exception as e:
            logger.error(f"Error generating ad video: {e}")
            return {"success": False, "error": str(e)}

    def _generate_video_prompts(
        self, product_info: Dict, ad_style: str, num_images: int
    ) -> List[str]:
        """Generate prompts for video images"""
        name = product_info.get("name", "Product")
        description = product_info.get("description", "")

        prompts = []

        if ad_style == "product":
            # Product showcase sequence
            prompts = [
                f"Professional product photo of {name}. Clean white background, studio lighting.",
                f"{name} being used in a professional setting. High quality commercial photography.",
                f"Close-up detail shot of {name}. {description}. Professional product photography.",
            ]
        elif ad_style == "lifestyle":
            # Lifestyle sequence
            prompts = [
                f"{name} in a natural, everyday setting. Authentic lifestyle photography.",
                f"Person using {name} in a real-world context. Warm natural lighting.",
                f"{name} being enjoyed in a comfortable home environment. Relatable scene.",
            ]
        elif ad_style == "social":
            # Social media sequence
            prompts = [
                f"Eye-catching social media image featuring {name}. Vibrant colors, modern aesthetic.",
                f"Bold, engaging composition with {name}. Social media optimized design.",
                f"Trendy, attention-grabbing image of {name}. Instagram-worthy style.",
            ]
        else:
            # Default: product style
            prompts = [
                f"Professional photo of {name}. {description}",
                f"{name} showcase. High quality product photography.",
                f"{name} detail. Commercial quality image.",
            ]

        # Return requested number of prompts
        return prompts[:num_images]


# Export service instance
video_service = VideoGenerationService()
