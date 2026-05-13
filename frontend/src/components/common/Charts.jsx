import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area
} from 'recharts'

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2']

// Bar Chart — Appointment Status
export function AppointmentBarChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Appointments by Status</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Pie Chart — Doctor Specializations
export function SpecializationPieChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Doctors by Specialization</h3>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={80}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Line Chart — Monthly Appointments Trend
export function AppointmentTrendChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Appointment Trends</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="colorAppointments" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Area
            type="monotone"
            dataKey="appointments"
            stroke="#2563eb"
            strokeWidth={2}
            fill="url(#colorAppointments)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Bar Chart — Disease/Symptom Frequency
export function DiseaseBarChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="card text-center py-10">
        <p className="text-gray-400 text-sm">No symptom data yet.</p>
        <p className="text-gray-400 text-xs mt-1">Use the AI Symptom Checker to see your disease history here.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">Your Disease History</h3>
      <p className="text-xs text-gray-400 mb-4">Based on your AI symptom analysis reports</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 80, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 12 }} allowDecimals={false} />
          <YAxis type="category" dataKey="disease" tick={{ fontSize: 11 }} width={80} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
            formatter={(value) => [value, 'Times reported']}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Area Chart — Weekly Appointments
export function WeeklyAppointmentChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">This Week's Appointments</h3>
      <p className="text-xs text-gray-400 mb-4">Daily appointment count (last 7 days)</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="weekGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#16a34a" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Area type="monotone" dataKey="appointments" stroke="#16a34a" strokeWidth={2} fill="url(#weekGrad)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Multi-line Chart — Monthly Trends (completed vs cancelled)
export function MonthlyTrendChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">Monthly Appointment Trends</h3>
      <p className="text-xs text-gray-400 mb-4">Completed vs Cancelled over last 6 months</p>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <defs>
            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="cancelledGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend />
          <Area type="monotone" dataKey="completed" stroke="#2563eb" strokeWidth={2} fill="url(#completedGrad)" name="Completed" />
          <Area type="monotone" dataKey="cancelled" stroke="#dc2626" strokeWidth={2} fill="url(#cancelledGrad)" name="Cancelled" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// Revenue Bar Chart
export function RevenueChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">Revenue Overview</h3>
      <p className="text-xs text-gray-400 mb-4">Monthly revenue from completed consultations (₹)</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="month" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${v}`} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} formatter={v => [`₹${v}`, 'Revenue']} />
          <Bar dataKey="revenue" radius={[6, 6, 0, 0]} fill="#7c3aed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Donut Chart — Appointment Types
export function AppointmentTypeDonutChart({ data }) {
  const DONUT_COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#7c3aed']
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">Consultation Types</h3>
      <p className="text-xs text-gray-400 mb-2">Distribution by appointment type</p>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
            {data.map((_, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
          </Pie>
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Legend iconType="circle" iconSize={8} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}

// Horizontal Bar — Top Specializations
export function TopSpecializationsChart({ data }) {
  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-1">Top Specializations</h3>
      <p className="text-xs text-gray-400 mb-4">By number of appointments</p>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 20, left: 90, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
          <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={90} />
          <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
          <Bar dataKey="appointments" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// Bar Chart — Platform Stats (Admin)
export function PlatformStatsChart({ stats }) {
  const data = [
    { name: 'Patients', value: stats?.total_patients || 0 },
    { name: 'Doctors', value: stats?.total_doctors || 0 },
    { name: 'Appointments', value: stats?.total_appointments || 0 },
    { name: 'Pending', value: stats?.pending_appointments || 0 },
    { name: 'Verified Drs', value: stats?.verified_doctors || 0 },
  ]

  return (
    <div className="card">
      <h3 className="font-semibold text-gray-900 mb-4">Platform Overview</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
          />
          <Bar dataKey="value" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
