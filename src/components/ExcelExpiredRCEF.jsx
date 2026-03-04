import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ExcelExpiredRCEF = () => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expired FCA');

    worksheet.columns = [
      { key: 'prov', width: 18 },         
      { key: 'no', width: 6 },            // B: No.
      { key: 'name', width: 45 },         // C: NAME OF FCA
      { key: 'dateApp', width: 15 },      // D: DATE OF APPLICATION RECEIVED
      { key: 'dateRec', width: 15 },      // E: DATE RECEIVED
      { key: 'dateExp', width: 15 },      // F: DATE OF EXPIRATION
      { key: 'type', width: 22 },         // G: *TYPE OF FCA
      { key: 'total', width: 12 },        // H: TOTAL NO. OF MEMBERS
      { key: 'area', width: 12 },         // I: AREA (ha) COVERED
      { key: 'address', width: 25 },      // J: ADDRESS
      { key: 'contactPerson', width: 20 },// K: CONTACT PERSON
      { key: 'contactNo', width: 15 },    // L: CONTACT NO.
      { key: 'seeds', width: 8 },         // M: SEEDS
      { key: 'mech', width: 8 },          // N: MECH.
      { key: 'credit', width: 8 },        // O: CREDIT
      { key: 'extn', width: 8 },          // P: EXTN.
      { key: 'remarks', width: 15 },      // Q: REMARKS
    ];

    // 2. TOP TITLE ROWS (Rows 1 to 3)
    const titleRows = [
      ['LIST OF FARMERS COOPERATIVE/ASSOCIATION ACCREDITED UNDER RCEF'],
      ['REGION: MIMAROPA'],
      [''] // Blank row for spacing
    ];

    titleRows.forEach((val, index) => {
      const rowNum = index + 1;
      worksheet.getRow(rowNum).values = val;
      // Merge across all 17 columns (A to Q)
      worksheet.mergeCells(`A${rowNum}:Q${rowNum}`);
      const cell = worksheet.getCell(`A${rowNum}`);
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
    });

    // 3. TABLE HEADERS (ROWS 4 & 5)
    const headerColor = 'FFFFFF00'; // Yellow
    
    // Row 4 Headers
    worksheet.getRow(4).values = [
      'PROV./CITIES/MUN.', 'No.', 'NAME OF FCA', 'DATE OF APPLICATION RECEIVED', 'DATE RECEIVED', 
      'DATE OF EXPIRATION', '*TYPE OF FCA', 'TOTAL NO. OF MEMBERS', 'AREA (ha) COVERED', 'ADDRESS', 
      'CONTACT PERSON', 'CONTACT NO.', 'TYPE OF INTERVENTION', '', '', '', 'REMARKS'
    ];
    
    // Row 5 Headers (Sub-headers for merged columns)
    worksheet.getRow(5).values = [
      '', '', '', '', '', '', '', '', '', '', '', '', 
      'SEEDS', 'MECH.', 'CREDIT', 'EXTN.', ''
    ];

    const merges = [
      'A4:A5', 'B4:B5', 'C4:C5', 'D4:D5', 'E4:E5', 'F4:F5', 'G4:G5', // Standard Columns
      'H4:H5', 'I4:I5', 'J4:J5', 'K4:K5', 'L4:L5', 
      'M4:P4', 
      'Q4:Q5'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    [4, 5].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.height = 30;
      row.eachCell((cell) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: headerColor } };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.font = { bold: true, size: 9, name: 'Times New Roman' };
        cell.border = {
          top: { style: 'thin' }, left: { style: 'thin' },
          bottom: { style: 'thin' }, right: { style: 'thin' }
        };
      });
    });

    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:Q${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } }; // Dark green
        cell.font = { bold: true, italic: true, name: 'Times New Roman' }; 
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    addProvinceRow('PALAWAN');

    const data = [
      ['1. Quezon', 1, 'Panibacan Irrigators Service Association', '9/23/2019', '10/15/2019', '10/14/2022', 'Irrigators Association', 50, 96, 'Brgy. Malagtao', 'Joaquin Martinez', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Expired'],
      ['', 2, 'Berong Multi-Purpose Cooperative', '10/17/2019', '10/28/2019', '10/27/2022', 'Cooperative', 44, 90, 'Berong', 'Perpetua E. Talaver', '9187534547', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'Expired']
    ];

    data.forEach(item => {
      const row = worksheet.addRow(item);
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true }; 
        
        if (colNumber === 1 && cell.value) {
           cell.font = { name: 'Times New Roman', size: 10, bold: true };
        }
      });
      [2, 4, 5, 6, 8, 9, 12, 13, 14, 15, 16, 17].forEach(col => {
         const cell = row.getCell(col);
         if(cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Expired_FCA_List.xlsx');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={exportToExcel}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#dc3545', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'Times New Roman'
        }}
      >
        Export Expired RCEF List
      </button>
    </div>
  );
};

export default ExcelExpiredRCEF;