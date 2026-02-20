import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import ExpenseModal from './ExpenseModal';
import {
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Plus, Wallet, FileText, Search, Loader2, Trash2, Pencil, ChevronLeft, ChevronRight, Repeat, LayoutGrid, Briefcase } from 'lucide-react';
import { useExpenses, useExpenseStats, useDeleteExpense } from '../api/expenses/hooks';
import type { Expense } from '../api/expenses/types';

const COLORS = ['#33cbcc', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#ef4444', '#06b6d4', '#84cc16', '#f97316'];

const formatFCFA = (amount: number) => new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');

const FREQUENCY_LABELS: Record<string, string> = {
    DAILY: 'Quotidienne',
    WEEKLY: 'Hebdomadaire',
    MONTHLY: 'Mensuelle',
    YEARLY: 'Annuelle',
};

export default function Expenses() {
    const [search, setSearch] = useState('');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

    const { data: expenses, isLoading: expLoading } = useExpenses();
    const { data: stats, isLoading: statsLoading } = useExpenseStats(selectedYear);
    const deleteExpense = useDeleteExpense();
    const [visibleSeries, setVisibleSeries] = useState<Set<string>>(new Set());

    // Sync visibleSeries when stats.series changes
    const allSeries = stats?.series || [];
    const seriesKey = allSeries.join(',');
    const [prevSeriesKey, setPrevSeriesKey] = useState('');
    if (seriesKey !== prevSeriesKey) {
        setPrevSeriesKey(seriesKey);
        setVisibleSeries(new Set(allSeries));
    }

    const toggleSeries = (name: string) => {
        setVisibleSeries(prev => {
            const next = new Set(prev);
            if (next.has(name)) next.delete(name);
            else next.add(name);
            return next;
        });
    };

    const seriesColors: Record<string, string> = useMemo(() => {
        const map: Record<string, string> = {};
        allSeries.forEach((name, i) => { map[name] = COLORS[i % COLORS.length]; });
        return map;
    }, [seriesKey]);

    const filteredExpenses = useMemo(() => {
        if (!expenses) return [];
        if (!search) return expenses;
        const q = search.toLowerCase();
        return expenses.filter(e =>
            e.title.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
        );
    }, [expenses, search]);

    const isLoading = expLoading || statsLoading;

    const handleEdit = (expense: Expense) => {
        setEditingExpense(expense);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingExpense(null);
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="w-8 h-8 animate-spin text-[#33cbcc]" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Dépenses</h1>
                    <p className="text-sm text-gray-500 mt-1">Gérez et analysez vos charges d'entreprise</p>
                </div>
                <button
                    onClick={() => { setEditingExpense(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#33cbcc] to-[#2bb5b6] text-white rounded-xl font-medium shadow-lg shadow-[#33cbcc]/20 hover:shadow-[#33cbcc]/40 transition-all hover:-translate-y-0.5"
                >
                    <Plus size={18} />
                    Nouvelle Dépense
                </button>
            </div>

            {/* Year Selector + Stats Cards */}
            <div className="flex items-center gap-3 mb-2">
                <button
                    onClick={() => setSelectedYear(y => y - 1)}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                >
                    <ChevronLeft size={18} />
                </button>
                <span className="text-lg font-bold text-gray-800 tabular-nums min-w-[60px] text-center">{selectedYear}</span>
                <button
                    onClick={() => setSelectedYear(y => y + 1)}
                    disabled={selectedYear >= new Date().getFullYear()}
                    className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={18} />
                </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-[#33cbcc]/5 rounded-bl-[100px] transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Total Annuel</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatFCFA(stats?.totalYear || 0)}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#33cbcc]/10 flex items-center justify-center text-[#33cbcc]">
                            <Wallet size={20} />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-[100px] transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Transactions</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats?.totalCount || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                            <FileText size={20} />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-[100px] transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Récurrentes</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats?.recurrentCount || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                            <Repeat size={20} />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-amber-50 rounded-bl-[100px] transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Catégories</p>
                            <h3 className="text-2xl font-bold text-gray-800">{stats?.byCategory?.length || 0}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                            <LayoutGrid size={20} />
                        </div>
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group">
                    <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-[100px] transition-transform group-hover:scale-110" />
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500 mb-1">Projets</p>
                            <h3 className="text-2xl font-bold text-gray-800">{formatFCFA(stats?.totalProjects || 0)}</h3>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Briefcase size={20} />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Multi-Series Line Chart */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">Évolution Mensuelle ({selectedYear})</h3>
                        <p className="text-xs text-gray-500 mt-1">Salaires + dépenses par catégorie</p>
                    </div>
                </div>
                {/* Series Toggle Filters */}
                {allSeries.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                        {allSeries.map((name) => {
                            const active = visibleSeries.has(name);
                            const color = seriesColors[name];
                            return (
                                <button
                                    key={name}
                                    onClick={() => toggleSeries(name)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${active
                                        ? 'border-transparent text-white shadow-sm'
                                        : 'border-gray-200 text-gray-400 bg-white hover:bg-gray-50'
                                        }`}
                                    style={active ? { backgroundColor: color } : undefined}
                                >
                                    <span
                                        className="w-2 h-2 rounded-full shrink-0"
                                        style={{ backgroundColor: active ? '#fff' : color }}
                                    />
                                    {name}
                                </button>
                            );
                        })}
                    </div>
                )}
                <div className="h-72">
                    {allSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={stats?.byMonth || []}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6B7280' }} tickFormatter={(v) => v === 0 ? '0' : (v / 1000).toFixed(0) + 'k'} dx={-10} />
                                <RechartsTooltip
                                    cursor={{ stroke: '#f3f4f6', strokeWidth: 2 }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value, name) => [formatFCFA(Number(value) || 0), String(name)]}
                                />
                                {allSeries.map((name) => (
                                    <Line
                                        key={name}
                                        type="monotone"
                                        dataKey={name}
                                        stroke={seriesColors[name]}
                                        strokeWidth={visibleSeries.has(name) ? 2.5 : 0}
                                        dot={visibleSeries.has(name) ? { r: 3, fill: seriesColors[name], strokeWidth: 2, stroke: '#fff' } : false}
                                        activeDot={visibleSeries.has(name) ? { r: 5, strokeWidth: 0 } : false}
                                        hide={!visibleSeries.has(name)}
                                    />
                                ))}
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            Aucune donnée pour cette année
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Category Bar Chart */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-800 mb-6 uppercase tracking-wider">Par Catégorie</h3>
                <div className="h-64">
                    {(stats?.byCategory?.length || 0) > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={stats?.byCategory || []} layout="vertical" margin={{ top: 0, right: 0, left: 20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E5E7EB" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#4B5563', fontWeight: 500 }} width={100} />
                                <RechartsTooltip
                                    cursor={{ fill: '#f9fafb' }}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    formatter={(value) => [formatFCFA(Number(value) || 0), 'Total']}
                                />
                                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={40}>
                                    {(stats?.byCategory || []).map((_entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                            Aucune donnée pour cette année
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Expenses Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col min-h-[400px]">
                <div className="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-gray-50/50 gap-4">
                    <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <FileText size={20} className="text-gray-400" />
                        Historique des Dépenses
                    </h2>
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Rechercher..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#33cbcc]/20 focus:border-[#33cbcc] transition-all bg-white"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto flex-1">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider">
                                <th className="px-6 py-4 font-semibold w-1/3">Dépense</th>
                                <th className="px-6 py-4 font-semibold">Type</th>
                                <th className="px-6 py-4 font-semibold">Date</th>
                                <th className="px-6 py-4 font-semibold text-right">Montant</th>
                                <th className="px-6 py-4 w-24 text-center border-l border-gray-100">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredExpenses.map((expense) => (
                                <tr key={expense.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-800">{expense.title}</p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-0.5">
                                            <span className="w-1.5 h-1.5 rounded-full bg-[#33cbcc]" />
                                            {expense.category}
                                        </p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {expense.type === 'ONE_TIME' ? (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-semibold">
                                                Ponctuelle
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-purple-50 text-purple-700 text-xs font-semibold">
                                                {expense.frequency ? FREQUENCY_LABELS[expense.frequency] : 'Récurrente'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 whitespace-nowrap">
                                        {formatDate(expense.date)}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-800 text-right whitespace-nowrap">
                                        {formatFCFA(expense.amount)}
                                    </td>
                                    <td className="px-2">
                                        <div className="flex justify-center items-center gap-1 h-[72px] border-l border-transparent group-hover:border-gray-100 group-hover:bg-gray-100/50 transition-colors">
                                            <button
                                                onClick={() => handleEdit(expense)}
                                                className="p-2 text-gray-400 hover:text-[#33cbcc] hover:bg-[#33cbcc]/10 rounded-lg transition-colors"
                                                title="Modifier"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => {
                                                    if (window.confirm('Supprimer cette dépense ?')) {
                                                        deleteExpense.mutate(expense.id);
                                                    }
                                                }}
                                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredExpenses.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                                        Aucune dépense trouvée.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExpenseModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                expense={editingExpense}
            />
        </div>
    );
}
