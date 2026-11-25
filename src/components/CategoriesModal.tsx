import React, { useState, useEffect, useRef } from 'react';
import { Tags, Pencil, Trash2, X, Palette, Check } from 'lucide-react';
import {
  CategoryIcon,
  CATEGORY_ICON_OPTIONS,
  CATEGORY_COLOR_OPTIONS,
  getCategoryDefaultIcon,
  getCategoryDefaultColor,
  getSavedCategoryIcons,
  getSavedCategoryColors,
  saveCategoryIcon,
  saveCategoryColor,
  deleteCategoryIconAndColor,
  getCategoryColorDetails,
} from './CategoryIcon';
import { Language, Translations, getCategoryDisplayName } from '../utils/translations';

interface CategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  onAddCategory: (name: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (name: string) => void;
  onCategoryIconChange?: () => void;
  language?: Language;
  t?: Translations;
}

export const CategoriesModal: React.FC<CategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onRenameCategory,
  onDeleteCategory,
  onCategoryIconChange,
  language = 'it',
  t,
}) => {
  const [editingOldName, setEditingOldName] = useState<string | null>(null);
  const [inputVal, setInputVal] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shopping-cart');
  const [selectedColor, setSelectedColor] = useState('purple');
  const [activeGroup, setActiveGroup] = useState<string>('Tutte');
  const [iconsMap, setIconsMap] = useState<Record<string, string>>({});
  const [colorsMap, setColorsMap] = useState<Record<string, string>>({});
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setIconsMap(getSavedCategoryIcons());
      setColorsMap(getSavedCategoryColors());
    } else {
      setEditingOldName(null);
      setInputVal('');
      setSelectedIcon('shopping-cart');
      setSelectedColor('purple');
      setActiveGroup('Tutte');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const resetForm = () => {
    setEditingOldName(null);
    setInputVal('');
    setSelectedIcon('shopping-cart');
    setSelectedColor('purple');
  };

  const handleStartEdit = (cat: string) => {
    setEditingOldName(cat);
    setInputVal(cat);
    const existingIcon = iconsMap[cat] || getCategoryDefaultIcon(cat);
    setSelectedIcon(existingIcon);
    const existingColor = colorsMap[cat] || getCategoryDefaultColor(cat);
    setSelectedColor(existingColor);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setTimeout(() => {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }, 60);
  };

  const handleNameChange = (val: string) => {
    setInputVal(val);
    // Suggerimento automatico di icona e colore basato sul testo digitato (se non stiamo modificando)
    if (!editingOldName) {
      const suggestedIcon = getCategoryDefaultIcon(val);
      if (suggestedIcon) {
        setSelectedIcon(suggestedIcon);
      }
      const suggestedColor = getCategoryDefaultColor(val);
      if (suggestedColor) {
        setSelectedColor(suggestedColor);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    if (editingOldName) {
      const renamed = editingOldName !== trimmed;
      if (renamed) {
        onRenameCategory(editingOldName, trimmed);
        deleteCategoryIconAndColor(editingOldName);
      }
      saveCategoryIcon(trimmed, selectedIcon);
      saveCategoryColor(trimmed, selectedColor);
      setIconsMap(getSavedCategoryIcons());
      setColorsMap(getSavedCategoryColors());
      if (!renamed) {
        onCategoryIconChange?.();
      }
    } else {
      const existingMatch = categories.find(
        (c) => c.trim().toLowerCase() === trimmed.toLowerCase()
      );
      const targetName = existingMatch || trimmed;
      if (!existingMatch) {
        onAddCategory(targetName);
      }
      saveCategoryIcon(targetName, selectedIcon);
      saveCategoryColor(targetName, selectedColor);
      setIconsMap(getSavedCategoryIcons());
      setColorsMap(getSavedCategoryColors());
      if (existingMatch) {
        onCategoryIconChange?.();
      }
    }

    resetForm();
  };

  const handleDelete = (cat: string) => {
    if (editingOldName === cat) {
      resetForm();
    }
    onDeleteCategory(cat);
    deleteCategoryIconAndColor(cat);
    setIconsMap(getSavedCategoryIcons());
    setColorsMap(getSavedCategoryColors());
  };

  const groups = [
    { id: 'Tutte', label: language === 'de' ? 'Alle' : language === 'en' ? 'All' : 'Tutte' },
    { id: 'Quotidiano', label: language === 'de' ? 'Alltag' : language === 'en' ? 'Daily' : 'Quotidiano' },
    { id: 'Casa & Utenze', label: language === 'de' ? 'Haus & Nebenkosten' : language === 'en' ? 'Home & Bills' : 'Casa & Utenze' },
    { id: 'Trasporti', label: language === 'de' ? 'Transport' : language === 'en' ? 'Transport' : 'Trasporti' },
    { id: 'Svago', label: language === 'de' ? 'Freizeit' : language === 'en' ? 'Leisure' : 'Svago' },
    { id: 'Lavoro & Finanza', label: language === 'de' ? 'Arbeit & Finanzen' : language === 'en' ? 'Work & Finance' : 'Lavoro & Finanza' },
  ];

  const filteredIcons = CATEGORY_ICON_OPTIONS.filter((opt) => {
    if (activeGroup === 'Tutte') return true;
    return opt.group === activeGroup;
  });

  const selectedIconObj = CATEGORY_ICON_OPTIONS.find((o) => o.id === selectedIcon);
  const selectedColorObj = getCategoryColorDetails(selectedColor);

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center no-print">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-3xl max-w-md w-full p-5 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Tags className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-tight">
                {language === 'de'
                  ? 'Ausgaben- & Einnahmenkategorien'
                  : language === 'en'
                  ? 'Expense & Income Categories'
                  : 'Categorie Spesa & Entrata'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {language === 'de'
                  ? 'Name, Symbol und Farbe für jede Kategorie anpassen'
                  : language === 'en'
                  ? 'Customize name, icon, and color for each category'
                  : 'Personalizza nome, icona grafica e colore per ogni categoria'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollContainerRef} className="overflow-y-auto no-scrollbar py-3 space-y-4 flex-1">
          {/* Form Inserimento / Modifica Categoria */}
          <form
            onSubmit={handleSubmit}
            className={`space-y-3.5 bg-slate-950 p-3.5 rounded-2xl border transition ${
              editingOldName
                ? 'border-purple-500/70 ring-1 ring-purple-500/30'
                : 'border-slate-800'
            }`}
          >
            {editingOldName && (
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <span className="text-[11px] font-bold text-purple-300 flex items-center gap-1.5 truncate">
                  <Pencil className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">
                    {language === 'de'
                      ? `Kategorie bearbeiten: ${getCategoryDisplayName(editingOldName, language)}`
                      : language === 'en'
                        ? `Editing category: ${getCategoryDisplayName(editingOldName, language)}`
                        : `Modifica categoria: ${editingOldName}`}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-[11px] text-slate-400 hover:text-white font-semibold flex-shrink-0"
                >
                  {t?.cancel || (language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Annulla')}
                </button>
              </div>
            )}

            {/* Anteprima Live Categoria */}
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div
                  className={`p-2.5 rounded-xl ${selectedColorObj.bgLight} ${selectedColorObj.textColor} border ${selectedColorObj.borderColor} flex items-center justify-center shadow-sm`}
                >
                  <CategoryIcon iconName={selectedIcon} className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white truncate max-w-[200px]">
                    {inputVal.trim() ||
                      (language === 'de'
                        ? 'Neue Kategorie'
                        : language === 'en'
                          ? 'New Category Name'
                          : 'Nome Nuova Categoria')}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span>{language === 'de' ? 'Symbol' : language === 'en' ? 'Icon' : 'Icona'}: <strong className="text-slate-200">{selectedIconObj?.label || selectedIcon}</strong></span>
                    <span>•</span>
                    <span>{language === 'de' ? 'Farbe' : language === 'en' ? 'Color' : 'Colore'}: <strong className={selectedColorObj.textColor}>{selectedColorObj.label}</strong></span>
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-semibold px-2 py-0.5 rounded-lg border border-slate-700">
                {language === 'de' ? 'Vorschau' : language === 'en' ? 'Preview' : 'Anteprima'}
              </span>
            </div>

            {/* Input Nome Categoria */}
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                {language === 'de' ? 'Kategoriename' : language === 'en' ? 'Category Name' : 'Nome Categoria'}
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={inputVal}
                onChange={(e) => handleNameChange(e.target.value)}
                required
                placeholder={language === 'de' ? 'z. B. Restaurants, Tanken, Fitness, Rechnungen...' : language === 'en' ? 'e.g. Restaurants, Fuel, Gym, Utilities...' : 'es. Ristoranti, Benzina, Palestra, Bollette...'}
                className="w-full select-text bg-slate-900 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Selezione Colore Categoria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>{language === 'de' ? 'Kategoriefarbe wählen' : language === 'en' ? 'Choose Category Color' : 'Scegli Colore Categoria'}</span>
                </label>
                <span className={`text-[11px] font-bold ${selectedColorObj.textColor}`}>
                  {selectedColorObj.label}
                </span>
              </div>

              {/* Palette cromatica a 12 tonalità */}
              <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800">
                {CATEGORY_COLOR_OPTIONS.map((c) => {
                  const isSelected = selectedColor === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setSelectedColor(c.id)}
                      title={c.label}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all ${c.preview} ${
                        isSelected
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-lg'
                          : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`}
                    >
                      {isSelected && <Check className="w-4 h-4 text-white stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Griglia Selezione Icona Categoria */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  {language === 'de' ? 'Symbol für die Kategorie wählen' : language === 'en' ? 'Choose Category Icon' : 'Scegli Icona per la Categoria'}
                </label>
                <span className="text-[10px] text-purple-400 font-medium truncate max-w-[150px]">
                  {selectedIconObj?.label}
                </span>
              </div>

              {/* Filtro Gruppi */}
              <div className="flex gap-1 overflow-x-auto no-scrollbar pb-1.5 mb-1">
                {groups.map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setActiveGroup(grp.id)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-medium whitespace-nowrap transition ${
                      activeGroup === grp.id
                        ? 'bg-purple-600 text-white font-bold'
                        : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {grp.label}
                  </button>
                ))}
              </div>

              {/* Icon Buttons Grid */}
              <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 p-2 bg-slate-900/90 rounded-xl border border-slate-800 max-h-36 overflow-y-auto no-scrollbar">
                {filteredIcons.map((opt) => {
                  const isSelected = selectedIcon === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedIcon(opt.id)}
                      title={opt.label}
                      className={`p-2 rounded-xl flex items-center justify-center transition-all ${
                        isSelected
                          ? `${selectedColorObj.bgLight} ${selectedColorObj.textColor} border ${selectedColorObj.borderColor} shadow-md ring-2 ring-purple-400 scale-105`
                          : 'bg-slate-950 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/60'
                      }`}
                    >
                      <CategoryIcon iconName={opt.id} className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Azioni Form */}
            <div className="flex gap-2 pt-1">
              {editingOldName && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2.5 rounded-xl text-xs font-semibold transition"
                >
                  {t?.cancel || (language === 'de' ? 'Abbrechen' : language === 'en' ? 'Cancel' : 'Annulla')}
                </button>
              )}
              <button
                type="submit"
                className="flex-1 bg-purple-600 hover:bg-purple-500 text-white py-2.5 rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30 active:scale-98"
              >
                {editingOldName
                  ? language === 'de'
                    ? 'Kategorieänderungen speichern'
                    : language === 'en'
                    ? 'Save Category Changes'
                    : 'Salva Modifiche Categoria'
                  : language === 'de'
                  ? '+ Neue Kategorie hinzufügen'
                  : language === 'en'
                  ? '+ Add New Category'
                  : '+ Aggiungi Nuova Categoria'}
              </button>
            </div>
          </form>

          {/* Elenco Categorie Esistenti con Icona e Colore */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              {language === 'de'
                ? `Verfügbare Kategorien (${categories.length})`
                : language === 'en'
                ? `Available Categories (${categories.length})`
                : `Categorie Disponibili (${categories.length})`}
            </span>
            <div className="space-y-1.5">
              {categories.map((cat) => {
                const catIcon = iconsMap[cat] || getCategoryDefaultIcon(cat);
                const catColorDetails = getCategoryColorDetails(colorsMap[cat] || cat);
                const displayName = getCategoryDisplayName(cat, language);
                const isBeingEdited = editingOldName === cat;

                return (
                  <div
                    key={cat}
                    className={`flex justify-between items-center p-2.5 rounded-xl border text-xs transition ${
                      isBeingEdited
                        ? 'bg-purple-950/40 border-purple-500/60'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleStartEdit(cat)}
                      className="flex items-center space-x-2.5 min-w-0 flex-1 text-left group"
                      title={language === 'de' ? 'Tippen zum Bearbeiten' : language === 'en' ? 'Tap to edit' : 'Tocca per modificare'}
                    >
                      <div
                        className={`p-2 rounded-xl ${catColorDetails.bgLight} ${catColorDetails.textColor} border ${catColorDetails.borderColor} flex items-center justify-center flex-shrink-0`}
                      >
                        <CategoryIcon iconName={catIcon} categoryName={cat} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-slate-100 font-bold block truncate group-hover:text-purple-300 transition">
                          {displayName}
                          {displayName !== cat && (
                            <span className="text-[10px] font-normal text-slate-500 ml-1.5">({cat})</span>
                          )}
                        </span>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1.5 font-mono truncate">
                          <span>{language === 'de' ? 'Symbol' : language === 'en' ? 'icon' : 'icona'}: {catIcon}</span>
                          <span>•</span>
                          <span className={catColorDetails.textColor}>{language === 'de' ? 'Farbe' : language === 'en' ? 'color' : 'colore'}: {catColorDetails.label}</span>
                        </div>
                      </div>
                    </button>
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleStartEdit(cat)}
                        className={`min-w-[36px] min-h-[36px] rounded-lg flex items-center justify-center transition ${
                          isBeingEdited
                            ? 'text-purple-300 bg-purple-500/20'
                            : 'text-slate-400 hover:text-purple-400 hover:bg-slate-900'
                        }`}
                        title={t?.edit || 'Modifica nome, icona o colore'}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(cat)}
                        className="min-w-[36px] min-h-[36px] text-slate-500 hover:text-rose-400 rounded-lg hover:bg-slate-900 flex items-center justify-center transition"
                        title={t?.delete || 'Elimina categoria'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 text-right">
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-3 py-1 font-semibold"
          >
            {t?.close || 'Chiudi'}
          </button>
        </div>
      </div>
    </div>
  );
};

