import React from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

const ExcelExport = () => {
  const exportToExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Farmers Cooperative');

    // 1. DEFINE ALL 21 COLUMNS (A through U)
    worksheet.columns = [
      { key: 'prov', width: 18 },         // A: PROV./CITIES/MUN.
      { key: 'no', width: 6 },            // B: No.
      { key: 'name', width: 45 },         // C: Name
      { key: 'dateApp', width: 15 },      // D: DATE OF APPLICATION RECEIVED
      { key: 'dateAcc', width: 15 },      // E: DATE ACCREDITED
      { key: 'dateExp', width: 15 },      // F: DATE OF EXPIRATION
      { key: 'type', width: 22 },         // G: *TYPE OF FCA
      { key: 'male', width: 8 },          // H: MALE
      { key: 'female', width: 8 },        // I: FEMALE
      { key: 'total', width: 12 },        // J: TOTAL NO. OF MEMBERS
      { key: 'area', width: 12 },         // K: AREA (ha) COVERED
      { key: 'address', width: 25 },      // L: ADDRESS
      { key: 'contactPerson', width: 20 },// M: CONTACT PERSON
      { key: 'contactNo', width: 15 },    // N: CONTACT NO.
      { key: 'seeds', width: 8 },         // O: SEEDS
      { key: 'mech', width: 8 },          // P: MECH
      { key: 'credit', width: 8 },        // Q: CREDIT
      { key: 'extn', width: 8 },          // R: EXTN.
      { key: 'remarks', width: 15 },      // S: REMARKS
      { key: 'cert', width: 45 },         // T: CERTIFICATE OF ACCREDITATION
      { key: 'docs', width: 35 },         // U: Submitted Documents
    ];

    // 2. HEADER TITLES
    const titleRows = [
      ['LIST OF FARMERS COOPERATIVE/ASSOCIATION ACCREDITED UNDER RCEF'],
      ['REGION: MIMAROPA'],
      ['As of January 2026'],
      [''] 
    ];

    titleRows.forEach((val, index) => {
      const rowNum = index + 1;
      worksheet.getRow(rowNum).values = val;
      // Merge across all 21 columns (A to U)
      worksheet.mergeCells(`A${rowNum}:U${rowNum}`);
      const cell = worksheet.getCell(`A${rowNum}`);
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      
      cell.font = { 
        name: 'Times New Roman', 
        size: 11, 
        bold: true,
        italic: rowNum === 3
      };
      
      if (rowNum === 2) {
        cell.value = {
          richText: [
            { font: { name: 'Times New Roman', bold: true }, text: 'REGION: ' },
            { font: { name: 'Times New Roman', color: { argb: 'FFFF0000' }, bold: true }, text: 'MIMAROPA' }
          ]
        };
      }
    });

    // 3. TABLE HEADERS (ROWS 6 & 7)
    const headerColor = 'FFFFFF00'; // Yellow
    
    // Row 6 Headers
    worksheet.getRow(6).values = [
      'PROV./CITIES/MUN.', 'No.', 'Name', 'DATE OF APPLICATION RECEIVED', 'DATE ACCREDITED', 
      'DATE OF EXPIRATION', '*TYPE OF FCA', 'NO. OF MEMBERS', '', 'TOTAL NO. OF MEMBERS', 
      'AREA (ha) COVERED', 'ADDRESS', 'CONTACT PERSON', 'CONTACT NO.', 'TYPE OF INTERVENTION', 
      '', '', '', 'REMARKS', 'CERTIFICATE OF ACCREDITATION', 'Submitted Documents'
    ];
    
    // Row 7 Headers (Sub-headers for merged columns)
    worksheet.getRow(7).values = [
      '', '', '', '', '', '', '', 'MALE', 'FEMALE', '', '', '', '', '', 
      'SEEDS', 'MECH', 'CREDIT', 'EXTN.', '', '', ''
    ];

    // Merge Header Cells
    const merges = [
      'A6:A7', 'B6:B7', 'C6:C7', 'D6:D7', 'E6:E7', 'F6:F7', 'G6:G7', // Standard Columns
      'H6:I6', // NO. OF MEMBERS spans MALE, FEMALE
      'J6:J7', 'K6:K7', 'L6:L7', 'M6:M7', 'N6:N7', 
      'O6:R6', // TYPE OF INTERVENTION spans SEEDS, MECH, CREDIT, EXTN
      'S6:S7', 'T6:T7', 'U6:U7'
    ];
    merges.forEach(m => worksheet.mergeCells(m));

    // Style Header Rows
    [6, 7].forEach(rowNum => {
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

    // 4. HELPER FUNCTIONS FOR SECTIONS
    const addProvinceRow = (name) => {
      const row = worksheet.addRow([name.toUpperCase()]);
      worksheet.mergeCells(`A${row.number}:U${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } }; // Green
        cell.font = { bold: true, italic: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' }, top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' }};
      });
    };

    const addMunicipalityRow = (name) => {
      const row = worksheet.addRow([name]);
      worksheet.mergeCells(`A${row.number}:U${row.number}`);
      row.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4B084' } }; // Peach/Orange
        cell.font = { bold: true, name: 'Times New Roman' };
        cell.border = { outline: true, bottom: { style: 'thin' }, top: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
    };

    // 5. DATA ROWS
    addProvinceRow('PALAWAN');
    addMunicipalityRow('1. Quezon');

    // Mapped precisely to the 21 columns
    const quezonData = [
      ['', 1, 'Dao Farmers Association', '2/27/2023', '2/27/2023', '2/26/2026', 'Farmers Association', 22, 4, 26, 57, 'Brgy. Bugon', 'Armando A. Baal', '', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Accredited', 'Dao Farmers Association.jpeg', ''],
      ['', 2, 'Quezon Seed Producers Cooperative', '2/27/2023', '2/27/2023', '2/26/2026', 'Cooperative', 32, 154, 186.3, 209.8, 'Brgy. Alfonso XIII', 'Leofred T. Valenzuela', '9182496612', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Accredited', 'Quezon Seed Producers Cooperative.jpeg', ''],
      ['', 3, 'Samahan Magsasaka Ng Aramaywan', '5/15/2023', '5/15/2023', '5/14/2026', 'Farmers Association', 61, 7, 68, 104.25, 'Brgy. Aramaywan', 'Oliver A. Osao', '9368301078', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Accredited', 'Samahan Magsasaka Ng Aramaywan.jpeg', '']
    ];

    quezonData.forEach(item => {
      const row = worksheet.addRow(item);
      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true }; // Wrap text for long names/addresses
      });
      // Center align specific columns like Numbers, Dates, Booleans
      [2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 17, 18].forEach(col => {
         const cell = row.getCell(col);
         if(cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    addMunicipalityRow("2. Brooke's Point");
    const brookesData = [
      ['', 1, 'Macagua Farmers Irrigators Association, Inc.', '3/23/2023', '3/23/2023', '3/22/2026', 'Irrigators Association', 89, 25, 114, 188.75, 'Brgy. Saraza', 'Marvin A. Limbo', '9360987130', 'FALSE', 'TRUE', 'FALSE', 'FALSE', 'Accredited', 'Macagua Farmers Irrigators Association, Inc.jpeg', '']
    ];
    
    brookesData.forEach(item => {
      const row = worksheet.addRow(item);
      row.eachCell(cell => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      [2, 4, 5, 6, 8, 9, 10, 11, 15, 16, 17, 18].forEach(col => {
        const cell = row.getCell(col);
        if(cell) cell.alignment = { horizontal: 'center', vertical: 'middle' };
     });
    });

    // 6. GENERATE AND SAVE
    const buffer = await workbook.xlsx.writeBuffer();
    saveAs(new Blob([buffer]), 'Accredited_FCA_MIMAROPA.xlsx');
  };

  return (
    <div style={{ padding: '20px' }}>
      <button 
        onClick={exportToExcel}
        style={{ 
          padding: '12px 24px', 
          backgroundColor: '#007bff', 
          color: '#fff', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer',
          fontWeight: 'bold',
          fontFamily: 'Times New Roman'
        }}
      >
        Export Full RCEF Report
      </button>
    </div>
  );
};

export default ExcelExport;