import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, UserPlus, Search, Shield, X, User, UserCheck, ChevronDown } from 'lucide-react';
import { useFamilyStore } from '../stores/useFamilyStore';
import { useAccountStore } from '../stores/useAccountStore';
import { cn } from '../utils/cn';
import { useTranslation } from 'react-i18next';

const PRESET_COLORS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
    '#F59E0B', '#10B981', '#06B6D4', '#6366F1',
];

function Families() {
    const { t } = useTranslation();
    const { families, fetchFamilies, createFamily, updateFamily, deleteFamily, assignAccountFamily } = useFamilyStore();
    const { accounts, fetchAccounts } = useAccountStore();

    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
    const [assignSearch, setAssignSearch] = useState('');
    const [addingToFamilyId, setAddingToFamilyId] = useState<string | null>(null);
    const [expandedFamilyIds, setExpandedFamilyIds] = useState<Set<string>>(new Set());

    useEffect(() => {
        fetchFamilies();
        fetchAccounts();
    }, []);

    const unassignedAccounts = useMemo(() => {
        return accounts.filter(a => !a.family_id);
    }, [accounts]);

    const getAccountsForFamily = (familyId: string) => {
        return accounts.filter(a => a.family_id === familyId);
    };

    const filteredUnassigned = useMemo(() => {
        if (!assignSearch) return unassignedAccounts;
        const q = assignSearch.toLowerCase();
        return unassignedAccounts.filter(a => a.email.toLowerCase().includes(q));
    }, [unassignedAccounts, assignSearch]);

    const resetForm = () => {
        setName('');
        setColor(PRESET_COLORS[0]);
        setDescription('');
        setEditId(null);
        setMode('list');
    };

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await createFamily(name.trim(), color, description.trim() || undefined);
            resetForm();
        } catch (e) {
            console.error('Create family failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdate = async () => {
        if (!editId || !name.trim()) return;
        setLoading(true);
        try {
            await updateFamily(editId, name.trim(), color, description.trim() || undefined);
            resetForm();
        } catch (e) {
            console.error('Update family failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        setLoading(true);
        try {
            await deleteFamily(id);
            setConfirmDeleteId(null);
            setExpandedFamilyIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        } catch (e) {
            console.error('Delete family failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (accountId: string, familyId: string) => {
        try {
            await assignAccountFamily(accountId, familyId);
            await fetchAccounts();
        } catch (e) {
            console.error('Assign failed:', e);
        }
    };

    const handleUnassign = async (accountId: string) => {
        try {
            await assignAccountFamily(accountId, null);
            await fetchAccounts();
        } catch (e) {
            console.error('Unassign failed:', e);
        }
    };

    const startEdit = (id: string) => {
        const family = families.find((f) => f.id === id);
        if (!family) return;
        setEditId(id);
        setName(family.name);
        setColor(family.color);
        setDescription(family.description || '');
        setMode('edit');
    };

    const totalFamilies = families.length;
    const assignedAccountsCount = accounts.filter(a => a.family_id).length;
    const unassignedAccountsCount = unassignedAccounts.length;

    return (
        <div className="flex flex-col h-full p-6 gap-6 max-w-7xl mx-auto w-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-base-content">
                        {t('accounts.family.manage_families', 'Families')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Organize your accounts into family groups for better management
                    </p>
                </div>
                <button
                    onClick={() => { resetForm(); setMode('create'); }}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
                >
                    <Plus className="w-4 h-4" />
                    {t('accounts.family.create_family', 'Create Family')}
                </button>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-base-100 rounded-2xl p-5 border border-gray-200 dark:border-base-300 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-blue-600 dark:text-blue-400">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total Families</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-base-content">{totalFamilies}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-base-100 rounded-2xl p-5 border border-gray-200 dark:border-base-300 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-green-50 dark:bg-green-900/20 rounded-xl text-green-600 dark:text-green-400">
                        <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Assigned Accounts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-base-content">{assignedAccountsCount}</p>
                    </div>
                </div>
                <div className="bg-white dark:bg-base-100 rounded-2xl p-5 border border-gray-200 dark:border-base-300 shadow-sm flex items-center gap-4">
                    <div className="p-3.5 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-600 dark:text-orange-400">
                        <User className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Unassigned Accounts</p>
                        <p className="text-2xl font-bold text-gray-900 dark:text-base-content">{unassignedAccountsCount}</p>
                    </div>
                </div>
            </div>

            {/* Create / Edit Modal */}
            {mode !== 'list' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-base-100 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-base-300 animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-5 border-b border-gray-100 dark:border-base-200 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-base-content">
                                {mode === 'create' ? t('accounts.family.create_family', 'Create Family') : t('accounts.family.edit_family', 'Edit Family')}
                            </h2>
                            <button onClick={resetForm} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-base-200 rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('accounts.family.name', 'Name')}
                                </label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('accounts.family.name_placeholder', 'e.g. Work, Personal...')}
                                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    maxLength={30}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                    {t('accounts.family.color', 'Color Accent')}
                                </label>
                                <div className="flex gap-3 flex-wrap">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-10 h-10 rounded-full transition-all flex items-center justify-center shadow-sm",
                                                color === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-base-100 scale-110" : "hover:scale-110 opacity-80 hover:opacity-100"
                                            )}
                                            style={{ backgroundColor: c }}
                                        >
                                            {color === c && <div className="w-2.5 h-2.5 bg-white rounded-full shadow-sm" />}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {t('accounts.family.description', 'Description (optional)')}
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('accounts.family.description_placeholder', 'Short description...')}
                                    className="w-full px-4 py-3 text-sm rounded-xl border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none h-24"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                        <div className="px-6 py-5 bg-gray-50 dark:bg-base-200/50 border-t border-gray-100 dark:border-base-200 flex justify-end gap-3">
                            <button
                                onClick={resetForm}
                                className="px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-base-100 border border-gray-300 dark:border-base-300 rounded-xl hover:bg-gray-50 dark:hover:bg-base-200 transition-colors"
                            >
                                {t('accounts.family.back', 'Cancel')}
                            </button>
                            <button
                                onClick={mode === 'create' ? handleCreate : handleUpdate}
                                disabled={!name.trim() || loading}
                                className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                            >
                                {loading ? t('accounts.family.saving', 'Saving...') : mode === 'create' ? t('accounts.family.create', 'Create Family') : t('accounts.family.save', 'Save Changes')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Click-away overlay for popovers */}
            {addingToFamilyId && (
                <div className="fixed inset-0 z-10" onClick={() => setAddingToFamilyId(null)} />
            )}

            {/* Family Grid */}
            <div className="flex-1 pb-10">
                {families.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center bg-white dark:bg-base-100 rounded-3xl border border-gray-200 dark:border-base-300 shadow-sm">
                        <div className="relative w-24 h-24 mb-6">
                            <div className="absolute inset-0 bg-blue-100 dark:bg-blue-900/20 rounded-full animate-pulse" />
                            <div className="absolute inset-2 bg-blue-50 dark:bg-blue-800/20 rounded-full" />
                            <Users className="absolute inset-0 m-auto w-10 h-10 text-blue-500 dark:text-blue-400" />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white dark:bg-base-100 rounded-full flex items-center justify-center shadow-sm border border-gray-100 dark:border-base-200">
                                <Shield className="w-5 h-5 text-green-500" />
                            </div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-base-content mb-2">
                            {t('accounts.family.no_families', 'No families yet')}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-8">
                            Create family groups to organize your accounts, manage quotas efficiently, and keep everything structured.
                        </p>
                        <button
                            onClick={() => { resetForm(); setMode('create'); }}
                            className="px-6 py-3 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-all flex items-center gap-2 shadow-sm hover:shadow-md hover:-translate-y-0.5 duration-200"
                        >
                            <Plus className="w-5 h-5" />
                            {t('accounts.family.create_family', 'Create Your First Family')}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {families.map((family) => {
                            const familyAccounts = getAccountsForFamily(family.id);
                            const isExpanded = expandedFamilyIds.has(family.id);

                            return (
                                <div
                                    key={family.id}
                                    className="bg-white dark:bg-base-100 rounded-2xl border border-gray-200 dark:border-base-300 shadow-sm overflow-hidden flex flex-col relative group"
                                >
                                    {/* Top Accent - subtle line instead of thick bar */}
                                    <div className="h-1 w-full opacity-60" style={{ backgroundColor: family.color }} />

                                    <div className="flex-1 flex flex-col">
                                        {/* Header - clickable to expand/collapse */}
                                        <div
                                            className="flex items-center gap-3 p-4 cursor-pointer hover:bg-gray-50/50 dark:hover:bg-base-200/30 transition-colors select-none"
                                            onClick={() => setExpandedFamilyIds(prev => {
                                const next = new Set(prev);
                                if (next.has(family.id)) {
                                    next.delete(family.id);
                                } else {
                                    next.add(family.id);
                                }
                                return next;
                            })}
                                        >
                                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: family.color }} />
                                            <div className="flex-1 min-w-0">
                                                <h3 className="text-sm font-bold text-gray-900 dark:text-base-content truncate">{family.name}</h3>
                                                {family.description && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-500 truncate mt-0.5">{family.description}</p>
                                                )}
                                            </div>
                                            <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-base-200 text-[10px] font-bold text-gray-500 dark:text-gray-500 shrink-0">
                                                {familyAccounts.length}
                                            </span>
                                            <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                <button onClick={() => startEdit(family.id)} className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-base-200 dark:hover:bg-base-200 rounded-lg transition-colors">
                                                    <Pencil className="w-3.5 h-3.5" />
                                                </button>
                                                <button onClick={() => setConfirmDeleteId(family.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-base-200 dark:hover:bg-base-200 rounded-lg transition-colors">
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                            <ChevronDown className={cn(
                                                "w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform shrink-0",
                                                isExpanded && "rotate-180"
                                            )} />
                                        </div>

                                        {/* Collapsible content */}
                                        {isExpanded && (
                                            <div className="border-t border-gray-100 dark:border-base-200">
                                                {/* Members list */}
                                                <div className="overflow-y-auto max-h-[240px]">
                                                    {familyAccounts.length > 0 ? (
                                                        familyAccounts.map(account => (
                                                            <div key={account.id} className="flex items-center gap-3 px-4 py-2 hover:bg-gray-50/50 dark:hover:bg-base-200/30 group/account transition-colors">
                                                                <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-base-200 flex items-center justify-center shrink-0">
                                                                    <span className="text-[10px] font-bold text-gray-500 dark:text-gray-500">
                                                                        {account.email.charAt(0).toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                <span className="flex-1 text-xs text-gray-600 dark:text-gray-400 truncate">{account.email}</span>
                                                                {account.quota?.subscription_tier && (
                                                                    <span className={cn(
                                                                        "px-1.5 py-0.5 rounded text-[9px] font-bold",
                                                                        account.quota.subscription_tier.toLowerCase().includes('pro')
                                                                            ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                                                            : account.quota.subscription_tier.toLowerCase().includes('ultra')
                                                                                ? "bg-purple-500/10 text-purple-500 dark:text-purple-400"
                                                                                : "bg-gray-500/10 text-gray-500 dark:text-gray-500"
                                                                    )}>
                                                                        {account.quota.subscription_tier.toLowerCase().includes('ultra') ? 'ULTRA' :
                                                                         account.quota.subscription_tier.toLowerCase().includes('pro') ? 'PRO' : 'FREE'}
                                                                    </span>
                                                                )}
                                                                <button
                                                                    onClick={() => handleUnassign(account.id)}
                                                                    className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover/account:opacity-100 transition-all"
                                                                    title={t('accounts.family.unassign', 'Remove')}
                                                                >
                                                                    <X className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <p className="px-4 py-6 text-xs text-gray-400 dark:text-gray-600 text-center">
                                                            No members yet
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Add member button */}
                                                <div className="relative border-t border-gray-100 dark:border-base-200 p-2">
                                                    {addingToFamilyId === family.id && (
                                                        <div className="absolute bottom-full left-0 w-full mb-2 bg-white dark:bg-base-100 rounded-xl border border-gray-200 dark:border-base-300 shadow-xl overflow-hidden z-20">
                                                            <div className="p-2 border-b border-gray-100 dark:border-base-200">
                                                                <div className="relative">
                                                                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                                    <input
                                                                        type="text"
                                                                        value={assignSearch}
                                                                        onChange={(e) => setAssignSearch(e.target.value)}
                                                                        placeholder="Search accounts..."
                                                                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-gray-50 dark:bg-base-200 border border-gray-200 dark:border-base-300 text-gray-900 dark:text-base-content focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                                                        autoFocus
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div className="max-h-48 overflow-y-auto p-1">
                                                                {filteredUnassigned.length > 0 ? (
                                                                    filteredUnassigned.map(account => (
                                                                        <button
                                                                            key={account.id}
                                                                            onClick={() => {
                                                                                handleAssign(account.id, family.id);
                                                                                setAddingToFamilyId(null);
                                                                                setAssignSearch('');
                                                                            }}
                                                                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors"
                                                                        >
                                                                            <UserPlus className="w-3 h-3 shrink-0" />
                                                                            <span className="truncate">{account.email}</span>
                                                                        </button>
                                                                    ))
                                                                ) : (
                                                                    <p className="py-4 text-xs text-gray-400 dark:text-gray-600 text-center">No unassigned accounts</p>
                                                                )}
                                                            </div>
                                                        </div>
                                                    )}

                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAddingToFamilyId(addingToFamilyId === family.id ? null : family.id);
                                                            setAssignSearch('');
                                                        }}
                                                        className={cn(
                                                            "w-full py-2 flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg transition-colors",
                                                            addingToFamilyId === family.id
                                                                ? "bg-blue-500/10 text-blue-500 dark:text-blue-400"
                                                                : "text-gray-500 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-500/10 bg-gray-100/50 dark:bg-base-200/50"
                                                        )}
                                                    >
                                                        <Plus className={cn("w-3.5 h-3.5 transition-transform", addingToFamilyId === family.id && "rotate-45")} />
                                                        {addingToFamilyId === family.id ? 'Close' : 'Add Member'}
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Delete Confirmation Overlay */}
                                    {confirmDeleteId === family.id && (
                                        <div className="absolute inset-0 bg-base-100/95 dark:bg-base-100/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center">
                                            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mb-3">
                                                <Trash2 className="w-6 h-6 text-red-500" />
                                            </div>
                                            <h4 className="text-sm font-bold text-gray-900 dark:text-base-content mb-1">Delete Family?</h4>
                                            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">This will unassign all members.</p>
                                            <div className="flex gap-2 w-full">
                                                <button
                                                    onClick={() => setConfirmDeleteId(null)}
                                                    className="flex-1 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-base-200 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(family.id)}
                                                    disabled={loading}
                                                    className="flex-1 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                                                >
                                                    {loading ? 'Deleting...' : 'Delete'}
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default Families;