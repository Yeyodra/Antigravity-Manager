import { useEffect, useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Users, UserPlus, UserMinus, Search } from 'lucide-react';
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
    const [expandedFamilyId, setExpandedFamilyId] = useState<string | null>(null);
    const [assignSearch, setAssignSearch] = useState('');

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
            if (expandedFamilyId === id) setExpandedFamilyId(null);
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

    return (
        <div className="flex flex-col h-full p-6 gap-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-base-content">
                        {t('accounts.family.manage_families', 'Families')}
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Organize your accounts into family groups
                    </p>
                </div>
                {mode === 'list' && (
                    <button
                        onClick={() => { resetForm(); setMode('create'); }}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t('accounts.family.create_family', 'Create Family')}
                    </button>
                )}
            </div>

            {/* Create / Edit Form */}
            {mode !== 'list' && (
                <div className="bg-white dark:bg-base-100 rounded-2xl border border-gray-200 dark:border-base-300 p-6 shadow-sm">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-base-content mb-4">
                        {mode === 'create' ? t('accounts.family.create_family', 'Create Family') : t('accounts.family.edit_family', 'Edit Family')}
                    </h2>
                    <div className="space-y-4 max-w-md">
                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('accounts.family.name', 'Name')}
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('accounts.family.name_placeholder', 'e.g. Work, Personal...')}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                maxLength={30}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('accounts.family.color', 'Color')}
                            </label>
                            <div className="flex gap-2 flex-wrap">
                                {PRESET_COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={cn(
                                            "w-8 h-8 rounded-full transition-all",
                                            color === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-base-100 scale-110" : "hover:scale-105"
                                        )}
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                                {t('accounts.family.description', 'Description (optional)')}
                            </label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder={t('accounts.family.description_placeholder', 'Short description...')}
                                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                maxLength={100}
                            />
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-base-200 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                            >
                                {t('accounts.family.back', 'Cancel')}
                            </button>
                            <button
                                onClick={mode === 'create' ? handleCreate : handleUpdate}
                                disabled={!name.trim() || loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('accounts.family.saving', 'Saving...') : mode === 'create' ? t('accounts.family.create', 'Create') : t('accounts.family.save', 'Save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Family List */}
            {mode === 'list' && (
                <div className="flex-1 overflow-y-auto space-y-4">
                    {families.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <Users className="w-16 h-16 text-gray-300 dark:text-gray-600 mb-4" />
                            <p className="text-lg font-semibold text-gray-500 dark:text-gray-400">
                                {t('accounts.family.no_families', 'No families yet')}
                            </p>
                            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                                Create a family group to organize your accounts
                            </p>
                        </div>
                    ) : (
                        families.map((family) => {
                            const familyAccounts = getAccountsForFamily(family.id);
                            const isExpanded = expandedFamilyId === family.id;

                            return (
                                <div
                                    key={family.id}
                                    className="bg-white dark:bg-base-100 rounded-2xl border border-gray-200 dark:border-base-300 shadow-sm overflow-hidden"
                                >
                                    {/* Family Header */}
                                    <div
                                        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-base-200/50 transition-colors"
                                        onClick={() => setExpandedFamilyId(isExpanded ? null : family.id)}
                                    >
                                        <span className="w-5 h-5 rounded-full shrink-0" style={{ backgroundColor: family.color }} />
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-sm font-bold text-gray-900 dark:text-base-content">{family.name}</h3>
                                            {family.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{family.description}</p>
                                            )}
                                        </div>
                                        <span className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-base-200 text-xs font-bold text-gray-600 dark:text-gray-400">
                                            {familyAccounts.length} accounts
                                        </span>
                                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <button
                                                onClick={() => startEdit(family.id)}
                                                className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                                                title="Edit"
                                            >
                                                <Pencil className="w-4 h-4 text-gray-500" />
                                            </button>
                                            {confirmDeleteId === family.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(family.id)}
                                                        disabled={loading}
                                                        className="px-2.5 py-1 text-xs font-bold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                                                    >
                                                        {t('accounts.family.confirm_delete', 'Confirm')}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2.5 py-1 text-xs font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-base-300 rounded-lg hover:bg-gray-300 dark:hover:bg-base-200 transition-colors"
                                                    >
                                                        {t('accounts.family.cancel_delete', 'Cancel')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(family.id)}
                                                    className="p-2 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {/* Expanded: Account List + Assign */}
                                    {isExpanded && (
                                        <div className="border-t border-gray-200 dark:border-base-300">
                                            {/* Assigned accounts */}
                                            {familyAccounts.length > 0 ? (
                                                <div className="divide-y divide-gray-100 dark:divide-base-200">
                                                    {familyAccounts.map((account) => (
                                                        <div key={account.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-base-200/30">
                                                            <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 truncate">{account.email}</span>
                                                            {account.quota?.subscription_tier && (
                                                                <span className={cn(
                                                                    "px-2 py-0.5 rounded-md text-[10px] font-bold",
                                                                    account.quota.subscription_tier.toLowerCase().includes('pro')
                                                                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                                                                        : account.quota.subscription_tier.toLowerCase().includes('ultra')
                                                                            ? "bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
                                                                            : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                                                                )}>
                                                                    {account.quota.subscription_tier.toLowerCase().includes('ultra') ? 'ULTRA' :
                                                                     account.quota.subscription_tier.toLowerCase().includes('pro') ? 'PRO' : 'FREE'}
                                                                </span>
                                                            )}
                                                            <button
                                                                onClick={() => handleUnassign(account.id)}
                                                                className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                                title={t('accounts.family.unassign', 'Remove')}
                                                            >
                                                                <UserMinus className="w-3.5 h-3.5 text-red-500" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="px-4 py-4 text-sm text-gray-400 dark:text-gray-500 text-center">
                                                    No accounts assigned to this family
                                                </p>
                                            )}

                                            {/* Add account to family */}
                                            {unassignedAccounts.length > 0 && (
                                                <div className="border-t border-gray-200 dark:border-base-300 p-3">
                                                    <div className="relative mb-2">
                                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            value={assignSearch}
                                                            onChange={(e) => setAssignSearch(e.target.value)}
                                                            placeholder="Search unassigned accounts..."
                                                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-gray-200 dark:border-base-300 bg-gray-50 dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-1 focus:ring-blue-500 focus:border-transparent outline-none"
                                                        />
                                                    </div>
                                                    <div className="max-h-32 overflow-y-auto space-y-0.5">
                                                        {filteredUnassigned.slice(0, 10).map((account) => (
                                                            <button
                                                                key={account.id}
                                                                onClick={() => handleAssign(account.id, family.id)}
                                                                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors"
                                                            >
                                                                <UserPlus className="w-3 h-3 shrink-0" />
                                                                <span className="truncate">{account.email}</span>
                                                            </button>
                                                        ))}
                                                        {filteredUnassigned.length > 10 && (
                                                            <p className="text-[10px] text-gray-400 text-center py-1">
                                                                +{filteredUnassigned.length - 10} more
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}

export default Families;
