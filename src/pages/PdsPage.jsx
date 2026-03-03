import React, { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import html2pdf from 'html2pdf.js';

const PdsPage = () => {
  const formRef = useRef(null);
  
  // Signature Canvas Refs & State
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const [formData, setFormData] = useState({
    surname: 'Balinton', firstName: 'Matthew', middleName: 'C.', nameExt: '',
    dob: '', placeOfBirth: '', sex: '', civilStatus: '',
    height: '1.70', weight: '58', bloodType: '',
    umid: '', pagibig: '', philhealth: '', philsys: '', tin: '', agencyNo: '',
    citizenship: 'Filipino', citizenshipType: '', country: '',
    resAddress: { houseNo: '', street: '', village: '', barangay: '', city: '', province: '', zip: '' },
    permAddress: { houseNo: '', street: '', village: '', barangay: '', city: '', province: '', zip: '' },
    telNo: '', mobileNo: '', email: '',
    spouse: { surname: '', firstName: '', middleName: '', nameExt: '', occupation: '', employer: '', businessAddr: '', telNo: '' },
    father: { surname: '', firstName: '', middleName: '', nameExt: '' },
    mother: { surname: '', firstName: '', middleName: '' },
    children: Array(12).fill({ name: '', dob: '' }),
    education: {
      elementary: { school: '', degree: '', from: '', to: '', units: '', year: '', honors: '' },
      secondary: { school: '', degree: '', from: '', to: '', units: '', year: '', honors: '' },
      vocational: { school: '', degree: '', from: '', to: '', units: '', year: '', honors: '' },
      college: { school: '', degree: '', from: '', to: '', units: '', year: '', honors: '' },
      graduate: { school: '', degree: '', from: '', to: '', units: '', year: '', honors: '' },
    },
    signatureDate: ''
  });

  // Initialize canvas drawing settings
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext('2d');
      context.lineCap = 'round';
      context.lineJoin = 'round';
      context.strokeStyle = 'black';
      context.lineWidth = 2.5;
    }
  }, []);

  // Drawing functions
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    
    // Scale coordinates based on actual rendered size vs internal canvas resolution
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const context = canvas.getContext('2d');
    context.beginPath();
    context.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
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

  const finishDrawing = () => {
    if (!isDrawing) return;
    const context = canvasRef.current.getContext('2d');
    context.closePath();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleInputChange = (e, section = null, index = null, subKey = null) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;

    if (section === 'children' && index !== null) {
      const newChildren = [...formData.children];
      newChildren[index] = { ...newChildren[index], [name]: val };
      setFormData(prev => ({ ...prev, children: newChildren }));
    } 
    else if (section === 'spouse' || section === 'father' || section === 'mother') {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: val }
      }));
    }
    else if (section === 'resAddress' || section === 'permAddress') {
      setFormData(prev => ({
        ...prev,
        [section]: { ...prev[section], [name]: val }
      }));
    }
    else if (section === 'education' && subKey) {
      setFormData(prev => ({
        ...prev,
        education: { ...prev.education, [subKey]: { ...prev.education[subKey], [name]: val } }
      }));
    }
    else {
      setFormData(prev => ({ ...prev, [name]: val }));
    }
  };

  const generatePDF = () => {
    const element = formRef.current;
    const opt = {
      margin:       0.2,
      filename:     'CS_Form_212_Page1.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2 },
      jsPDF:        { unit: 'in', format: 'legal', orientation: 'portrait' }
    };
    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="max-w-[1000px] mx-auto p-4 bg-gray-50 font-sans">
      {/* Print-optimized styles */}
      <style>{`
        @media print {
          body { 
            font-size: 8pt !important; 
            margin: 0 !important; 
            padding: 0 !important;
          }
          .print-container {
            border: 4px solid black !important;
            padding: 0.1in !important;
            width: 100% !important;
            max-width: 8.5in !important;
            margin: 0 auto !important;
            box-shadow: none !important;
          }
          .print-container * {
            line-height: 1.1 !important;
          }
          .print-container input, 
          .print-container textarea {
            padding: 0 !important;
            font-size: 7pt !important;
            border-bottom-width: 1px !important;
          }
          .print-container .h-7 { height: 0.18in !important; }
          .print-container .h-8 { height: 0.2in !important; }
          .print-container .h-10 { height: 0.24in !important; }
          .print-container .h-12 { height: 0.28in !important; }
          .print-container .h-24 { height: 0.6in !important; }
          .print-container .p-1 { padding: 1px !important; }
          .print-container .p-2 { padding: 2px !important; }
          .print-container .mt-4 { margin-top: 0.1in !important; }
          .print-container .mb-1 { margin-bottom: 1px !important; }
          .print-container .gap-4 { gap: 0.1in !important; }
          .print-container .text-3xl { font-size: 18pt !important; }
          .print-container .text-sm { font-size: 7pt !important; }
          .print-container .text-xs { font-size: 6pt !important; }
          .print-container .text-[10px] { font-size: 7pt !important; }
          .print-container .text-[11px] { font-size: 8pt !important; }
          .print-container .text-[8px] { font-size: 6pt !important; }
          .print-container .text-[7px] { font-size: 5pt !important; }
          .print-container .border-2 { border-width: 2px !important; }
          .print-container .border-\[3px\] { border-width: 3px !important; }
          .print-container button { display: none !important; }
          @page { size: 8.5in 14in; margin: 0.2in; }
        }
      `}</style>

      <div ref={formRef} className="print-container w-full bg-white border-[4px] border-black flex flex-col leading-tight">
        {/* HEADER */}
        <div className="mb-2 p-1">
          <div className="font-bold italic text-[11px] print:text-[8px]">CS Form No. 212</div>
          <div className="italic text-[9px] -mt-1 print:text-[6px]">Revised 2025</div>
          <div className="text-center text-3xl font-black mt-2 tracking-tighter print:text-xl">PERSONAL DATA SHEET</div>
          <div className="mt-4 text-[8px] font-bold italic leading-tight uppercase print:text-[5px] print:mt-1">
            WARNING: Any misrepresentation made in the Personal Data Sheet and the Work Experience Sheet shall cause the filing of administrative/criminal case/s against the person concerned.
          </div>
          <div className="mt-2 text-[8px] font-bold italic leading-tight print:text-[5px] print:mt-1">
            READ THE ATTACHED GUIDE TO FILLING OUT THE PERSONAL DATA SHEET (PDS) BEFORE ACCOMPLISHING THE PDS FORM.
          </div>
          <div className="flex items-center text-[8px] mt-1 print:text-[5px]">
            <span>Print legibly if accomplished through own handwriting. Tick appropriate boxes (</span>
            <div className="w-3 h-3 border-[2px] border-black mx-1 print:w-2 print:h-2"></div>
            <span>) and use separate sheet if necessary. Indicate N/A if not applicable. <span className="font-bold">DO NOT ABBREVIATE.</span></span>
          </div>
        </div>

        <div className="text-[10px] font-sans uppercase print:text-[7px]">
          {/* SECTION I: PERSONAL INFORMATION */}
          <div className="bg-[#999999] text-white p-1 italic font-bold text-sm border-y-[4px] border-black print:text-[9px] print:p-0.5">
            I. PERSONAL INFORMATION
          </div>

          <div className="border-b-[4px] border-black print:border">
            {/* Name Fields */}
            <div className="flex border-b-[2px] border-black print:border-b">
              <div className="w-[20%] bg-[#eaeaea] p-2 border-r-[2px] border-black font-normal print:p-1">
                <span className="font-bold mr-2">1.</span> SURNAME
              </div>
              <div className="w-[80%] flex items-center justify-center bg-white">
                <input name="surname" value={formData.surname} onChange={handleInputChange} className="w-full h-full px-2 outline-none uppercase print:h-5" />
              </div>
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className="w-[20%] bg-[#eaeaea] p-2 border-r-[2px] border-black font-normal print:p-1">
                <span className="font-bold mr-2">2.</span> FIRST NAME
              </div>
              <div className="w-[55%] flex items-center justify-center border-r-[2px] border-black bg-white">
                <input name="firstName" value={formData.firstName} onChange={handleInputChange} className="w-full h-full px-2 outline-none uppercase print:h-5" />
              </div>
              <div className="w-[25%] bg-[#eaeaea] p-1 text-[8px] flex flex-col justify-center items-center print:text-[6px] relative">
                NAME EXTENSION (JR., SR)
                <input name="nameExt" value={formData.nameExt} onChange={handleInputChange} className="bg-white border-none mt-1 uppercase outline-none px-1 text-center w-3/4 print:mt-0 print:h-4" />
              </div>
            </div>
            <div className="flex border-b-[2px] border-black">
              <div className="w-[20%] bg-[#eaeaea] p-2 border-r-[2px] border-black font-normal print:p-1 pl-8">
                MIDDLE NAME
              </div>
              <div className="w-[80%] flex items-center justify-center bg-white">
                <input name="middleName" value={formData.middleName} onChange={handleInputChange} className="w-full h-full px-2 outline-none uppercase print:h-5" />
              </div>
            </div>

            <div className="flex border-b-[2px] border-black">
              {/* Left Side */}
              <div className="w-1/2 border-r-[2px] border-black flex flex-col">
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">3.</span> DATE OF BIRTH<br/>(mm/dd/yyyy)
                  </div>
                  <div className="w-[60%] flex items-center justify-center bg-white">
                    <input type="text" placeholder="mm/dd/yyyy" name="dob" value={formData.dob} onChange={handleInputChange} className="w-full h-full outline-none px-2 print:text-[7px]" />
                  </div>
                </div>
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">4.</span> PLACE OF BIRTH
                  </div>
                  <div className="w-[60%] flex items-center justify-center bg-white">
                    <input name="placeOfBirth" value={formData.placeOfBirth} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" />
                  </div>
                </div>
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">5.</span> SEX AT BIRTH
                  </div>
                  <div className="w-[60%] p-1 flex gap-6 items-center justify-center bg-white print:gap-1">
                    <label className="flex items-center gap-1 print:gap-0.5 cursor-pointer"><input type="checkbox" name="sex" value="Male" checked={formData.sex === 'Male'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Male</label>
                    <label className="flex items-center gap-1 print:gap-0.5 cursor-pointer"><input type="checkbox" name="sex" value="Female" checked={formData.sex === 'Female'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Female</label>
                  </div>
                </div>
                <div className="flex border-b-[2px] border-black h-[68px] print:h-12">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">6.</span> CIVIL STATUS
                  </div>
                  <div className="w-[60%] p-2 grid grid-cols-2 items-center bg-white print:grid-cols-1 print:text-[6px]">
                    <label className="flex items-center gap-1 print:gap-0.5 cursor-pointer"><input type="checkbox" name="civilStatus" value="Single" checked={formData.civilStatus === 'Single'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Single</label>
                    <label className="flex items-center gap-1 print:gap-0.5 cursor-pointer"><input type="checkbox" name="civilStatus" value="Married" checked={formData.civilStatus === 'Married'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Married</label>
                    <label className="flex items-center gap-1 print:gap-0.5 cursor-pointer"><input type="checkbox" name="civilStatus" value="Widowed" checked={formData.civilStatus === 'Widowed'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Separated</label>
                    <label className="flex items-center gap-1 col-span-2 print:col-span-1 cursor-pointer"><input type="checkbox" name="civilStatus" value="Others" checked={formData.civilStatus === 'Others'} onChange={handleInputChange} className="w-3 h-3 border-black" /> Other/s:</label>
                  </div>
                </div>
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">7.</span> HEIGHT (m)
                  </div>
                  <div className="w-[60%] flex items-center justify-center bg-white">
                    <input name="height" value={formData.height} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" />
                  </div>
                </div>
                <div className="flex h-8 print:h-6">
                  <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5">
                    <span className="font-bold mr-2">8.</span> WEIGHT (kg)
                  </div>
                  <div className="w-[60%] flex items-center justify-center bg-white">
                    <input name="weight" value={formData.weight} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" />
                  </div>
                </div>
              </div>

              {/* Right Side */}
              <div className="w-1/2 flex flex-col">
                <div className="border-b-[2px] flex border-black h-24 print:h-16">
                  <div className="w-[30%] bg-[#eaeaea] p-2 border-r-[2px] border-black print:p-1 flex flex-col items-center justify-center text-center">
                    <div className="text-[10px] print:text-[7px] w-full text-left"><span className="font-bold mr-2">16.</span> CITIZENSHIP</div>
                    <div className="text-[8px] normal-case mt-2 print:text-[5px]">If holder of dual citizenship,</div>
                    <div className="text-[8px] normal-case print:text-[4px]">please indicate the details.</div>
                  </div>
                  <div className="w-[70%] p-2 bg-white flex flex-col justify-center print:p-1 relative">
                    <div className="flex gap-8 mb-2 print:gap-2 print:mb-0 justify-center">
                      <label className="flex items-center gap-1 cursor-pointer print:gap-0.5">
                        <input type="checkbox" name="citizenship" value="Filipino" checked={formData.citizenship === 'Filipino'} onChange={handleInputChange} className="w-3 h-3 border-black print:w-2 print:h-2" /> 
                        <span>Filipino</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer print:gap-0.5">
                        <input type="checkbox" name="citizenship" value="Dual" checked={formData.citizenship === 'Dual'} onChange={handleInputChange} className="w-3 h-3 border-black print:w-2 print:h-2" /> 
                        <span>Dual Citizenship</span>
                      </label>
                    </div>
                    <div className="flex justify-center gap-6 text-[8px] mb-2 print:gap-2 print:text-[6px] print:mb-0 ml-12">
                      <label className="flex items-center gap-1 cursor-pointer print:ml-0 print:gap-0.5">
                        <input type="checkbox" name="citizenshipType" value="birth" checked={formData.citizenshipType === 'birth'} onChange={handleInputChange} className="w-3 h-3 border-black print:w-2 print:h-2" /> 
                        <span>by birth</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer print:gap-0.5">
                        <input type="checkbox" name="citizenshipType" value="naturalization" checked={formData.citizenshipType === 'naturalization'} onChange={handleInputChange} className="w-3 h-3 border-black print:w-2 print:h-2" /> 
                        <span>by naturalization</span>
                      </label>
                    </div>
                    <div className="flex items-end justify-center gap-2 mt-2 w-full">
                      <span className="text-[8px] normal-case print:text-[5px]">Pls. indicate country:</span>
                      <input name="country" value={formData.country} onChange={handleInputChange} className="border-b border-black w-1/2 outline-none uppercase text-center text-[10px] bg-transparent print:h-3 print:text-[6px]" />
                    </div>
                  </div>
                </div>

                <div className="flex flex-1 border-t-[2px] border-black">
                  <div className="w-[30%] bg-[#eaeaea] p-2 border-r-[2px] border-black flex flex-col justify-between print:p-1">
                     <div><span className="font-bold mr-2">17.</span> RESIDENTIAL ADDRESS</div>
                     <div className="text-center w-full mt-auto mb-2">ZIP CODE</div>
                  </div>
                  <div className="w-[70%] p-1 flex flex-col bg-white print:p-0.5 justify-between">
                    <div className="flex w-full">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="houseNo" value={formData.resAddress.houseNo} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">House/Block/Lot No.</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="street" value={formData.resAddress.street} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Street</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="village" value={formData.resAddress.village} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Subdivision/Village</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="barangay" value={formData.resAddress.barangay} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Barangay</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="city" value={formData.resAddress.city} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">City/Municipality</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="province" value={formData.resAddress.province} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Province</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                       <input name="zip" value={formData.resAddress.zip} onChange={(e) => handleInputChange(e, 'resAddress')} className="w-full bg-transparent outline-none text-center text-[10px] h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* IDs and Permanent Address */}
            <div className="flex border-b-[4px] border-black">
              <div className="w-1/2 border-r-[2px] border-black flex flex-col">
                {[
                  { label: '9. BLOOD TYPE', name: 'bloodType' },
                  { label: '10. GSIS ID NO.', name: 'umid' },
                  { label: '11. PAG-IBIG ID NO.', name: 'pagibig' },
                  { label: '12. PHILHEALTH NO.', name: 'philhealth' },
                  { label: '13. SSS NO.', name: 'philsys' },
                  { label: '14. TIN NO.', name: 'tin' },
                  { label: '15. AGENCY EMPLOYEE NO.', name: 'agencyNo' }
                ].map((field, idx) => (
                  <div key={idx} className="flex border-b-[2px] border-black last:border-b-0 h-8 print:h-6">
                    <div className="w-[40%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">{field.label.split('.')[0]}.</span> {field.label.split('.')[1]}</div>
                    <div className="w-[60%] flex items-center justify-center bg-white">
                      <input name={field.name} value={formData[field.name]} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" />
                    </div>
                  </div>
                ))}
              </div>

              <div className="w-1/2 flex flex-col">
                <div className="flex flex-grow border-b-[2px] border-black">
                  <div className="w-[30%] bg-[#eaeaea] p-2 border-r-[2px] border-black flex flex-col justify-between print:p-1">
                     <div><span className="font-bold mr-2">18.</span> PERMANENT ADDRESS</div>
                     <div className="text-center w-full mt-auto mb-2">ZIP CODE</div>
                  </div>
                  <div className="w-[70%] p-1 flex flex-col bg-white print:p-0.5 justify-between">
                    <div className="flex w-full">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="houseNo" value={formData.permAddress.houseNo} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">House/Block/Lot No.</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="street" value={formData.permAddress.street} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Street</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="village" value={formData.permAddress.village} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Subdivision/Village</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="barangay" value={formData.permAddress.barangay} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Barangay</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="city" value={formData.permAddress.city} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">City/Municipality</span>
                      </div>
                      <div className="w-1/2 flex flex-col border-b border-black px-1 relative h-6 justify-end pb-0.5">
                        <input name="province" value={formData.permAddress.province} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px]" />
                        <span className="text-[6px] w-full text-center absolute bottom-0 left-0 italic font-normal text-gray-500">Province</span>
                      </div>
                    </div>
                    <div className="flex w-full mt-1">
                       <input name="zip" value={formData.permAddress.zip} onChange={(e) => handleInputChange(e, 'permAddress')} className="w-full bg-transparent outline-none text-center text-[10px] h-4" />
                    </div>
                  </div>
                </div>
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[30%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">19.</span> TELEPHONE NO.</div>
                  <div className="w-[70%] flex items-center justify-center bg-white"><input name="telNo" value={formData.telNo} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" /></div>
                </div>
                <div className="flex border-b-[2px] border-black h-8 print:h-6">
                  <div className="w-[30%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">20.</span> MOBILE NO.</div>
                  <div className="w-[70%] flex items-center justify-center bg-white"><input name="mobileNo" value={formData.mobileNo} onChange={handleInputChange} className="w-full h-full outline-none px-2 uppercase print:h-5" /></div>
                </div>
                <div className="flex h-8 print:h-6">
                  <div className="w-[30%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">21.</span> E-MAIL ADDRESS (if any)</div>
                  <div className="w-[70%] flex items-center justify-center bg-white"><input name="email" value={formData.email} onChange={handleInputChange} className="w-full h-full outline-none px-2 print:h-5" /></div>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION II: FAMILY BACKGROUND */}
          <div className="bg-[#999999] text-white p-1 italic font-bold text-sm border-b-[4px] border-black print:text-[9px] print:p-0.5">
            II. FAMILY BACKGROUND
          </div>

          <div className="border-b-[4px] border-black flex text-[10px] leading-none print:text-[7px] print:border">
            <div className="w-[60%] border-r-[4px] border-black flex flex-col">
              <div className="flex border-b-[2px] border-black h-7 print:h-5">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">22.</span> SPOUSE'S SURNAME</div>
                <div className="w-[65%] flex items-center justify-center bg-white">
                  <input name="surname" value={formData.spouse.surname} onChange={(e) => handleInputChange(e, 'spouse')} className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                </div>
              </div>
              <div className="flex border-b-[2px] border-black h-10 print:h-6">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center pl-6 print:p-0.5">FIRST NAME</div>
                <div className="w-[40%] flex items-center justify-center border-r-[2px] border-black bg-white">
                  <input name="firstName" value={formData.spouse.firstName} onChange={(e) => handleInputChange(e, 'spouse')} className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                </div>
                <div className="w-[25%] bg-[#eaeaea] p-1 text-[7px] leading-tight flex flex-col justify-center items-center print:text-[5px]">
                  NAME EXTENSION (JR., SR)
                  <input name="nameExt" value={formData.spouse.nameExt} onChange={(e) => handleInputChange(e, 'spouse')} className="bg-white border-none mt-0.5 outline-none px-1 h-4 w-3/4 text-center print:h-3 print:text-[5px]" />
                </div>
              </div>
              {['MIDDLE NAME', 'OCCUPATION', 'EMPLOYER/BUSINESS NAME', 'BUSINESS ADDRESS', 'TELEPHONE NO.'].map((label, idx) => (
                <div key={idx} className="flex border-b-[2px] border-black h-7 print:h-5">
                  <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center pl-6 print:p-0.5">{label}</div>
                  <div className="w-[65%] flex items-center justify-center bg-white">
                    <input name={label === 'MIDDLE NAME' ? 'middleName' : label === 'OCCUPATION' ? 'occupation' : label === 'EMPLOYER/BUSINESS NAME' ? 'employer' : label === 'BUSINESS ADDRESS' ? 'businessAddr' : 'telNo'} 
                      value={formData.spouse[label === 'MIDDLE NAME' ? 'middleName' : label === 'OCCUPATION' ? 'occupation' : label === 'EMPLOYER/BUSINESS NAME' ? 'employer' : label === 'BUSINESS ADDRESS' ? 'businessAddr' : 'telNo']} 
                      onChange={(e) => handleInputChange(e, 'spouse')} 
                      className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                  </div>
                </div>
              ))}
              <div className="flex border-b-[2px] border-black h-7 print:h-5">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">24.</span> FATHER'S SURNAME</div>
                <div className="w-[65%] flex items-center justify-center bg-white">
                  <input name="surname" value={formData.father.surname} onChange={(e) => handleInputChange(e, 'father')} className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                </div>
              </div>
              <div className="flex border-b-[2px] border-black h-10 print:h-6">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center pl-6 print:p-0.5">FIRST NAME</div>
                <div className="w-[40%] flex items-center justify-center border-r-[2px] border-black bg-white">
                  <input name="firstName" value={formData.father.firstName} onChange={(e) => handleInputChange(e, 'father')} className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                </div>
                <div className="w-[25%] bg-[#eaeaea] p-1 text-[7px] leading-tight flex flex-col justify-center items-center print:text-[5px]">
                  NAME EXTENSION (JR., SR)
                  <input name="nameExt" value={formData.father.nameExt} onChange={(e) => handleInputChange(e, 'father')} className="bg-white border-none mt-0.5 outline-none px-1 h-4 w-3/4 text-center print:h-3 print:text-[5px]" />
                </div>
              </div>
              <div className="flex border-b-[2px] border-black h-7 print:h-5">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center pl-6 print:p-0.5">MIDDLE NAME</div>
                <div className="w-[65%] flex items-center justify-center bg-white">
                  <input name="middleName" value={formData.father.middleName} onChange={(e) => handleInputChange(e, 'father')} className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                </div>
              </div>
              <div className="flex border-b-[2px] border-black h-7 print:h-5">
                <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center print:p-0.5"><span className="font-bold mr-2">25.</span> MOTHER'S MAIDEN NAME</div>
                <div className="w-[65%] bg-white"></div>
              </div>
              {['SURNAME', 'FIRST NAME', 'MIDDLE NAME'].map((label, idx) => (
                <div key={idx} className="flex border-b-[2px] border-black last:border-b-0 h-7 print:h-5">
                  <div className="w-[35%] bg-[#eaeaea] p-1 border-r-[2px] border-black flex items-center pl-6 print:p-0.5">{label}</div>
                  <div className="w-[65%] flex items-center justify-center bg-white">
                    <input name={label === 'SURNAME' ? 'surname' : label === 'FIRST NAME' ? 'firstName' : 'middleName'} 
                      value={formData.mother[label === 'SURNAME' ? 'surname' : label === 'FIRST NAME' ? 'firstName' : 'middleName']} 
                      onChange={(e) => handleInputChange(e, 'mother')} 
                      className="w-full h-full outline-none uppercase px-2 print:text-[6px]" />
                  </div>
                </div>
              ))}
            </div>

            {/* RIGHT COLUMN: Children */}
            <div className="w-[40%] flex flex-col">
              <div className="flex border-b-[2px] border-black text-center bg-[#eaeaea] h-10 print:h-5">
                <div className="w-[65%] p-1 border-r-[2px] border-black flex items-center justify-start text-[10px] print:text-[7px]">
                  <span className="font-bold ml-1 mr-2">23.</span> NAME of CHILDREN (Write full name and list all) 
                </div>
                <div className="w-[35%] p-1 flex items-center justify-center text-[10px] print:text-[7px]">DATE OF BIRTH (mm/dd/yyyy)</div>
              </div>
              <div className="flex flex-col flex-grow">
                {formData.children.map((child, i) => {
                  return (
                    <div key={i} className={`flex border-b-[2px] border-black h-[1.53rem] last:border-b-0 bg-white`}>
                      <div className="w-[65%] border-r-[2px] border-black flex items-center justify-center p-0">
                        <input name="name" value={child.name} onChange={(e) => handleInputChange(e, 'children', i)} className="w-full h-full outline-none px-2 uppercase text-[10px] print:text-[6px]" />
                      </div>
                      <div className="w-[35%] items-center justify-center relative bg-white p-0">
                        <input type="text" name="dob" value={child.dob} onChange={(e) => handleInputChange(e, 'children', i)} className="w-full h-full outline-none text-[10px] text-center print:text-[6px]" />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="h-6 p-0.5 text-[10px] text-red-600 italic text-center font-bold flex items-center justify-center bg-white border-t-[4px] border-black print:text-[5px] print:h-4">
                (Continue on separate sheet if necessary)
              </div>
            </div>
          </div>

          {/* SECTION III: EDUCATIONAL BACKGROUND */}
          <div className="bg-[#999999] text-white p-1 italic font-bold text-sm border-b-[4px] border-black print:text-[9px] print:p-0.5">
            III. EDUCATIONAL BACKGROUND
          </div>

          <div className="bg-white print:border">
            <table className="w-full text-[10px] text-center border-collapse print:text-[7px]">
              <thead className="bg-[#eaeaea]">
                <tr className="border-b-[4px] border-black">
                  <th className="border-r-[2px] border-black p-1 font-normal w-[15%] print:p-0.5 text-left align-top" rowSpan="2"><span className="font-bold mr-1">26.</span><br/><span className="w-full text-center block mt-2">LEVEL</span></th>
                  <th className="border-r-[2px] border-black p-1 font-normal w-[20%] print:p-0.5 leading-tight" rowSpan="2">NAME OF SCHOOL<br/>(Write in full)</th>
                  <th className="border-r-[2px] border-black p-1 font-normal w-[20%] print:p-0.5 leading-tight" rowSpan="2">BASIC EDUCATION/DEGREE/COURSE<br/>(Write in full)</th>
                  <th className="border-r-[2px] border-black p-1 font-normal w-[15%] print:p-0.5 leading-tight" colSpan="2">PERIOD OF ATTENDANCE</th>
                  <th className="border-r-[2px] border-black p-1 font-normal w-[10%] print:p-0.5 leading-tight" rowSpan="2">HIGHEST LEVEL/<br/>UNITS EARNED<br/>(if not graduated)</th>
                  <th className="border-r-[2px] border-black p-1 font-normal w-[8%] print:p-0.5 leading-tight" rowSpan="2">YEAR<br/>GRADUATED</th>
                  <th className="p-1 font-normal w-[12%] print:p-0.5 leading-tight" rowSpan="2">SCHOLARSHIP/<br/>ACADEMIC<br/>HONORS RECEIVED</th>
                </tr>
                <tr className="border-b-[4px] border-black">
                  <th className="border-r-[2px] border-black p-1 font-normal text-[9px] print:text-[5px]">From</th>
                  <th className="border-r-[2px] border-black p-1 font-normal text-[9px] print:text-[5px]">To</th>
                </tr>
              </thead>
              <tbody>
                {['elementary', 'secondary', 'vocational', 'college', 'graduate'].map((level, idx) => (
                  <tr key={idx} className="border-b-[2px] border-black h-8 print:h-6 last:border-b-0">
                    <td className="bg-[#eaeaea] border-r-[2px] border-black p-1 font-normal text-left text-[9px] leading-tight print:text-[6px] print:p-0.5 uppercase pl-2">
                       {level === 'vocational' ? 'VOCATIONAL / TRADE COURSE' : level === 'graduate' ? 'GRADUATE STUDIES' : level}
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="school" value={formData.education[level].school} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none p-1 text-[10px] uppercase text-center flex items-center justify-center bg-transparent print:text-[6px] print:p-0" />
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="degree" value={formData.education[level].degree} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none p-1 text-[10px] uppercase text-center bg-transparent print:text-[6px] print:p-0" />
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="from" value={formData.education[level].from} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none text-center text-[10px] bg-transparent print:text-[6px]" />
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="to" value={formData.education[level].to} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none text-center text-[10px] bg-transparent print:text-[6px]" />
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="units" value={formData.education[level].units} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none p-1 text-[10px] uppercase text-center bg-transparent print:text-[6px] print:p-0" />
                    </td>
                    <td className="border-r-[2px] border-black p-0">
                      <input name="year" value={formData.education[level].year} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none text-center text-[10px] bg-transparent print:text-[6px]" />
                    </td>
                    <td className="p-0">
                      <input name="honors" value={formData.education[level].honors} onChange={(e) => handleInputChange(e, 'education', null, level)} className="w-full h-full outline-none p-1 text-[10px] uppercase text-center bg-transparent print:text-[6px] print:p-0" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FOOTER */}
          <div className="border-y-[4px] border-black text-center text-red-600 italic font-bold text-[10px] py-0.5 bg-white print:text-[5px] print:border">
            (Continue on separate sheet if necessary)
          </div>

          <div className="flex bg-white h-10 print:h-8 print:border">
            <div className="w-[15%] bg-[#eaeaea] border-r-[4px] border-black flex items-center justify-center italic font-bold text-[11px] print:text-[7px] print:p-0 uppercase">SIGNATURE</div>
            
            {/* Interactive E-Signature Canvas */}
            <div className="w-[55%] border-r-[4px] border-black relative bg-white flex items-center justify-center">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={finishDrawing}
                onMouseLeave={finishDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={finishDrawing}
                width={500}
                height={80}
                className="absolute inset-0 w-full h-full cursor-crosshair z-10 touch-none"
              />
              {!isDrawing && (
                <div className="absolute text-red-600 text-[10px] italic text-center print:text-[6px] z-0 pointer-events-none select-none opacity-50">
                  (wet signature/e-signature/digital certificate)
                </div>
              )}
              <button 
                onClick={clearSignature} 
                className="absolute top-1 right-1 bg-gray-200 text-black text-[8px] px-1 rounded z-20 print:hidden shadow-sm font-bold uppercase"
              >
                Clear
              </button>
            </div>

            <div className="w-[10%] bg-[#eaeaea] border-r-[4px] border-black flex items-center justify-center italic font-bold text-[11px] print:text-[7px] print:p-0 uppercase">DATE</div>
            <div className="w-[20%] flex items-center justify-center">
              <input name="signatureDate" value={formData.signatureDate} onChange={handleInputChange} className="w-full h-full outline-none text-center bg-transparent print:text-[6px]" />
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-right text-[9px] italic mt-1 pr-1 font-bold">
        CS FORM 212 (Revised 2025), Page 1 of 4
      </div>

      <div className="mt-6 flex justify-end gap-4 print:hidden">
        <button onClick={() => window.print()} className="bg-blue-600 text-white px-6 py-2 rounded font-bold uppercase text-sm">Print / Save</button>
        <button onClick={generatePDF} className="bg-red-700 text-white px-6 py-2 rounded font-bold uppercase text-sm shadow-lg">Download Official PDF</button>
      </div>
    </div>
  );
};

export default PdsPage;