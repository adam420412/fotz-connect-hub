import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuthContext } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export interface EmployeeNote {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

// Using localStorage for personal notes (simple, no migration needed)
export function useEmployeeNotes() {
  const { user } = useAuthContext();
  const { toast } = useToast();
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const storageKey = `employee_notes_${user?.id}`;

  useEffect(() => {
    if (!user?.id) return;
    
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setNotes(JSON.parse(stored));
      } catch {
        setNotes([]);
      }
    }
    setIsLoading(false);
  }, [user?.id, storageKey]);

  const saveNotes = (newNotes: EmployeeNote[]) => {
    setNotes(newNotes);
    localStorage.setItem(storageKey, JSON.stringify(newNotes));
  };

  const addNote = (content: string) => {
    const newNote: EmployeeNote = {
      id: crypto.randomUUID(),
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    saveNotes([newNote, ...notes]);
    toast({ title: "Notatka dodana" });
    return newNote;
  };

  const updateNote = (id: string, content: string) => {
    const updated = notes.map((note) =>
      note.id === id
        ? { ...note, content, updated_at: new Date().toISOString() }
        : note
    );
    saveNotes(updated);
    toast({ title: "Notatka zaktualizowana" });
  };

  const deleteNote = (id: string) => {
    const filtered = notes.filter((note) => note.id !== id);
    saveNotes(filtered);
    toast({ title: "Notatka usunięta" });
  };

  return {
    notes,
    isLoading,
    addNote,
    updateNote,
    deleteNote,
  };
}
