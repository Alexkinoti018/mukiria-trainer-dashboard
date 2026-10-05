import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, Loader2, X, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface IntelligentDropzoneProps {
  onSuccess: (data: any) => void;
  context: string; // e.g., 'learning_plan', 'trainee_assignment'
  role: string; // e.g., 'trainer', 'trainee', 'hod'
  accept?: string;
  label?: string;
}

export default function IntelligentDropzone({
  onSuccess,
  context,
  role,
  accept = ".pdf,.doc,.docx",
  label = "Drag and drop your file here"
}: IntelligentDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const processFiles = async (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setIsUploading(true);

    try {
      const promises = selectedFiles.map((selectedFile) => {
        return new Promise<any>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = async () => {
            const base64Data = (reader.result as string).split(',')[1];
            try {
              const response = await fetch('http://localhost:8000/api/parse-doc', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  filename: selectedFile.name,
                  content_type: selectedFile.type,
                  file_data: base64Data,
                  role: role,
                  context: context
                })
              });

              if (!response.ok) {
                let msg = "Failed to parse document " + selectedFile.name;
                try {
                  const errJson = await response.json();
                  if (errJson.error) msg = errJson.error;
                } catch {
                  // ignore
                }
                throw new Error(msg);
              }
              const data = await response.json();
              resolve(data);
            } catch (err) {
              reject(err);
            }
          };
          reader.onerror = () => reject(new Error("File read error"));
          reader.readAsDataURL(selectedFile);
        });
      });

      const results = await Promise.all(promises);
      setIsUploading(false);
      toast.success(`Processed ${results.length} file(s) successfully!`);
      onSuccess(results);
    } catch (error: any) {
      setIsUploading(false);
      setFiles([]);
      toast.error(error?.message || "Error processing file. Please verify file format and backend service.");
      console.error(error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`relative w-full p-8 border-2 border-dashed rounded-xl transition-all duration-200 ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-accent/50"
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={accept}
        multiple
        className="hidden"
      />
      
      <div className="flex flex-col items-center justify-center text-center space-y-4">
        {isUploading ? (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl z-10">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium text-foreground">
              Processing {files.length} document{files.length > 1 ? 's' : ''}...
            </p>
          </div>
        ) : files.length > 0 ? (
          <>
            <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{files.length} file(s) processed</p>
              <p className="text-xs text-muted-foreground mt-1">Ready for submission</p>
            </div>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <UploadCloud className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-medium text-foreground mb-2">
                {isDragging ? "Drop your files here" : label}
              </h3>
              <p className="text-sm text-muted-foreground mb-6">
                Supported formats: PDF, Word (DOCX)
              </p>
            </div>
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:opacity-90 transition-opacity"
            >
              Browse Files
            </button>
          </>
        )}
      </div>
    </div>
  );
}
