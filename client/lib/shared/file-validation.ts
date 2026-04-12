export const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB
export const MAX_FILES = 1;
export const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
export const ALLOWED_FILE_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.gif";

export interface FileValidationResult {
  valid: File[];
  errors: string[];
}

export function validateFiles(files: File[], currentCount: number = 0): FileValidationResult {
  const errors: string[] = [];

  if (currentCount >= MAX_FILES) {
    return { valid: [], errors: [`Only ${MAX_FILES} file can be attached at a time`] };
  }

  const valid = files.filter((file) => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push(`${file.name}: only jpg, png, gif, webp allowed`);
      return false;
    }
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`${file.name}: exceeds 1 MB limit`);
      return false;
    }
    return true;
  });

  return { valid, errors };
}
