import { useFamilyStore } from '../../stores/useFamilyStore';
import { Users } from 'lucide-react';

interface FamilyBadgeProps {
    familyId?: string | null;
}

function FamilyBadge({ familyId }: FamilyBadgeProps) {
    const { families } = useFamilyStore();

    if (!familyId) return null;

    const family = families.find((f) => f.id === familyId);
    if (!family) return null;

    return (
        <span
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
    );
}

export default FamilyBadge;
