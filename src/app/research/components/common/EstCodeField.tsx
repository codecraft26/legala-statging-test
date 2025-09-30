"use client";

import React from "react";

interface EstCodeOption {
  code: string;
  description?: string;
}

interface EstCodeFieldProps {
  value: string;
  onChange: (v: string) => void;
  options: EstCodeOption[];
  disabled?: boolean;
  helper?: React.ReactNode;
  errorText?: string | null;
}

export default function EstCodeField({ value, onChange, options, disabled, helper, errorText }: EstCodeFieldProps) {
  return (
    <div className="relative">
      <input
        className="rounded-md border px-3 py-2 text-sm w-full"
        placeholder="EST code (e.g., JKSG02,JKSG01)"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list="estCodeDatalist"
        disabled={disabled}
      />
      <datalist id="estCodeDatalist">
        {options.map((option, index) => (
          <option key={index} value={option.code}>
            {option.description}
          </option>
        ))}
      </datalist>
      {errorText ? (
        <div className="text-xs text-red-500 mt-1">{errorText}</div>
      ) : helper ? (
        <div className="text-xs text-gray-500 mt-1">{helper}</div>
      ) : null}
    </div>
  );
}


