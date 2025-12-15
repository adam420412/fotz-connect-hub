import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTaskCategories } from "@/hooks/useTaskCategories";
import { useToast } from "@/hooks/use-toast";
import { Tag, Plus, Trash2, Loader2, Edit2, Check, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const predefinedColors = [
  "#3b82f6", // blue
  "#ef4444", // red
  "#22c55e", // green
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
  "#6366f1", // indigo
  "#14b8a6", // teal
];

export function CategoryManagement() {
  const { categories, isLoading, createCategory, deleteCategory, updateCategory } =
    useTaskCategories();
  const { toast } = useToast();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryColor, setNewCategoryColor] = useState(predefinedColors[0]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast({
        title: "Błąd",
        description: "Nazwa kategorii jest wymagana",
        variant: "destructive",
      });
      return;
    }

    setIsAdding(true);
    try {
      await createCategory({ name: newCategoryName.trim(), color: newCategoryColor });
      setNewCategoryName("");
      setNewCategoryColor(predefinedColors[0]);
      toast({
        title: "Sukces",
        description: "Kategoria została dodana",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się dodać kategorii",
        variant: "destructive",
      });
    } finally {
      setIsAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await deleteCategory(id);
      toast({
        title: "Sukces",
        description: "Kategoria została usunięta",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć kategorii",
        variant: "destructive",
      });
    }
  };

  const handleStartEdit = (category: { id: string; name: string; color: string }) => {
    setEditingId(category.id);
    setEditName(category.name);
    setEditColor(category.color);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editName.trim()) return;

    try {
      await updateCategory({ id: editingId, name: editName.trim(), color: editColor });
      setEditingId(null);
      toast({
        title: "Sukces",
        description: "Kategoria została zaktualizowana",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się zaktualizować kategorii",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditColor("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Add new category */}
      <div className="space-y-4 p-4 rounded-lg bg-muted/50">
        <h4 className="text-sm font-medium text-foreground">Dodaj nową kategorię</h4>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Label htmlFor="category-name">Nazwa</Label>
            <Input
              id="category-name"
              placeholder="np. Marketing"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
            />
          </div>
          <div className="space-y-2">
            <Label>Kolor</Label>
            <div className="flex gap-1">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-7 h-7 rounded-md transition-all ${
                    newCategoryColor === color
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                      : "hover:scale-110"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setNewCategoryColor(color)}
                />
              ))}
            </div>
          </div>
          <Button
            variant="gradient"
            onClick={handleAddCategory}
            disabled={isAdding || !newCategoryName.trim()}
            className="gap-2"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Dodaj
          </Button>
        </div>
      </div>

      {/* Existing categories */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-foreground">
          Istniejące kategorie ({categories?.length || 0})
        </h4>
        {categories && categories.length > 0 ? (
          <div className="space-y-2">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                {editingId === category.id ? (
                  <>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: editColor }}
                    />
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="flex-1 h-8"
                      autoFocus
                    />
                    <div className="flex gap-1">
                      {predefinedColors.slice(0, 5).map((color) => (
                        <button
                          key={color}
                          type="button"
                          className={`w-5 h-5 rounded transition-all ${
                            editColor === color
                              ? "ring-2 ring-primary ring-offset-1"
                              : "hover:scale-110"
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => setEditColor(color)}
                        />
                      ))}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-green-600"
                      onClick={handleSaveEdit}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={handleCancelEdit}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <Tag className="h-4 w-4 text-muted-foreground" />
                    <span className="flex-1 text-sm font-medium text-foreground">
                      {category.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleStartEdit(category)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Usunąć kategorię?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ta akcja jest nieodwracalna. Zadania przypisane do tej
                            kategorii nie zostaną usunięte, ale stracą przypisaną
                            kategorię.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Anuluj</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteCategory(category.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Usuń
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground p-4 text-center">
            Brak kategorii. Dodaj pierwszą kategorię powyżej.
          </p>
        )}
      </div>
    </div>
  );
}
