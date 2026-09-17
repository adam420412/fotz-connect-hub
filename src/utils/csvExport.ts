import { Lead } from "@/hooks/useCRM";

export const exportLeadsToCSV = (leads: Lead[]) => {
  const headers = [
    "Nazwa",
    "Email",
    "Telefon",
    "Firma",
    "Kanał",
    "Szczegół źródła",
    "Profil zewnętrzny",
    "Kampania UTM",
    "Status",
    "Notatki",
    "Data utworzenia",
  ];

  const rows = leads.map((lead) => [
    lead.name,
    lead.email || "",
    lead.phone || "",
    lead.company || "",
    lead.source_channel || lead.source,
    lead.source_detail || lead.source,
    lead.external_url || "",
    lead.utm_campaign || "",
    lead.status,
    lead.notes?.replace(/"/g, '""') || "",
    new Date(lead.created_at).toLocaleDateString("pl-PL"),
  ]);

  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n");

  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", `leady-${new Date().toISOString().split("T")[0]}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
