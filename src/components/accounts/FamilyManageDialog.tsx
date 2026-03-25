import { useState } from 'react';
import { Plus, Pencil, Trash2, X } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

const PRESET_COLORS = [
    '#3B82F6', '#8B5CF6', '#EC4899', '#EF4444',
    '#F59E0B', '#10B981', '#06B6D4', '#6366F1',
];

interface FamilyManageDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

function FamilyManageDialog({ isOpen, onClose }: FamilyManageDialogProps) {
    const { t } = useTranslation();
    const { families, createFamily, updateFamily, deleteFamily } = useFamilyStore();
    const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
    const [editId, setEditId] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [color, setColor] = useState(PRESET_COLORS[0]);
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

    if (!isOpen) return null;

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
        } catch (e) {
            console.error('Delete family failed:', e);
        } finally {
            setLoading(false);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
            <div
                className="bg-white dark:bg-base-100 rounded-2xl shadow-2xl border border-gray-200 dark:border-base-300 w-full max-w-md mx-4 max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-base-300">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-base-content">
                        {mode === 'create' ? t('accounts.family.create_family') : mode === 'edit' ? t('accounts.family.edit_family') : t('accounts.family.manage_families')}
                    </h2>
                    <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-base-200 transition-colors">
                        <X className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-5">
                    {mode === 'list' ? (
                        <div className="space-y-2">
                            {families.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                                    {t('accounts.family.no_families')}
                                </p>
                            ) : (
                                families.map((family) => (
                                    <div
                                        key={family.id}
                                        className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-base-300 hover:bg-gray-50 dark:hover:bg-base-200/50 transition-colors"
                                    >
                                        <span className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: family.color }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-base-content truncate">{family.name}</p>
                                            {family.description && (
                                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{family.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => startEdit(family.id)}
                                                className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                                            </button>
                                            {confirmDeleteId === family.id ? (
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleDelete(family.id)}
                                                        disabled={loading}
                                                        className="px-2 py-1 text-[10px] font-bold text-white bg-red-500 rounded-md hover:bg-red-600 transition-colors"
                                                    >
                                                        {t('accounts.family.confirm_delete')}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDeleteId(null)}
                                                        className="px-2 py-1 text-[10px] font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-base-300 rounded-md hover:bg-gray-300 dark:hover:bg-base-200 transition-colors"
                                                    >
                                                        {t('accounts.family.cancel_delete')}
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => setConfirmDeleteId(family.id)}
                                                    className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    ) : (
                        /* Create / Edit form */
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('accounts.family.name')}</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder={t('accounts.family.name_placeholder')}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    maxLength={30}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('accounts.family.color')}</label>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESET_COLORS.map((c) => (
                                        <button
                                            key={c}
                                            onClick={() => setColor(c)}
                                            className={cn(
                                                "w-7 h-7 rounded-full transition-all",
                                                color === c ? "ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-base-100 scale-110" : "hover:scale-105"
                                            )}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">{t('accounts.family.description')}</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder={t('accounts.family.description_placeholder')}
                                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-base-300 bg-white dark:bg-base-200 text-gray-900 dark:text-base-content focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                                    maxLength={100}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-gray-200 dark:border-base-300 flex justify-between">
                    {mode === 'list' ? (
                        <>
                            <button
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-base-200 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                            >
                                {t('accounts.family.close')}
                            </button>
                            <button
                                onClick={() => { resetForm(); setMode('create'); }}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
                            >
                                <Plus className="w-4 h-4" />
                                {t('accounts.family.create_family')}
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                onClick={resetForm}
                                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-base-200 rounded-lg hover:bg-gray-200 dark:hover:bg-base-300 transition-colors"
                            >
                                {t('accounts.family.back')}
                            </button>
                            <button
                                onClick={mode === 'create' ? handleCreate : handleUpdate}
                                disabled={!name.trim() || loading}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? t('accounts.family.saving') : mode === 'create' ? t('accounts.family.create') : t('accounts.family.save')}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default FamilyManageDialog;
