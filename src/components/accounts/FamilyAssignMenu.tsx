import { useState, useRef, useEffect } from 'react';
import { Users, ChevronDown, Check } from 'lucide-react';
import { useFamilyStore } from '../../stores/useFamilyStore';
import { cn } from '../../utils/cn';
import { useTranslation } from 'react-i18next';

interface FamilyAssignMenuProps {
    accountId: string;
    currentFamilyIds?: string[] | null;
    onAssigned?: () => void;
}

function FamilyAssignMenu({ accountId, currentFamilyIds, onAssigned }: FamilyAssignMenuProps) {
    const { t } = useTranslation();
    const { families, assignAccountFamily, unassignAccountFamily } = useFamilyStore();
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    const assignedIds = currentFamilyIds || [];

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

    const handleToggle = async (familyId: string) => {
        setLoading(true);
        try {
            if (assignedIds.includes(familyId)) {
                await unassignAccountFamily(accountId, familyId);
            } else {
                await assignAccountFamily(accountId, familyId);
            }
            onAssigned?.();
        } catch (e) {
            console.error('Toggle family failed:', e);
        } finally {
            setLoading(false);
        }
    };

    const assignedCount = assignedIds.length;
    const firstFamily = assignedCount > 0 ? families.find(f => f.id === assignedIds[0]) : null;

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
                disabled={loading}
                className={cn(
                    "flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold transition-colors border",
                    firstFamily
                        ? "shadow-sm hover:opacity-80"
                        : "bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/20"
                )}
                style={firstFamily ? {
                    backgroundColor: `${firstFamily.color}15`,
                    borderColor: `${firstFamily.color}30`,
                    color: firstFamily.color,
                } : undefined}
                title={t('accounts.family.assign_family')}
            >
                <Users className="w-2.5 h-2.5" />
                {assignedCount === 0
                    ? t('accounts.family.family_label')
                    : assignedCount === 1
                        ? firstFamily?.name || t('accounts.family.family_label')
                        : `${assignedCount} families`
                }
                <ChevronDown className="w-2 h-2" />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[160px] bg-white dark:bg-base-100 rounded-lg shadow-xl border border-gray-200 dark:border-base-300 py-1">
                    {families.map((family) => {
                        const isAssigned = assignedIds.includes(family.id);
                        return (
                            <button
                                key={family.id}
                                onClick={() => handleToggle(family.id)}
                                disabled={loading}
                                className={cn(
                                    "w-full flex items-center gap-2 px-3 py-1.5 text-xs transition-colors",
                                    isAssigned
                                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-semibold"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-base-200"
                                )}
                            >
                                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: family.color }} />
                                <span className="truncate flex-1 text-left">{family.name}</span>
                                {isAssigned && <Check className="w-3 h-3 shrink-0 text-blue-500" />}
                            </button>
                        );
                    })}
                    {families.length === 0 && (
                        <p className="px-3 py-2 text-xs text-gray-400">{t('accounts.family.no_families_short')}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default FamilyAssignMenu;
