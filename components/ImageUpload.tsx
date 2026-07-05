"use client";

import { useState, useRef, DragEvent, ChangeEvent } from "react";
import ImageLightbox from "./ImageLightbox";

interface ImageUploadProps {
  onImagesChange: (images: File[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUpload({
  onImagesChange,
  maxImages = 10,
  disabled = false,
}: ImageUploadProps) {
  const [images, setImages] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Build object URLs lazily per render — we memoize with useMemo if needed
  const previewUrls = images.map((f) => URL.createObjectURL(f));

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith("image/")
    );
    addImages(files);
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.target.files) {
      const files = Array.from(e.target.files).filter((file) =>
        file.type.startsWith("image/")
      );
      addImages(files);
    }
  };

  const addImages = (newFiles: File[]) => {
    const remainingSlots = maxImages - images.length;
    const filesToAdd = newFiles.slice(0, remainingSlots);
    const updatedImages = [...images, ...filesToAdd];
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const removeImage = (index: number) => {
    const updatedImages = images.filter((_, i) => i !== index);
    setImages(updatedImages);
    onImagesChange(updatedImages);
  };

  const openFileDialog = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`border-2 border-dashed p-4 text-center transition-all relative overflow-hidden ${
          disabled
            ? "border-gray-200 bg-gray-100 opacity-60 cursor-not-allowed pointer-events-none"
            : isDragging
            ? "border-navy bg-navy-light cursor-pointer"
            : "border-gray-300 bg-gray-50 cursor-pointer hover:border-gray-400"
        }`}
        onDragOver={disabled ? undefined : handleDragOver}
        onDragLeave={disabled ? undefined : handleDragLeave}
        onDrop={disabled ? undefined : handleDrop}
        onClick={disabled ? undefined : openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileInput}
          style={{ display: "none" }}
          disabled={disabled}
        />
        <div className="flex flex-col items-center gap-2">
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="text-gray-400"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <p className="text-gray-600 text-sm m-0">Drag and drop or click</p>
        </div>
      </div>

      {images.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3 mt-4 sm:grid-cols-[repeat(auto-fill,minmax(120px,1fr))]">
          {images.map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden border border-gray-200 bg-white group"
            >
              {/* Thumbnail — click to open lightbox */}
              <div
                className="relative cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxIndex(index);
                }}
              >
                <img
                  src={previewUrls[index]}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-24 object-cover"
                />
                {/* Zoom hint on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <svg
                    className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"
                    />
                  </svg>
                </div>
              </div>

              {/* Remove button */}
              <button
                className={`absolute top-1 right-1 w-6 h-6 bg-red-600 text-white flex items-center justify-center text-lg font-bold transition-all border-0 p-0 leading-none ${
                  disabled
                    ? "opacity-50 cursor-not-allowed"
                    : "cursor-pointer hover:bg-red-700 hover:scale-110"
                }`}
                onClick={(e) => {
                  if (disabled) return;
                  e.stopPropagation();
                  removeImage(index);
                }}
                disabled={disabled}
                aria-label="Remove image"
              >
                ×
              </button>

              <div className="p-2 text-xs text-gray-600">
                <div className="truncate font-medium">{image.name}</div>
                <div className="text-gray-500">{(image.size / 1024).toFixed(1)} KB</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {images.length >= maxImages && (
        <p className="mt-2 text-sm text-amber-600 font-medium text-center">
          Maximum of {maxImages} images reached
        </p>
      )}

      {/* Lightbox for input image preview */}
      {lightboxIndex !== null && (
        <ImageLightbox
          images={previewUrls}
          currentIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onNavigate={setLightboxIndex}
        />
      )}
    </div>
  );
}
