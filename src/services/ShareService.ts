
export class ShareService {
  // Compartilhar via WhatsApp
  static shareViaWhatsApp(message: string, fileUrl?: string): void {
    const text = encodeURIComponent(message + (fileUrl ? `\n\nArquivo: ${fileUrl}` : ''));
    const whatsappUrl = `https://wa.me/?text=${text}`;
    window.open(whatsappUrl, '_blank');
  }

  // Compartilhar via Telegram
  static shareViaTelegram(message: string, fileUrl?: string): void {
    const text = encodeURIComponent(message + (fileUrl ? `\n\nArquivo: ${fileUrl}` : ''));
    const telegramUrl = `https://t.me/share/url?url=${text}`;
    window.open(telegramUrl, '_blank');
  }

  // Compartilhar via email
  static shareViaEmail(subject: string, body: string, fileUrl?: string): void {
    const mailto = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body + (fileUrl ? `\n\nArquivo: ${fileUrl}` : ''))}`;
    window.location.href = mailto;
  }

  // Copiar link para área de transferência
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.error('Erro ao copiar para área de transferência:', err);
      return false;
    }
  }

  // Gerar link compartilhável (mock - em produção seria um serviço real)
  static generateShareableLink(reportType: string, reportId: string): string {
    return `${window.location.origin}/reports/${reportType}/${reportId}`;
  }
}
