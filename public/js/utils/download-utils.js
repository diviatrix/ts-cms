import { messages } from '../ui-utils.js';

/**
 * Download utilities for file operations
 */
export class DownloadUtils {
    /**
     * Download content as markdown file
     * @param {string} title - The title to use for filename
     * @param {string} content - The markdown content to download
     * @param {string} defaultTitle - Default title if title is empty
     */
    static downloadAsMarkdown(title, content, defaultTitle = 'Untitled') {
        const safeTitle = title || defaultTitle;
        const safeContent = content || '';
        
        if (!safeContent.trim()) {
            messages.showError('No content to download.');
            return;
        }

        // Create filename from title
        const filename = `${safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        
        // Create and download the file
        const blob = new Blob([safeContent], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        messages.showSuccess('Record downloaded successfully!');
    }
} 