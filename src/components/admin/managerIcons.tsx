import {
    Layers, Globe, FlaskConical, Briefcase, DollarSign, Users, Megaphone,
    Package, Search, Handshake, Share2, Cpu, Target, Rocket, Settings,
    type LucideIcon,
} from 'lucide-react';

export const MANAGER_ICON_OPTIONS: { value: string; label: string; Icon: LucideIcon }[] = [
    { value: 'layers', label: 'General', Icon: Layers },
    { value: 'dollar-sign', label: 'Finance', Icon: DollarSign },
    { value: 'users', label: 'HR / People', Icon: Users },
    { value: 'megaphone', label: 'Marketing', Icon: Megaphone },
    { value: 'briefcase', label: 'Operations', Icon: Briefcase },
    { value: 'search', label: 'Research', Icon: Search },
    { value: 'handshake', label: 'Partnership', Icon: Handshake },
    { value: 'share-2', label: 'Social Media', Icon: Share2 },
    { value: 'package', label: 'Inventory', Icon: Package },
    { value: 'cpu', label: 'Product / Tech', Icon: Cpu },
    { value: 'target', label: 'Strategy', Icon: Target },
    { value: 'rocket', label: 'Growth', Icon: Rocket },
    { value: 'globe', label: 'Web / Content', Icon: Globe },
    { value: 'flask-conical', label: 'R&D', Icon: FlaskConical },
    { value: 'settings', label: 'Settings', Icon: Settings },
];

const ICON_MAP = Object.fromEntries(MANAGER_ICON_OPTIONS.map(o => [o.value, o.Icon]));

export function ManagerIcon({ name, className = 'w-5 h-5' }: { name?: string; className?: string }) {
    const Icon = (name && ICON_MAP[name]) || Layers;
    return <Icon className={className} />;
}
