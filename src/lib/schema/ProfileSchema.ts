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
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Include at least one uppercase letter")
      .regex(/[0-9]/, "Include at least one number"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    country: z.string().min(1, "Please select a country"),
    role: z.string().min(1, "Please select a role"),

    profilePicture: fileUploadValue.refine(
      (val) => !val || val.files.every((f) => f.size <= MAX_FILE_SIZE),
      { message: "File size must be less than 5MB" },
    ),

    bookingDate: z.string().min(1, "Please select a date"),
    // or for multiple:
    bookingDates: z.array(z.string()).min(1, "Select at least one date"),

    // Single required checkbox, e.g. "I agree to the terms"
    agreeToTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to continue",
    }),
    agreeTerms: z.boolean().refine((v) => v === true, {
      message: "You must accept the terms to continue",
    }),

    interest: z.array(z.string()).min(1, "Select at least one interest"),

    gender: z.enum(["male", "female", "other"], {
      message: "Please select an option",
    }),

    time: z.string().min(1, "Please select a time"),

    maxPrice: z
      .number()
      .min(0, "Price must be at least 0")
      .max(10000, "Price must be less than 10000"),
    priceRange: z
      .tuple([
        z
          .number()
          .min(0, "Price must be at least 0")
          .max(10000, "Price must be less than 10000"),
        z
          .number()
          .min(0, "Price must be at least 0")
          .max(10000, "Price must be less than 10000"),
      ])
      .refine(([min, max]) => min <= max, {
        message: "Minimum price must be less than or equal to maximum price",
      }),

    experience: z
      .number()
      .min(0, "Experience must be at least 0")
      .max(5, "Experience must be less than 5"),
    rating: z
      .number()
      .min(0, "Rating must be at least 0")
      .max(5, "Rating must be less than 5"),

    // Checkbox group, at least one required
    interests: z.array(z.string()).min(1, "Select at least one option"),

    documents: fileUploadValue.refine(
      (val) => !val || val.files.every((f) => f.size <= MAX_FILE_SIZE),
      { message: "File size must be less than 5MB" },
    ),
    hoby: z.array(z.string()).min(1, "Please select at least one hoby"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ProfileFormValues = z.infer<typeof profileSchema>;
