import { Citation } from '../types';

export const formatCitation = (citation: Citation): string => {
  const date = new Date().getFullYear();
  
  switch (citation.format) {
    case 'ABNT':
      return `"${citation.text}" (${citation.title.toUpperCase()}, ${date}, p. ${citation.page}).`;
    case 'APA':
      return `"${citation.text}" (${citation.title}, ${date}, p. ${citation.page})`;
    default:
      // Internal Nexus Markdown format for notes
      return `> ${citation.text}\n\n— *${citation.title}, pág. ${citation.page}*`;
  }
};