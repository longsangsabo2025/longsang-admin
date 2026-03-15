/**
 * 🔍 Highlight Text Component
 *
 * Highlights search terms in text
 */

interface HighlightTextProps {
  text: string;
  searchQuery: string;
  className?: string;
}

export function HighlightText({ text, searchQuery, className = '' }: HighlightTextProps) {
  if (!searchQuery.trim()) {
    return <span className={className}>{text}</span>;
  }

  const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));

  return (
    <span className={className}>
      {parts.map((part, index) => {
        const isMatch = part.toLowerCase() === searchQuery.toLowerCase();
        return isMatch ? (
          <mark key={index} className="bg-yellow-200 dark:bg-yellow-900 px-1 rounded">
            {part}
          </mark>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </span>
  );
}
