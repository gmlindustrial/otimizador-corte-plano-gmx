
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { FileText } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelect: (file: File) => void;
  uploading: boolean;
}

export const FileUploadArea = ({ onFileSelect, uploading }: FileUploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls,.txt,.pdf"
        onChange={handleFileChange}
        className="hidden"
        disabled={uploading}
      />
      
      <div className="space-y-4">
        <div className="flex justify-center">
          <div className="bg-gray-100 p-3 rounded-full">
            <FileText className="w-8 h-8 text-gray-600" />
          </div>
        </div>
        
        <div>
          <p className="text-lg font-medium text-gray-900">
            Arraste arquivos ou clique para selecionar
          </p>
          <p className="text-sm text-gray-500 mt-1">
            Formatos aceitos: CSV, XLSX, TXT, PDF
          </p>
        </div>
        
        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="bg-blue-600 hover:bg-blue-700"
        >
          Selecionar Arquivo
        </Button>
      </div>
    </div>
  );
};
