"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  FileText,
  FileArchive,
  FileSpreadsheet,
  FileCode,
  Music,
  File as FileIcon,
} from "lucide-react";
import { cn } from "@/src/utils/cn";

export interface ExistingFileValue {
  id?: string;
  url: string;
  name: string;
  type?: string;
}

type UploadItem =
  | { kind: "existing"; key: string; data: ExistingFileValue }
  | { kind: "new"; key: string; file: File };

export interface FileUploaderProps {
  label?: string;
  helperText?: string;
  error?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  multiple?: boolean;
  maxFiles?: number;
  accept?: string;
  maxSizeMB?: number;
  name?: string;
  id?: string;
  defaultValue?: ExistingFileValue | ExistingFileValue[] | null;
  onChange?: (payload: {
    files: File[];
    remainingExisting: ExistingFileValue[];
  }) => void;
  onBlur?: () => void;
  className?: string;
  labelBackgroundClassName?: string;
}

const BYTES_IN_MB = 1024 * 1024;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < BYTES_IN_MB) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`;
}

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
}

function iconForFile(name: string, type?: string) {
  const ext = getExtension(name);
  const mime = type ?? "";

  if (mime.startsWith("audio/") || ["mp3", "wav", "ogg", "m4a"].includes(ext))
    return Music;
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) return FileArchive;
  if (["xls", "xlsx", "csv"].includes(ext)) return FileSpreadsheet;
  if (["json", "js", "ts", "tsx", "jsx", "html", "css", "py"].includes(ext))
    return FileCode;
  if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) return FileText;
  return FileIcon;
}

type PreviewKind = "image" | "video" | "icon";

function previewKind(name: string, type?: string): PreviewKind {
  const ext = getExtension(name);
  const mime = type ?? "";
  if (
    mime.startsWith("image/") ||
    ["png", "jpg", "jpeg", "gif", "webp", "svg", "avif"].includes(ext)
  ) {
    return "image";
  }
  if (
    mime.startsWith("video/") ||
    ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)
  ) {
    return "video";
  }
  return "icon";
}

let uidCounter = 0;
const nextKey = () => `f${Date.now()}-${uidCounter++}`;

function normalizeDefault(
  defaultValue: ExistingFileValue | ExistingFileValue[] | null | undefined,
): ExistingFileValue[] {
  if (!defaultValue) return [];
  return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
}


function FilePreviewThumb({
  name,
  type,
  url,
  size,
}: {
  name: string;
  type?: string;
  url?: string;
  size?: string;
}) {
  const kind = previewKind(name, type);

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded bg-mui-hoverBg">
      {kind === "image" && url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={name} className="h-full w-full object-cover" />
      ) : kind === "video" && url ? (
        <video src={url} className="h-full w-full object-cover" muted />
      ) : (
        React.createElement(iconForFile(name, type), {
          className: "h-6 w-6 text-mui-text-secondary",
        })
      )}
    </div>
  );
}


const FileUploader = React.forwardRef<HTMLInputElement, FileUploaderProps>(
  (
    {
      label,
      helperText,
      error = false,
      fullWidth = true,
      disabled = false,
      multiple = false,
      maxFiles,
      accept,
      maxSizeMB,
      name,
      id,
      defaultValue = null,
      onChange,
      onBlur,
      className,
      labelBackgroundClassName = "bg-black text-white",
    },
    forwardedRef,
  ) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const helperId = helperText ? `${inputId}-helper-text` : undefined;

    const inputRef = React.useRef<HTMLInputElement | null>(null);
    const setRefs = React.useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node;
        if (typeof forwardedRef === "function") forwardedRef(node);
        else if (forwardedRef) {
          (
            forwardedRef as React.MutableRefObject<HTMLInputElement | null>
          ).current = node;
        }
      },
      [forwardedRef],
    );

    
    // File objects, in the order they should render.
    const [items, setItems] = React.useState<UploadItem[]>(() =>
      normalizeDefault(defaultValue).map((data) => ({
        kind: "existing",
        key: data.id ?? data.url,
        data,
      })),
    );

    const [isDragging, setIsDragging] = React.useState(false);
    const [isFocused, setIsFocused] = React.useState(false);
    const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

    // Object URLs for newly-added files — created/revoked as items change
    const [objectUrlMap, setObjectUrlMap] = React.useState<Map<string, string>>(
      new Map(),
    );
    const objectUrlsRef = React.useRef<Map<string, string>>(new Map()); // for cleanup bookkeeping only

    const getObjectUrl = (item: Extract<UploadItem, { kind: "new" }>) =>
      objectUrlMap.get(item.key);

    React.useEffect(() => {
      const liveKeys = new Set(
        items.filter((i) => i.kind === "new").map((i) => i.key),
      );

      const current = objectUrlsRef.current;
      let changed = false;

      // Revoke and delete URLs for items no longer present
      current.forEach((url, key) => {
        if (!liveKeys.has(key)) {
          URL.revokeObjectURL(url);
          current.delete(key);
          changed = true;
        }
      });

      // Create object URLs for new items
      items.forEach((i) => {
        if (i.kind === "new" && !current.has(i.key)) {
          const url = URL.createObjectURL(i.file);
          current.set(i.key, url);
          changed = true;
        }
      });

      if (changed) {
        setObjectUrlMap(new Map(current));
      }
    }, [items]);

    React.useEffect(() => {
      return () =>
        objectUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    }, []);

    const emitChange = (next: UploadItem[]) => {
      onChange?.({
        files: next
          .filter(
            (i): i is Extract<UploadItem, { kind: "new" }> => i.kind === "new",
          )
          .map((i) => i.file),
        remainingExisting: next
          .filter(
            (i): i is Extract<UploadItem, { kind: "existing" }> =>
              i.kind === "existing",
          )
          .map((i) => i.data),
      });
    };

    // Notify the parent (RHF's onChange) whenever items change — safe here
    // because this runs in an effect, not during FileUploader's render.
    const isMounted = React.useRef(false);
    React.useEffect(() => {
      if (!isMounted.current) {
        isMounted.current = true;
        return; // skip firing onChange on initial mount; defaultValues already cover this
      }
      emitChange(items);
    }, [items]);

    const addFiles = (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setErrorMsg(null);

      const incoming = Array.from(fileList);
      const oversize = maxSizeMB
        ? incoming.find((f) => f.size > maxSizeMB * BYTES_IN_MB)
        : undefined;
      if (oversize) {
        setErrorMsg(`"${oversize.name}" is larger than ${maxSizeMB} MB`);
        return;
      }

      setItems((prev) => {
        const base = multiple ? prev : [];
        const combined: UploadItem[] = [
          ...base,
          ...incoming.map((file) => ({
            kind: "new" as const,
            key: nextKey(),
            file,
          })),
        ];
        const capped =
          multiple && maxFiles
            ? combined.slice(0, maxFiles)
            : multiple
              ? combined
              : combined.slice(-1);
        // no emitChange here anymore — the effect handles it
        return capped;
      });
    };

    const removeItem = (key: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setItems((prev) => prev.filter((i) => i.key !== key));
      // no emitChange here anymore — the effect handles it
    };

    const openBrowser = () => {
      if (!disabled) inputRef.current?.click();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (disabled) return;
      addFiles(e.dataTransfer.files);
    };

    const hasContent = items.length > 0;
    const shrink = true;

    const borderColor =
      error || errorMsg
        ? "border-mui-error"
        : isDragging || isFocused
          ? "border-mui-primary"
          : "border-mui-border";
    const borderWidth =
      isDragging || isFocused || error || errorMsg ? "border-2" : "border";
    const labelColor =
      error || errorMsg
        ? "text-error"
        : isDragging || isFocused
          ? "text-mui-primary"
          : "text-mui-text-secondary";

    const atMax =
      multiple && maxFiles
        ? items.length >= maxFiles
        : !multiple && items.length >= 1;

    return (
      <div className={cn(fullWidth ? "w-full" : "inline-block", "font-roboto")}>
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={openBrowser}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              openBrowser();
            }
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            onBlur?.();
          }}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          aria-disabled={disabled}
          className={cn(
            "relative flex w-full flex-col rounded transition-colors duration-150",
            borderWidth,
            borderColor,
            "px-4 py-3.5 outline-none",
            disabled
              ? "cursor-not-allowed opacity-40"
              : cn(
                  "cursor-pointer",
                  !isDragging && !isFocused && "hover:border-mui-borderHover",
                ),
            isDragging && "bg-primary/5",
            className,
          )}
        >
          <input
            ref={setRefs}
            id={inputId}
            type="file"
            name={name}
            accept={accept}
            multiple={multiple}
            disabled={disabled}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = ""; // allow re-selecting the same file
            }}
            className="sr-only"
            aria-describedby={helperId}
          />

          {label && (
            <label
              htmlFor={inputId}
              className={cn(
                "pointer-events-none absolute left-3.5 origin-top-left select-none",
                "transition-all duration-150 ease-out",
                labelColor,
                shrink
                  ? cn("-top-2 -ml-1 scale-75 px-1", labelBackgroundClassName)
                  : "top-1/2 -translate-y-1/2 scale-100 text-base",
              )}
            >
              {label}
            </label>
          )}

          {!hasContent && (
            <div
              className={cn(
                "flex w-full flex-col items-center gap-1.5 text-center transition-opacity",
                label ? "pt-3 pb-1" : "py-3",
              )}
            >
              <UploadCloud className="h-7 w-7 text-mui-text-secondary" />
              <p className="text-sm text-primary-text">
                <span className="font-medium text-mui-primary">
                  Click to upload
                </span>{" "}
                or drag and drop
                {multiple ? " files" : " a file"}
              </p>
              {accept && (
                <p className="text-xs text-mui-text-secondary">
                  {accept.replaceAll(",", ", ")}
                </p>
              )}
            </div>
          )}

          {hasContent && (
            <div className={cn("flex flex-col gap-2", label && "pt-2")}>
              {items.map((item) => {
                const name =
                  item.kind === "existing" ? item.data.name : item.file.name;
                const type =
                  item.kind === "existing" ? item.data.type : item.file.type;
                const url =
                  item.kind === "existing" ? item.data.url : getObjectUrl(item);
                const sizeLabel =
                  item.kind === "new"
                    ? formatBytes(item.file.size)
                    : "Uploaded file";

                return (
                  <div
                    key={item.key}
                    className="flex items-center gap-3 rounded bg-mui-hoverBg/40 p-1.5"
                  >
                    <FilePreviewThumb name={name} type={type} url={url} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-primary-text">
                        {name}
                      </p>
                      <p className="text-xs text-mui-text-secondary">
                        {sizeLabel}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => removeItem(item.key, e)}
                      disabled={disabled}
                      aria-label={`Remove ${name}`}
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-mui-text-secondary transition-colors",
                        disabled
                          ? "cursor-not-allowed"
                          : "cursor-pointer hover:bg-mui-hoverBg hover:text-primary-text",
                      )}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}

              {multiple && !atMax && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openBrowser();
                  }}
                  disabled={disabled}
                  className="mt-0.5 self-start text-xs font-medium text-mui-primary hover:underline"
                >
                  + Add more files
                </button>
              )}
            </div>
          )}
        </div>

        {(helperText || errorMsg) && (
          <p
            id={helperId}
            className={cn(
              "mt-1 px-1 text-xs leading-tight",
              error || errorMsg ? "text-error" : "text-mui-text-secondary",
            )}
          >
            {errorMsg ?? helperText}
          </p>
        )}
      </div>
    );
  },
);

FileUploader.displayName = "FileUploader";

export default FileUploader;
