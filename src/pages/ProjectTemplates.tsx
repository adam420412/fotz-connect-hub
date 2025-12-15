import { useState } from "react";
import { Helmet } from "react-helmet-async";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  FolderPlus, 
  ListPlus, 
  Trash2, 
  FileText, 
  FolderOpen, 
  Edit, 
  Copy,
  LayoutTemplate,
  CheckSquare,
  Clock
} from "lucide-react";
import { useProjectTemplates, useTemplateItems, priorityConfig, ProjectTemplate, TemplatePriority } from "@/hooks/useProjectTemplates";
import { cn } from "@/lib/utils";

export default function ProjectTemplates() {
  const [selectedTemplate, setSelectedTemplate] = useState<ProjectTemplate | null>(null);
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [itemType, setItemType] = useState<"task" | "folder">("task");
  const [editingTemplate, setEditingTemplate] = useState<ProjectTemplate | null>(null);

  const [templateForm, setTemplateForm] = useState({
    name: "",
    description: "",
    category: "",
  });

  const [itemForm, setItemForm] = useState({
    name: "",
    description: "",
    priority: "normal" as TemplatePriority,
    estimated_days: "",
  });

  const { templates, isLoading, createTemplate, updateTemplate, deleteTemplate, isCreating } = useProjectTemplates();
  const { items, tasks, folders, createItem, deleteItem, isCreating: isCreatingItem } = useTemplateItems(
    selectedTemplate?.id || null
  );

  const handleCreateTemplate = () => {
    if (!templateForm.name) return;

    if (editingTemplate) {
      updateTemplate({
        id: editingTemplate.id,
        ...templateForm,
      });
    } else {
      createTemplate(templateForm);
    }

    resetTemplateForm();
  };

  const resetTemplateForm = () => {
    setTemplateForm({ name: "", description: "", category: "" });
    setEditingTemplate(null);
    setIsTemplateDialogOpen(false);
  };

  const handleEditTemplate = (template: ProjectTemplate) => {
    setEditingTemplate(template);
    setTemplateForm({
      name: template.name,
      description: template.description || "",
      category: template.category || "",
    });
    setIsTemplateDialogOpen(true);
  };

  const handleCreateItem = () => {
    if (!itemForm.name || !selectedTemplate) return;

    createItem({
      template_id: selectedTemplate.id,
      item_type: itemType,
      name: itemForm.name,
      description: itemForm.description || undefined,
      priority: itemType === "task" ? itemForm.priority : undefined,
      estimated_days: itemType === "task" && itemForm.estimated_days 
        ? parseInt(itemForm.estimated_days) 
        : undefined,
      sort_order: items.length,
    });

    resetItemForm();
  };

  const resetItemForm = () => {
    setItemForm({ name: "", description: "", priority: "normal", estimated_days: "" });
    setIsItemDialogOpen(false);
  };

  const openItemDialog = (type: "task" | "folder") => {
    setItemType(type);
    setIsItemDialogOpen(true);
  };

  const categories = [...new Set(templates.map((t) => t.category).filter(Boolean))];

  return (
    <DashboardLayout>
      <Helmet>
        <title>Szablony projektów | FOTZ Studio</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Szablony projektów</h1>
            <p className="text-muted-foreground">Twórz i zarządzaj szablonami z predefiniowanymi zadaniami i folderami</p>
          </div>
          <Dialog open={isTemplateDialogOpen} onOpenChange={(open) => {
            if (!open) resetTemplateForm();
            setIsTemplateDialogOpen(open);
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nowy szablon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? "Edytuj szablon" : "Nowy szablon projektu"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nazwa szablonu *</Label>
                  <Input
                    id="name"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    placeholder="np. Kampania Social Media"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Kategoria</Label>
                  <Input
                    id="category"
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({ ...templateForm, category: e.target.value })}
                    placeholder="np. Marketing, Branding"
                    list="categories"
                  />
                  <datalist id="categories">
                    {categories.map((cat) => (
                      <option key={cat} value={cat || ""} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Opis</Label>
                  <Textarea
                    id="description"
                    value={templateForm.description}
                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                    placeholder="Krótki opis szablonu..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={resetTemplateForm}>
                    Anuluj
                  </Button>
                  <Button onClick={handleCreateTemplate} disabled={isCreating || !templateForm.name}>
                    {editingTemplate ? "Zapisz" : "Utwórz"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Templates List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold">Szablony ({templates.length})</h2>
            
            {isLoading ? (
              <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                  Ładowanie...
                </CardContent>
              </Card>
            ) : templates.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <LayoutTemplate className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Brak szablonów</p>
                  <p className="text-sm text-muted-foreground">Utwórz pierwszy szablon projektu</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {templates.map((template) => (
                  <Card
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-md",
                      selectedTemplate?.id === template.id && "ring-2 ring-primary"
                    )}
                    onClick={() => setSelectedTemplate(template)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{template.name}</h3>
                          {template.category && (
                            <Badge variant="outline" className="mt-1">
                              {template.category}
                            </Badge>
                          )}
                          {template.description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {template.description}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1 ml-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditTemplate(template);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteTemplate(template.id);
                              if (selectedTemplate?.id === template.id) {
                                setSelectedTemplate(null);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Template Details */}
          <div className="lg:col-span-2">
            {selectedTemplate ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{selectedTemplate.name}</CardTitle>
                      <CardDescription>{selectedTemplate.description}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => openItemDialog("folder")}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        Folder
                      </Button>
                      <Button size="sm" onClick={() => openItemDialog("task")}>
                        <ListPlus className="mr-2 h-4 w-4" />
                        Zadanie
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="tasks">
                    <TabsList className="mb-4">
                      <TabsTrigger value="tasks">
                        <CheckSquare className="mr-2 h-4 w-4" />
                        Zadania ({tasks.length})
                      </TabsTrigger>
                      <TabsTrigger value="folders">
                        <FolderOpen className="mr-2 h-4 w-4" />
                        Foldery ({folders.length})
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="tasks" className="space-y-2">
                      {tasks.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <CheckSquare className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>Brak zadań w szablonie</p>
                        </div>
                      ) : (
                        tasks.map((task) => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div>
                                <p className="font-medium">{task.name}</p>
                                {task.description && (
                                  <p className="text-sm text-muted-foreground">{task.description}</p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={priorityConfig[task.priority].color}>
                                {priorityConfig[task.priority].label}
                              </Badge>
                              {task.estimated_days && (
                                <Badge variant="outline">
                                  <Clock className="mr-1 h-3 w-3" />
                                  {task.estimated_days}d
                                </Badge>
                              )}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => deleteItem(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </TabsContent>

                    <TabsContent value="folders" className="space-y-2">
                      {folders.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FolderOpen className="h-10 w-10 mx-auto mb-2 opacity-50" />
                          <p>Brak folderów w szablonie</p>
                        </div>
                      ) : (
                        folders.map((folder) => (
                          <div
                            key={folder.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                          >
                            <div className="flex items-center gap-3">
                              <FolderOpen className="h-5 w-5 text-amber-500" />
                              <div>
                                <p className="font-medium">{folder.name}</p>
                                {folder.description && (
                                  <p className="text-sm text-muted-foreground">{folder.description}</p>
                                )}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => deleteItem(folder.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <LayoutTemplate className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Wybierz szablon</h3>
                  <p className="text-muted-foreground">
                    Wybierz szablon z listy, aby zobaczyć i edytować jego zawartość
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Item Dialog */}
        <Dialog open={isItemDialogOpen} onOpenChange={(open) => {
          if (!open) resetItemForm();
          setIsItemDialogOpen(open);
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {itemType === "task" ? "Dodaj zadanie" : "Dodaj folder"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="item-name">Nazwa *</Label>
                <Input
                  id="item-name"
                  value={itemForm.name}
                  onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                  placeholder={itemType === "task" ? "np. Przygotowanie briefu" : "np. Materiały graficzne"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="item-description">Opis</Label>
                <Textarea
                  id="item-description"
                  value={itemForm.description}
                  onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                  placeholder="Opcjonalny opis..."
                  rows={2}
                />
              </div>

              {itemType === "task" && (
                <>
                  <div className="space-y-2">
                    <Label>Priorytet</Label>
                    <Select
                      value={itemForm.priority}
                      onValueChange={(value: TemplatePriority) => 
                        setItemForm({ ...itemForm, priority: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(priorityConfig).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="estimated-days">Szacowany czas (dni)</Label>
                    <Input
                      id="estimated-days"
                      type="number"
                      min="1"
                      value={itemForm.estimated_days}
                      onChange={(e) => setItemForm({ ...itemForm, estimated_days: e.target.value })}
                      placeholder="np. 3"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={resetItemForm}>
                  Anuluj
                </Button>
                <Button onClick={handleCreateItem} disabled={isCreatingItem || !itemForm.name}>
                  Dodaj
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
