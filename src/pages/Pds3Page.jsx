import React from 'react';

const Pds3Page = () => {
  const voluntaryRows = Array.from({ length: 7 });
  const learningRows = Array.from({ length: 21 });
  const otherInfoRows = Array.from({ length: 7 });

  return (
    <div className="max-w-[1000px] mx-auto p-4 bg-gray-50 font-sans">
      <div className="w-full bg-white border-[4px] border-black flex flex-col">
        
        {/* ================= SECTION VI ================= */}
        <div className="bg-[#999999] text-white font-bold italic border-b-[4px] border-black px-1 py-0.5 text-sm uppercase">
          VI. Voluntary Work or Involvement in Civic / Non-Government / People / Voluntary Organizations
        </div>
        
        <table className="w-full border-collapse text-center table-fixed">
          <thead>
            <tr>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[42%] text-left align-top font-normal text-[9px] leading-tight bg-[#eaeaea]">
                <span className="font-bold">29.</span> <span className="ml-5 text-center block uppercase">Name & Address of Organization<br/>(Write in full)</span>
              </th>
              <th colSpan={2} className="border-r-[2px] border-b-[2px] border-black p-1 w-[16%] font-normal text-[9px] bg-[#eaeaea] uppercase">
                Inclusive Dates<br/>(mm/dd/yyyy)
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[7px] bg-[#eaeaea] uppercase">
                Number of Hours
              </th>
              <th rowSpan={2} className="border-b-[4px] border-black p-1 w-[34%] font-normal text-[9px] bg-[#eaeaea] uppercase">
                Position / Nature of Work
              </th>
            </tr>
            <tr>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[9px] bg-[#eaeaea]">From</th>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[9px] bg-[#eaeaea]">To</th>
            </tr>
          </thead>
          <tbody>
            {voluntaryRows.map((_, index) => (
              <tr key={`voluntary-${index}`} className="h-6">
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`vol-name-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`vol-from-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`vol-to-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`vol-hours-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`vol-position-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Continuation Note */}
        <div className="text-center text-red-600 italic font-bold text-[10px] py-0.5 border-b-[4px] border-black bg-white">
          (Continue on separate sheet if necessary)
        </div>

        {/* ================= SECTION VII ================= */}
        <div className="bg-[#999999] text-white font-bold italic border-b-[4px] border-black px-1 py-0.5 text-sm uppercase">
          VII. Learning and Development (L&D) Interventions/Training Programs Attended
        </div>

        <table className="w-full border-collapse text-center table-fixed">
          <thead>
            <tr>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[40%] text-left align-top font-normal text-[9px] leading-tight bg-[#eaeaea]">
                <span className="font-bold">30.</span> <span className="ml-2 text-center block uppercase">Title of Learning and Development Interventions/Training Programs<br/>(Write in full)</span>
              </th>
              <th colSpan={2} className="border-r-[2px] border-b-[2px] border-black p-1 w-[16%] font-normal text-[9px] bg-[#eaeaea] uppercase">
                Inclusive Dates of<br/>Attendance<br/>(mm/dd/yyyy)
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[7px] bg-[#eaeaea] uppercase">
                Number of<br/>Hours
              </th>
              <th rowSpan={2} className="border-r-[2px] border-b-[4px] border-black p-1 w-[10%] font-normal text-[8px] bg-[#eaeaea]">
                Type of L&D<br/>(Managerial/<br/>Supervisory/<br/>Technical/etc)
              </th>
              <th rowSpan={2} className="border-b-[4px] border-black p-1 w-[26%] font-normal text-[9px] bg-[#eaeaea] uppercase">
                Conducted/ Sponsored By<br/>(Write in full)
              </th>
            </tr>
            <tr>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[9px] bg-[#eaeaea]">From</th>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[8%] font-normal text-[9px] bg-[#eaeaea]">To</th>
            </tr>
          </thead>
          <tbody>
            {learningRows.map((_, index) => (
              <tr key={`learning-${index}`} className="h-5">
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-title-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-from-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-to-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-hours-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-type-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`ld-sponsored-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Continuation Note */}
        <div className="text-center text-red-600 italic font-bold text-[10px] py-0.5 border-b-[4px] border-black bg-white">
          (Continue on separate sheet if necessary)
        </div>

        {/* ================= SECTION VIII ================= */}
        <div className="bg-[#999999] text-white font-bold italic border-b-[4px] border-black px-1 py-0.5 text-sm uppercase">
          VIII. Other Information
        </div>

        <table className="w-full border-collapse text-center table-fixed">
          <thead>
            <tr>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[30%] text-left align-top font-normal text-[9px] bg-[#eaeaea]">
                <span className="font-bold">31.</span> <span className="ml-5 text-center block uppercase">Special Skills and Hobbies</span>
              </th>
              <th className="border-r-[2px] border-b-[4px] border-black p-1 w-[40%] text-left align-top font-normal text-[9px] bg-[#eaeaea]">
                <span className="font-bold">32.</span> <span className="ml-5 text-center block uppercase">Non-Academic Distinctions / Recognition<br/>(Write in full)</span>
              </th>
              <th className="border-b-[4px] border-black p-1 w-[30%] text-left align-top font-normal text-[9px] bg-[#eaeaea]">
                <span className="font-bold">33.</span> <span className="ml-5 text-center block uppercase">Membership in Association/Organization<br/>(Write in full)</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {otherInfoRows.map((_, index) => (
              <tr key={`other-${index}`} className="h-6">
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`skills-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-r-[2px] border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`recognition-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                </td>
                <td className="border-b-[2px] border-black p-0 bg-white">
                  <input type="text" name={`membership-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
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
          <div className="w-[15%] border-r-[4px] border-black flex items-center justify-center font-bold text-xs bg-[#eaeaea] italic uppercase">
            Signature
          </div>
          <div className="w-[55%] border-r-[4px] border-black p-0 relative bg-white">
            <input 
              type="text" 
              name="signature-page3"
              placeholder="(wet signature/e-signature/digital certificate)" 
              className="w-full h-full px-2 text-center text-black outline-none bg-transparent text-[10px] placeholder:text-red-500 placeholder:italic" 
            />
          </div>
          <div className="w-[10%] border-r-[4px] border-black flex items-center justify-center font-bold text-xs bg-[#eaeaea] italic uppercase">
            Date
          </div>
          <div className="w-[20%] p-0 bg-white">
            <input 
              type="text" 
              name="date-page3"
              className="w-full h-full px-2 text-center text-black outline-none bg-transparent text-[10px]" 
            />
          </div>
        </div>
      </div>
      
      {/* Page Numbering */}
      <div className="w-full text-right text-[9px] italic mt-1 pr-1 font-bold">
        CS FORM 212 (Revised 2025), Page 3 of 4
      </div>
    </div>
  );
};

export default Pds3Page;