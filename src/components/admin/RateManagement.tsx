import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, DollarSign, Save, Loader2 } from "lucide-react";
import { useTeamMemberRates } from "@/hooks/useTeamMemberRates";
import { UserWithRole } from "@/hooks/useAdminData";

interface RateManagementProps {
  users: UserWithRole[];
}

export function RateManagement({ users }: RateManagementProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingRates, setEditingRates] = useState<Record<string, string>>({});
  const { rates, setRate, isSettingRate, getRateForUser } = useTeamMemberRates();

  // Filter only team members (not clients)
  const teamUsers = users.filter(
    (u) => u.role !== "client" && u.is_active
  );

  const filteredUsers = teamUsers.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRateChange = (userId: string, value: string) => {
    setEditingRates((prev) => ({ ...prev, [userId]: value }));
  };

  const handleSaveRate = (userId: string) => {
    const rateValue = editingRates[userId];
    if (rateValue !== undefined) {
      const numericRate = parseFloat(rateValue);
      if (!isNaN(numericRate) && numericRate >= 0) {
        setRate({ userId, hourlyRate: numericRate });
        setEditingRates((prev) => {
          const newRates = { ...prev };
          delete newRates[userId];
          return newRates;
        });
      }
    }
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  const getCurrentRate = (userId: string) => {
    const rate = getRateForUser(userId);
    return rate?.hourly_rate ?? 0;
  };

  const getCurrency = (userId: string) => {
    const rate = getRateForUser(userId);
    return rate?.currency ?? "PLN";
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Szukaj członków zespołu..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Info */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
        <DollarSign className="h-4 w-4" />
        <span>Ustaw stawkę godzinową dla każdego członka zespołu. Stawka jest używana do obliczania kosztów projektów.</span>
      </div>

      {/* Team Members List */}
      <div className="space-y-2">
        {filteredUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Brak członków zespołu
          </div>
        ) : (
          filteredUsers.map((user) => {
            const currentRate = getCurrentRate(user.id);
            const currency = getCurrency(user.id);
            const isEditing = editingRates[user.id] !== undefined;
            const displayRate = isEditing ? editingRates[user.id] : currentRate.toString();

            return (
              <div
                key={user.id}
                className="flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:bg-muted/30 transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(user.full_name, user.email)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">
                    {user.full_name || user.email}
                  </p>
                  <p className="text-sm text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>

                <Badge variant="outline" className="capitalize">
                  {user.role}
                </Badge>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={displayRate}
                      onChange={(e) => handleRateChange(user.id, e.target.value)}
                      className="w-24 pr-12 text-right"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      {currency}/h
                    </span>
                  </div>
                  
                  {isEditing && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleSaveRate(user.id)}
                      disabled={isSettingRate}
                    >
                      {isSettingRate ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
