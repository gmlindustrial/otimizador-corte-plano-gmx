
import { toast } from 'sonner';
import { MonitoringService } from '../MonitoringService';

export class ErrorHandler {
  private static monitoring = MonitoringService.getInstance();

  static handle(error: any, context: string): string {
    const errorMessage = error?.message || 'Erro desconhecido';
    const fullMessage = `${context}: ${errorMessage}`;
    
    // Log com serviço de monitoramento
    this.monitoring.error(fullMessage, context, {
      error: error?.stack || error,
      timestamp: new Date().toISOString()
    });
    
    console.error(fullMessage, error);
    toast.error(fullMessage);
    
    return fullMessage;
  }

  static handleSuccess(message: string): void {
    this.monitoring.info(message, 'SUCCESS');
    console.log(message);
    toast.success(message);
  }

  static handleInfo(message: string): void {
    this.monitoring.info(message, 'INFO');
    console.log(message);
    toast.info(message);
  }
}
