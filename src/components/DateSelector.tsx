"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface DateSelectorProps {
  dates: string[];
  selectedDate: string;
}

export function DateSelector({ dates, selectedDate }: DateSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  return (
    <label className="date-selector">
      <span>選擇日期</span>
      <select
        value={selectedDate}
        onChange={(event) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", event.target.value);
          router.push(`/?${params.toString()}`);
        }}
      >
        {dates.map((date) => (
          <option key={date} value={date}>
            {date}
          </option>
        ))}
      </select>
    </label>
  );
}
