import React, { useState } from 'react';
import cn from "@/app/utils/TailwindMergeAndClsx";

const NoteEditor: React.FC = () => {
  const [notes, setNotes] = useState<string>('');

  return (
    <div className="w-[350px] h-[200px] bg-black border border-white rounded-lg p-4">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Ta notater her..."
        className={cn(
          "w-full h-full bg-transparent text-white",
          "resize-none focus:outline-none",
          "font-abc-repro-mono text-sm",
          "placeholder:text-gray-500"
        )}
      />
    </div>
  );
};

export default NoteEditor; 