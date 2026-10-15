import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

/**
 * FilterPopover Component
 * Reusable slicer/filter dropdown popover matching the design:
 * - Can be rendered as a sleek `.filter-param-box` (with icon, label, and value)
 *   OR as a compact button trigger (`.filter-dropdown-btn`)
 * - Blue header with "Select All" checkbox and title
 * - "Ketik untuk menelusuri" search input
 * - Checkable list with item label and "Hanya" selection button
 */
export default function FilterPopover({
  title,
  items = [],
  selectedValues = [],
  onChange,
  triggerLabel,
  icon = null,
  label = null,
  displayValue = null,
  isBoxTrigger = false,
  align = 'left',
  width = 270,
  containerStyle = {}
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const popoverRef = useRef(null);

  // Normalize items to { value, label }
  const normalizedItems = items.map(item => {
    if (typeof item === 'string') {
      return { value: item, label: item };
    }
    return item;
  });

  // Filter items by search query
  const filteredItems = normalizedItems.filter(item =>
    item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.value && String(item.value).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Clean selected values without dummy 'Semua' / 'all'
  const cleanSelected = selectedValues.filter(v => v !== 'Semua' && v !== 'all');

  // Check if all visible items are selected
  const allSelected =
    filteredItems.length > 0 &&
    filteredItems.every(item => cleanSelected.includes(item.value));

  const isIndeterminate =
    !allSelected &&
    filteredItems.some(item => cleanSelected.includes(item.value));

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Select item and close popover immediately
  const handleSelectItem = (value) => {
    onChange([value]);
    setIsOpen(false);
  };

  // Toggle single item
  const handleToggleItem = (e, value) => {
    e.stopPropagation();
    if (cleanSelected.includes(value)) {
      if (cleanSelected.length > 1) {
        onChange(cleanSelected.filter(v => v !== value));
      } else {
        onChange([]);
      }
    } else {
      onChange([...cleanSelected, value]);
    }
  };

  // Select ONLY this item and close immediately
  const handleSelectOnly = (e, value) => {
    e.stopPropagation();
    onChange([value]);
    setIsOpen(false);
  };

  // Toggle select all
  const handleToggleSelectAll = (e) => {
    e.stopPropagation();
    if (allSelected) {
      // Deselect all visible
      const visibleVals = filteredItems.map(i => i.value);
      onChange(cleanSelected.filter(v => !visibleVals.includes(v)));
    } else {
      // Select all visible without dummy 'Semua'
      const newVals = Array.from(new Set(filteredItems.map(i => i.value)));
      onChange(newVals);
    }
  };

  // Display label for box value
  const getBoxValueText = () => {
    if (displayValue !== null && displayValue !== undefined) {
      return displayValue;
    }
    const cleanLabel = label || title?.replace(/^PILIH\s+/i, '') || '';
    const isAll =
      selectedValues.length === 0 ||
      (normalizedItems.length > 0 && selectedValues.length === normalizedItems.length);
    if (isAll) {
      return cleanLabel ? `Semua ${cleanLabel}` : 'Semua';
    }
    if (selectedValues.length === 1) {
      const found = normalizedItems.find(i => i.value === selectedValues[0]);
      return found ? found.label : selectedValues[0];
    }
    return `${selectedValues.length} Terpilih`;
  };

  // Display label for button showing selected values
  const getButtonText = () => {
    const cleanTitle = (triggerLabel || label || title?.replace(/^PILIH\s+/i, '') || '').toUpperCase();
    const isAll =
      selectedValues.length === 0 ||
      (normalizedItems.length > 0 && selectedValues.length === normalizedItems.length);
    if (isAll) {
      return `${cleanTitle}: SEMUA`;
    }
    if (selectedValues.length === 1) {
      const found = normalizedItems.find(i => i.value === selectedValues[0]);
      const itemLabel = found ? found.label : selectedValues[0];
      return `${cleanTitle}: ${itemLabel}`;
    }
    return `${cleanTitle}: (${selectedValues.length}) DIPILIH`;
  };

  const hasSelectedValue = selectedValues.length > 0;
  const useBoxStyle = isBoxTrigger || Boolean(icon || label);

  return (
    <div
      className="filter-popover-container"
      ref={popoverRef}
      style={{
        position: 'relative',
        width: '100%',
        zIndex: isOpen ? 1000 : 1,
        ...containerStyle
      }}
    >
      {/* Trigger 1: Sleek Box Parameter (Icon, Label, Value, Chevron) */}
      {useBoxStyle ? (
        <div
          className={`filter-param-box ${isOpen ? 'active' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          style={{
            cursor: 'pointer',
            userSelect: 'none',
            border: isOpen ? '1px solid #00d2ff' : undefined,
            boxShadow: isOpen ? '0 0 12px rgba(0, 210, 255, 0.35)' : undefined
          }}
        >
          <div className="filter-param-box-left">
            {icon}
            <div className="filter-param-box-texts">
              <span className="filter-param-box-label">{label || title}</span>
              <span className="filter-param-box-value" title={String(getBoxValueText())}>
                {getBoxValueText()}
              </span>
            </div>
          </div>
          <ChevronDown
            size={14}
            color={isOpen ? '#00d2ff' : '#8CC1E9'}
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
              flexShrink: 0
            }}
          />
        </div>
      ) : (
        /* Trigger 2: Standard/Compact Dropdown Button */
        <button
          type="button"
          className={`filter-dropdown-btn ${isOpen ? 'active' : ''} ${hasSelectedValue ? 'has-value' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          style={{ width: '100%' }}
          title={getButtonText()}
        >
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginRight: 6 }}>
            {getButtonText()}
          </span>
          <ChevronDown
            size={14}
            style={{
              flexShrink: 0,
              opacity: 0.8,
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}
          />
        </button>
      )}

      {/* Popover Dropdown Card */}
      {isOpen && (
        <div
          className="filter-popover-card"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            width: width,
            minWidth: 260,
            zIndex: 9999
          }}
        >
          {/* Header with blue background */}
          <div className="filter-popover-header" onClick={handleToggleSelectAll}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <input
                type="checkbox"
                checked={allSelected}
                ref={el => {
                  if (el) el.indeterminate = isIndeterminate;
                }}
                onChange={handleToggleSelectAll}
                onClick={e => e.stopPropagation()}
                className="filter-popover-checkbox"
                style={{ cursor: 'pointer', width: 16, height: 16 }}
              />
              <span className="filter-popover-title">{title || label || 'PILIH'}</span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="filter-popover-search-wrap">
            <input
              type="text"
              className="filter-popover-search-input"
              placeholder="Ketik untuk menelusuri..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
          </div>

          {/* Item List */}
          <div className="filter-popover-list">
            {filteredItems.length === 0 ? (
              <div className="filter-popover-empty">Tidak ada data ditemukan</div>
            ) : (
              filteredItems.map(item => {
                const isChecked = selectedValues.includes(item.value);
                const isSemua =
                  item.value === 'Semua' ||
                  item.value === 'all' ||
                  (typeof item.label === 'string' && item.label.toLowerCase().startsWith('semua'));
                return (
                  <div
                    key={item.value}
                    className={`filter-popover-item ${isChecked ? 'selected' : ''}`}
                    onClick={() => handleSelectItem(item.value)}
                  >
                    <div className="filter-popover-item-left">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleToggleItem(e, item.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="filter-popover-checkbox"
                        style={{ cursor: 'pointer', width: 16, height: 16 }}
                      />
                      <span className={`filter-popover-label ${isChecked ? 'active' : ''}`}>
                        {item.label}
                      </span>
                    </div>

                    {/* Blue "Hanya" button (hidden on 'Semua' options) */}
                    {!isSemua && (
                      <button
                        type="button"
                        className="filter-popover-hanya-btn"
                        onClick={(e) => handleSelectOnly(e, item.value)}
                        title={`Pilih hanya ${item.label}`}
                      >
                        Hanya
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
