import React, { useState, useEffect } from 'react';
import { EmergencyCase, Severity, ReadinessStatus } from '../types';
import { Activity, CheckCircle, User, Heart, Wind, Thermometer, AlertCircle, Info, FileText, ShieldCheck, Clock } from 'lucide-react';
import ImageModal from '../components/ImageModal';

interface Props {
  activeCase: EmergencyCase;
  updateCase: (updates: Partial<EmergencyCase>, targetId?: string) => void;
}

const HospitalDashboard: React.FC<Props> = ({ activeCase, updateCase }) => {

  const [activeTab, setActiveTab] = useState<'info' | 'medical' | 'telemetry'>('info');
  const [selectedPhoto, setSelectedPhoto] = useState<{ src: string, title: string } | null>(null);
  const [livePulse, setLivePulse] = useState(activeCase.vitals.pulse);

  useEffect(() => {
    if (activeTab === 'telemetry') {
      const interval = setInterval(() => {
        setLivePulse(
          activeCase.vitals.pulse +
          (activeCase.vitals.pulse > 0 ? Math.floor(Math.random() * 3) - 1 : 0)
        );
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [activeTab, activeCase.vitals.pulse]);

  const toggleReadiness = (key: keyof ReadinessStatus) => {
    updateCase({
      readiness: { ...activeCase.readiness, [key]: !activeCase.readiness[key] }
    });
  };

  const statusColor =
    activeCase.severity === Severity.CRITICAL
      ? 'red'
      : activeCase.severity === Severity.MEDIUM
      ? 'yellow'
      : 'emerald';

  return (

<div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-24 relative z-10">

{selectedPhoto && (
<ImageModal
src={selectedPhoto.src}
title={selectedPhoto.title}
onClose={() => setSelectedPhoto(null)}
/>
)}

{/* HEADER */}

<div className={`bg-white border-2 border-${statusColor}-100 p-8 rounded-[3rem] shadow-2xl flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden`}>

<div className={`absolute left-0 top-0 bottom-0 w-3 bg-${statusColor}-600`} />

<div className="flex items-center gap-8">

<div className={`w-24 h-24 rounded-[2rem] bg-${statusColor}-600 text-white flex flex-col items-center justify-center`}>
<span className="text-4xl font-black italic">{activeCase.eta}</span>
<span className="text-[10px] font-black uppercase">Mins</span>
</div>

<div>

<div className="flex items-center gap-3 mb-2">

<h1 className="text-3xl font-black text-slate-950 uppercase italic">
Inbound Node: {activeCase.ambulanceId}
</h1>

{activeCase.identity.isPoliceVerified && (
<div className="px-3 py-1 bg-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase flex items-center gap-1.5 border border-emerald-200">
<ShieldCheck size={12} /> Authority Sync OK
</div>
)}

</div>

<div className="flex flex-wrap items-center gap-4">

<span className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 uppercase">
<User size={14} className="text-blue-500" />
{activeCase.isUnknown
? 'Session UID: ' + activeCase.identity.temporaryId
: activeCase.identity.name}
</span>

<span className="flex items-center gap-2 px-4 py-1.5 bg-slate-50 rounded-xl text-xs font-bold border border-slate-100 uppercase">
<AlertCircle size={14} className="text-red-500" />
{activeCase.severity} Priority         
</span>

</div>
</div>
</div>

{/* TABS */}

<div className="flex flex-wrap gap-2 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">

{[
{ id: 'info', icon: Info, label: 'Admission' },
{ id: 'medical', icon: FileText, label: 'Nurse Feedback' },
{ id: 'telemetry', icon: Activity, label: 'Live Mesh' }
].map((tab) => (

<button
key={tab.id}
onClick={() => setActiveTab(tab.id as any)}
className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 ${
activeTab === tab.id
? 'bg-slate-900 text-white'
: 'text-slate-400 hover:text-slate-900'
}`}
>

<tab.icon size={14} /> {tab.label}

</button>

))}

</div>
</div>

{/* GRID */}

<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

<div className="lg:col-span-2 space-y-8">

{/* ADMISSION TAB */}

          {activeTab === 'info' && (

<div className="bg-white p-10 rounded-[2.5rem] border border-slate-200">

<h2 className="text-xl font-black mb-8">
Clinical Intelligence
</h2>

<div className="space-y-8">
  <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
    <span className="text-[9px] font-black text-slate-400 uppercase block mb-4">
      Authenticated Identity Stream
    </span>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Patient Name</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.name || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Age</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.age || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Gender</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.gender || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Blood Group</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.bloodGroup || '—'}</p>
      </div>
      <div className="md:col-span-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Address</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.address || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
        <p className="text-lg font-black text-slate-900 font-mono">{activeCase.identity.emergencyContactPhone || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Government ID Type</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.govIdType || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Government ID Number</p>
        <p className="text-lg font-black text-slate-900 font-mono">{activeCase.identity.govIdNumber || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Vehicle Number</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.vehicleNumber || '—'}</p>
      </div>
      <div>
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Case Reference</p>
        <p className="text-lg font-black text-slate-900">{activeCase.identity.caseReference || '—'}</p>
      </div>
      <div className="md:col-span-2">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Police Verification Status</p>
        <p className="text-lg font-black text-slate-900">
          {activeCase.identity.isPoliceVerified ? 'Verified' : 'Pending'}
        </p>
      </div>
    </div>
  </div>
</div>
</div>

)}

{/* NURSE FEEDBACK TAB */}

{activeTab === 'medical' && (

<div className="bg-white p-10 rounded-[3rem] border border-slate-200 space-y-10">

<h2 className="text-xl font-black flex items-center gap-3">
<FileText className="text-blue-600" size={24} />
Nurse Clinical Feedback
</h2>

<div className="bg-slate-50 border border-slate-200 rounded-[2.5rem] p-10 space-y-10">

<div className="flex gap-6">
<div className="w-1 bg-red-600 rounded-full" />
<div>
<p className="text-[10px] font-black text-slate-400 uppercase mb-2">
Trauma Presentation Log
</p>
<p className="text-2xl font-black italic">
{activeCase.medicalCondition.injuries || 'No primary trauma reported by ambulance node.'}
</p>
</div>
</div>

<div className="flex gap-6">
<div className="w-1 bg-yellow-500 rounded-full" />
<div>
<p className="text-[10px] font-black text-slate-400 uppercase mb-2">
Field Symptom Matrix
</p>
<p className="text-2xl font-black italic">
{activeCase.medicalCondition.symptoms || 'Awaiting clinical log updates from EMS.'}
</p>
</div>
</div>

</div>

<div className="p-10 bg-blue-900 rounded-[3rem] text-white shadow-xl">
<p className="text-[10px] font-black text-blue-300 uppercase mb-3">
EMS Administered Matrix
</p>
<p className="text-xl font-bold italic">
"{activeCase.medicalCondition.treatment || 'No specific field interventions synchronized for this registry context.'}"
</p>
</div>

</div>

)}

{/* LIVE MESH TAB */}

{activeTab === 'telemetry' && (

<div className="bg-white p-12 rounded-[3rem] border border-slate-200">

<h2 className="text-xl font-black flex items-center gap-3">
<Activity className="text-red-600" size={24} />
Field Telemetry Feed
</h2>

<div className="grid grid-cols-2 md:grid-cols-5 gap-12 mt-10">

{[
{ label: 'Pulse Rate', val: livePulse, unit: 'BPM' },
{ label: 'BP Systolic', val: activeCase.vitals.bp_sys, unit: 'mmHg' },
{ label: 'O2 Saturation', val: activeCase.vitals.spo2 + '%', unit: 'SpO2' },
{ label: 'Core Temp', val: activeCase.vitals.temp, unit: '°C' },
{ label: 'ETA', val: activeCase.eta, unit: 'mins', isEta: true }
].map((v) => (

<div key={v.label} className="flex flex-col gap-1">
{v.isEta && <Clock className="text-slate-400" size={20} />}
<div className="text-[10px] font-black uppercase">{v.label}</div>
<div className="text-6xl font-black">{v.val ?? '--'}</div>
<div className="text-[10px] uppercase">{v.unit}</div>
</div>

))}

</div>
</div>

)}

</div>

{/* RIGHT PANEL */}

<div className="space-y-8">

<div className="bg-slate-950 p-12 rounded-[3rem] border border-slate-800">

<h3 className="text-[11px] font-black text-slate-600 uppercase mb-12">
Clinical Readiness Matrix
</h3>

<div className="space-y-5">

{[
{ key: 'icu', label: 'ICU Recovery Unit' },
{ key: 'blood', label: 'Blood Node Arranged' },
{ key: 'specialist', label: 'Clinical Specialist' },
{ key: 'equipment', label: 'Trauma Bay Triage' },
{ key: 'medicines', label: 'Clinical Pharmacy' }
].map((item) => (

<button
key={item.key}
onClick={() => toggleReadiness(item.key as any)}
className={`w-full p-7 rounded-3xl flex justify-between border-2 ${
activeCase.readiness[item.key as keyof ReadinessStatus]
? 'bg-emerald-600 text-white'
: 'bg-white/5 text-slate-500'
}`}
>

<span className="font-black text-[11px] uppercase">
{item.label}
</span>

{activeCase.readiness[item.key as keyof ReadinessStatus] ? (
<CheckCircle size={20} />
) : (
<div className="w-5 h-5 rounded-full border-2 border-slate-800" />
)}

</button>

))}

</div>
</div>

</div>

</div>

</div>

);
};

export default HospitalDashboard;