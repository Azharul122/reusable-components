"use client";

import * as React from "react";
import {
  useForm,
  Controller,
  FieldValues,
  DefaultValues,
  Path,
  SubmitHandler,
  Resolver,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodType } from "zod";

import TextField from "./InputFields";
import { cn } from "@/src/utils/cn";
import Select, { SelectOption } from "./SelectField";
import FileUploader, { ExistingFileValue } from "./FileUpload";
import { Checkbox, CheckboxGroup, CheckboxOption } from "./CheckboxField";

type BaseFieldConfig<TFieldValues extends FieldValues> = {
  name: Path<TFieldValues>;
  label: string;
  helperText?: string;
  fullWidth?: boolean;
  colSpan?: 6 | 12;
};

type TextFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "text" | "email" | "password" | "number" | "tel" | "url";
    placeholder?: string;
    startAdornment?: React.ReactNode;
    endAdornment?: React.ReactNode;
  };

type CheckboxFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "checkbox";
  };

type CheckboxGroupFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "checkbox-group";
    options: CheckboxOption[];
    direction?: "row" | "column";
    selectAll?: boolean;
  };

type SelectFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "select";
    options: SelectOption[];
    placeholder?: string;
    multiple?: boolean;
    searchPlaceholder?: string;
  };

export type FieldConfig<TFieldValues extends FieldValues> =
  | TextFieldConfig<TFieldValues>
  | SelectFieldConfig<TFieldValues>
  | FileFieldConfig<TFieldValues>
  | CheckboxFieldConfig<TFieldValues>
  | CheckboxGroupFieldConfig<TFieldValues>;

export interface ReusableFormProps<TFieldValues extends FieldValues> {
  schema: ZodType<TFieldValues, TFieldValues>;
  fields: FieldConfig<TFieldValues>[];
  defaultValues: DefaultValues<TFieldValues>;
  values?: TFieldValues;
  onSubmit: SubmitHandler<TFieldValues>;
  submitLabel?: string;
  /** Called after a successful submit + form reset, e.g. to show a toast */
  onSuccess?: () => void;
  className?: string;
}

type FileFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "file";
    accept?: string;
    maxSizeMB?: number;
    defaultFile?: ExistingFileValue | null;
    multiple?: boolean;
    maxFiles?: number;
    defaultFiles?: ExistingFileValue | ExistingFileValue[] | null;
  };

export default function ReusableForm<TFieldValues extends FieldValues>({
  schema,
  fields,
  defaultValues,
  values,
  onSubmit,
  submitLabel = "Submit",
  onSuccess,
  className,
}: ReusableFormProps<TFieldValues>) {
  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<TFieldValues>({
    resolver: zodResolver(schema) as Resolver<TFieldValues>,
    defaultValues,
    values,
    mode: "onChange",
  });

  const submit: SubmitHandler<TFieldValues> = async (values) => {
    await onSubmit(values);
    reset(defaultValues);
    onSuccess?.();
  };

  return (
    <form
      onSubmit={handleSubmit(submit)}
      noValidate
      className={cn("grid grid-cols-1 gap-5 sm:grid-cols-12", className)}
    >
      {fields.map((field) => {
        const fieldError = errors[field.name];
        const errorMessage =
          typeof fieldError?.message === "string"
            ? fieldError.message
            : undefined;
        const span = field.colSpan ?? 12;

        return (
          <div
            key={String(field.name)}
            className={span === 6 ? "sm:col-span-6" : "sm:col-span-12"}
          >
            {field.type === "select" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <Select
                    label={field.label}
                    options={field.options}
                    multiple={field.multiple}
                    searchPlaceholder={field.searchPlaceholder}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    placeholder={field.placeholder}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                  />
                )}
              />
            ) : field.type === "file" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <FileUploader
                    label={field.label}
                    multiple={field.multiple}
                    maxFiles={field.maxFiles}
                    accept={field.accept}
                    maxSizeMB={field.maxSizeMB}
                    defaultValue={field.defaultFiles}
                    onChange={(payload) => rhfField.onChange(payload)}
                    onBlur={rhfField.onBlur}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                  />
                )}
              />
            ) : field.type === "checkbox" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <Checkbox
                    label={field.label}
                    checked={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                  />
                )}
              />
            ) : field.type === "checkbox-group" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <CheckboxGroup
                    label={field.label}
                    options={field.options}
                    direction={field.direction}
                    selectAll={field.selectAll}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                  />
                )}
              />
            ) : (
              <TextField
                type={field.type}
                label={field.label}
                placeholder={field.placeholder}
                startAdornment={field.startAdornment}
                endAdornment={field.endAdornment}
                error={Boolean(fieldError)}
                helperText={errorMessage ?? field.helperText}
                fullWidth={field.fullWidth ?? true}
                {...register(field.name)}
              />
            )}
          </div>
        );
      })}

      <div className="sm:col-span-12">
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "inline-flex h-10.5 items-center justify-center rounded px-6 border",
            "bg-mui-primary text-sm font-medium uppercase tracking-wide text-white",
            "shadow-sm transition-colors hover:bg-mui-primaryHover",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
