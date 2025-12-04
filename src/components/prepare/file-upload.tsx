'use client';

import { useState } from 'react';
import { FileText, UploadCloud, CheckCircle2, BarChart3, ClipboardList, Target, File as FileIcon, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadedFile {
  name: string;
  size: string;
  type: 'pdf' | 'doc' | 'ppt' | 'other';
}

const mockFiles: UploadedFile[] = [
  { name: 'Billing_Architecture_Overview.pdf', size: '2.4 MB', type: 'pdf' },
  { name: 'System_Requirements_Document.docx', size: '1.1 MB', type: 'doc' },
  { name: 'Past_Incident_Reports.pdf', size: '3.7 MB', type: 'pdf' },
];

const fileConfig: Record<string, { icon: typeof FileIcon; gradient: string; bgClass: string }> = {
  pdf: {
    icon: BarChart3,
    gradient: 'from-red-500 to-rose-500',
    bgClass: 'bg-gradient-to-br from-red-500 to-rose-500',
  },
  doc: {
    icon: ClipboardList,
    gradient: 'from-blue-500 to-cyan-500',
    bgClass: 'bg-gradient-to-br from-blue-500 to-cyan-500',
  },
  ppt: {
    icon: Target,
    gradient: 'from-orange-500 to-amber-500',
    bgClass: 'bg-gradient-to-br from-orange-500 to-amber-500',
  },
  other: {
    icon: FileIcon,
    gradient: 'from-neutral-400 to-neutral-500',
    bgClass: 'bg-gradient-to-br from-neutral-400 to-neutral-500',
  },
};

export function FileUpload() {
  const [files] = useState<UploadedFile[]>(mockFiles);
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div className="bg-white rounded-2xl p-8 mb-8 border border-neutral-200/80 shadow-sm hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-violet-500 shadow-lg shadow-primary/20">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-neutral-900">
            Add Explicit Knowledge
          </h3>
          <p className="text-xs text-neutral-500">
            Upload documentation, presentations, and materials
          </p>
        </div>
      </div>

      {/* Upload zone */}
      <div
        className={cn(
          "relative rounded-2xl p-10 text-center cursor-pointer transition-all duration-300 border-2 border-dashed overflow-hidden group",
          isDragOver
            ? "border-primary bg-primary/5 scale-[0.99]"
            : "border-neutral-200 bg-gradient-to-br from-neutral-50 to-slate-50 hover:border-primary/50 hover:from-primary/5 hover:to-violet-50"
        )}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragOver(true);
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragOver(false);
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.02]"
             style={{
               backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)',
               backgroundSize: '20px 20px'
             }}
        />

        <div className={cn(
          "relative mx-auto w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center mb-5 transition-all duration-300",
          isDragOver
            ? "bg-gradient-to-br from-primary to-violet-500 scale-110"
            : "bg-white group-hover:scale-105"
        )}>
          <UploadCloud className={cn(
            "w-8 h-8 transition-all duration-300",
            isDragOver ? "text-white" : "text-neutral-400 group-hover:text-primary"
          )} />
        </div>
        <div className="relative font-bold mb-2 text-neutral-900 text-lg">
          {isDragOver ? "Drop files to upload" : "Drop files here or click to upload"}
        </div>
        <div className="relative text-sm text-neutral-500 flex items-center justify-center gap-2">
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">PDF</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">DOCX</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">TXT</span>
          <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium">PPT</span>
        </div>
      </div>

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="mt-6 pt-6 border-t border-neutral-100">
          <div className="font-bold mb-4 text-neutral-900 flex items-center gap-2">
            <div className="p-1 rounded-md bg-emerald-100">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <span>Uploaded Files</span>
            <span className="text-xs font-medium px-2 py-0.5 bg-neutral-100 rounded-full text-neutral-500">
              {files.length} files
            </span>
          </div>
          <div className="space-y-2">
            {files.map((file, index) => {
              const config = fileConfig[file.type] || fileConfig.other;
              const Icon = config.icon;

              return (
                <div
                  key={file.name}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-xl bg-neutral-50 border border-neutral-100",
                    "group hover:bg-white hover:border-neutral-200 hover:shadow-sm transition-all duration-200",
                    "animate-fade-in"
                  )}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className={cn(
                    "p-2.5 rounded-xl shadow-md transition-transform duration-200 group-hover:scale-105",
                    config.bgClass
                  )}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-neutral-800 truncate group-hover:text-neutral-900 transition-colors">
                      {file.name}
                    </span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
                      <Sparkles className="w-3 h-3 text-amber-500" />
                      Processed
                    </span>
                  </div>
                  <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-1 rounded">
                    {file.size}
                  </span>
                  <button className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
