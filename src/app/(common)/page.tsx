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
import { DateValue } from "@/src/components/forms/DateField";
import { useState } from "react";
import Pagination from "@/src/components/ui/Pagination";
import Breadcrumbs from "@/src/components/ui/Breadcrumbs";
import Link from "next/link";
import Steps from "@/src/components/ui/Stepper";
import PageLoader from "@/src/components/shared/loader/Loader";
import EmptyState from "@/src/components/ui/Empty";
import ProgressBar from "@/src/components/ui/Progressbar";

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

const bookedDates: DateValue[] = [
  "2026-07-15",
  "2026-07-16",
  "2026-07-20",
  "2026-08-01",
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
    startAdornment: <Mail className="h-4.5 w-4.5" />,
    colSpan: 6,
  },
  {
    type: "password",
    name: "password",
    label: "Password",
    startAdornment: <Lock className="h-4.5 w-4.5" />,
    // helperText: "At least 8 characters, one uppercase letter and one number",
    colSpan: 6,
  },
  {
    type: "password",
    name: "confirmPassword",
    label: "Confirm password",
    startAdornment: <Lock className="h-4.5 w-4.5" />,
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
    multiple: true, 
    maxFiles: 5, 
    colSpan: 6,
  },
  {
    type: "select",
    name: "hoby",
    label: "Hoby",
    multiple: true,
    searchPlaceholder: "Search hoby",
    placeholder: "Select a hoby",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
    colSpan: 12,
  },
  {
    type: "checkbox",
    name: "agreeToTerms",
    label: "Accept terms and conditions",
    colSpan: 12,
  },
  {
    type: "checkbox-group",
    name: "interests",
    label: "Select interests",
    options: [
      { value: "short", label: "Short" },
      { value: "medium", label: "Medium" },
      { value: "long", label: "Long" },
    ],
    colSpan: 12,
  },
  {
    type: "radio",
    name: "gender",
    label: "Select gender",
    options: [
      { value: "male", label: "Male" },
      { value: "female", label: "Female" },
      { value: "other", label: "Other" },
    ],
    colSpan: 12,
  },
  {
    type: "date",
    name: "bookingDate",
    label: "Select date",
    colSpan: 12,
  },
  {
    type: "date",
    name: "bookingDates",
    label: "Select multiple dates",
    multiple: true,
    colSpan: 12,
    bookedDates: bookedDates,
    disablePast: true,
  },
  // Example additions to page.tsx's `fields` array

  {
    type: "switch",
    name: "agreeTerms",
    label: "Accept terms and conditions",
    colSpan: 12,
  },

  {
    type: "switch-group",
    name: "interest",
    label: "Notification preferences",
    direction: "column",
    options: [
      { value: "email", label: "Email notifications" },
      { value: "sms", label: "SMS notifications" },
      { value: "push", label: "Push notifications" },
    ],
    colSpan: 12,
  },

  {
    type: "slider",
    name: "maxPrice", 
    label: "Maximum price",
    min: 0,
    max: 1000,
    step: 10,
    formatValue: (v) => `$${v}`,
    colSpan: 12,
  },

  {
    type: "slider",
    name: "priceRange", 
    label: "Price range",
    range: true,
    min: 0,
    max: 1000,
    step: 10,
    formatValue: (v) => `$${v}`,
    colSpan: 12,
  },
  {
    type: "rating",
    name: "experience", 
    label: "Experience",
    max: 5,
    colSpan: 12,
  },
  {
    type: "rating",
    name: "rating",
    label: "Rating",
    max: 5,
    precision: 1,
    mode: "edit",
    colSpan: 12,
  },
  {
    type: "time",
    name: "time", 
    label: "Select time",
    colSpan: 12,
    use12Hours: true, 
  },
];

export default function Home() {
  const [submitted, setSubmitted] = React.useState<ProfileFormValues | null>(
    null,
  );

  const [page, setPage] = useState(1);
  const [step, setStep] = useState(1);
  const steps = [
    { label: "Cart" },
    { label: "Shipping", description: "Address & method" },
    { label: "Payment" },
    { label: "Review", optional: true },
  ];

  const totalPages = 24;

  const onSubmit = (data: ProfileFormValues) => {
    setSubmitted(data);
  };

  console.log(submitted);

  const profileInitialValues = React.useMemo<ProfileFormValues>(
    () => ({
      fullName: "John Doe",
      email: "RtK6R@example.com",
      password: "password123",
      confirmPassword: "password123",
      country: "us",
      hoby: [],
      role: "admin",
      profilePicture: null,
      documents: null,
      agreeToTerms: false,
      interests: [],
      gender: "male",
      bookingDate: "",
      bookingDates: [],
      agreeTerms: false,
      interest: [],
      maxPrice: 0,
      priceRange: [0, 0],
      experience: 4.75,
      rating: 0,
      time: "",
    }),
    [], 
  );

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-6 py-16">
      <h1 className="mb-1 text-2xl font-medium ">Create profile</h1>
      <p className="mb-8 text-sm text-mui-text-secondary">
        Reusable Input / Select components styled after Material UI, validated
        with Zod via React Hook Form.
      </p>

      <div className="rounded   shadow-mui ">
        <ReusableForm
          schema={profileSchema}
          fields={fields}
          defaultValues={profileInitialValues}
          submitLabel="Create account"
          onSubmit={onSubmit}
        />
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      <Breadcrumbs
        linkAs={Link}
        items={[
          { label: "Settings", href: "/settings" },
          { label: "Team", href: "/settings/team" },
          { label: "Members" }, // no href = current page
        ]}
      />

      {/* Stepper */}

      <Steps steps={steps} currentStep={step} onStepClick={setStep} />

      {/* Loader */}
      <PageLoader
        variant="inline"
        size="md"
        minHeight="200px"
        className="border"
        label="Data is loading..."
      />

      {/* Empty */}
      <EmptyState
        title="No data available"
        description="There is no data to display at the moment."
        variant="search"
      />

      {/* Progress bar */}
      <ProgressBar value={50} max={100} />
    </main>
  );
}
