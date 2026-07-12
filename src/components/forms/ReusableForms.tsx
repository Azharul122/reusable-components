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
import { RadioGroup, RadioOption } from "./RadioField";
import DateField, { DateValue } from "./DateField";
import { Switch, SwitchGroup, SwitchOption } from "./Switch";
import { Slider } from "./Slider";
import RatingField from "./RatingField";

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

type RadioFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "radio";
    options: RadioOption[];
    direction?: "row" | "column";
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

type SwitchFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "switch";
  };

type SwitchGroupFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "switch-group";
    options: SwitchOption[];
    direction?: "row" | "column";
  };

type SelectFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "select";
    options: SelectOption[];
    placeholder?: string;
    multiple?: boolean;
    searchPlaceholder?: string;
  };

type DateFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "date";
    multiple?: boolean;
    bookedDates?: DateValue[];
    disablePast?: boolean;
    minDate?: DateValue;
    maxDate?: DateValue;
  };

type SliderFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "slider";
    range?: boolean; // false/omitted = single value, true = [min, max]
    min?: number;
    max?: number;
    step?: number;
    formatValue?: (value: number) => string; // e.g. (v) => `$${v}`
    showValue?: boolean;
  };

type RatingFieldConfig<TFieldValues extends FieldValues> =
  BaseFieldConfig<TFieldValues> & {
    type: "rating";
    max?: number;
    precision?: number;
    mode?: "view" | "edit";
  };

export type FieldConfig<TFieldValues extends FieldValues> =
  | TextFieldConfig<TFieldValues>
  | SelectFieldConfig<TFieldValues>
  | FileFieldConfig<TFieldValues>
  | CheckboxFieldConfig<TFieldValues>
  | CheckboxGroupFieldConfig<TFieldValues>
  | SwitchFieldConfig<TFieldValues>
  | SwitchGroupFieldConfig<TFieldValues>
  | RadioFieldConfig<TFieldValues>
  | DateFieldConfig<TFieldValues>
  | SliderFieldConfig<TFieldValues>
  | RatingFieldConfig<TFieldValues>;

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
            ) : field.type === "rating" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <RatingField
                    label={field.label}
                    max={field.max}
                    precision={field.precision}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                    mode={field.mode ?? "view"}
                  />
                )}
              />
            ) : field.type === "switch" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <Switch
                    label={field.label}
                    checked={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                  />
                )}
              />
            ) : field.type === "slider" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <Slider
                    label={field.label}
                    // cast needed because the generic FieldConfig can't tie
                    // `range` to the value's shape at this layer
                    {...({ range: field.range } as { range?: boolean })}
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    formatValue={field.formatValue}
                    showValue={field.showValue}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                  />
                )}
              />
            ) : field.type === "switch-group" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <SwitchGroup
                    label={field.label}
                    options={field.options}
                    direction={field.direction}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
                  />
                )}
              />
            ) : field.type === "radio" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <RadioGroup
                    label={field.label}
                    options={field.options}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    direction={field.direction}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                  />
                )}
              />
            ) : field.type === "date" ? (
              <Controller
                name={field.name}
                control={control}
                render={({ field: rhfField }) => (
                  <DateField
                    label={field.label}
                    multiple={field.multiple}
                    bookedDates={field.bookedDates}
                    disablePast={field.disablePast}
                    minDate={field.minDate}
                    maxDate={field.maxDate}
                    value={rhfField.value}
                    onChange={rhfField.onChange}
                    onBlur={rhfField.onBlur}
                    name={rhfField.name}
                    error={Boolean(fieldError)}
                    helperText={errorMessage ?? field.helperText}
                    fullWidth={field.fullWidth ?? true}
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
            "bg-primary text-sm font-medium uppercase tracking-wide text-white",
            "shadow-sm transition-colors hover:bg-primaryHover",
            "disabled:cursor-not-allowed disabled:opacity-60",
          )}
        >
          {isSubmitting ? "Submitting…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
