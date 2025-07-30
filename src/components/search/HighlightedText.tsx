import React from 'react';
import { 
  highlightSearchTerm, 
  highlightMultipleTerms, 
  extractSearchTerms,
  DEFAULT_HIGHLIGHT_CLASSES,
  type HighlightedTextProps 
} from '../../utils/searchHighlight';

interface HighlightedTextComponentProps extends HighlightedTextProps {
  multipleTerms?: boolean;
  maxLength?: number;
}

/**
 * Component that highlights search terms within text
 */
const HighlightedText: React.FC<HighlightedTextComponentProps> = ({
  text,
  searchTerm,
  caseSensitive = false,
  highlightClassName = DEFAULT_HIGHLIGHT_CLASSES,
  className = '',
  multipleTerms = false,
  maxLength
}) => {
  if (!text) {
    return null;
  }

  // Truncate text if maxLength is specified
  let displayText = text;
  if (maxLength && text.length > maxLength) {
    displayText = text.substring(0, maxLength) + '...';
  }

  if (!searchTerm.trim()) {
    return <span className={className}>{displayText}</span>;
  }

  // Get highlighted segments
  const segments = multipleTerms 
    ? highlightMultipleTerms(displayText, extractSearchTerms(searchTerm), caseSensitive)
    : highlightSearchTerm(displayText, searchTerm, caseSensitive);

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        segment.isMatch ? (
          <mark 
            key={index} 
            className={highlightClassName}
          >
            {segment.text}
          </mark>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      ))}
    </span>
  );
};

export default HighlightedText;
