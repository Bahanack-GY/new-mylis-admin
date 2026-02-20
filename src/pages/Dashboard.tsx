import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Users,
  Briefcase,
  CheckCircle,
  TrendingUp,
  MoreHorizontal,
  ArrowUpRight,
  FileText,
  DollarSign,
  CreditCard,
  Coins,
  Clock,
  Loader2,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useEmployees } from '../api/employees/hooks';
import { useProjects } from '../api/projects/hooks';
import { useTasks } from '../api/tasks/hooks';
import { useDepartments } from '../api/departments/hooks';
import { useLogs } from '../api/logs/hooks';
import type { Log } from '../api/logs/types';
import { useInvoiceStats } from '../api/invoices/hooks';
import { useExpenseStats } from '../api/expenses/hooks';
import { useDepartmentScope } from '../contexts/AuthContext';

type DatePreset = 'today' | 'this_week' | 'this_month' | 'this_year' | 'custom';

function getDateRange(preset: DatePreset, customFrom?: string, customTo?: string): { from: string; to: string } {
  const now = new Date();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const to = endOfDay.toISOString();

  switch (preset) {
    case 'today': {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return { from: start.toISOString(), to };
    }
    case 'this_week': {
      const day = now.getDay();
      const mondayOffset = day === 0 ? -6 : 1 - day;
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + mondayOffset);
      return { from: start.toISOString(), to };
    }
    case 'this_month': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: start.toISOString(), to };
    }
    case 'this_year': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { from: start.toISOString(), to };
    }
    case 'custom': {
      return {
        from: customFrom ? new Date(customFrom).toISOString() : new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
        to: customTo ? new Date(customTo + 'T23:59:59.999').toISOString() : to,
      };
    }
  }
}

const Dashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const deptScope = useDepartmentScope();

  // Date range state — default: this_month
  const [datePreset, setDatePreset] = useState<DatePreset>('this_month');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showDateMenu, setShowDateMenu] = useState(false);

  const { from, to } = useMemo(
    () => getDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo]
  );

  // API data — pass date range to time-sensitive queries
  const { data: apiEmployees, isLoading: loadingEmployees } = useEmployees(deptScope);
  const { data: apiProjects, isLoading: loadingProjects } = useProjects(deptScope);
  const { data: apiTasks, isLoading: loadingTasks } = useTasks(deptScope, from, to);
  const { data: apiDepartments, isLoading: loadingDepartments } = useDepartments();
  const { data: apiLogs, isLoading: loadingLogs } = useLogs(from, to);
  const { data: invoiceStats } = useInvoiceStats(deptScope, from, to);
  const { data: expenseStats } = useExpenseStats();

  const isLoading = loadingEmployees || loadingProjects || loadingTasks || loadingDepartments || loadingLogs;

  // Derive stats from real data only
  const totalEmployees = apiEmployees?.length ?? 0;
  const activeProjects = apiProjects?.length ?? 0;
  const tasksCompleted = apiTasks?.filter(t => t.state === 'COMPLETED').length ?? 0;
  const totalTasks = apiTasks?.length ?? 0;
  const efficiency = totalTasks > 0 ? Math.round((tasksCompleted / totalTasks) * 100) : 0;

  const formatFCFA = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  const revenue = invoiceStats?.totalRevenue ?? 0;
  const totalExpenses = (expenseStats?.totalYear ?? 0) + (expenseStats?.totalSalaries ?? 0) + (expenseStats?.totalProjects ?? 0);
  const profit = revenue - totalExpenses;
  const pending = invoiceStats?.totalPending ?? 0;

  const stats = [
    { title: t('dashboard.stats.totalEmployees'), value: String(totalEmployees), change: '+0%', icon: Users, color: '#283852', link: '/employees' },
    { title: t('dashboard.stats.activeProjects'), value: String(activeProjects), change: '+0%', icon: Briefcase, color: '#314463', link: '/projects' },
    { title: t('dashboard.stats.tasksCompleted'), value: String(tasksCompleted), change: '+0%', icon: CheckCircle, color: '#3a5175', link: '/tasks' },
    { title: t('dashboard.stats.efficiency'), value: `${efficiency}%`, change: '+0%', icon: TrendingUp, color: '#445d86' },
    { title: t('dashboard.stats.revenue'), value: formatFCFA(revenue), change: '+0%', icon: DollarSign, color: '#4d6a98' },
    { title: t('dashboard.stats.expenses'), value: formatFCFA(totalExpenses), change: '+0%', icon: CreditCard, color: '#5676a9', link: '/expenses' },
    { title: t('dashboard.stats.profit'), value: formatFCFA(profit), change: profit >= 0 ? '+0%' : '-0%', icon: Coins, color: '#6083bb' },
    { title: t('dashboard.stats.pending'), value: formatFCFA(pending), change: '+0%', icon: Clock, color: '#698fcc' },
  ];

  // Derive chart data from real tasks grouped by day of week
  const dayNames = [
    t('dashboard.charts.days.Sun'),
    t('dashboard.charts.days.Mon'),
    t('dashboard.charts.days.Tue'),
    t('dashboard.charts.days.Wed'),
    t('dashboard.charts.days.Thu'),
    t('dashboard.charts.days.Fri'),
    t('dashboard.charts.days.Sat'),
  ];
  const chartData = (() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    (apiTasks || []).forEach(task => {
      const date = task.dueDate || task.createdAt;
      if (date) {
        const dow = new Date(date).getDay();
        counts[dow]++;
      }
    });
    // Return Mon-Sun order
    return [1, 2, 3, 4, 5, 6, 0].map(i => ({ name: dayNames[i], tasks: counts[i] }));
  })();

  // Derive pie data from departments
  const pieData = (apiDepartments || []).map(dept => ({
    name: dept.name,
    value: dept.employees?.length || 0,
  }));
  const pieTotal = pieData.reduce((s, d) => s + d.value, 0);

  const COLORS = ['#283852', '#33cbcc', '#FFBB28', '#FF8042', '#8b5cf6', '#ec4899'];

  const presetOptions: { key: DatePreset; label: string }[] = [
    { key: 'today', label: t('dashboard.dateFilter.today', 'Today') },
    { key: 'this_week', label: t('dashboard.dateFilter.thisWeek', 'This Week') },
    { key: 'this_month', label: t('dashboard.dateFilter.thisMonth', 'This Month') },
    { key: 'this_year', label: t('dashboard.dateFilter.thisYear', 'This Year') },
    { key: 'custom', label: t('dashboard.dateFilter.custom', 'Custom') },
  ];

  const currentLabel = presetOptions.find(o => o.key === datePreset)?.label || '';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#33cbcc]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 ">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold text-gray-800">{t('dashboard.title')}</h1>
           <p className="text-gray-500 mt-1">{t('dashboard.subtitle')}</p>
        </div>
        {/* Date Range Selector */}
        <div className="relative">
           <button
              onClick={() => setShowDateMenu(!showDateMenu)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-[#33cbcc]/40 transition-colors"
           >
              <Calendar size={16} className="text-[#33cbcc]" />
              <span className="text-sm">{currentLabel}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showDateMenu ? 'rotate-180' : ''}`} />
           </button>

           <AnimatePresence>
              {showDateMenu && (
                 <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 bg-white rounded-xl border border-gray-200 shadow-xl z-50 min-w-[220px] overflow-hidden"
                 >
                    {presetOptions.map(opt => (
                       <button
                          key={opt.key}
                          onClick={() => {
                             setDatePreset(opt.key);
                             if (opt.key !== 'custom') setShowDateMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm font-medium transition-colors ${
                             datePreset === opt.key
                                ? 'bg-[#33cbcc]/10 text-[#33cbcc]'
                                : 'text-gray-600 hover:bg-gray-50'
                          }`}
                       >
                          {opt.label}
                       </button>
                    ))}

                    {datePreset === 'custom' && (
                       <div className="px-4 py-3 border-t border-gray-100 space-y-2">
                          <div>
                             <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('dashboard.dateFilter.from', 'From')}</label>
                             <input
                                type="date"
                                value={customFrom}
                                onChange={e => setCustomFrom(e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#33cbcc]"
                             />
                          </div>
                          <div>
                             <label className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">{t('dashboard.dateFilter.to', 'To')}</label>
                             <input
                                type="date"
                                value={customTo}
                                onChange={e => setCustomTo(e.target.value)}
                                className="w-full mt-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-700 focus:outline-none focus:border-[#33cbcc]"
                             />
                          </div>
                          <button
                             onClick={() => setShowDateMenu(false)}
                             className="w-full mt-1 px-3 py-2 bg-[#33cbcc] text-white text-sm font-semibold rounded-lg hover:bg-[#2bb5b6] transition-colors"
                          >
                             {t('dashboard.dateFilter.apply', 'Apply')}
                          </button>
                       </div>
                    )}
                 </motion.div>
              )}
           </AnimatePresence>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={stat.link ? () => navigate(stat.link) : undefined}
            className={`bg-white p-6 rounded-2xl border border-gray-100 transition-colors relative overflow-hidden group hover:border-[#33cbcc]/50${stat.link ? ' cursor-pointer' : ''}`}
          >
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-gray-500 text-sm font-medium">{stat.title}</h3>
                    <span className={`text-xs font-semibold ${stat.change.startsWith('+') ? 'text-green-500 bg-green-50' : 'text-red-500 bg-red-50'} px-2 py-1 rounded-full`}>
                        {stat.change}
                    </span>
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mt-2">{stat.value}</h2>
            </div>

            <div
                className="absolute -right-6 -bottom-6 opacity-5 transition-transform group-hover:scale-110 duration-500 ease-out"
                style={{ color: stat.color }}
            >
                <stat.icon size={120} strokeWidth={1.5} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.4 }}
           className="lg:col-span-2 bg-white p-6 rounded-3xl border border-gray-100"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">{t('dashboard.charts.productivity')}</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
               <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#33cbcc" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#33cbcc" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF'}} />
                <CartesianGrid vertical={false} stroke="#E5E7EB" strokeDasharray="3 3"/>
                <Tooltip
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  cursor={{ stroke: '#33cbcc', strokeWidth: 2 }}
                />
                <Area type="monotone" dataKey="tasks" stroke="#33cbcc" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Side Chart (Money Flow / Distribution) */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.5 }}
           className="bg-white p-6 rounded-3xl border border-gray-100 flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-gray-800">{t('dashboard.charts.distribution')}</h3>
            <button className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
               <MoreHorizontal size={20} />
            </button>
          </div>
          <div className="flex-1 min-h-[250px] relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                 <p className="text-xs text-gray-400 font-medium">{t('dashboard.charts.total')}</p>
                 <p className="text-2xl font-bold text-gray-800">{pieTotal}</p>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
             {pieData.map((entry, index) => (
               <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                     <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                     <span className="text-gray-600">{entry.name}</span>
                  </div>
                  <span className="font-semibold text-gray-800">{pieTotal > 0 ? Math.round((entry.value / pieTotal) * 100) : 0}%</span>
               </div>
             ))}
          </div>
        </motion.div>
      </div>

      {/* Recents Table Section */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white p-6 rounded-3xl border border-gray-100"
      >
         <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-bold text-gray-800">{t('dashboard.recentActivities.title')}</h3>
            <a href="#" className="text-[#33cbcc] font-medium hover:underline flex items-center gap-1">
               {t('dashboard.recentActivities.viewAll')} <ArrowUpRight size={16} />
            </a>
          </div>

          <div className="overflow-x-auto">
             <table className="w-full">
                <thead>
                   <tr className="text-left text-gray-400 text-sm border-b border-gray-100">
                      <th className="pb-4 font-medium pl-4">{t('dashboard.recentActivities.columns.activity')}</th>
                      <th className="pb-4 font-medium">{t('dashboard.recentActivities.columns.date')}</th>
                      <th className="pb-4 font-medium">{t('dashboard.recentActivities.columns.user')}</th>
                      <th className="pb-4 font-medium">{t('dashboard.recentActivities.columns.status')}</th>
                      <th className="pb-4 font-medium pr-4">{t('dashboard.recentActivities.columns.amountRef')}</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                   {(apiLogs || []).length === 0 ? (
                      <tr>
                         <td colSpan={5} className="py-8 text-center text-gray-400 text-sm">
                            {t('dashboard.recentActivities.noData', 'No recent activities')}
                         </td>
                      </tr>
                   ) : (apiLogs || []).slice(0, 10).map((log: Log) => {
                      const userName = log.user?.employee
                         ? `${log.user.employee.firstName} ${log.user.employee.lastName}`
                         : log.user?.email || log.userId;
                      const entity = (log.details as any)?.entity || '';
                      const target = (log.details as any)?.target || '';
                      const description = [entity, target].filter(Boolean).join(' · ') || log.user?.role || '';
                      const actionColors: Record<string, string> = {
                         CREATE: 'bg-green-100 text-green-600',
                         LOGIN: 'bg-blue-100 text-blue-600',
                         UPDATE: 'bg-amber-100 text-amber-600',
                         DELETE: 'bg-red-100 text-red-600',
                         SEND: 'bg-purple-100 text-purple-600',
                         PAY: 'bg-emerald-100 text-emerald-600',
                         ASSIGN: 'bg-cyan-100 text-cyan-600',
                         REJECT: 'bg-rose-100 text-rose-600',
                         CLOSE: 'bg-gray-100 text-gray-600',
                      };
                      const badgeClass = actionColors[log.action] || 'bg-green-100 text-green-600';
                      return (
                      <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                         <td className="py-4 pl-4">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                                  <FileText size={18} />
                                </div>
                                <div>
                                   <p className="font-semibold text-gray-800">{log.action}{entity ? ` ${entity}` : ''}</p>
                                   <p className="text-xs text-gray-400">{target || description}</p>
                                </div>
                            </div>
                         </td>
                         <td className="py-4 text-gray-500 text-sm">{new Date(log.timestamp).toLocaleDateString()}</td>
                         <td className="py-4">
                            <div className="flex items-center gap-2">
                               {log.user?.employee?.avatarUrl ? (
                                  <img src={log.user.employee.avatarUrl} alt={userName} className="w-6 h-6 rounded-full object-cover" />
                               ) : (
                                  <div className="w-6 h-6 rounded-full bg-[#283852] flex items-center justify-center text-white text-[10px] font-semibold">
                                     {userName.charAt(0).toUpperCase()}
                                  </div>
                               )}
                               <span className="text-sm font-medium text-gray-700">{userName}</span>
                            </div>
                         </td>
                         <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass}`}>
                               {log.action}
                            </span>
                         </td>
                         <td className="py-4 pr-4 font-semibold text-gray-800">
                            #{log.id.slice(0, 8)}
                         </td>
                      </tr>
                      );
                   })}
                </tbody>
             </table>
          </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
