import React from "react";

// Filtro de competición en píldoras, el mismo de la ficha de jugadora,
// /rankings y la portada. «Todas» y «Oficiales» van primero.
const ORDER = ["Primera Iberdrola", "Liga F", "UWCL", "Copa de la Reina", "Supercopa de España", "Amistosos", "Amistoso"];

interface Props {
    competitions: string[];
    value: string;
    onChange: (value: string) => void;
    logos?: Record<string, string>;
    /** Valor de «Todas» (los buscadores usan "todos"). */
    allValue?: string;
    officialValue?: string | null;
}

export default function CompetitionPills({ competitions, value, onChange, logos = {}, allValue = "todos", officialValue = "oficiales" }: Props) {
    const sorted = [...competitions].sort((a, b) => {
        const ia = ORDER.indexOf(a), ib = ORDER.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b, "es");
    });
    const options = [
        { value: allValue, label: "Todas" },
        ...(officialValue ? [{ value: officialValue, label: "Oficiales" }] : []),
        ...sorted.map((c) => ({ value: c, label: /^amistoso/i.test(c) ? "Amistoso" : c })),
    ];
    return (
        <div className="pt-pills comp-pills" role="group" aria-label="Competición">
            {options.map((o) => (
                <button key={o.value} type="button" className={`pt-pill${value === o.value ? " is-active" : ""}`}
                    aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
                    {logos[o.value] && <img src={logos[o.value]} alt="" width={16} height={16} loading="lazy" />}
                    {o.label}
                </button>
            ))}
        </div>
    );
}
