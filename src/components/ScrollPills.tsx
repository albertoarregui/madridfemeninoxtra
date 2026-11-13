import React, { useEffect, useRef, useState } from "react";

interface Option { value: string; label: string }
interface Props { options: Option[]; value: string; onChange: (value: string) => void; label: string }

export default function ScrollPills({ options, value, onChange, label }: Props) {
    const rowRef = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: true, end: false });

    const update = () => {
        const row = rowRef.current;
        if (!row) return;
        setEdges({ start: row.scrollLeft <= 2, end: row.scrollLeft + row.clientWidth >= row.scrollWidth - 2 });
    };

    useEffect(() => {
        const row = rowRef.current;
        if (!row) return;
        update();
        const ro = new ResizeObserver(update);
        ro.observe(row);
        return () => ro.disconnect();
    }, []);

    useEffect(() => {
        const row = rowRef.current;
        const active = row?.querySelector<HTMLElement>(".pt-pill.is-active");
        if (!row || !active) return;
        const target = active.offsetLeft - (row.clientWidth - active.offsetWidth) / 2;
        row.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
    }, [value]);

    const move = (dir: number) => rowRef.current?.scrollBy({ left: dir * Math.max(240, (rowRef.current.clientWidth || 0) * 0.7), behavior: "smooth" });

    return (
        <div className={`scroll-pills${edges.start ? " at-start" : ""}${edges.end ? " at-end" : ""}`}>
            <button type="button" className="scroll-pills-arrow is-prev" aria-label="Anteriores" onClick={() => move(-1)} disabled={edges.start}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m15 6-6 6 6 6" /></svg>
            </button>
            <div className="pt-pills scroll-pills-row" role="group" aria-label={label} ref={rowRef} onScroll={update}>
                {options.map((o) => (
                    <button key={o.value} type="button" className={`pt-pill${value === o.value ? " is-active" : ""}`}
                        aria-pressed={value === o.value} onClick={() => onChange(o.value)}>
                        {o.label}
                    </button>
                ))}
            </div>
            <button type="button" className="scroll-pills-arrow is-next" aria-label="Siguientes" onClick={() => move(1)} disabled={edges.end}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
            </button>
        </div>
    );
}
