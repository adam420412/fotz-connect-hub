import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FileImage, FileText, FileVideo, Loader2 } from "lucide-react";

interface FileThumbnailProps {
  storagePath: string;
  fileType: string;
  fileName: string;
  className?: string;
}

export const FileThumbnail = ({ storagePath, fileType, fileName, className = "" }: FileThumbnailProps) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const loadThumbnail = async () => {
      if (fileType !== "image") return;

      setLoading(true);
      setError(false);

      try {
        const { data } = await supabase.storage
          .from("project-files")
          .createSignedUrl(storagePath, 3600);

        if (data?.signedUrl) {
          setImageUrl(data.signedUrl);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Error loading thumbnail:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadThumbnail();
  }, [storagePath, fileType]);

  // Show icon for non-image files
  if (fileType !== "image") {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        {fileType === "video" ? (
          <FileVideo className="h-12 w-12 text-primary" />
        ) : (
          <FileText className="h-12 w-12 text-muted-foreground" />
        )}
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Error or no URL - show icon
  if (error || !imageUrl) {
    return (
      <div className={`flex items-center justify-center bg-muted ${className}`}>
        <FileImage className="h-12 w-12 text-accent" />
      </div>
    );
  }

  // Show actual image thumbnail
  return (
    <div className={`relative overflow-hidden bg-muted ${className}`}>
      <img
        src={imageUrl}
        alt={fileName}
        className="absolute inset-0 w-full h-full object-cover transition-transform group-hover:scale-105"
        onError={() => setError(true)}
      />
    </div>
  );
};
