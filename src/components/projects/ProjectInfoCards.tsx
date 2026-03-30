import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Building,
  Calendar,
  Package,
  Clock,
  Calculator,
  Scissors,
  Settings,
} from "lucide-react";
import { format } from "date-fns";

interface ProjectStats {
  total: number;
  aguardandoOtimizacao: number;
  otimizadas: number;
  cortadas: number;
}

interface ProjectInfoCardsProps {
  clientName?: string;
  obraName?: string;
  createdAt: string;
  stats?: ProjectStats;
}

export const ProjectInfoCards = ({
  clientName,
  obraName,
  createdAt,
  stats,
}: ProjectInfoCardsProps) => {
  const pct = (value: number) =>
    stats && stats.total > 0 ? ((value / stats.total) * 100).toFixed(1) : "0";

  const pctValue = (value: number) =>
    stats && stats.total > 0 ? (value / stats.total) * 100 : 0;

  return (
    <Card className="bg-card backdrop-blur-lg shadow-xl border rounded-2xl">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center gap-3 text-xl font-semibold text-foreground">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
            <Settings className="w-5 h-5 text-white" />
          </div>
          Informações do Projeto
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {/* Info row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <InfoCard icon={User} color="blue" label="Cliente" value={clientName || "Não definido"} />
          <InfoCard icon={Building} color="emerald" label="Obra" value={obraName || "Não definida"} />
          <InfoCard icon={Calendar} color="amber" label="Criado em" value={format(new Date(createdAt), "dd/MM/yyyy")} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mt-6">
          <StatCard
            icon={Package}
            color="violet"
            label="Total de Peças"
            value={stats?.total || 0}
            pctLabel="100% do total"
            pctValue={100}
          />
          <StatCard
            icon={Clock}
            color="yellow"
            label="Aguardando Otimização"
            value={stats?.aguardandoOtimizacao || 0}
            pctLabel={`${pct(stats?.aguardandoOtimizacao || 0)}% do total`}
            pctValue={pctValue(stats?.aguardandoOtimizacao || 0)}
          />
          <StatCard
            icon={Calculator}
            color="cyan"
            label="Aguardando Corte"
            value={stats?.otimizadas || 0}
            pctLabel={`${pct(stats?.otimizadas || 0)}% do total`}
            pctValue={pctValue(stats?.otimizadas || 0)}
          />
          <StatCard
            icon={Scissors}
            color="emerald"
            label="Peças Cortadas"
            value={stats?.cortadas || 0}
            pctLabel={`Do total: ${pct(stats?.cortadas || 0)}%`}
            pctValue={pctValue(stats?.cortadas || 0)}
            secondaryPct={
              stats && stats.otimizadas > 0
                ? { label: `Das otimizadas: ${((stats.cortadas / stats.otimizadas) * 100).toFixed(1)}%`, value: (stats.cortadas / stats.otimizadas) * 100 }
                : undefined
            }
          />
        </div>
      </CardContent>
    </Card>
  );
};

// Sub-componentes internos

const colorMap: Record<string, { bg: string; border: string; icon: string; text: string; hover: string }> = {
  blue: { bg: "from-blue-50 to-indigo-50", border: "border-blue-100", icon: "bg-blue-100", text: "text-blue-600", hover: "group-hover:bg-blue-200" },
  emerald: { bg: "from-emerald-50 to-green-50", border: "border-emerald-100", icon: "bg-emerald-100", text: "text-emerald-600", hover: "group-hover:bg-emerald-200" },
  amber: { bg: "from-amber-50 to-orange-50", border: "border-amber-100", icon: "bg-amber-100", text: "text-amber-600", hover: "group-hover:bg-amber-200" },
  violet: { bg: "from-violet-50 to-purple-50", border: "border-violet-100", icon: "bg-violet-100", text: "text-violet-600", hover: "group-hover:bg-violet-200" },
  yellow: { bg: "from-yellow-50 to-amber-50", border: "border-yellow-100", icon: "bg-yellow-100", text: "text-yellow-600", hover: "group-hover:bg-yellow-200" },
  cyan: { bg: "from-cyan-50 to-blue-50", border: "border-cyan-100", icon: "bg-cyan-100", text: "text-cyan-600", hover: "group-hover:bg-cyan-200" },
};

function InfoCard({ icon: Icon, color, label, value }: { icon: any; color: string; label: string; value: string }) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`group p-6 bg-gradient-to-br ${c.bg} rounded-xl border ${c.border} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${c.icon} rounded-xl ${c.hover} transition-colors`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
        <div className="space-y-1">
          <p className={`text-sm font-medium ${c.text} uppercase tracking-wide`}>{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon, color, label, value, pctLabel, pctValue, secondaryPct,
}: {
  icon: any; color: string; label: string; value: number;
  pctLabel: string; pctValue: number;
  secondaryPct?: { label: string; value: number };
}) {
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className={`group p-6 bg-gradient-to-br ${c.bg} rounded-xl border ${c.border} hover:shadow-lg transition-all duration-300`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 ${c.icon} rounded-xl ${c.hover} transition-colors`}>
          <Icon className={`w-6 h-6 ${c.text}`} />
        </div>
        <div className="space-y-1 w-full">
          <p className={`text-sm font-medium ${c.text} uppercase tracking-wide`}>{label}</p>
          <p className="text-lg font-semibold text-foreground">{value}</p>
          <div className="mt-3 space-y-1">
            <div className="text-xs text-muted-foreground">{pctLabel}</div>
            <Progress value={pctValue} />
          </div>
          {secondaryPct && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground mb-1">{secondaryPct.label}</div>
              <Progress value={secondaryPct.value} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
