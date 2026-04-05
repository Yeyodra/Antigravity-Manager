import { useFamilyStore } from '../../stores/useFamilyStore';
import { Users } from 'lucide-react';

interface FamilyBadgeProps {
    familyIds?: string[] | null;
}

function FamilyBadge({ familyIds }: FamilyBadgeProps) {
    const { families } = useFamilyStore();

    if (!familyIds || familyIds.length === 0) return null;

    const matchedFamilies = familyIds
        .map(id => families.find(f => f.id === id))
        .filter(Boolean) as typeof families;

    if (matchedFamilies.length === 0) return null;

    return (
        <>
            {matchedFamilies.map(family => (
                <span
                    key={family.id}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-bold shadow-sm border"
                    style={{
                        backgroundColor: `${family.color}15`,
                        borderColor: `${family.color}30`,
                        color: family.color,
                    }}
                >
                    <Users className="w-2.5 h-2.5" />
                    {family.name}
                </span>
            ))}
        </>
    );
}

export default FamilyBadge;
