import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Check,
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { Account, CategoryRule, Transaction } from '../types/finance';
import { formatCurrency, getCurrencyCode } from '../utils/formatters';
import { Language, getCategoryDisplayName } from '../utils/translations';
import {
  ParsedSheetData,
  ColumnMapping,
  ImportedTransactionCandidate,
  parseStatementFile,
  parseCsvText,
  autoDetectColumns,
  buildImportCandidates,
} from '../utils/bankStatementImport';

interface CsvImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: Account[];
  categories: string[];
  categoryRules?: CategoryRule[];
  existingTransactions: Transaction[];
  onImportTransactions: (newTransactions: Transaction[]) => void;
  onShowToast: (msg: string) => void;
  language?: Language;
}

export const CsvImportModal: React.FC<CsvImportModalProps> = ({
  isOpen,
  onClose,
  accounts,
  categories,
  categoryRules = [],
  existingTransactions,
  onImportTransactions,
  onShowToast,
  language = 'it',
}) => {
  const isDe = language === 'de';
  const isEn = language === 'en';

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [sheet, setSheet] = useState<ParsedSheetData | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping>({
    dateCol: 0,
    descriptionCol: 1,
    amountCol: 2,
    creditCol: -1,
    debitCol: -1,
    categoryCol: -1,
    notesCol: -1,
  });
  const [targetAccountId, setTargetAccountId] = useState<string>(accounts[0]?.id || '');
  const [categoryOverrides, setCategoryOverrides] = useState<Record<number, string>>({});
  const [selectionOverrides, setSelectionOverrides] = useState<Record<number, boolean>>({});
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [showPasteBox, setShowPasteBox] = useState(false);
  const [pastedCsvText, setPastedCsvText] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);

  const selectedAccount = useMemo(
    () => accounts.find((a) => a.id === targetAccountId || a.name === targetAccountId) || accounts[0],
    [accounts, targetAccountId]
  );

  const candidates = useMemo<ImportedTransactionCandidate[]>(() => {
    if (!sheet) return [];
    const base = buildImportCandidates({
      sheet,
      mapping,
      existingTransactions,
      categories,
      categoryRules,
    });
    return base.map((item) => ({
      ...item,
      category: categoryOverrides[item.rowIndex] || item.category,
      selected:
        selectionOverrides[item.rowIndex] !== undefined
          ? selectionOverrides[item.rowIndex]
          : skipDuplicates
            ? !item.isDuplicate
            : true,
    }));
  }, [sheet, mapping, existingTransactions, categories, categoryRules, categoryOverrides, selectionOverrides, skipDuplicates]);

  if (!isOpen) return null;

  const selectedCount = candidates.filter((c) => c.selected).length;
  const duplicateCount = candidates.filter((c) => c.isDuplicate).length;

  const loadParsedSheet = (parsed: ParsedSheetData) => {
    if (!parsed.headers.length || !parsed.rows.length) {
      setParseError(
        isDe
          ? 'Keine gültigen Datenzeilen in der Datei gefunden.'
          : isEn
            ? 'No valid data rows found in the selected file.'
            : 'Nessuna riga valida trovata nel file selezionato.'
      );
      return;
    }
    setParseError(null);
    setSheet(parsed);
    setMapping(autoDetectColumns(parsed.headers));
    setCategoryOverrides({});
    setSelectionOverrides({});
    setShowPasteBox(false);
  };

  const handleFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsReading(true);
    setParseError(null);
    try {
      const parsed = await parseStatementFile(file);
      loadParsedSheet(parsed);
    } catch (err) {
      console.error('Statement import parse error:', err);
      setParseError(
        isDe
          ? 'Fehler beim Lesen der CSV-/Excel-Datei. Prüfe das Dateiformat.'
          : isEn
            ? 'Error reading the CSV/Excel file. Please check the file format.'
            : 'Errore nella lettura del file CSV/Excel. Verifica il formato.'
      );
    } finally {
      setIsReading(false);
      e.target.value = '';
    }
  };

  const handlePasteAnalyze = () => {
    if (!pastedCsvText.trim()) return;
    const parsed = parseCsvText(pastedCsvText, 'estratto_incollato.csv');
    loadParsedSheet(parsed);
  };

  const handleReset = () => {
    setSheet(null);
    setParseError(null);
    setCategoryOverrides({});
    setSelectionOverrides({});
    setPastedCsvText('');
  };

  const handleConfirmImport = () => {
    const chosen = candidates.filter((c) => c.selected);
    if (chosen.length === 0) {
      setParseError(
        isDe
          ? 'Bitte wähle mindestens eine Buchung zum Importieren aus.'
          : isEn
            ? 'Please select at least one transaction to import.'
            : 'Seleziona almeno un movimento da importare.'
      );
      return;
    }

    const accountName = selectedAccount?.name || accounts[0]?.name || 'Conto';
    const baseTs = Date.now();
    const created: Transaction[] = chosen.map((c, idx) => ({
      id: `imp_${baseTs}_${idx}`,
      date: c.date,
      type: c.type,
      account: accountName,
      category: c.category,
      amount: c.amount,
      description: c.description,
      notes: c.notes,
      tags: c.tags,
    }));

    onImportTransactions(created);
    onShowToast(
      isDe
        ? `${created.length} Buchungen erfolgreich importiert!`
        : isEn
          ? `${created.length} transactions imported successfully!`
          : `${created.length} movimenti importati con successo!`
    );
    handleReset();
    onClose();
  };

  const currencyCode = getCurrencyCode(selectedAccount?.currency);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-end sm:items-center justify-center no-print p-0 sm:p-4">
      <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-5 shadow-2xl relative animate-slide-up max-h-[92vh] flex flex-col">
        <div className="w-12 h-1 bg-slate-700 rounded-full mx-auto mb-3 sm:hidden" />

        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3 pr-8">
          <div className="p-2.5 rounded-xl bg-teal-500/15 text-teal-400 border border-teal-500/30">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white leading-tight">
              {isDe
                ? 'Kontoauszug importieren (CSV / Excel)'
                : isEn
                  ? 'Import Bank Statement (CSV / Excel)'
                  : 'Importa Estratto Conto (CSV / Excel)'}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isDe
                ? 'Unterstützt .csv, .xlsx, .xls mit Duplikaterkennung'
                : isEn
                  ? 'Supports .csv, .xlsx, .xls with automatic duplicate check'
                  : 'Supporta .csv, .xlsx, .xls con riconoscimento automatico e anti-duplicati'}
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.tsv,.txt,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleFilePick}
        />

        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-0.5">
          {parseError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{parseError}</span>
            </div>
          )}

          {!sheet ? (
            <div className="space-y-3">
              {/* Target Account Selector */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  {isDe ? 'Zielkonto' : isEn ? 'Destination Account' : 'Conto di destinazione'}
                </label>
                <select
                  value={selectedAccount?.id || ''}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-teal-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} ({getCurrencyCode(acc.currency)})
                    </option>
                  ))}
                </select>
              </div>

              {/* Upload Card */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isReading}
                className="w-full p-6 rounded-2xl border-2 border-dashed border-teal-500/40 bg-teal-950/15 hover:bg-teal-950/30 hover:border-teal-400 transition flex flex-col items-center justify-center gap-2 text-center"
              >
                <div className="w-11 h-11 rounded-2xl bg-teal-500/20 text-teal-300 flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-white">
                  {isReading
                    ? isDe
                      ? 'Datei wird gelesen...'
                      : isEn
                        ? 'Reading file...'
                        : 'Lettura file in corso...'
                    : isDe
                      ? 'CSV- oder Excel-Datei (.xlsx / .xls) auswählen'
                      : isEn
                        ? 'Select CSV or Excel (.xlsx / .xls) file'
                        : 'Seleziona file CSV o Excel (.xlsx / .xls)'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isDe
                    ? 'Datum, Beschreibung, Betrag oder Haben/Soll werden automatisch erkannt'
                    : isEn
                      ? 'Date, description, amount or credit/debit columns are auto-detected'
                      : 'Data, descrizione, importo o Dare/Avere vengono riconosciuti in automatico'}
                </span>
              </button>

              {/* Paste CSV option (great for APK / mobile clipboard) */}
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setShowPasteBox((v) => !v)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 font-semibold flex items-center justify-center gap-2 transition"
                >
                  <ClipboardPaste className="w-4 h-4 text-cyan-400" />
                  <span>
                    {isDe
                      ? 'Oder CSV-Text direkt einfügen'
                      : isEn
                        ? 'Or paste CSV text directly'
                        : 'Oppure incolla il testo CSV direttamente'}
                  </span>
                </button>

                {showPasteBox && (
                  <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                    <textarea
                      rows={5}
                      value={pastedCsvText}
                      onChange={(e) => setPastedCsvText(e.target.value)}
                      placeholder={
                        'Data;Descrizione;Importo\n14/11/2026;Supermercato;-42,50\n10/11/2026;Stipendio;1850,00'
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                    <button
                      type="button"
                      onClick={handlePasteAnalyze}
                      disabled={!pastedCsvText.trim()}
                      className="w-full py-2 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold transition"
                    >
                      {isDe ? 'CSV analysieren' : isEn ? 'Analyze CSV' : 'Analizza CSV'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* File Summary + Account + Column Mapping */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-bold text-white truncate">
                    {sheet.fileName || 'File'} ({sheet.rows.length}{' '}
                    {isDe ? 'Zeilen' : isEn ? 'rows' : 'righe'})
                  </div>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-[11px] text-teal-400 hover:text-teal-300 font-semibold flex-shrink-0"
                  >
                    {isDe ? 'Datei ändern' : isEn ? 'Change file' : 'Cambia file'}
                  </button>
                </div>

                {/* Account & Column Selectors */}
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Zielkonto' : isEn ? 'Account' : 'Conto'}
                    </label>
                    <select
                      value={selectedAccount?.id || ''}
                      onChange={(e) => setTargetAccountId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      {accounts.map((acc) => (
                        <option key={acc.id} value={acc.id}>
                          {acc.name} ({getCurrencyCode(acc.currency)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Datumsspalte' : isEn ? 'Date column' : 'Colonna Data'}
                    </label>
                    <select
                      value={mapping.dateCol}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, dateCol: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Beschreibung' : isEn ? 'Description' : 'Descrizione'}
                    </label>
                    <select
                      value={mapping.descriptionCol}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, descriptionCol: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Betragsspalte' : isEn ? 'Amount column' : 'Colonna Importo'}
                    </label>
                    <select
                      value={mapping.amountCol}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, amountCol: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      <option value={-1}>
                        {isDe ? '-- Haben/Soll getrennt --' : isEn ? '-- Separate Credit/Debit --' : '-- Dare/Avere separati --'}
                      </option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Einnahmen (Haben)' : isEn ? 'Income (Credit)' : 'Entrate (Avere)'}
                    </label>
                    <select
                      value={mapping.creditCol}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, creditCol: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      <option value={-1}>--</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block mb-0.5">
                      {isDe ? 'Ausgaben (Soll)' : isEn ? 'Expense (Debit)' : 'Uscite (Dare)'}
                    </label>
                    <select
                      value={mapping.debitCol}
                      onChange={(e) =>
                        setMapping((m) => ({ ...m, debitCol: Number(e.target.value) }))
                      }
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-2 py-1.5 text-[11px]"
                    >
                      <option value={-1}>--</option>
                      {sheet.headers.map((h, i) => (
                        <option key={i} value={i}>
                          {h}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Duplicate toggle */}
                <label className="flex items-center justify-between pt-1 text-[11px] text-slate-300 cursor-pointer">
                  <span>
                    {isDe
                      ? `Duplikate automatisch überspringen (${duplicateCount} erkannt)`
                      : isEn
                        ? `Skip detected duplicates automatically (${duplicateCount} found)`
                        : `Salta automaticamente i duplicati (${duplicateCount} rilevati)`}
                  </span>
                  <input
                    type="checkbox"
                    checked={skipDuplicates}
                    onChange={(e) => {
                      setSkipDuplicates(e.target.checked);
                      setSelectionOverrides({});
                    }}
                    className="accent-teal-500 w-4 h-4"
                  />
                </label>
              </div>

              {/* Preview List */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between px-1 text-[11px] font-semibold text-slate-300">
                  <span>
                    {isDe
                      ? `Erkannte Buchungen (${candidates.length})`
                      : isEn
                        ? `Detected Transactions (${candidates.length})`
                        : `Movimenti rilevati (${candidates.length})`}
                  </span>
                  <span className="text-teal-400">
                    {selectedCount} {isDe ? 'ausgewählt' : isEn ? 'selected' : 'selezionati'}
                  </span>
                </div>

                {candidates.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center text-xs text-slate-400">
                    {isDe
                      ? 'Keine gültigen Buchungen mit dieser Spaltenzuordnung erkannt. Bitte passe Datum/Betrag an.'
                      : isEn
                        ? 'No valid transactions matched this column mapping. Try adjusting Date/Amount columns.'
                        : 'Nessun movimento valido riconosciuto con queste colonne. Controlla la mappatura Data/Importo.'}
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-60 overflow-y-auto no-scrollbar pr-0.5">
                    {candidates.map((c) => (
                      <div
                        key={c.rowIndex}
                        className={`p-2.5 rounded-xl border text-xs transition ${
                          c.selected
                            ? 'bg-slate-950 border-slate-700'
                            : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setSelectionOverrides((prev) => ({
                                ...prev,
                                [c.rowIndex]: !c.selected,
                              }))
                            }
                            className={`mt-0.5 w-4 h-4 rounded flex items-center justify-center border flex-shrink-0 ${
                              c.selected
                                ? 'bg-teal-600 border-teal-500 text-white'
                                : 'bg-slate-900 border-slate-700 text-transparent'
                            }`}
                          >
                            <Check className="w-3 h-3" />
                          </button>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white truncate">
                                {c.description}
                              </span>
                              <span
                                className={`font-bold flex items-center gap-0.5 flex-shrink-0 ${
                                  c.type === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {c.type === 'INCOME' ? (
                                  <ArrowDownLeft className="w-3 h-3" />
                                ) : (
                                  <ArrowUpRight className="w-3 h-3" />
                                )}
                                {c.type === 'INCOME' ? '+' : '-'}
                                {formatCurrency(c.amount, true, currencyCode)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 mt-1.5">
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                                <span className="font-mono">{c.date}</span>
                                {c.isDuplicate && (
                                  <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold">
                                    {isDe ? 'Duplikat' : isEn ? 'Duplicate' : 'Duplicato'}
                                  </span>
                                )}
                              </div>

                              <select
                                value={c.category}
                                onChange={(e) =>
                                  setCategoryOverrides((prev) => ({
                                    ...prev,
                                    [c.rowIndex]: e.target.value,
                                  }))
                                }
                                className="bg-slate-900 border border-slate-800 text-indigo-300 rounded-lg px-2 py-0.5 text-[10px] font-medium max-w-[140px]"
                              >
                                {categories.map((cat) => (
                                  <option key={cat} value={cat}>
                                    {getCategoryDisplayName(cat, language)}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 mt-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            {isDe ? 'Abbrechen' : isEn ? 'Cancel' : 'Annulla'}
          </button>
          {sheet && (
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={selectedCount === 0}
              className="flex-1 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-lg transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isDe
                  ? `${selectedCount} Buchungen importieren`
                  : isEn
                    ? `Import ${selectedCount} Transactions`
                    : `Importa ${selectedCount} Movimenti`}
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
