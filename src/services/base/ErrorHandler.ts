
import { toast } from 'sonner';

export class ErrorHandler {
  static handle(error: any, context: string): string {
    const errorMessage = error?.message || 'Erro desconhecido';
    const fullMessage = `${context}: ${errorMessage}`;
    
    console.error(fullMessage, error);
    toast.error(fullMessage);
    
    return fullMessage;
  }

  static handleSuccess(message: string): void {
    console.log(message);
    toast.success(message);
  }

  static handleInfo(message: string): void {
    console.log(message);
    toast.info(message);
  }
}
