'use client';

import React, { useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, Trash2, Check, RefreshCw } from 'lucide-react';

interface LogoUploadProps {
  value: string;
  onChange: (base64OrUrl: string) => void;
  label?: string;
  helpText?: string;
}

export default function LogoUpload({
  value,
  onChange,
  label = 'Company Logo',
  helpText = 'Upload your logo image (PNG, SVG, JPG, WebP — Max 4MB)',
}: LogoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setUploadError(null);

    // Validate size (max 4MB)
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File size exceeds 4MB. Please choose a smaller image.');
      return;
    }

    // Validate image type
    if (!file.type.startsWith('image/')) {
      setUploadError('Invalid file type. Please upload a PNG, SVG, JPG, or WebP image.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        onChange(result);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-white/80">
        <ImageIcon className="w-4 h-4 text-indigo-400" />
        {label}
      </label>

      {/* Upload & Preview Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group rounded-2xl p-5 border-2 border-dashed transition-all cursor-pointer flex flex-col sm:flex-row items-center gap-5 ${
          isDragging
            ? 'border-indigo-400 bg-indigo-500/10'
            : 'border-white/15 bg-white/[0.03] hover:border-white/30 hover:bg-white/[0.05]'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/svg+xml,image/webp"
          onChange={(e) => {
            if (e.target.files && e.target.files[0]) {
              handleFile(e.target.files[0]);
            }
          }}
          className="hidden"
        />

        {/* Thumbnail preview */}
        <div className="w-24 h-24 rounded-xl bg-black/40 border border-white/10 flex items-center justify-center p-2 flex-shrink-0 relative overflow-hidden shadow-inner">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="Company Logo Preview"
              className="max-w-full max-h-full object-contain filter drop-shadow"
            />
          ) : (
            <ImageIcon className="w-8 h-8 text-white/25" />
          )}
        </div>

        {/* Action description */}
        <div className="flex-1 text-center sm:text-left space-y-1">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <UploadCloud className="w-4 h-4 text-indigo-400" />
            <span className="text-sm font-semibold text-white">
              {value ? 'Click or drag to replace logo' : 'Click or drag logo here to upload'}
            </span>
          </div>
          <p className="text-xs text-white/40">{helpText}</p>
          {value && (
            <div className="pt-2 flex items-center justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                <Check className="w-3 h-3" /> Logo Active
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-500/15 text-rose-300 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Remove
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError && (
        <p className="text-xs text-rose-400 font-medium animate-fade-in">{uploadError}</p>
      )}
    </div>
  );
}
