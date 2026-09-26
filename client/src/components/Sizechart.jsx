import { useState } from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { XMarkIcon } from "@heroicons/react/24/outline";

// Each row is an object of measurements for the "inch" set.
// The "cm" values are derived from the inches so the two stay in sync.
const SIZE_ROWS = [
  { size: "XS", chest: 32, waist: 26, hip: 34, length: 26 },
  { size: "S", chest: 34, waist: 28, hip: 36, length: 27 },
  { size: "M", chest: 36, waist: 30, hip: 38, length: 28 },
  { size: "L", chest: 38, waist: 32, hip: 40, length: 29 },
  { size: "XL", chest: 40, waist: 34, hip: 42, length: 30 },
  { size: "XXL", chest: 42, waist: 36, hip: 44, length: 31 },
];

const COLUMNS = [
  { key: "chest", label: "Chest" },
  { key: "waist", label: "Waist" },
  { key: "hip", label: "Hip" },
  { key: "length", label: "Length" },
];

// How-to-measure instructions (no images — text only)
const MEASUREMENT_TIPS = [
  {
    title: "Chest",
    text: "Measure around the fullest part of your chest, keeping the tape horizontal and snug but not tight.",
  },
  {
    title: "Waist",
    text: "Measure around your natural waistline, the narrowest part of your torso, usually just above the navel.",
  },
  {
    title: "Hip",
    text: "Stand with feet together and measure around the fullest part of your hips and seat.",
  },
  {
    title: "Length",
    text: "Measure from the highest point of the shoulder straight down to the desired hem.",
  },
];

// Convert a value in inches to centimetres, rounded to 1 decimal place
const toCm = (inches) => Math.round(inches * 2.54 * 10) / 10;

const Sizechart = ({ open, onClose }) => {
  const [unit, setUnit] = useState("in"); // "in" | "cm"

  const formatValue = (inches) =>
    unit === "in" ? inches : toCm(inches);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-black/40 transition-opacity duration-200 data-closed:opacity-0"
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4">
        <DialogPanel
          transition
          className="relative w-full max-w-2xl rounded-xl bg-white shadow-xl transition duration-200 data-closed:scale-95 data-closed:opacity-0"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <DialogTitle className="text-lg font-semibold text-gray-900">
              Size Chart
            </DialogTitle>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close size chart"
              className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            >
              <XMarkIcon aria-hidden="true" className="size-6" />
            </button>
          </div>

          <div className="max-h-[75vh] overflow-y-auto px-6 py-5">
            {/* Unit toggle */}
            <div className="flex items-center justify-end">
              <div className="inline-flex rounded-md border border-gray-300 p-0.5">
                {["in", "cm"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setUnit(option)}
                    className={`rounded px-4 py-1.5 text-sm font-medium transition ${
                      unit === option
                        ? "bg-indigo-600 text-white"
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>

            {/* How to measure */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                How to measure
              </h3>
              <ul className="mt-3 space-y-3">
                {MEASUREMENT_TIPS.map((tip) => (
                  <li key={tip.title} className="flex gap-3">
                    <span className="mt-1 size-2 shrink-0 rounded-full bg-indigo-600" />
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">
                        {tip.title}:
                      </span>{" "}
                      {tip.text}
                    </p>
                  </li>
                ))}
              </ul>
            </div>

            {/* Size details table */}
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-gray-900">
                Size details ({unit === "in" ? "inches" : "centimetres"})
              </h3>
              <div className="mt-3 overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-200 px-3 py-2 text-left font-semibold text-gray-900">
                        Size
                      </th>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          className="border border-gray-200 px-3 py-2 text-center font-semibold text-gray-900"
                        >
                          {col.label} ({unit})
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {SIZE_ROWS.map((row) => (
                      <tr key={row.size} className="even:bg-gray-50">
                        <td className="border border-gray-200 px-3 py-2 font-medium text-gray-900">
                          {row.size}
                        </td>
                        {COLUMNS.map((col) => (
                          <td
                            key={col.key}
                            className="border border-gray-200 px-3 py-2 text-center text-gray-600"
                          >
                            {formatValue(row[col.key])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                Tip: If you're between two sizes, we recommend choosing the
                larger size for a more comfortable fit.
              </p>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );
};

export default Sizechart;
