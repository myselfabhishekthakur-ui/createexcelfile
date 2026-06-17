"use client";

interface InstructionInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}

const EXAMPLE_INSTRUCTIONS = [
  'Add a new column named "Status"',
  "Add data to Column A",
  "Insert a new sheet with these records",
  "Delete column C",
  "Rename sheet to Summary",
  "Update rows where Name is John",
];

export function InstructionInput({
  value,
  onChange,
  id = "instruction-input",
}: InstructionInputProps) {
  return (
    <div>
      <textarea
        id={id}
        className="instruction-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your instructions here...&#10;&#10;You can provide multiple instructions, one per line.&#10;For example:&#10;  Add a new column named 'Status' with default value 'Active'&#10;  Insert a new sheet called 'Summary'"
        spellCheck={false}
      />
      <div className="instruction-examples">
        {EXAMPLE_INSTRUCTIONS.map((example) => (
          <button
            key={example}
            className="instruction-example"
            onClick={() => {
              onChange(value ? `${value}\n${example}` : example);
            }}
            type="button"
          >
            {example}
          </button>
        ))}
      </div>
    </div>
  );
}
