import React, { useState, useRef, useEffect } from 'react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    options: Option[];
    value: string;
    onChange: (val: string) => void;
    id?: string;
}

export default function CustomSelect({ options, value, onChange, id }: CustomSelectProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        
        const trigger = container.querySelector('.custom-select-trigger');
        if (!trigger) return;

        const handleToggle = (e: Event) => {
            e.stopPropagation();
            
            // Close all other selects first (like in rankings)
            document.querySelectorAll('.custom-select-container').forEach(c => {
                if (c !== container) c.classList.remove('open');
            });
            
            container.classList.toggle('open');
        };

        const handleClickOutside = (e: MouseEvent) => {
            if (!container.contains(e.target as Node)) {
                container.classList.remove('open');
            }
        };

        trigger.addEventListener('click', handleToggle);
        document.addEventListener('click', handleClickOutside);

        return () => {
            trigger.removeEventListener('click', handleToggle);
            document.removeEventListener('click', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    return (
        <div
            className="custom-select-container"
            id={id}
            ref={containerRef}
        >
            <div 
                className="custom-select-trigger" 
                style={{ cursor: 'pointer' }}
                tabIndex={0}
            >
                <span className="selected-text">{selectedOption ? selectedOption.label : 'Seleccionar'}</span>
                <div className="custom-select-arrow">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
            </div>
            <div className="custom-select-options">
                {options.map((option) => (
                    <div
                        key={option.value}
                        className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(option.value);
                            containerRef.current?.classList.remove('open');
                        }}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
