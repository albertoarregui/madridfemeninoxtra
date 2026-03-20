import React, { useRef, useEffect, useState } from 'react';

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
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const selectRef = useRef<HTMLSelectElement>(null);

    useEffect(() => {
        if (selectRef.current) {
            selectRef.current.value = value;
        }
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const handleOptionClick = (val: string) => {
        onChange(val);
        setIsOpen(false);
    };

    return (
        <div
            className={`custom-select-container ${isOpen ? 'open' : ''}`}
            id={id}
            ref={containerRef}
            data-custom-select="true"
        >
            <div
                className="custom-select-trigger"
                onClick={() => setIsOpen(!isOpen)}
                style={{ cursor: 'pointer' }}
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
            <select
                ref={selectRef}
                style={{ display: 'none' }}
                className="native-select"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
            </select>
            <div className="custom-select-options">
                {options.map((option) => (
                    <div
                        key={option.value}
                        className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                        onClick={() => handleOptionClick(option.value)}
                        data-value={option.value}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
}


