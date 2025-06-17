
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, BarChart3, Activity } from 'lucide-react';

interface DashboardProps {
  history: Array<{
    id: string;
    project: any;
    results: any;
    date: string;
    barLength: number;
  }>;
}

export const Dashboard = ({ history }: DashboardProps) => {
  // Calcular estatísticas
  const totalOptimizations = history.length;
  const totalBarsUsed = history.reduce((sum, item) => sum + item.results.totalBars, 0);
  const averageEfficiency = history.length > 0 
    ? history.reduce((sum, item) => sum + item.results.efficiency, 0) / history.length 
    : 0;
  const totalWaste = history.reduce((sum, item) => sum + item.results.totalWaste, 0);

  // Dados para gráficos
  const efficiencyData = history.slice(-10).map((item, index) => ({
    name: `Opt ${index + 1}`,
    efficiency: item.results.efficiency.toFixed(1),
    waste: item.results.wastePercentage.toFixed(1)
  }));

  const barUsageData = [
    { name: '6m', value: history.filter(h => h.barLength === 6000).length },
    { name: '12m', value: history.filter(h => h.barLength === 12000).length }
  ];

  const COLORS = ['#3B82F6', '#10B981'];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total de Otimizações</p>
                <p className="text-3xl font-bold">{totalOptimizations}</p>
              </div>
              <BarChart3 className="w-8 h-8 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Eficiência Média</p>
                <p className="text-3xl font-bold">{averageEfficiency.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Barras Utilizadas</p>
                <p className="text-3xl font-bold">{totalBarsUsed}</p>
              </div>
              <Activity className="w-8 h-8 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Desperdício Total</p>
                <p className="text-3xl font-bold">{(totalWaste / 1000).toFixed(1)}m</p>
              </div>
              <TrendingDown className="w-8 h-8 text-red-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Eficiência das Últimas Otimizações</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={efficiencyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="efficiency" fill="#3B82F6" name="Eficiência %" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Uso por Tipo de Barra</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={barUsageData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {barUsageData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Últimas Otimizações */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle>Últimas Otimizações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {history.slice(0, 5).map((item) => (
              <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h4 className="font-medium">{item.project.name}</h4>
                  <p className="text-sm text-gray-600">{item.project.client} - {item.project.obra}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-green-600">{item.results.efficiency.toFixed(1)}% eficiência</p>
                  <p className="text-sm text-gray-600">{new Date(item.date).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
            {history.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                Nenhuma otimização realizada ainda
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
