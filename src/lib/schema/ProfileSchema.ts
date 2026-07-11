import { z } from "zod";

const existingFileSchema = z.object({
  id: z.string().optional(),
  url: z.string(),
  name: z.string(),
  type: z.string().optional(),
});

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Matches what FileUploader actually emits via onChange:
// { files: File[], remainingExisting: ExistingFileValue[] } | null
const fileUploadValue = z
  .object({
    files: z.array(z.instanceof(File)),
    remainingExisting: z.array(existingFileSchema),
  })
  .nullable();

export const profileSchema = z
  .object({
    fullName: z
      .string()
      .min(1, "Full name is required")
      .min(2, "Full name must be at least 2 characters"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    country: z.string().min(1, "Please select a country"),
    role: z.string().min(1, "Please select a role"),

    profilePicture: fileUploadValue.refine(
      (val) =>
        !val ||
        val.files.every((f) => f.size <= MAX_FILE_SIZE),
      { message: "File size must be less than 5MB" },
    ),

    documents: fileUploadValue.refine(
      (val) =>
        !val ||
        val.files.every((f) => f.size <= MAX_FILE_SIZE),
      { message: "File size must be less than 5MB" },
    ),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;