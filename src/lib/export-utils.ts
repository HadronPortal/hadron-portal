import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportColumn {
  header: string;
  accessor: (row: any) => string | number;
  align?: 'left' | 'right' | 'center';
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
      const val = c.accessor(row);
      return `"${String(val ?? '').replace(/"/g, '""')}"`;
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

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}
