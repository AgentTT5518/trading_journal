'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface RulesListInputProps {
  name: string;
  label: string;
  defaultValue?: string[];
}

export function RulesListInput({ name, label, defaultValue = [] }: RulesListInputProps) {
  const [items, setItems] = useState<string[]>(defaultValue);
  const [input, setInput] = useState('');

  function addItem() {
    const trimmed = input.trim();
    if (trimmed && !items.includes(trimmed)) {
      setItems([...items, trimmed]);
      setInput('');
    }
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={JSON.stringify(items)} />
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); addItem(); }
          }}
          placeholder={`Add ${label.toLowerCase()}...`}
          className="flex-1"
        />
        <Button type="button" variant="outline" size="sm" onClick={addItem}>
          Add
        </Button>
      </div>
      {items.length > 0 && (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
              <span>{item}</span>
              <button
                type="button"
                onClick={() => removeItem(i)}
                className="text-muted-foreground hover:text-foreground"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
