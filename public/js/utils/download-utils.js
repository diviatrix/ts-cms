export class DownloadUtils {
  static downloadAsMarkdown(title, content, defaultTitle = 'Untitled') {
    const safeTitle = title || defaultTitle;
    const safeContent = content || '';
        
    if (!safeContent.trim()) {
      return;
    }

    const filename = `${safeTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        
    const blob = new Blob([safeContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

  }
} 