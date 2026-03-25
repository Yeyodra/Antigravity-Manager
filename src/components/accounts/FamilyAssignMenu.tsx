import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, X } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

interface FamilyAssignMenuProps {
    accountId: string;
    currentFamilyId?: string | null;
    onAssigned?: () => void;
}

function FamilyAssignMenu({ accountId, currentFamilyId, onAssigned }: FamilyAssignMenuProps) {
    const { t } = useTranslation();
    const { families, assignAccountFamily } = useFamilyStore();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const handleAssign = async (familyId: string | null) => {
        setLoading(true);
        try {
            await assignAccountFamily(accountId, familyId);
            onAssigned?.();
        } catch (e) {
            console.error('Assign family failed:', e);
        } finally {
            setLoading(false);
            setIsOpen(false);
        }
    };

    const currentFamily = families.find((f) => f.id === currentFamilyId);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                disabled={loading}
                className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors border",
                    currentFamily
                        ? "shadow-sm hover:opacity-80"
                        : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20"
                )}
                style={currentFamily ? {
                    backgroundColor: `${currentFamily.color}15`,
                    borderColor: `${currentFamily.color}30`,
                    color: currentFamily.color,
                } : undefined}
                title={t('accounts.family.assign_family')}
            >
                <Users className="w-2.5 h-2.5" />
                {currentFamily ? currentFamily.name : t('accounts.family.family_label')}
                <ChevronDown className="w-2 h-2" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[140px] bg-white dark:bg-base-100 rounded-lg shadow-xl border border-gray-200 dark:border-base-300 py-1">
                    {currentFamilyId && (
                        <button
                            onClick={() => handleAssign(null)}
                            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        >
                            <X className="w-3 h-3" />
                            {t('accounts.family.unassign')}
                        </button>
                    )}
                    {families.map((family) => (
                        <button
                            key={family.id}
                            onClick={() => handleAssign(family.id)}
                            className={cn(
                                "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                                family.id === currentFamilyId
                                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-base-200"
                            )}
                        >
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: family.color }} />
                            <span className="truncate">{family.name}</span>
                        </button>
                    ))}
                    {families.length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400">{t('accounts.family.no_families_short')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default FamilyAssignMenu;
