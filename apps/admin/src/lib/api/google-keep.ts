/**
 * 📌 Google Keep Integration (Simplified)
 *
 * Đơn giản hóa: Chỉ tạo text format để copy vào Keep
 * Không cần API phức tạp - User copy và paste vào Keep manually
 */

interface GoogleKeepNote {
  title: string;
  textContent?: string;
  category?: string;
  priority?: string;
  tags?: string[];
}

class GoogleKeepAPI {
  /**
   * Format idea thành text để copy vào Google Keep
   * User sẽ copy và paste vào Keep manually
   */
  formatForKeep(idea: GoogleKeepNote): string {
    const lines = [
      idea.title,
      '',
      idea.textContent || '',
      '',
      idea.category ? `Category: ${idea.category}` : '',
      idea.priority ? `Priority: ${idea.priority}` : '',
      idea.tags && idea.tags.length > 0 ? `Tags: ${idea.tags.join(', ')}` : '',
    ].filter(Boolean);

    return lines.join('\n');
  }

  /**
   * Tạo Keep note URL (pre-filled)
   * Google Keep hỗ trợ URL với text parameter
   */
  createKeepUrl(idea: GoogleKeepNote): string {
    const text = this.formatForKeep(idea);
    const encodedText = encodeURIComponent(text);
    return `https://keep.google.com/#NOTE/${encodedText}`;
  }

  /**
   * Copy to clipboard và mở Keep
   */
  async copyToKeep(idea: GoogleKeepNote): Promise<{ url: string }> {
    const text = this.formatForKeep(idea);

    // Copy to clipboard
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        // Fallback: Show text in alert if clipboard fails
        console.warn('Clipboard write failed:', error);
      }
    }

    // Return Keep URL
    return {
      url: this.createKeepUrl(idea),
    };
  }

  /**
   * Sync idea to Google Keep (simplified)
   * Returns formatted text and URL
   */
  async syncIdea(idea: {
    title: string;
    content?: string | null;
    category?: string;
    priority?: string;
    tags?: string[];
  }): Promise<{ id: string; url: string }> {
    const note: GoogleKeepNote = {
      title: idea.title,
      textContent: idea.content || '',
      category: idea.category,
      priority: idea.priority,
      tags: idea.tags || [],
    };

    const result = await this.copyToKeep(note);

    return {
      id: `keep-${Date.now()}`, // Temporary ID
      url: result.url,
    };
  }
}

export default GoogleKeepAPI;
export type { GoogleKeepNote };
