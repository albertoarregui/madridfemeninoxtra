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
    const triggerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const selectedOption = options.find(opt => opt.value === value) || options[0];

    useEffect(() => {
        const toggleHandler = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();
            setIsOpen(prev => !prev);
        };

        const trigger = triggerRef.current;
        if (trigger) {
            trigger.addEventListener('click', toggleHandler);
            // Also handle touch specifically for some browsers
            trigger.addEventListener('touchend', toggleHandler, { passive: false });
        }

        return () => {
            if (trigger) {
                trigger.removeEventListener('click', toggleHandler);
                trigger.removeEventListener('touchend', toggleHandler);
            }
        };
    }, []);

    const toggle = (e: React.MouseEvent | React.TouchEvent) => {
        // Disabling React toggle in favor of native one above
    };

    return (
        <div
            className={`custom-select-container ${isOpen ? 'open' : ''}`}
            id={id}
            ref={containerRef}
            onClick={(e) => e.stopPropagation()}
        >
            <div 
                className="custom-select-trigger" 
                ref={triggerRef}
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
