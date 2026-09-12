import { BriefcaseBusiness, Building2, CarFront, Package, Wrench, Cpu, PawPrint, Settings2 } from "lucide-react";
import type { ListingCategory } from "../../../../shared/marketplace";

const icons = {
  real_estate: Building2,
  vehicles: CarFront,
  auto_parts: Settings2,
  electronics: Cpu,
  pets: PawPrint,
  jobs: BriefcaseBusiness,
  used_items: Package,
  services: Wrench,
};

export function CategoryIcon({ category, className }: { category: ListingCategory; className?: string }) {
  const Icon = icons[category];
  return <Icon aria-hidden="true" className={className} strokeWidth={1.8} />;
}
