import { Button } from "@/components/ui/button";
import { FileText, Loader2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { formatDuration } from "@/hooks/useTimeTracking";
import type { Project } from "@/hooks/useProjects";
import type { ProjectStats } from "@/hooks/useProjectStats";
import type { ProjectTask } from "@/hooks/useProjectTasks";
import { useProjectCosts } from "@/hooks/useProjectCosts";

interface ProjectPDFExportProps {
  project: Project;
  stats?: ProjectStats | null;
  tasks: ProjectTask[];
}

export function ProjectPDFExport({ project, stats, tasks }: ProjectPDFExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();
  const { projectCosts } = useProjectCosts();

  const projectCost = projectCosts.find((c) => c.projectId === project.id);

  const generatePDF = async () => {
    setIsExporting(true);
    
    try {
      // Create HTML content for the report
      const taskStats = {
        total: tasks.length,
        completed: tasks.filter((t) => t.status === "completed").length,
        in_progress: tasks.filter((t) => t.status === "in_progress").length,
        pending: tasks.filter((t) => t.status === "pending").length,
      };

      const statusLabels: Record<string, string> = {
        active: "Aktywny",
        paused: "Wstrzymany",
        completed: "Zakończony",
      };

      const priorityLabels: Record<string, string> = {
        low: "Niski",
        normal: "Normalny",
        high: "Wysoki",
        urgent: "Pilny",
      };

      const taskStatusLabels: Record<string, string> = {
        pending: "Oczekujące",
        in_progress: "W trakcie",
        completed: "Zakończone",
        cancelled: "Anulowane",
      };

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Raport projektu - ${project.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1a1a1a;
              line-height: 1.6;
            }
            .header {
              border-bottom: 2px solid #103053;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .header h1 {
              color: #103053;
              font-size: 28px;
              margin-bottom: 10px;
            }
            .header .meta {
              color: #666;
              font-size: 14px;
            }
            .section {
              margin-bottom: 30px;
            }
            .section h2 {
              color: #103053;
              font-size: 18px;
              margin-bottom: 15px;
              border-bottom: 1px solid #eee;
              padding-bottom: 8px;
            }
            .stats-grid {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 15px;
              margin-bottom: 30px;
            }
            .stat-card {
              background: #f8f9fa;
              padding: 15px;
              border-radius: 8px;
              text-align: center;
            }
            .stat-card .value {
              font-size: 24px;
              font-weight: bold;
              color: #103053;
            }
            .stat-card .label {
              font-size: 12px;
              color: #666;
              margin-top: 5px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 14px;
            }
            th, td {
              padding: 10px;
              text-align: left;
              border-bottom: 1px solid #eee;
            }
            th {
              background: #f8f9fa;
              font-weight: 600;
              color: #103053;
            }
            .badge {
              display: inline-block;
              padding: 3px 8px;
              border-radius: 4px;
              font-size: 12px;
              font-weight: 500;
            }
            .badge-green { background: #d4edda; color: #155724; }
            .badge-yellow { background: #fff3cd; color: #856404; }
            .badge-blue { background: #cce5ff; color: #004085; }
            .badge-gray { background: #e2e3e5; color: #383d41; }
            .progress-bar {
              height: 8px;
              background: #e9ecef;
              border-radius: 4px;
              overflow: hidden;
              margin-top: 10px;
            }
            .progress-bar .fill {
              height: 100%;
              background: #103053;
              border-radius: 4px;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #eee;
              text-align: center;
              color: #666;
              font-size: 12px;
            }
            .cost-section {
              background: #f8f9fa;
              padding: 20px;
              border-radius: 8px;
              margin-top: 20px;
            }
            .cost-total {
              font-size: 24px;
              font-weight: bold;
              color: #103053;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${project.name}</h1>
            <div class="meta">
              <p>Status: <strong>${statusLabels[project.status]}</strong></p>
              ${project.due_date ? `<p>Termin: ${format(new Date(project.due_date), "d MMMM yyyy", { locale: pl })}</p>` : ""}
              <p>Wygenerowano: ${format(new Date(), "d MMMM yyyy, HH:mm", { locale: pl })}</p>
            </div>
          </div>

          ${project.description ? `
          <div class="section">
            <h2>Opis projektu</h2>
            <p>${project.description}</p>
          </div>
          ` : ""}

          <div class="section">
            <h2>Postęp projektu</h2>
            <p style="font-size: 18px; font-weight: bold;">${project.progress}%</p>
            <div class="progress-bar">
              <div class="fill" style="width: ${project.progress}%"></div>
            </div>
          </div>

          <div class="stats-grid">
            <div class="stat-card">
              <div class="value">${formatDuration(stats?.totalTimeMinutes || 0)}</div>
              <div class="label">Czas pracy</div>
            </div>
            <div class="stat-card">
              <div class="value">${taskStats.completed}/${taskStats.total}</div>
              <div class="label">Zadania ukończone</div>
            </div>
            <div class="stat-card">
              <div class="value">${stats?.memberCount || 0}</div>
              <div class="label">Członków zespołu</div>
            </div>
            <div class="stat-card">
              <div class="value">${taskStats.in_progress}</div>
              <div class="label">W trakcie</div>
            </div>
          </div>

          ${projectCost ? `
          <div class="section">
            <h2>Koszty projektu</h2>
            <div class="cost-section">
              <p>Łączny koszt: <span class="cost-total">${projectCost.totalCost.toFixed(2)} ${projectCost.currency}</span></p>
              <p style="margin-top: 10px; color: #666;">Łączny czas: ${formatDuration(projectCost.totalMinutes)} (${(projectCost.totalMinutes / 60).toFixed(1)} godz.)</p>
              
              ${projectCost.members.length > 0 ? `
              <table style="margin-top: 15px;">
                <thead>
                  <tr>
                    <th>Członek zespołu</th>
                    <th>Czas</th>
                    <th>Stawka/h</th>
                    <th>Koszt</th>
                  </tr>
                </thead>
                <tbody>
                  ${projectCost.members.map(m => `
                    <tr>
                      <td>${m.userName}</td>
                      <td>${formatDuration(m.totalMinutes)}</td>
                      <td>${m.hourlyRate} ${m.currency}</td>
                      <td>${m.totalCost.toFixed(2)} ${m.currency}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              ` : ""}
            </div>
          </div>
          ` : ""}

          ${tasks.length > 0 ? `
          <div class="section">
            <h2>Lista zadań (${tasks.length})</h2>
            <table>
              <thead>
                <tr>
                  <th>Tytuł</th>
                  <th>Status</th>
                  <th>Priorytet</th>
                  <th>Przypisany</th>
                  <th>Termin</th>
                </tr>
              </thead>
              <tbody>
                ${tasks.map(task => `
                  <tr>
                    <td>${task.title}</td>
                    <td><span class="badge ${
                      task.status === "completed" ? "badge-green" :
                      task.status === "in_progress" ? "badge-blue" :
                      task.status === "pending" ? "badge-yellow" : "badge-gray"
                    }">${taskStatusLabels[task.status]}</span></td>
                    <td><span class="badge ${
                      task.priority === "urgent" ? "badge-yellow" :
                      task.priority === "high" ? "badge-yellow" : "badge-gray"
                    }">${priorityLabels[task.priority]}</span></td>
                    <td>${task.assigned_member?.name || "-"}</td>
                    <td>${task.deadline ? format(new Date(task.deadline), "d MMM yyyy", { locale: pl }) : "-"}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
          ` : ""}

          <div class="footer">
            <p>Raport wygenerowany automatycznie przez FOTZ Studio</p>
          </div>
        </body>
        </html>
      `;

      // Create a new window and print as PDF
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        
        // Wait for content to load, then print
        printWindow.onload = () => {
          printWindow.print();
        };
        
        // Fallback if onload doesn't fire
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }

      toast({
        title: "Raport gotowy",
        description: "Okno drukowania zostało otwarte",
      });
    } catch (error: any) {
      toast({
        title: "Błąd eksportu",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button onClick={generatePDF} disabled={isExporting} variant="outline" className="gap-2">
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <FileText className="h-4 w-4" />
      )}
      Eksportuj PDF
    </Button>
  );
}