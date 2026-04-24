import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  ScatterChart,
  Scatter,
  ZAxis,
} from "recharts";

// --- K-Means for Performance Ranking Implementation ---
const kMeansRanking = (data, k = 3, maxIterations = 100) => {
  if (data.length < k) return { clusters: [], centroids: [] };

  // 1. Initialize centroids (using actual metrics: tasks, reward, prospects)
  let centroids = data
    .sort(() => 0.5 - Math.random())
    .slice(0, k)
    .map((p) => ({ tasks: p.tasks, reward: p.reward, prospects: p.prospects }));

  let clusters = new Array(k).fill(0).map(() => []);
  let iterations = 0;
  let changed = true;

  const getDistance = (p1, p2) => {
    // Normalizing distance (Simple approach for ranking)
    return Math.sqrt(
      Math.pow(p1.tasks - p2.tasks, 2) +
      Math.pow((p1.reward - p2.reward) / 100000, 2) + // Scale down reward for distance
      Math.pow(p1.prospects - p2.prospects, 2)
    );
  };

  while (changed && iterations < maxIterations) {
    changed = false;
    iterations++;
    const newClusters = new Array(k).fill(0).map(() => []);

    data.forEach((point) => {
      let minDist = Infinity;
      let closestIndex = 0;
      centroids.forEach((centroid, index) => {
        const dist = getDistance(point, centroid);
        if (dist < minDist) {
          minDist = dist;
          closestIndex = index;
        }
      });
      newClusters[closestIndex].push(point);
    });

    const newCentroids = newClusters.map((cluster, index) => {
      if (cluster.length === 0) return centroids[index];
      return {
        tasks: cluster.reduce((sum, p) => sum + p.tasks, 0) / cluster.length,
        reward: cluster.reduce((sum, p) => sum + p.reward, 0) / cluster.length,
        prospects: cluster.reduce((sum, p) => sum + p.prospects, 0) / cluster.length,
      };
    });

    for (let i = 0; i < k; i++) {
      if (
        newCentroids[i].tasks !== centroids[i].tasks ||
        newCentroids[i].reward !== centroids[i].reward ||
        newCentroids[i].prospects !== centroids[i].prospects
      ) {
        changed = true;
        break;
      }
    }
    centroids = newCentroids;
    clusters = newClusters;
  }

  // Rank clusters based on average tasks completed
  const clustersWithAvg = clusters.map((cluster, idx) => ({
    cluster,
    centroid: centroids[idx],
    avgScore: centroids[idx].tasks + (centroids[idx].reward / 100000) + centroids[idx].prospects
  }));

  clustersWithAvg.sort((a, b) => b.avgScore - a.avgScore);

  return clustersWithAvg.map((c, i) => ({
    tier: i === 0 ? "Top Performer" : i === 1 ? "Medium Performer" : "Need Improvement",
    agents: c.cluster,
    stats: c.centroid
  }));
};

