import React from 'react';

export default function RadiusSelector({ radiusKm, onChange }) {
    return (
        <div className="radius-selector">
            <label>Search radius</label>

            <select
                value={radiusKm}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                <option value={1}>Within 1 km</option>
                <option value={2}>Within 2 km</option>
                <option value={5}>Within 5 km</option>
            </select>
        </div>
    );
}
