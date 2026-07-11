"use client";

import * as React from "react";
import { Mail, Lock } from "lucide-react";

import {
  ProfileFormValues,
  profileSchema,
} from "@/src/lib/schema/ProfileSchema";
import ReusableForm, {
  FieldConfig,
} from "@/src/components/forms/ReusableForms";

const countryOptions = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "bd", label: "Bangladesh" },
  { value: "in", label: "India" },
  { value: "de", label: "Germany" },
  { value: "jp", label: "Japan" },
];

const roleOptions = [
  { value: "admin", label: "Administrator" },
  { value: "editor", label: "Editor" },
  { value: "viewer", label: "Viewer" },
  { value: "billing", label: "Billing only", disabled: true },
];

const fields: FieldConfig<ProfileFormValues>[] = [
  {
    type: "text",
    name: "fullName",
    label: "Full name",
    colSpan: 12,
  },
  {
    type: "email",
    name: "email",
    label: "Email address",
    startAdornment: <Mail className="h-[18px] w-[18px]" />,
    colSpan: 6,
  },
  {
    type: "password",
    name: "password",
    label: "Password",
    startAdornment: <Lock className="h-[18px] w-[18px]" />,
    // helperText: "At least 8 characters, one uppercase letter and one number",
    colSpan: 6,
  },
  {
    type: "password",
    name: "confirmPassword",
    label: "Confirm password",
    startAdornment: <Lock className="h-[18px] w-[18px]" />,
    // helperText: "At least 8 characters, one uppercase letter and one number",
    colSpan: 6,
  },
  {
    type: "select",
    name: "country",
    label: "Country",
    placeholder: "Select a country",
    options: countryOptions,
    colSpan: 6,
  },
  {
    type: "select",
    name: "role",
    label: "Role",
    placeholder: "Select a role",
    options: roleOptions,
    colSpan: 6,
  },
  {
    type: "file",
    name: "profilePicture",
    label: "Profile picture",
    accept: "image/*",
    maxSizeMB: 5,
    colSpan: 6,
  },
  {
    type: "file",
    name: "documents",
    label: "Documents",
    accept: "*/*",
    maxSizeMB: 5,
    multiple: true, // ← turns on multi-file mode
    maxFiles: 5, // ← optional cap
    colSpan: 6,
  },
];

export default function Home() {
  const [submitted, setSubmitted] = React.useState<ProfileFormValues | null>(
    null,
  );

  const onSubmit = (data: ProfileFormValues) => {
    setSubmitted(data);
  };

console.log(submitted);

  const profileInitialValues = {
    fullName: "John Doe",
    email: "RtK6R@example.com",
    password: "password123",
    confirmPassword: "password123",
    country: "us",
    role: "admin",
    profilePicture: null,
    documents: null,
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-medium text-mui-text-primary">
        Create profile
      </h1>
      <p className="mb-8 text-sm text-mui-text-secondary">
        Reusable Input / Select components styled after Material UI, validated
        with Zod via React Hook Form.
      </p>

      <div className="rounded   shadow-mui ">
        <ReusableForm
          schema={profileSchema}
          fields={fields}
          defaultValues={{
            fullName: "",
            email: "",
            password: "",
            confirmPassword: "",
            country: "",
            role: "",
            profilePicture: null,
            documents: null,
          }}
          values={profileInitialValues}
          submitLabel="Create account"
          onSubmit={onSubmit}
        />
      </div>

      {submitted && (
        <div className="mt-6 rounded border border-green-600/30 bg-green-50 p-4 text-sm text-green-800">
          Submitted successfully. Check the console for the full payload.
          <pre className="mt-2 overflow-auto text-xs text-green-900">
            {JSON.stringify(submitted, null, 2)}
          </pre>
        </div>
      )}
    </main>
  );
}
