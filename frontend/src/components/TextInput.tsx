"use client";

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function TextInput({
  value,
  onChange,
  placeholder = "Paste your data here...\n\nSupported formats:\n• CSV (comma-separated)\n• TSV (tab-separated)\n• Pipe-separated\n• Any structured text data",
  id = "text-input",
}: TextInputProps) {
  const lineCount = value ? value.split("\n").length : 0;
  const charCount = value.length;

  return (
    <div className="text-input-wrapper">
      <textarea
        id={id}
        className="text-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
      />
      <div className="text-input-footer">
        <span>
          {lineCount} {lineCount === 1 ? "line" : "lines"}
        </span>
        <span>{charCount.toLocaleString()} characters</span>
      </div>
    </div>
  );
}
