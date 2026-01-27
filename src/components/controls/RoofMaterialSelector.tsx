import { RoofMaterial, ROOF_MATERIALS } from '@/types/solar';

interface RoofMaterialSelectorProps {
  value: RoofMaterial;
  onChange: (material: RoofMaterial) => void;
}

export function RoofMaterialSelector({ value, onChange }: RoofMaterialSelectorProps) {
  return (
    <div className="space-y-3">
      <label className="control-label">Roof Material</label>
      <div className="grid grid-cols-2 gap-2">
        {ROOF_MATERIALS.map((material) => (
          <button
            key={material.value}
            onClick={() => onChange(material.value)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              value === material.value
                ? 'border-primary bg-primary/10 text-foreground'
                : 'border-border bg-card hover:border-muted-foreground/50 text-muted-foreground'
            }`}
          >
            <span
              className="w-4 h-4 rounded-full border border-border/50"
              style={{ backgroundColor: material.color }}
            />
            <span className="text-sm font-medium">{material.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
