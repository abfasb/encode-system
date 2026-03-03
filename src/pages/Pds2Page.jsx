import React from 'react';

const Pds2Page = () => {
  const eligibilityRows = Array.from({ length: 7 });
  const workExperienceRows = Array.from({ length: 28 });

  return (
    <div className="max-w-[1000px] mx-auto p-4 bg-gray-50 font-sans">
      <div className="w-full bg-white border-[4px] border-black flex flex-col">
        
        {/* ================= SECTION IV ================= */}
        <div className="bg-[#999999] text-white font-bold italic border-b-[4px] border-black px-1 py-0.5 text-sm">
          IV. CIVIL SERVICE ELIGIBILITY
        </div>
        
        <table className="w-full border-collapse text-center table-fixed">
          <thead>
            <tr>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[32%] text-left align-top font-normal text-[9px] leading-tight bg-[#eaeaea]">
                <span className="font-bold">27.</span> <span className="ml-2">CES/CSEE/CAREER SERVICE/RA 1080 (BOARD/</span><br/>
                <span className="ml-5">BAR) UNDER SPECIAL LAWS/CATEGORY II/ IV ELIGIBILITY</span><br/>
                <span className="ml-5">AND ELIGIBILITIES FOR UNIFORMED PERSONNEL</span>
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[12%] font-normal text-[9px] bg-[#eaeaea]">
                RATING<br/>(If Applicable)
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[15%] font-normal text-[9px] bg-[#eaeaea]">
                DATE OF<br/>EXAMINATION /<br/>CONFERMENT
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[21%] font-normal text-[9px] bg-[#eaeaea]">
                PLACE OF EXAMINATION /<br/>CONFERMENT
              </th>
              <th colSpan={2} className="border-b-[2px] border-black p-1 w-[20%] font-normal text-[9px] bg-[#eaeaea]">
                LICENSE <span className="italic">(if applicable)</span>
              </th>
            </tr>
            <tr>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[10%] font-normal text-[9px] bg-[#eaeaea]">NUMBER</th>
              <th className="border-b-[4px] border-black p-1 w-[10%] font-normal text-[9px] bg-[#eaeaea]">Valid Until</th>
            </tr>
          </thead>
          <tbody>
            {eligibilityRows.map((_, index) => (
              <tr key={`eligibility-${index}`} className="h-6">
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-name-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-rating-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-date-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-place-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-license-no-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`eligibility-license-valid-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Continuation Note */}
        <div className="text-center text-red-600 italic font-bold text-[10px] py-0.5 border-b-[4px] border-black bg-white">
          (Continue on separate sheet if necessary)
        </div>

        {/* ================= SECTION V ================= */}
        <div className="bg-[#999999] text-white border-b-[4px] border-black px-1 py-0.5 text-sm flex items-center gap-1">
          <span className="font-bold italic">V. WORK EXPERIENCE</span>
          <span className="text-[10px] italic font-normal mt-0.5">(Include private employment. Start from your recent work.) Description of duties should be indicated in the attached Work Experience Sheet.</span>
        </div>

        <table className="w-full border-collapse text-center table-fixed">
          <thead>
            <tr>
              <th colSpan={2} className="border-r-[2px] border-b-[2px] border-black p-1 w-[15%] text-left align-top font-normal text-[9px] leading-tight bg-[#eaeaea]">
                <span className="font-bold">28.</span> <span className="ml-2 text-center block">INCLUSIVE DATES<br/>(dd/mm/yyyy)</span>
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[27%] font-normal text-[9px] bg-[#eaeaea]">
                POSITION TITLE<br/>(Write in full/Do not abbreviate)
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[33%] font-normal text-[9px] bg-[#eaeaea]">
                DEPARTMENT / AGENCY / OFFICE / COMPANY<br/>(Write in full/Do not abbreviate)
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[15%] font-normal text-[9px] bg-[#eaeaea]">
                STATUS OF<br/>APPOINTMENT
              </th>
              <th rowSpan={2} className="border-b-[4px] border-black p-1 w-[10%] font-normal text-[9px] bg-[#eaeaea]">
                GOVT SERVICE<br/>(Y/ N)
              </th>
            </tr>
            <tr>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[7.5%] font-normal text-[9px] bg-[#eaeaea]">From</th>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[7.5%] font-normal text-[9px] bg-[#eaeaea]">To</th>
            </tr>
          </thead>
          <tbody>
            {workExperienceRows.map((_, index) => (
              <tr key={`work-${index}`} className="h-5">
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-from-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-to-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-position-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-department-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-status-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`work-govt-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Continuation Note */}
        <div className="text-center text-red-600 italic font-bold text-[10px] py-0.5 border-b-[4px] border-black bg-white">
          (Continue on separate sheet if necessary)
        </div>

        {/* ================= FOOTER ================= */}
        <div className="flex w-full h-10 bg-white">
          <div className="w-[15%] border-r-[4px] border-black flex items-center justify-center font-bold text-xs bg-[#eaeaea] italic">
            SIGNATURE
          </div>
          <div className="w-[55%] border-r-[4px] border-black p-0 relative bg-white">
            <input 
              type="text" 
              name="signature"
              placeholder="(wet signature/e-signature/digital certificate)" 
              className="w-full h-full px-2 text-center text-black outline-none bg-transparent text-[10px] placeholder:text-red-500 placeholder:italic" 
            />
          </div>
          <div className="w-[10%] border-r-[4px] border-black flex items-center justify-center font-bold text-xs bg-[#eaeaea] italic">
            DATE
          </div>
          <div className="w-[20%] p-0 bg-white">
            <input 
              type="text" 
              name="date"
              className="w-full h-full px-2 text-center text-black outline-none bg-transparent text-[10px]" 
            />
          </div>
        </div>
      </div>
      
      {/* Page Numbering */}
      <div className="w-full text-right text-[9px] italic mt-1 pr-1 font-bold">
        CS FORM 212 (Revised 2025), Page 2 of 4
      </div>
    </div>
  );
};

export default Pds2Page;