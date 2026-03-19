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
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
        }

        return () => {
            document.removeEventListener('click', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    const toggle = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        if ('nativeEvent' in e) {
            (e.nativeEvent as Event).stopImmediatePropagation();
        }
        setIsOpen(prev => !prev);
    };

    return (
        <div
            className={`custom-select-container ${isOpen ? 'open' : ''}`}
            id={id}
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
        >
            <button 
                type="button"
                className="custom-select-trigger" 
                onClick={toggle}
                style={{ 
                    appearance: 'none', 
                    background: 'none', 
                    border: 'none', 
                    padding: 0, 
                    width: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    outline: 'none',
                    boxShadow: 'none',
                    WebkitTapHighlightColor: 'transparent'
                }}
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
            </button>
            <div className="custom-select-options">
                {options.map((option) => (
                    <div
                        key={option.value}
                        className={`custom-select-option ${option.value === value ? 'selected' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(option.value);
                            setIsOpen(false);
                        }}
                    >
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
}
