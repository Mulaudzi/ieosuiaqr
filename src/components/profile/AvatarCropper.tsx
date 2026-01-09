import { useState, useRef, useCallback } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Upload, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface AvatarCropperProps {
  open: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  isUploading?: boolean;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function AvatarCropper({
  open,
  onClose,
  onCropComplete,
  isUploading = false,
}: AvatarCropperProps) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCrop(undefined);
      setScale(1);
      setRotate(0);
      const reader = new FileReader();
      reader.addEventListener("load", () =>
        setImgSrc(reader.result?.toString() || "")
      );
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    setCrop(centerAspectCrop(width, height, 1));
  };

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    const image = imgRef.current;
    if (!image || !completedCrop) {
      return null;
    }

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    const outputSize = 256; // Output avatar size
    canvas.width = outputSize;
    canvas.height = outputSize;

    ctx.imageSmoothingQuality = "high";

    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Apply rotation
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-centerX, -centerY);

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputSize,
      outputSize
    );

    ctx.restore();

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => {
          resolve(blob);
        },
        "image/jpeg",
        0.9
      );
    });
  }, [completedCrop, scale, rotate]);

  const handleCropComplete = async () => {
    const croppedImage = await getCroppedImg();
    if (croppedImage) {
      onCropComplete(croppedImage);
    }
  };

  const handleClose = () => {
    setImgSrc("");
    setCrop(undefined);
    setCompletedCrop(undefined);
    setScale(1);
    setRotate(0);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!imgSrc ? (
            <div
              className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => inputRef.current?.click()}
            >
              <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm font-medium">Click to upload an image</p>
              <p className="text-xs text-muted-foreground mt-1">
                JPG, PNG, GIF or WebP. Max 5MB.
              </p>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={onSelectFile}
                className="hidden"
              />
            </div>
          ) : (
            <>
              <div className="relative bg-muted rounded-xl overflow-hidden flex items-center justify-center min-h-[300px]">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop preview"
                    src={imgSrc}
                    onLoad={onImageLoad}
                    style={{
                      transform: `scale(${scale}) rotate(${rotate}deg)`,
                      maxHeight: "400px",
                    }}
                  />
                </ReactCrop>
                <button
                  onClick={() => {
                    setImgSrc("");
                    setCrop(undefined);
                  }}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-background/80 hover:bg-background transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[scale]}
                    min={0.5}
                    max={3}
                    step={0.1}
                    onValueChange={([value]) => setScale(value)}
                    className="flex-1"
                  />
                  <ZoomIn className="w-4 h-4 text-muted-foreground" />
                </div>

                <div className="flex items-center gap-3">
                  <RotateCw className="w-4 h-4 text-muted-foreground" />
                  <Slider
                    value={[rotate]}
                    min={-180}
                    max={180}
                    step={1}
                    onValueChange={([value]) => setRotate(value)}
                    className="flex-1"
                  />
                  <span className="text-xs text-muted-foreground w-12 text-right">
                    {rotate}°
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            Cancel
          </Button>
          {imgSrc && (
            <Button
              variant="hero"
              onClick={handleCropComplete}
              disabled={!completedCrop || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Save Photo"
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
