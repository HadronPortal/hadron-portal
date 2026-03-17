import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { fetchWithAuth } from '@/lib/auth-refresh';

const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
const BASE = `https://${projectId}.supabase.co/functions/v1`;

interface ExportColumn {
  header: string;
  accessor: (row: any) => string | number;
  align?: 'left' | 'right' | 'center';
  forceText?: boolean; // Forces text format in CSV (prevents Excel scientific notation)
}

interface ExportOptions {
  title: string;
  columns: ExportColumn[];
  data: any[];
  fileName: string;
}

export function exportCSV({ columns, data, fileName }: ExportOptions) {
  const sep = ';';
  const header = columns.map(c => `"${c.header}"`).join(sep);
  const rows = data.map(row =>
    columns.map(c => {
      const val = String(c.accessor(row) ?? '').replace(/"/g, '""');
      // Prefix with = and wrap in quotes to force Excel text format for long numeric strings
      if (c.forceText && val && /^\d{8,}$/.test(val)) {
        return `="${val}"`;
      }
      return `"${val}"`;
    }).join(sep)
  );
  const bom = '\uFEFF';
  const csv = bom + [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${fileName}.csv`);
}

export function exportPDF({ title, columns, data, fileName }: ExportOptions) {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });

  doc.setFontSize(14);
  doc.text(title, 14, 15);
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 14, 21);

  const head = [columns.map(c => c.header)];
  const body = data.map(row => columns.map(c => String(c.accessor(row) ?? '')));

  autoTable(doc, {
    startY: 26,
    head,
    body,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [41, 55, 74], textColor: 255, fontStyle: 'bold', fontSize: 7 },
    alternateRowStyles: { fillColor: [245, 247, 250] },
    columnStyles: columns.reduce((acc, col, i) => {
      if (col.align === 'right') acc[i] = { halign: 'right' };
      return acc;
    }, {} as Record<number, any>),
  });

  doc.save(`${fileName}.pdf`);
}

/**
 * Fetches ALL pages from an API endpoint for full export.
 * Returns the complete array of records.
 */
export async function fetchAllForExport(
  endpoint: string,
  params: Record<string, string>,
  dataKey: string, // e.g. 'clients' or 'orders'
): Promise<any[]> {
  const pageSize = 200;
  let currentPage = 1;
  let allData: any[] = [];
  let hasMore = true;

  while (hasMore) {
    const url = new URL(`${BASE}/${endpoint}`);
    Object.entries({ ...params, page: String(currentPage), limit: String(pageSize) }).forEach(([k, v]) => {
      if (v) url.searchParams.set(k, v);
    });

    const res = await fetchWithAuth(url.toString());
    if (!res.ok) throw new Error(`Erro ${res.status}`);
    const json = await res.json();

    const records = json[dataKey] || json.data || [];
    allData = allData.concat(records);

    const total = json.total_records || json.total || 0;
    if (allData.length >= total || records.length < pageSize) {
      hasMore = false;
    } else {
      currentPage++;
    }
  }

  return allData;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
