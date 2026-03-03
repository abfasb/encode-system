import React, { useState, useRef, useEffect } from 'react';

const Pds4Page = () => {
  const referenceRows = Array.from({ length: 3 });

  // Signature Canvas Refs & State
  const applicantCanvasRef = useRef(null);
  const oathCanvasRef = useRef(null);
  
  const [isDrawingApplicant, setIsDrawingApplicant] = useState(false);
  const [isDrawingOath, setIsDrawingOath] = useState(false);

  // Initialize canvas drawing settings
  useEffect(() => {
    const initCanvas = (canvas) => {
      if (canvas) {
        const context = canvas.getContext('2d');
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.strokeStyle = 'black';
        context.lineWidth = 2.5;
      }
    };
    initCanvas(applicantCanvasRef.current);
    initCanvas(oathCanvasRef.current);
  }, []);

  // Universal Drawing Functions
  const startDrawing = (e, canvasRef, setDrawingState) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    setDrawingState(true);
  };

  const draw = (e, canvasRef, isDrawingState) => {
    if (!isDrawingState) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const context = canvas.getContext('2d');
    context.lineTo(x, y);
    context.stroke();
  };

  const finishDrawing = (canvasRef, isDrawingState, setDrawingState) => {
    if (!isDrawingState) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.closePath();
    setDrawingState(false);
  };

  const clearSignature = (canvasRef) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 bg-gray-50 font-sans">
      <div className="w-full bg-white border-[4px] border-black flex flex-col text-[9px] leading-tight">
        
        {/* ================= QUESTIONS 34 to 40 ================= */}
        
        {/* Q34 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 pb-2 bg-[#eaeaea]">
            <p className="font-bold inline">34.</p> Are you related by consanguinity or affinity to the appointing or recommending authority, or to the<br/>
            <span className="ml-4">chief of bureau or office or to the person who has immediate supervision over you in the Office,</span><br/>
            <span className="ml-4">Bureau or Department where you will be appointed,</span>
            <p className="ml-4 mt-1">a. within the third degree?</p>
            <p className="ml-4 mt-3">b. within the fourth degree (for Local Government Unit - Career Employees)?</p>
          </div>
          <div className="w-[35%] flex flex-col bg-white">
            <div className="flex-1 border-b-[2px] border-black p-1 flex flex-col justify-end pb-2 relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
            </div>
            <div className="flex-1 p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex mt-1 items-end gap-1 w-full pr-1">
                <span>If YES, give details:</span>
                <input type="text" name="q34b-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Q35 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 pb-2 bg-[#eaeaea]">
            <p className="font-bold inline">35.</p> a. Have you ever been found guilty of any administrative offense?
            <p className="mt-5"><span className="ml-4">b. Have you been criminally charged before any court?</span></p>
          </div>
          <div className="w-[35%] flex flex-col bg-white">
            <div className="flex-1 border-b-[2px] border-black p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex mt-1 items-end gap-1 w-full pr-1">
                <span>If YES, give details:</span>
                <input type="text" name="q35a-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
            <div className="flex-1 p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="mt-1 w-full pr-1">
                <div className="flex items-end gap-1 w-full mb-1">
                  <span>If YES, give details:</span>
                </div>
                <div className="flex items-end gap-1 w-full pl-4">
                  <span>Date Filed:</span>
                  <input type="text" name="q35b-date" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Q36 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 bg-[#eaeaea]">
            <p className="font-bold inline">36.</p> Have you ever been convicted of any crime or violation of any law, decree, ordinance or regulation by<br/>
            <span className="ml-4">any court or tribunal?</span>
          </div>
          <div className="w-[35%] p-1 flex flex-col bg-white">
            <div className="flex gap-6 ml-2">
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
            </div>
            <div className="flex mt-1 items-end gap-1 w-full pr-1">
              <span>If YES, give details:</span>
              <input type="text" name="q36-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
            </div>
          </div>
        </div>

        {/* Q37 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 bg-[#eaeaea]">
            <p className="font-bold inline">37.</p> Have you ever been separated from the service in any of the following modes: resignation,<br/>
            <span className="ml-4">retirement, dropped from the rolls, dismissal, termination, end of term, finished contract or phased out</span><br/>
            <span className="ml-4">(abolition) in the public or private sector?</span>
          </div>
          <div className="w-[35%] p-1 flex flex-col justify-center bg-white">
            <div className="flex gap-6 ml-2">
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
            </div>
            <div className="flex mt-1 items-end gap-1 w-full pr-1">
              <span>If YES, give details:</span>
              <input type="text" name="q37-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
            </div>
          </div>
        </div>

        {/* Q38 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 pb-2 bg-[#eaeaea]">
            <p className="font-bold inline">38.</p> a. Have you ever been a candidate in a national or local election held within the last year (except<br/>
            <span className="ml-4">Barangay election)?</span>
            <p className="mt-3"><span className="ml-4">b. Have you resigned from the government service during the three (3)-month period before the last</span><br/>
            <span className="ml-4">election to promote/actively campaign for a national or local candidate?</span></p>
          </div>
          <div className="w-[35%] flex flex-col bg-white">
            <div className="flex-1 border-b-[2px] border-black p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex mt-1 items-end gap-1 w-full pr-1">
                <span>If YES, give details:</span>
                <input type="text" name="q38a-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
            <div className="flex-1 p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex mt-1 items-end gap-1 w-full pr-1">
                <span>If YES, give details:</span>
                <input type="text" name="q38b-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        {/* Q39 */}
        <div className="flex border-b-[2px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 bg-[#eaeaea]">
            <p className="font-bold inline">39.</p> Have you acquired the status of an immigrant or permanent resident of another country?
          </div>
          <div className="w-[35%] p-1 flex flex-col bg-white">
            <div className="flex gap-6 ml-2">
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
              <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
            </div>
            <div className="flex mt-1 items-end gap-1 w-full pr-1">
              <span>If YES, give details (country):</span>
              <input type="text" name="q39-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
            </div>
          </div>
        </div>

        {/* Q40 */}
        <div className="flex border-b-[4px] border-black">
          <div className="w-[65%] border-r-[2px] border-black p-1 pb-2 bg-[#eaeaea]">
            <p className="font-bold inline">40.</p> Pursuant to: (a) Indigenous People's Act (RA 8371); (b) Magna Carta for Disabled Persons (RA 7277,<br/>
            <span className="ml-4">as amended); and (c) Expanded Solo Parents Welfare Act (RA 11861), please answer the following</span><br/>
            <span className="ml-4">items:</span>
            <p className="mt-2"><span className="ml-2">a. Are you a member of any indigenous group?</span></p>
            <p className="mt-3"><span className="ml-2">b. Are you a person with disability?</span></p>
            <p className="mt-3"><span className="ml-2">c. Are you a solo parent?</span></p>
          </div>
          <div className="w-[35%] flex flex-col bg-white">
            {/* 40a */}
            <div className="flex-1 border-b-[2px] border-black p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex items-end gap-1 w-full pr-1">
                <span>If YES, please specify:</span>
                <input type="text" name="q40a-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
            {/* 40b */}
            <div className="flex-1 border-b-[2px] border-black p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex items-end gap-1 w-full pr-1">
                <span>If YES, please specify ID No:</span>
                <input type="text" name="q40b-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
            {/* 40c */}
            <div className="flex-1 p-1 flex flex-col relative">
              <div className="flex gap-6 ml-2">
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> YES</label>
                <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" className="w-3 h-3 border-black cursor-pointer" /> NO</label>
              </div>
              <div className="flex items-end gap-1 w-full pr-1">
                <span>If YES, please specify ID No:</span>
                <input type="text" name="q40c-details" className="flex-1 border-b border-black outline-none bg-transparent text-center text-[10px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ================= REFERENCES & PHOTO ROW ================= */}
        <div className="flex border-b-[4px] border-black bg-white">
          <div className="w-[75%] border-r-[4px] border-black flex flex-col">
            
            {/* Q41 Table */}
            <div className="border-b-[4px] border-black">
              <div className="bg-[#eaeaea] p-1 border-b-[2px] border-black">
                <span className="font-bold">41.</span> REFERENCES <span className="text-red-500 font-bold">(Person not related by consanguinity or affinity to applicant /appointee)</span>
              </div>
              <table className="w-full border-collapse text-center table-fixed">
                <thead>
                  <tr className="bg-white">
                    <th className="border-r-[2px] border-b-[2px] border-black p-1 w-[40%] bg-[#eaeaea] font-normal">NAME</th>
                    <th className="border-r-[2px] border-b-[2px] border-black p-1 w-[40%] bg-[#eaeaea] font-normal">OFFICE / RESIDENTIAL ADDRESS</th>
                    <th className="border-b-[2px] border-black p-1 w-[20%] bg-[#eaeaea] font-normal">CONTACT NO. AND/OR<br/>EMAIL</th>
                  </tr>
                </thead>
                <tbody>
                  {referenceRows.map((_, index) => (
                    <tr key={`ref-${index}`} className="h-6">
                      <td className="border-r-[2px] border-b-[2px] border-black p-0 last:border-b-0">
                        <input type="text" name={`ref-name-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                      </td>
                      <td className="border-r-[2px] border-b-[2px] border-black p-0 last:border-b-0">
                        <input type="text" name={`ref-address-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                      </td>
                      <td className="border-b-[2px] border-black p-0 last:border-b-0">
                        <input type="text" name={`ref-contact-${index}`} className="w-full h-full px-1 text-center outline-none bg-transparent text-[10px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Q42 Oath Declaration */}
            <div className="p-2 text-[10px] bg-[#eaeaea] flex-1 text-justify leading-snug">
              <span className="font-bold">42.</span> I declare under oath that I have personally accomplished this Personal Data Sheet which is a true, correct, and complete statement pursuant to the provisions of pertinent laws, rules, and regulations of the Republic of the Philippines. I authorize the agency head/authorized representative to verify/validate the contents stated herein. I agree that any misrepresentation made in this document and its attachments shall cause the filing of administrative/criminal case/s against me.
            </div>
          </div>
          
          {/* Photo Box */}
          <div className="w-[25%] p-2 flex justify-center items-center bg-white">
            <div className="w-[120px] h-[150px] border-[2px] border-black flex flex-col items-center justify-center p-2 text-center text-gray-500 text-[8px] leading-tight">
              Passport-sized unfiltered digital<br/>
              picture taken within<br/>
              the last 6 months<br/>
              4.5 cm. X 3.5 cm<br/><br/><br/>
              PHOTO
            </div>
          </div>
        </div>

        {/* ================= GOV ID, SIGNATURE, THUMBMARK ROW ================= */}
        <div className="flex border-b-[4px] border-black bg-white">
          
          {/* Gov ID Box */}
          <div className="w-[35%] border-r-[4px] border-black flex flex-col p-1">
            <div className="bg-[#eaeaea] border-[2px] border-black p-1 text-[8px] mb-1">
              Government Issued ID <span className="italic">(i.e.Passport, GSIS, SSS, PRC, Driver's License, etc.)</span><br/>
              PLEASE INDICATE ID Number and Date of Issuance
            </div>
            <div className="flex-1 border-[2px] border-black flex flex-col">
              <div className="flex-1 border-b-[2px] border-black flex flex-col p-0.5 relative">
                <span className="text-[7px]">Government Issued ID:</span>
                <input type="text" name="gov-id-type" className="w-full h-full outline-none bg-transparent text-center text-[10px] mt-1" />
              </div>
              <div className="flex-1 border-b-[2px] border-black flex flex-col p-0.5 relative">
                <span className="text-[7px]">ID/License/Passport No.:</span>
                <input type="text" name="gov-id-no" className="w-full h-full outline-none bg-transparent text-center text-[10px] mt-1" />
              </div>
              <div className="flex-1 flex flex-col p-0.5 relative">
                <span className="text-[7px]">Date/Place of Issuance:</span>
                <input type="text" name="gov-id-date-place" className="w-full h-full outline-none bg-transparent text-center text-[10px] mt-1" />
              </div>
            </div>
          </div>

          {/* Applicant Signature Box */}
          <div className="w-[45%] border-r-[4px] border-black flex flex-col p-1">
            <div className="flex-1 border-[2px] border-black flex flex-col">
              <div className="flex-1 flex flex-col items-center justify-center border-b-[2px] border-black relative p-1 bg-white">
                
                {/* Applicant Interactive Canvas */}
                <canvas
                  ref={applicantCanvasRef}
                  onMouseDown={(e) => startDrawing(e, applicantCanvasRef, setIsDrawingApplicant)}
                  onMouseMove={(e) => draw(e, applicantCanvasRef, isDrawingApplicant)}
                  onMouseUp={() => finishDrawing(applicantCanvasRef, isDrawingApplicant, setIsDrawingApplicant)}
                  onMouseLeave={() => finishDrawing(applicantCanvasRef, isDrawingApplicant, setIsDrawingApplicant)}
                  onTouchStart={(e) => startDrawing(e, applicantCanvasRef, setIsDrawingApplicant)}
                  onTouchMove={(e) => draw(e, applicantCanvasRef, isDrawingApplicant)}
                  onTouchEnd={() => finishDrawing(applicantCanvasRef, isDrawingApplicant, setIsDrawingApplicant)}
                  width={350}
                  height={80}
                  className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none mb-[12px]" 
                />
                
                {!isDrawingApplicant && (
                  <div className="absolute text-red-500 text-[9px] italic top-2 z-0 pointer-events-none select-none opacity-50">
                    (wet signature/e-signature/digital certificate)
                  </div>
                )}

                <button 
                  onClick={() => clearSignature(applicantCanvasRef)} 
                  className="absolute top-1 right-1 bg-gray-200 text-black text-[8px] px-1 rounded z-20 print:hidden shadow-sm font-bold uppercase"
                >
                  Clear
                </button>

                <div className="w-full bg-[#eaeaea] text-center text-[8px] py-0.5 border-t-[2px] border-black mt-auto z-0">Signature (Sign inside the box)</div>
              </div>
              
              <div className="h-8 flex flex-col relative bg-white">
                <input type="text" name="date-accomplished" className="w-full h-full outline-none bg-transparent text-center text-[10px] pb-3" />
                <div className="w-full bg-[#eaeaea] text-center text-[8px] py-0.5 border-t-[2px] border-black absolute bottom-0">Date Accomplished</div>
              </div>
            </div>
          </div>

          {/* Right Thumbmark */}
          <div className="w-[20%] p-1 flex justify-center items-center">
            <div className="w-[80px] h-[100px] border-[2px] border-black flex flex-col relative bg-white">
              <div className="w-full bg-[#eaeaea] text-center text-[8px] py-0.5 border-t-[2px] border-black absolute bottom-0">Right Thumbmark</div>
            </div>
          </div>
        </div>

        {/* ================= OATH ROW ================= */}
        <div className="w-full bg-white p-2 flex flex-col items-center justify-center">
          <div className="w-full text-center mt-2 mb-4">
            SUBSCRIBED AND SWORN to before me this <input type="text" name="sworn-date" className="w-48 border-b-[2px] border-black outline-none bg-transparent text-center mx-1" /> , affiant exhibiting his/her validly issued government ID as indicated above.
          </div>
          
          {/* Administering Oath Signature Box */}
          <div className="w-[300px] border-[2px] border-black flex flex-col mt-2 mb-2 h-20 relative bg-white">
            
             {/* Oath Interactive Canvas */}
             <canvas
                ref={oathCanvasRef}
                onMouseDown={(e) => startDrawing(e, oathCanvasRef, setIsDrawingOath)}
                onMouseMove={(e) => draw(e, oathCanvasRef, isDrawingOath)}
                onMouseUp={() => finishDrawing(oathCanvasRef, isDrawingOath, setIsDrawingOath)}
                onMouseLeave={() => finishDrawing(oathCanvasRef, isDrawingOath, setIsDrawingOath)}
                onTouchStart={(e) => startDrawing(e, oathCanvasRef, setIsDrawingOath)}
                onTouchMove={(e) => draw(e, oathCanvasRef, isDrawingOath)}
                onTouchEnd={() => finishDrawing(oathCanvasRef, isDrawingOath, setIsDrawingOath)}
                width={300}
                height={60}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none mb-[16px]" 
              />

             {!isDrawingOath && (
               <div className="text-red-500 text-[8px] italic text-center w-full absolute top-2 z-0 opacity-50 pointer-events-none select-none">
                 (wet signature/e-signature/digital certificate except for notary public)
               </div>
             )}

             <button 
                onClick={() => clearSignature(oathCanvasRef)} 
                className="absolute top-1 right-1 bg-gray-200 text-black text-[8px] px-1 rounded z-20 print:hidden shadow-sm font-bold uppercase"
             >
                Clear
             </button>

             <div className="w-full bg-[#eaeaea] text-center text-[9px] py-1 border-t-[2px] border-black absolute bottom-0 font-bold z-0">Person Administering Oath</div>
          </div>
        </div>

      </div>
      
      {/* Page Numbering */}
      <div className="w-full text-right text-[9px] italic mt-1 pr-1 font-bold">
        CS FORM 212 (Revised 2025), Page 4 of 4
      </div>
    </div>
  );
};

export default Pds4Page;