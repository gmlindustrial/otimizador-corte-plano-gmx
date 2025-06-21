
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Share2, MessageCircle, Send, Mail, Copy } from 'lucide-react';
import { ShareService } from '@/services/ShareService';
import { useToast } from '@/hooks/use-toast';

interface ShareDialogProps {
  isOpen: boolean;
  onClose: () => void;
  reportType: string;
  reportTitle: string;
}

export const ShareDialog = ({ isOpen, onClose, reportType, reportTitle }: ShareDialogProps) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(`Confira o relatório: ${reportTitle}`);
  const shareableLink = ShareService.generateShareableLink(reportType, Date.now().toString());

  const handleWhatsAppShare = () => {
    ShareService.shareViaWhatsApp(message);
    toast({
      title: "Compartilhado via WhatsApp",
      description: "O link foi aberto no WhatsApp",
    });
    onClose();
  };

  const handleTelegramShare = () => {
    ShareService.shareViaTelegram(message);
    toast({
      title: "Compartilhado via Telegram",
      description: "O link foi aberto no Telegram",
    });
    onClose();
  };

  const handleEmailShare = () => {
    if (!email) {
      toast({
        title: "Email obrigatório",
        description: "Digite um email para compartilhar",
        variant: "destructive",
      });
      return;
    }

    ShareService.shareViaEmail(`Relatório: ${reportTitle}`, message);
    toast({
      title: "Email preparado",
      description: "O cliente de email foi aberto",
    });
    onClose();
  };

  const handleCopyLink = async () => {
    const success = await ShareService.copyToClipboard(shareableLink);
    if (success) {
      toast({
        title: "Link copiado",
        description: "O link foi copiado para a área de transferência",
      });
    } else {
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Compartilhar Relatório
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Link compartilhável */}
          <div className="space-y-2">
            <Label>Link Compartilhável</Label>
            <div className="flex gap-2">
              <Input 
                value={shareableLink} 
                readOnly 
                className="text-xs"
              />
              <Button variant="outline" size="sm" onClick={handleCopyLink}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label>Mensagem</Label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Digite uma mensagem..."
              rows={3}
            />
          </div>

          {/* Botões de compartilhamento */}
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              onClick={handleWhatsAppShare}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>

            <Button 
              variant="outline" 
              onClick={handleTelegramShare}
              className="flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Telegram
            </Button>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label>Enviar por Email</Label>
            <div className="flex gap-2">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplo.com"
              />
              <Button variant="outline" onClick={handleEmailShare}>
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
