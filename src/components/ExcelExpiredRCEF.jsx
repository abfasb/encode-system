import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ExcelExpiredRCEF = () => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Expired FCA');

    // 1. DEFINE ALL 17 COLUMNS (A through Q)
    worksheet.columns = [
      { key: 'prov', width: 18 },         // A: PROV./CITIES/MUN.
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

    // 2. TABLE HEADERS (ROWS 1 & 2)
    const headerColor = 'FFFFFF00'; // Yellow
    
    // Row 1 Headers
    worksheet.getRow(1).values = [
      'PROV./CITIES/MUN.', 'No.', 'NAME OF FCA', 'DATE OF APPLICATION RECEIVED', 'DATE RECEIVED', 
      'DATE OF EXPIRATION', '*TYPE OF FCA', 'TOTAL NO. OF MEMBERS', 'AREA (ha) COVERED', 'ADDRESS', 
      'CONTACT PERSON', 'CONTACT NO.', 'TYPE OF INTERVENTION', '', '', '', 'REMARKS'
    ];
    
    // Row 2 Headers (Sub-headers for merged columns)
    worksheet.getRow(2).values = [
      '', '', '', '', '', '', '', '', '', '', '', '', 
      'SEEDS', 'MECH.', 'CREDIT', 'EXTN.', ''
    ];

    // Merge Header Cells
    const merges = [
      'A1:A2', 'B1:B2', 'C1:C2', 'D1:D2', 'E1:E2', 'F1:F2', 'G1:G2', // Standard Columns
      'H1:H2', 'I1:I2', 'J1:J2', 'K1:K2', 'L1:L2', 
      'M1:P1', // TYPE OF INTERVENTION spans SEEDS, MECH., CREDIT, EXTN.
      'Q1:Q2'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    // Style Header Rows
    [1, 2].forEach(rowNum => {
      const row = worksheet.getRow(rowNum);
      row.height = 30; // Slightly taller for wrapped text
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

    // 3. HELPER FUNCTION FOR PROVINCE ROW
    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:Q${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF548235' } }; // Darker green matching screenshot
        cell.font = { bold: true, italic: true, name: 'Times New Roman', color: { argb: 'FFFFFFFF' } }; // White text usually looks better on dark green, adjust if needed
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    // 4. DATA ROWS
    addProvinceRow('PALAWAN');

    // Mapped precisely to the 17 columns based on your screenshot
    const data = [
      ['1. Quezon', 1, 'Panibacan Irrigators Service Association', '9/23/2019', '10/15/2019', '10/14/2022', 'Irrigators Association', 50, 96, 'Brgy. Malagtao', 'Joaquin Martinez', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Expired'],
      ['', 2, 'Berong Multi-Purpose Cooperative', '10/17/2019', '10/28/2019', '10/27/2022', 'Cooperative', 44, 90, 'Berong', 'Perpetua E. Talaver', '9187534547', 'TRUE', 'FALSE', 'FALSE', 'FALSE', 'Expired']
      // Add more rows here as needed...
    ];

    data.forEach(item => {
      const row = worksheet.addRow(item);
      row.eachCell((cell, colNumber) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true }; 
        
        // Bold the Municipality name if it's in column 1
        if (colNumber === 1 && cell.value) {
           cell.font = { name: 'Times New Roman', size: 10, bold: true };
        }
      });
      // Center align specific columns: No, Dates, Totals, Bools, Remarks
      [2, 4, 5, 6, 8, 9, 12, 13, 14, 15, 16, 17].forEach(col => {
         const cell = row.getCell(col);
         if(cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    // 5. GENERATE AND SAVE
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