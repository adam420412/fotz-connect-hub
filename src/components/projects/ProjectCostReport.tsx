import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Download, Clock, DollarSign, Users, Loader2, FileSpreadsheet } from "lucide-react";
import { useProjectCosts } from "@/hooks/useProjectCosts";
import { formatDuration } from "@/hooks/useTimeTracking";

export function ProjectCostReport() {
  const { projectCosts, isLoading, exportToCSV } = useProjectCosts();

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const totalCost = projectCosts.reduce((sum, p) => sum + p.totalCost, 0);
  const totalMinutes = projectCosts.reduce((sum, p) => sum + p.totalMinutes, 0);
  const currency = projectCosts[0]?.currency || "PLN";

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Łączny koszt</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {totalCost.toFixed(2)} {currency}
            </p>
            <p className="text-xs text-muted-foreground">
              z {projectCosts.length} projektów
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Łączny czas</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatDuration(totalMinutes)}</p>
            <p className="text-xs text-muted-foreground">
              {(totalMinutes / 60).toFixed(1)} godzin
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Projekty</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{projectCosts.length}</p>
            <p className="text-xs text-muted-foreground">z czasem pracy</p>
          </CardContent>
        </Card>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button onClick={exportToCSV} className="gap-2" disabled={projectCosts.length === 0}>
          <FileSpreadsheet className="h-4 w-4" />
          Eksportuj do CSV
        </Button>
      </div>

      {/* Projects List */}
      {projectCosts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium">Brak danych o kosztach</p>
            <p className="text-sm text-muted-foreground">
              Zacznij śledzić czas pracy w projektach, aby zobaczyć koszty
            </p>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="multiple" className="space-y-4">
          {projectCosts.map((project) => (
            <AccordionItem
              key={project.projectId}
              value={project.projectId}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold">{project.projectName}</p>
                      <p className="text-sm text-muted-foreground">
                        {project.members.length} członków · {formatDuration(project.totalMinutes)}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-base font-semibold">
                    {project.totalCost.toFixed(2)} {project.currency}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Członek zespołu</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Czas</TableHead>
                      <TableHead className="text-right">Stawka</TableHead>
                      <TableHead className="text-right">Koszt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.members.map((member) => (
                      <TableRow key={member.userId}>
                        <TableCell className="font-medium">{member.userName}</TableCell>
                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                        <TableCell className="text-right">
                          {formatDuration(member.totalMinutes)}
                        </TableCell>
                        <TableCell className="text-right">
                          {member.hourlyRate} {member.currency}/h
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {member.totalCost.toFixed(2)} {member.currency}
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell colSpan={2}>RAZEM</TableCell>
                      <TableCell className="text-right">
                        {formatDuration(project.totalMinutes)}
                      </TableCell>
                      <TableCell />
                      <TableCell className="text-right text-primary">
                        {project.totalCost.toFixed(2)} {project.currency}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
