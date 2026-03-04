import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ExcelRCEFWithLackings = () => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('RCEF With Lackings');

    // 1. DEFINE ALL 13 COLUMNS (A through M)
    worksheet.columns = [
      { key: 'mun', width: 18 },          // A: MUN.
      { key: 'no', width: 6 },            // B: No.
      { key: 'name', width: 55 },         // C: NAME OF FCA
      { key: 'total', width: 12 },        // D: TOTAL NO. OF MEMBERS
      { key: 'area', width: 12 },         // E: Area (ha)
      { key: 'address', width: 25 },      // F: ADDRESS
      { key: 'head', width: 25 },         // G: HEAD OF ORGANIZATION
      { key: 'contactNo', width: 15 },    // H: CONTACT NO.
      { key: 'dateRec', width: 15 },      // I: DATE RECEIVED
      { key: 'program', width: 15 },      // J: RCEF PROGRAM
      { key: 'intervention', width: 22 }, // K: TYPE OF INTERVENTION
      { key: 'status', width: 15 },       // L: STATUS
      { key: 'remarks', width: 20 },      // M: REMARKS
    ];

    // 2. TOP TITLE ROWS WITH LEGEND
    const titleRows = [
      ['LIST OF FARMERS COOPERATIVE/ASSOCIATION WITH LACKING DOCUMENTS'],
      ['REGION: MIMAROPA'],
      ['Legend: Note: * No Letter of Intent, ** No Endorsement Letter, *** No OSS, **** No copy of reg. ***** Farmers Profile (Area)'],
      [''] // Blank row for spacing
    ];

    titleRows.forEach((val, index) => {
      const rowNum = index + 1;
      worksheet.getRow(rowNum).values = val;
      // Merge across all 13 columns (A to M)
      worksheet.mergeCells(`A${rowNum}:M${rowNum}`);
      const cell = worksheet.getCell(`A${rowNum}`);
      
      // Default formatting
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.font = { name: 'Times New Roman', size: 11, bold: true };
      
      // Make "MIMAROPA" text red
      if (rowNum === 2) {
        cell.value = {
          richText: [
            { font: { name: 'Times New Roman', bold: true }, text: 'REGION: ' },
            { font: { name: 'Times New Roman', color: { argb: 'FFFF0000' }, bold: true }, text: 'MIMAROPA' }
          ]
        };
      }

      // Style the Legend row (Left aligned, italic)
      if (rowNum === 3) {
         cell.alignment = { horizontal: 'left', vertical: 'middle' };
         cell.font = { name: 'Times New Roman', size: 10, italic: true }; 
         // Bold just the "Legend:" word
         cell.value = {
            richText: [
              { font: { name: 'Times New Roman', size: 10, bold: true, italic: true }, text: 'Legend: ' },
              { font: { name: 'Times New Roman', size: 10, italic: true }, text: 'Note: * No Letter of Intent, ** No Endorsement Letter, *** No OSS, **** No copy of reg. ***** Farmers Profile (Area)' }
            ]
         }
      }
    });

    // 3. TABLE HEADERS (MOVED DOWN TO ROW 5)
    const headerRow = worksheet.getRow(5);
    headerRow.values = [
      'MUN.', 'No.', 'NAME OF FCA', 'TOTAL NO.\nOF\nMEMBERS', 'Area (ha)', 'ADDRESS', 
      'HEAD OF ORGANIZATION', 'CONTACT NO.', 'DATE\nRECEIVED', 'RCEF\nPROGRAM', 
      'TYPE OF\nINTERVENTION', 'STATUS', 'REMARKS'
    ];
    
    headerRow.height = 45; // Taller to accommodate the stacked/wrapped text in your screenshot

    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFF00' } }; // Yellow
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.font = { bold: true, size: 9, name: 'Times New Roman' };
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
    });

    // 4. HELPER FUNCTION FOR PROVINCE ROW
    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:M${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Green
        cell.font = { bold: true, name: 'Times New Roman' };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    // 5. DATA ROWS
    addProvinceRow('PALAWAN');

    // Mapped precisely to the 13 columns
    const data = [
      ['Aborlan', 1, 'Sitio Communal MPC ****, *****', 87, '', 'Brgy. Iraan', 'Meriam Marquez', '9474179547', '11/15/2019', 'seeds', 'Philrice', '', ''],
      ['', 2, "Barangay Apo-Aporawan Farmer's Association (BAFA) *****", '', '', 'Brgy. Apo-Aporawan', 'Mervin C. Magbanua', '', '5/12/2021', 'Machineries', 'Philmech', '', '']
      // Add more rows here...
    ];

    data.forEach(item => {
      const row = worksheet.addRow(item);
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true }; 
        
        // Style the Municipality name in Column 1 (make it bold and italic like "Aborlan" in the screenshot)
        if (colNumber === 1 && cell.value) {
           cell.font = { name: 'Times New Roman', size: 10, bold: true, italic: true };
           cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
      // Center align specific columns like Numbers, Totals, Dates
      [2, 4, 5, 8, 9, 10, 11, 12].forEach(col => {
         const cell = row.getCell(col);
         if(cell) cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
    });

    // 6. GENERATE AND SAVE
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'RCEF_With_Lackings.xlsx');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={exportToExcel}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#ffc107', // Warning yellow for "Lacking"
          color: '#000', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'Times New Roman'
        }}
      >
        Export RCEF With Lackings
      </button>
    </div>
  );
};

export default ExcelRCEFWithLackings;