export default function AnalyticsDashboard({ tasks = [] }) {
  if (!tasks || !Array.isArray(tasks)) {
    return <div className="text-center py-10 text-gray-500">Memuat data analitik...</div>;
  }

  // --- Process Data for Agent Ranking ---
  const agentMetrics = tasks
    .filter((t) => t.status === "done")
    .reduce((acc, t) => {
      const name = t.completedBy?.name || t.assignedTo?.name || "Unknown";
      if (!acc[name]) {
        acc[name] = { name, tasks: 0, reward: 0, prospects: 0 };
      }
      acc[name].tasks += 1;
      acc[name].reward += t.reward || 0;
      acc[name].prospects += t.prospects || 0;
      return acc;
    }, {});

  const agentDataArray = Object.values(agentMetrics);
  const rankingResults = agentDataArray.length >= 3 ? kMeansRanking(agentDataArray, 3) : [];

  // 1. Status Distribution
  const statusData = [
    {
      name: "Selesai",
      value: tasks.filter((t) => t.status === "done").length,
      color: "#10B981",
    },
    {
      name: "Proses",
      value: tasks.filter((t) => t.status === "progress").length,
      color: "#F59E0B",
    },
    {
      name: "Pending",
      value: tasks.filter((t) => t.status === "pending").length,
      color: "#6B7280",
    },
  ];

  // 2. Segment Distribution
  const segmentCounts = tasks.reduce((acc, t) => {
    const seg = t.segment || "Uncategorized";
    acc[seg] = (acc[seg] || 0) + 1;
    return acc;
  }, {});
  const segmentData = Object.keys(segmentCounts)
    .map((key) => ({
      name: key,
      value: segmentCounts[key],
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 segments

  // 3. Top Performers (Completed Tasks)
  const performerCounts = tasks
    .filter((t) => t.status === "done")
    .reduce((acc, t) => {
      const name = t.completedBy?.name || t.assignedTo?.name || "Unknown";
      acc[name] = (acc[name] || 0) + 1;
      return acc;
    }, {});
  const performerData = Object.keys(performerCounts)
    .map((key) => ({
      name: key,
      tasks: performerCounts[key],
    }))
    .sort((a, b) => b.tasks - a.tasks)
    .slice(0, 5);

  // 4. Reward & Prospects Summary
  const totalReward = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.reward || 0), 0);
  
  const totalProspects = tasks
    .filter((t) => t.status === "done")
    .reduce((sum, t) => sum + (t.prospects || 0), 0);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-gray-500">Total Tugas</h3>
          <p className="text-2xl font-bold text-gray-800">{tasks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-green-600">Total Reward Cair</h3>
          <p className="text-2xl font-bold text-green-700">
            Rp {totalReward.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-sm font-medium text-blue-600">Total Prospek</h3>
          <p className="text-2xl font-bold text-blue-700">{totalProspects}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Status Tugas</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performers Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Agent Produktif</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performerData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 12}} />
                <Tooltip />
                <Bar dataKey="tasks" fill="#3B82F6" radius={[0, 4, 4, 0]} name="Tugas Selesai" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Segment Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Distribusi Segment (Top 5)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8884d8" name="Jumlah Tugas">
                  {segmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* K-Means Performance Ranking Visualization */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              Ranking Performa Agen (K-Means Clustering)
            </h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              Performance Segmentation
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-6">
            Algoritma ini mengelompokkan AR & Sales ke dalam 3 kategori (Top, Medium, Low) berdasarkan 3 parameter: Jumlah Tugas Selesai, Total Reward, dan Total Prospek.
          </p>
          
          {rankingResults.length > 0 ? (
            <div className="space-y-6">
              {/* Cluster Visual Visualization (Scatter) */}
              <div className="h-64 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-400 uppercase mb-4">Visualisasi Sebaran Cluster (Tugas vs Reward)</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="tasks" name="Jumlah Tugas" unit=" tgs" />
                    <YAxis type="number" dataKey="reward" name="Total Reward" unit=" Rp" tickFormatter={(v) => v/1000 + "k"} />
                    <ZAxis type="number" dataKey="prospects" range={[50, 400]} name="Prospek" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Legend />
                    {rankingResults.map((result, idx) => (
                      <Scatter
                        key={idx}
                        name={result.tier}
                        data={result.agents}
                        fill={idx === 0 ? "#10B981" : idx === 1 ? "#3B82F6" : "#F59E0B"}
                      />
                    ))}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {rankingResults.map((result, idx) => (
                  <div key={idx} className={`p-4 rounded-xl border-2 ${
                    idx === 0 ? "border-green-200 bg-green-50" : 
                    idx === 1 ? "border-blue-200 bg-blue-50" : "border-orange-200 bg-orange-50"
                  }`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                        idx === 0 ? "bg-green-200 text-green-800" : 
                        idx === 1 ? "bg-blue-200 text-blue-800" : "bg-orange-200 text-orange-800"
                      }`}>
                        {result.tier}
                      </span>
                      <span className="text-sm font-medium text-gray-600">{result.agents.length} Orang</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg. Tugas:</span>
                        <span className="font-bold text-gray-700">{result.stats.tasks.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg. Reward:</span>
                        <span className="font-bold text-gray-700">Rp {Math.round(result.stats.reward).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Avg. Prospek:</span>
                        <span className="font-bold text-gray-700">{result.stats.prospects.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="overflow-x-auto rounded-lg border border-gray-100">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-medium">
                    <tr>
                      <th className="px-4 py-3">Nama Agen</th>
                      <th className="px-4 py-3">Kategori</th>
                      <th className="px-4 py-3">Tugas</th>
                      <th className="px-4 py-3">Reward</th>
                      <th className="px-4 py-3">Prospek</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {rankingResults.flatMap(r => r.agents.map(agent => ({...agent, tier: r.tier}))).map((agent, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{agent.name}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            agent.tier === "Top Performer" ? "bg-green-100 text-green-700" :
                            agent.tier === "Medium Performer" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"
                          }`}>
                            {agent.tier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{agent.tasks}</td>
                        <td className="px-4 py-3 text-gray-600">Rp {agent.reward.toLocaleString()}</td>
                        <td className="px-4 py-3 text-gray-600">{agent.prospects}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed border-gray-200">
              <p className="text-gray-500 text-sm">Minimal dibutuhkan 3 agen dengan data tugas selesai untuk melakukan ranking K-Means.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
