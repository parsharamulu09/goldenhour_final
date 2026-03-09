
import React, { useState, useRef, useEffect } from 'react';
import { EmergencyCase, Severity, Vitals, PatientIdentity, Evidence, MedicalCondition, ConditionState, ReadinessStatus } from '../types';
import { analyzeMedicalCase } from '../services/gemini';
import { mockStorage } from '../services/supabase';
import { Heart, Thermometer, Wind, Activity, Zap, Loader2, Hospital, MapPin, UserCheck, Phone, Camera, Upload, CheckCircle, Shield, UserX, Info, Send, FileText, ArrowRight, UserPlus, AlertCircle, RefreshCcw } from 'lucide-react';

interface Props {
  activeCase: EmergencyCase;
  updateCase: (updates: Partial<EmergencyCase>, targetId?: string) => void;
}

const AmbulanceDashboard: React.FC<Props> = ({ activeCase, updateCase }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'medical' | 'identity'>('medical');
  const [uploading, setUploading] = useState<keyof Evidence | null>(null);

  // Isolated Local Form States for state reset behavior
  const [medicalForm, setMedicalForm] = useState<MedicalCondition>({
    state: '',
    injuries: '',
    symptoms: '',
    treatment: '',
    medicalSentToHospital: false
  });

  const [identityForm, setIdentityForm] = useState<PatientIdentity>({
    name: '',
    bloodGroup: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    relationship: '',
    idSource: 'ID Card'
  });

  const [accidentLoc, setAccidentLoc] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ text: string, type: 'success' | 'info' } | null>(null);

  // Isolation & Reset logic when active context changes (New Patient button support)
  useEffect(() => {
    setMedicalForm({ state: '', injuries: '', symptoms: '', treatment: '', medicalSentToHospital: false });
    setIdentityForm({ name: '', bloodGroup: '', emergencyContactName: '', emergencyContactPhone: '', relationship: '', idSource: 'ID Card' });
    setAccidentLoc('');
    setStatusMessage(null);
    setActiveTab('medical');
  }, [activeCase.id]);

  const fileInputs = {
    patientPhoto: useRef<HTMLInputElement>(null),
    vehiclePhoto: useRef<HTMLInputElement>(null),
    scenePhoto: useRef<HTMLInputElement>(null),
  };

  const handleEtaChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0) {
      updateCase({ eta: numValue });
    }
  };

  const handleVitalChange = (key: keyof Vitals, value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      updateCase({
        vitals: { ...activeCase.vitals, [key]: numValue, lastUpdated: new Date().toISOString() }
      });
    }
  };

  const sendMedicalToHospital = () => {
    if (!activeCase.eta || activeCase.eta <= 0) {
      alert("Clinical Sync Protocol: ETA to Hospital (minutes) is mandatory before dispatching the case to Hospital.");
      return;
    }
    // Sync Medical + Vitals to Hospital Node
    updateCase({ 
      medicalCondition: { ...medicalForm, lastUpdatedByEMS: new Date().toISOString(), medicalSentToHospital: true },
      severity: activeCase.severity,
      eta: activeCase.eta
    });
    setStatusMessage({ text: "Clinical Data Sent to Hospital", type: 'success' });
    
    // RESET Medical Form State
    setMedicalForm({ state: '', injuries: '', symptoms: '', treatment: '', medicalSentToHospital: true });
    
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const sendToPolice = () => {
    if (!accidentLoc) {
      alert("Verification Protocol: Accident Location is mandatory for Police sync.");
      return;
    }
    // Sync Identity + Accident to Police Node
    updateCase({ 
      identity: { ...activeCase.identity, ...identityForm },
      accidentDetails: { ...activeCase.accidentDetails, accidentLocation: accidentLoc, identitySentToPolice: true },
      isUnknown: !identityForm.name 
    });
    setStatusMessage({ text: "Identity & Accident Synced", type: 'success' });
    
    // RESET Identity Form State
    setIdentityForm({ name: '', bloodGroup: '', emergencyContactName: '', emergencyContactPhone: '', relationship: '', idSource: 'ID Card' });
    setAccidentLoc('');
    
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const onFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: keyof Evidence) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploading(type);
      try {
        const url = await mockStorage.uploadFile(file);
        updateCase({ evidence: { ...activeCase.evidence, [type]: url } });
      } catch (err) {
        console.error("Asset Sync Error", err);
      } finally {
        setUploading(null);
      }
    }
  };

  const triggerGeminiAnalysis = async () => {
    setAnalyzing(true);
    const summary = await analyzeMedicalCase(activeCase.vitals, medicalForm.injuries || 'Trauma', activeCase.severity);
    updateCase({ geminiSummary: summary });
    setAnalyzing(false);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto flex flex-col gap-8 animate-in fade-in duration-500 pb-24 relative z-10">
      {statusMessage && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-4 border animate-in slide-in-from-bottom-8 bg-emerald-600 border-emerald-500 text-white">
          <CheckCircle size={24} />
          <div>
            <span className="font-black uppercase tracking-widest text-[11px] block">{statusMessage.text}</span>
            <span className="text-[9px] font-bold opacity-70 uppercase tracking-tighter">Real-time Synchronized</span>
          </div>
        </div>
      )}

      {/* Hidden File Inputs */}
      <input type="file" className="hidden" ref={fileInputs.patientPhoto} onChange={(e) => onFileUpload(e, 'patientPhoto')} />
      <input type="file" className="hidden" ref={fileInputs.vehiclePhoto} onChange={(e) => onFileUpload(e, 'vehiclePhoto')} />
      <input type="file" className="hidden" ref={fileInputs.scenePhoto} onChange={(e) => onFileUpload(e, 'scenePhoto')} />

      {/* Triage Status Bar */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl border border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden">
        <div className="flex items-center gap-6 z-10">
          <div className={`w-20 h-20 rounded-3xl flex flex-col items-center justify-center shadow-2xl transition-colors duration-500 ${activeCase.severity === Severity.CRITICAL ? 'bg-red-600 animate-pulse shadow-red-500/20' : activeCase.severity === Severity.MEDIUM ? 'bg-amber-600' : 'bg-emerald-600'}`}>
            <span className="text-[10px] font-black uppercase opacity-70 tracking-tighter">ETA</span>
            <span className="text-3xl font-black italic">{activeCase.eta}</span>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black tracking-tighter uppercase italic">{activeCase.id}</h1>
              <div className="px-2 py-0.5 bg-emerald-500/10 rounded-md text-[8px] font-black uppercase tracking-widest text-emerald-500 border border-emerald-500/20">Protocol Active</div>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-slate-400 italic">
              <span className="flex items-center gap-1.5"><MapPin size={12} className="text-red-500" /> Inbound Context</span>
              <ArrowRight size={12} className="text-slate-700" />
<span className="flex items-center gap-1.5 text-blue-400 underline underline-offset-4 decoration-blue-400/20">
{activeCase.accidentDetails.hospitalLocation}
</span>            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 p-1.5 bg-white/5 rounded-2xl z-10 border border-white/10 backdrop-blur-md">
          {[
            { id: 'medical', label: 'Hospital Node', icon: FileText },
            { id: 'identity', label: 'Police Node', icon: Shield }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
                activeTab === tab.id ? 'bg-white text-slate-900 shadow-xl' : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {activeTab === 'medical' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-500">
              {/* Telemetry Stream */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
                <div className="flex items-center justify-between mb-10">
                  <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tight flex items-center gap-3">
                    <Activity className="text-red-600" size={24} /> Biometric Matrix
                  </h2>
                  <div className="px-3 py-1 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-red-100 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse" /> Live Telemetry Linked
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {[
                    { label: 'Pulse Rate', key: 'pulse', unit: 'BPM', icon: Heart, color: 'red' },
                    { label: 'Systolic', key: 'bp_sys', unit: 'mmHg', icon: Activity, color: 'purple' },
                    { label: 'SpO2 Sat', key: 'spo2', unit: '%', icon: Wind, color: 'blue' },
                    { label: 'Body Temp', key: 'temp', unit: '°C', icon: Thermometer, color: 'orange' },
                  ].map((v) => (
                    <div key={v.key} className="space-y-2 group">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 transition-colors group-focus-within:text-red-600">{v.label}</label>
                      <div className={`p-5 bg-slate-50 rounded-2xl border border-slate-100 group-focus-within:bg-white group-focus-within:border-red-400 group-focus-within:shadow-xl transition-all`}>
                        <input 
                          type="number"
                          value={(activeCase.vitals as any)[v.key] || ''}
                          onChange={(e) => handleVitalChange(v.key as any, e.target.value)}
                          className="bg-transparent text-3xl font-black text-slate-900 w-full outline-none cursor-text select-text"
                          placeholder="0"
                        />
                        <span className="text-[9px] font-black text-slate-400 uppercase">{v.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-8">
                  <div className="space-y-2 group max-w-xs">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic group-focus-within:text-red-600 transition-colors">
                      ETA to Hospital (minutes)
                    </label>
                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 group-focus-within:bg-white group-focus-within:border-red-400 group-focus-within:shadow-xl transition-all">
                      <input
                        type="number"
                        min={0}
                        value={Number.isFinite(activeCase.eta) && activeCase.eta > 0 ? activeCase.eta : ''}
                        onChange={(e) => handleEtaChange(e.target.value)}
                        className="bg-transparent text-3xl font-black text-slate-900 w-full outline-none cursor-text select-text"
                        placeholder="0"
                      />
                      <span className="text-[9px] font-black text-slate-400 uppercase">Minutes to arrival</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Clinical Condition (EMS to Hospital) */}
              <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-8">
                <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tight flex items-center gap-3">
                  <FileText className="text-blue-600" size={24} /> Hospital Clinical Update
                </h2>
                
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Assessment</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {['STABLE', 'CRITICAL', 'UNCONSCIOUS', 'SEMI-CONSCIOUS'].map((s) => (
                        <button
                          key={s}
                          onClick={() => setMedicalForm(prev => ({ ...prev, state: s as ConditionState }))}
                          className={`py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all border-2 ${medicalForm.state === s ? 'bg-blue-600 border-blue-600 text-white shadow-xl scale-[1.02]' : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
                        >
                          {s.replace('-', ' ')}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic underline underline-offset-4 decoration-blue-500/20">Visible Field Injuries</label>
                      <input 
                        type="text" 
                        value={medicalForm.injuries} 
                        onChange={(e) => setMedicalForm(prev => ({ ...prev, injuries: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-bold outline-none cursor-text select-text focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-900"
                        placeholder="Trauma signatures, fractures..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic underline underline-offset-4 decoration-blue-500/20">Clinical Symptom Log</label>
                      <textarea 
                        value={medicalForm.symptoms} 
                        onChange={(e) => setMedicalForm(prev => ({ ...prev, symptoms: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 font-bold outline-none h-32 cursor-text select-text focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-900 resize-none"
                        placeholder="Breathing pattern, pain levels, pupil state..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic underline underline-offset-4 decoration-blue-500/20">Immediate Field Interventions</label>
                      <textarea 
                        value={medicalForm.treatment} 
                        onChange={(e) => setMedicalForm(prev => ({ ...prev, treatment: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 font-bold outline-none h-32 cursor-text select-text focus:ring-4 focus:ring-blue-500/10 focus:bg-white transition-all text-slate-900 resize-none"
                        placeholder="Oxygen, tourniquet, splinting, IV line..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col gap-4">
                    <button 
                      onClick={sendMedicalToHospital}
                      disabled={!medicalForm.state}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest shadow-2xl shadow-blue-500/30 transition-all hover:scale-[1.01] active:scale-[0.98]"
                    >
                      <Send size={18} />
                      Send Clinical Condition to Hospital
                    </button>
                    
                    <button 
                      onClick={triggerGeminiAnalysis}
                      disabled={analyzing}
                      className="w-full bg-slate-950 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 uppercase text-[10px] tracking-widest shadow-xl border border-white/5 hover:bg-black active:scale-[0.98]"
                    >
                      {analyzing ? <Loader2 className="animate-spin" /> : <Zap className="text-yellow-400" size={16} fill="currentColor" />}
                      Sync Gemini Decision Support
                    </button>
                  </div>
                  
                  {activeCase.geminiSummary && (
                    <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] italic font-medium text-slate-700 leading-relaxed border-l-[10px] border-l-red-600 animate-in fade-in slide-in-from-left-4 shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-6 opacity-[0.03] text-slate-900"><Activity size={80} /></div>
                      <div className="text-[9px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2 not-italic underline underline-offset-4 decoration-red-600/20">
                        <Shield size={12} className="text-red-500" /> AI Clinical Synthesis
                      </div>
                      "{activeCase.geminiSummary}"
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'identity' && (
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 space-y-10 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-black text-slate-950 uppercase italic tracking-tight flex items-center gap-3">
                  <Shield className="text-amber-600" size={24} /> Police Authority
                </h2>
                <div className="p-3 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-between shadow-sm min-w-[220px]">
                  <div>
                    <span className="text-[8px] font-black text-red-400 uppercase tracking-widest block mb-0.5 italic">Session UID</span>
                    <span className="text-lg font-black text-red-600 font-mono tracking-tighter">{activeCase.identity.temporaryId}</span>
                  </div>
                  <UserX className="text-red-500" size={20} />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-1 group">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic group-focus-within:text-amber-600 transition-colors">Incident Scene Location (Mandatory for Police)</label>
                  <input 
                    type="text" 
                    required
                    value={accidentLoc}
                    onChange={(e) => setAccidentLoc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-5 font-black outline-none cursor-text select-text focus:ring-4 focus:ring-amber-500/10 focus:bg-white transition-all text-slate-950"
                    placeholder="Intersection or physical registry node..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-widest border-b border-slate-200 pb-2 italic underline underline-offset-8">Identity Log (Known)</h3>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1 italic">Legal Full Name</label>
                        <input 
                          type="text" 
                          value={identityForm.name} 
                          onChange={(e) => setIdentityForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none cursor-text select-text focus:bg-white transition-all text-slate-950"
                          placeholder="Verified registry name..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Registry Blood Group</label>
                        <input 
                          type="text" 
                          value={identityForm.bloodGroup} 
                          onChange={(e) => setIdentityForm(prev => ({ ...prev, bloodGroup: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none uppercase text-slate-950"
                          placeholder="A+ / O- / etc..."
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">POC Secure line</label>
                        <input 
                          type="tel" 
                          value={identityForm.emergencyContactPhone} 
                          onChange={(e) => setIdentityForm(prev => ({ ...prev, emergencyContactPhone: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 font-bold outline-none text-slate-950"
                          placeholder="+1 ..."
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-950 uppercase tracking-widest border-b border-slate-200 pb-2 italic underline underline-offset-8">Forensic Assets (Unknown)</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { key: 'patientPhoto', label: 'Face Scan', icon: Camera },
                        { key: 'vehiclePhoto', label: 'Asset Check', icon: Info },
                        { key: 'scenePhoto', label: 'Incident Scene', icon: Upload }
                      ].map((btn) => (
                        <button 
                          key={btn.key}
                          onClick={() => (fileInputs as any)[btn.key].current?.click()}
                          disabled={uploading === btn.key}
                          className={`aspect-square rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-2 transition-all relative group ${activeCase.evidence[btn.key as keyof Evidence] ? 'bg-emerald-50 border-emerald-400 text-emerald-600' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-amber-400 hover:bg-white'}`}
                        >
                          {uploading === btn.key ? <Loader2 className="animate-spin" /> : activeCase.evidence[btn.key as keyof Evidence] ? <CheckCircle size={24} /> : <btn.icon size={24} strokeWidth={1.5} />}
                          <span className="text-[9px] font-black uppercase tracking-widest">{btn.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  onClick={sendToPolice}
                  className="w-full bg-amber-600 hover:bg-amber-700 text-white font-black py-6 rounded-3xl flex items-center justify-center gap-4 uppercase text-[11px] tracking-widest shadow-2xl shadow-amber-500/30 transition-all active:scale-[0.98]"
                >
                  <Shield size={18} />
                  Authorize Forensic Transmission to Police
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Real-time Monitoring Sidebar */}
        <div className="space-y-8">
          {/* Hospital Readiness Stream (FIX) */}
          <div className="bg-slate-950 p-10 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-1000">
              <Hospital size={120} />
            </div>
            <div className="flex items-center gap-3 mb-10 relative z-10">
              <RefreshCcw className="text-blue-400 animate-spin-slow" size={18} />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500 italic underline underline-offset-8">Hospital Prep Feed</h3>
            </div>
            <div className="space-y-5 relative z-10">
              {[
                { label: 'ICU Recovery Unit', key: 'icu' },
                { label: 'Blood Node Reserve', key: 'blood' },
                { label: 'Triage Specialists', key: 'specialist' },
                { label: 'Trauma Bay Active', key: 'equipment' },
              ].map((item) => (
                <div key={item.key} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                  <span className="text-slate-500 italic">{item.label}</span>
                  <span className={`px-2 py-0.5 rounded italic font-bold ${activeCase.readiness[item.key as keyof ReadinessStatus] ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/10' : 'bg-red-500/10 text-red-500/60'}`}>
                    {activeCase.readiness[item.key as keyof ReadinessStatus] ? 'READY' : 'STANDBY'}
                  </span>
                </div>
              ))}
              <div className="pt-6 border-t border-white/5 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse shadow-lg shadow-emerald-500/50" />
                  <span className="text-[10px] text-emerald-500 font-black uppercase tracking-widest leading-none">Matrix Pulse Sync OK</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-sm pointer-events-auto">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8 px-1 flex items-center gap-2 underline underline-offset-8 decoration-red-600/30">
              <Shield size={12} className="text-red-600" /> Triage Selection
            </h3>
            <div className="space-y-4">
              {[Severity.LOW, Severity.MEDIUM, Severity.CRITICAL].map((s) => (
                <button
                  key={s}
                  onClick={() => updateCase({ severity: s })}
                  className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border-2 pointer-events-auto ${activeCase.severity === s ? (s === Severity.CRITICAL ? 'bg-red-600 border-red-600 text-white shadow-xl scale-[1.05]' : s === Severity.MEDIUM ? 'bg-amber-500 border-amber-500 text-white shadow-xl scale-[1.05]' : 'bg-emerald-600 border-emerald-600 text-white shadow-xl scale-[1.05]') : 'bg-slate-50 border-slate-50 text-slate-400 hover:border-slate-200'}`}
                >
                  {s} Priority Level
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmbulanceDashboard;
