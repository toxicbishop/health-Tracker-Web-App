import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useHealthLogs } from "../hooks/useHealthData";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Legend 
} from "recharts";
import { ArrowLeft, TrendingUp, Activity, Scale } from "lucide-react";
import { format, parseISO, subDays, isAfter } from "date-fns";
import type { WeightLog, BPLog, BothLog } from "../types/health";

export default function StatsPage() {
  const navigate = useNavigate();
  const { data: logs = [], isLoading } = useHealthLogs();

  const thirtyDaysAgo = subDays(new Date(), 30);

  // Process data for Weight Chart
  const weightData = useMemo(() => {
    const filtered = logs.filter(l => 
      (l.type === "WEIGHT" || l.type === "BOTH") && 
      isAfter(parseISO(l.timestamp), thirtyDaysAgo)
    );
    
    return filtered.map(l => ({
      date: format(parseISO(l.timestamp), "MMM d"),
      weight: l.type === "WEIGHT" ? (l as WeightLog).weight : (l as BothLog).weight,
      timestamp: new Date(l.timestamp).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, thirtyDaysAgo]);

  // Process data for BP Chart
  const bpData = useMemo(() => {
    const filtered = logs.filter(l => 
      (l.type === "BLOOD_PRESSURE" || l.type === "BOTH") && 
      isAfter(parseISO(l.timestamp), thirtyDaysAgo)
    );

    return filtered.map(l => ({
      date: format(parseISO(l.timestamp), "MMM d"),
      systolic: l.type === "BLOOD_PRESSURE" ? (l as BPLog).systolic : (l as BothLog).systolic,
      diastolic: l.type === "BLOOD_PRESSURE" ? (l as BPLog).diastolic : (l as BothLog).diastolic,
      timestamp: new Date(l.timestamp).getTime()
    })).sort((a, b) => a.timestamp - b.timestamp);
  }, [logs, thirtyDaysAgo]);

  return (
    <div className="stats-container">
      <nav className="top-nav">
        <button className="top-nav-back" onClick={() => navigate("/")}>
          <ArrowLeft size={24} />
        </button>
        <span className="top-nav-title">Health Outlook</span>
      </nav>

      <div className="page-wrap">
        <header className="stats-header">
          <div className="stats-icon-circle">
            <TrendingUp size={32} />
          </div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">Last 30 Days</p>
        </header>

        {isLoading ? (
          <div className="skeleton-stack">
            <div className="card skeleton" style={{ height: 300 }} />
            <div className="card skeleton" style={{ height: 300 }} />
          </div>
        ) : (
          <div className="charts-grid">
            {/* Weight Trend */}
            <div className="card chart-card">
              <div className="chart-header">
                <Scale size={20} className="chart-icon-wt" />
                <h2 className="chart-title">Weight Trend</h2>
              </div>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis domain={['dataMin - 2', 'dataMax + 2']} hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#4A90E2" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: "#4A90E2" }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Blood Pressure Trend */}
            <div className="card chart-card" style={{ marginTop: "1rem" }}>
              <div className="chart-header">
                <Activity size={20} className="chart-icon-bp" />
                <h2 className="chart-title">Blood Pressure</h2>
              </div>
              <div style={{ width: "100%", height: 250 }}>
                <ResponsiveContainer>
                  <AreaChart data={bpData}>
                    <defs>
                      <linearGradient id="colorSys" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#E74C3C" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#E74C3C" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                    <XAxis dataKey="date" fontSize={12} tickMargin={10} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Area 
                      type="monotone" 
                      dataKey="systolic" 
                      stroke="#E74C3C" 
                      fillOpacity={1} 
                      fill="url(#colorSys)" 
                      strokeWidth={2}
                      name="Systolic"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="diastolic" 
                      stroke="#C0392B" 
                      fillOpacity={0} 
                      strokeWidth={2}
                      name="Diastolic"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
