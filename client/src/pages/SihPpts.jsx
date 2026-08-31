import React from 'react';
import toast from 'react-hot-toast';

const SIH_PPTS_DATA = [
  {
    id: 'sih-power-rangers',
    teamName: 'Power Rangers',
    sihTheme: 'Travel and Tourism',
    year: 2025,
    psCode: 'SIH25032',
    problemStatementTitle: 'Development of a Smart Digital Platform to Promote Eco & Cultural Tourism in Jharkhand (Jharkhand Express)',
    description: `Our squad Power Rangers tackled SIH25032 for Jharkhand Tourism. We engineered an AI-powered multilingual travel platform integrated with blockchain-based artisan verification and offline-first navigation. The biggest turning point during Grand Finale judging was demonstrating real-time voice assistance and showing how local tribal handicraft artisans get verified payouts. Keep your pitch deck focused on the core architecture and user impact rather than generic slides!`,
    summaryText: `Transforming Jharkhand Tourism with Technology:
• Multilingual Chatbot: 24/7 assistance to tourists in their preferred language.
• Blockchain-Secured Guide Verification & Payments: Eliminates fraud through secure, verified tourism services.
• Hyperlocal, AI-Driven Itinerary Planner: Tailored experiences showcasing Jharkhand's rich tribal culture.
• Interactive Hyperlocal Maps: Powered by Mappls India for accurate on-ground navigation.
• Tribal Marketplace: Protected by blockchain smart contracts to empower artisans with direct, authentic craft sales.`
  },
  {
    id: 'sih-future-frameworks',
    teamName: 'Future Frameworks (SkillVista)',
    sihTheme: 'Smart Education & Learning',
    year: 2024,
    psCode: 'PS 1777',
    problemStatementTitle: 'AI-driven Assessment Platform (SkillVista) · Ministry of Skill Development and Entrepreneurship (MSDE)',
    description: `Winner at SIH 2024! Our team Future Frameworks from IET-DAVV Indore built SkillVista, an AI-driven assessment platform featuring multi-format evaluation, PWD accessibility with speech-to-text, and real-time proctoring. For future participants: ensure you have a live, working prototype deployed before the first evaluation round. Demonstrating working code and accessible UI always sets you apart from purely conceptual pitches!`,
    summaryText: `Key features of SkillVista AI-Powered Assessment Tool:
• Holistic Multi-Mode Assessment: Evaluates pen-paper handwriting scanning, online MCQs, practical coding, and viva voce.
• Inclusivity for PWD Candidates: Built with voice-to-text, text-to-speech, and customized accessibility controls.
• AI-Powered Personalization: Adapts questions dynamically based on individual candidate performance and learning gaps.
• Real-Time Proctored Analytics: Automated eye-tracking and audio analysis with instant feedback for educators.`
  },
  {
    id: 'sih-cattle-coders',
    teamName: 'Cattle-Coders (JeevSarthi)',
    sihTheme: 'Agriculture, FoodTech & Rural Development',
    year: 2025,
    psCode: 'SIH 25007',
    problemStatementTitle: 'Development of a Digital Farm Management Portal for Monitoring Maximum Residue Limits (MRL) and Antimicrobial Usage (AMU) in Livestock (JeevSarthi)',
    description: `JeevSarthi is an AI-enabled livestock digital platform that monitors Antimicrobial Usage (AMU) and Maximum Residue Limits (MRL) to ensure food safety and prevent antibiotic resistance. It unites farmers, veterinarians, and testing labs on a single cloud and mobile-friendly system with automated drug withdrawal period calculators and digital Pashu Swasthya health cards.`,
    summaryText: `Innovative Livestock Management Solution:
• Unified Digital Ecosystem: Seamless coordination between farmers, PashuMitras, veterinary clinics, and testing labs.
• Automated Risk Detection: Real-time calculation of AMU values generating instant warnings on safety breaches.
• Pashu Swasthya Health Card: Digital animal passport storing vaccination history and drug administration logs.
• Offline-First Mobile Access: Tailored for rural adoption with multilingual voice support and barcode drug scanners.`
  },
  {
    id: 'sih-imaginary-coders',
    teamName: 'Imaginary_coders (KrashiBandhu)',
    sihTheme: 'Agriculture, FoodTech & Rural Development',
    year: 2025,
    psCode: 'SIH25262',
    problemStatementTitle: 'AI based real-time crop image analytics for crop insurance - PMFBY (KrashiBandhu)',
    description: `KrashiBandhu revolutionizes crop insurance claims under PMFBY. Using edge computer vision (CNNs and Vision Transformers), farmers capture periodic field photos to detect crop stress, disease, and yield potential. Geotagged images cross-validate with satellite NDVI imagery to eliminate middlemen, accelerate Direct Benefit Transfers (DBT), and ensure tamper-proof insurance settlements.`,
    summaryText: `Key Solution Highlights:
• Edge AI Diagnostics: Analyzes crop stages and pest infections on-device with offline capability.
• Satellite & Weather Cross-Verification: Live satellite overlay (NDVI) validates claim legitimacy against natural calamities.
• Digital PMFBY Wallet: Direct insurance claim disbursements eliminating fraud and administrative bottlenecks.
• AR-Guided Image Capture: Prevents false or duplicate submissions through strict metadata and lighting checks.`
  }
];

const SihPpts = () => {
  const handleDownload = (entry) => {
    const filename = `${entry.teamName}.pptx`;
    
    // Generate a presentation document containing the full pitch deck content
    const presentationContent = `SMART INDIA HACKATHON PRESENTATION
=====================================================
Team: ${entry.teamName}
Theme: ${entry.sihTheme}
Year: ${entry.year}
Problem Statement: ${entry.psCode} - ${entry.problemStatementTitle}
=====================================================

OVERVIEW & SOLUTION:
${entry.description}

TECHNICAL & SYSTEM HIGHLIGHTS:
${entry.summaryText}

Smart India Hackathon Winning Pitch Deck
Homiee - College Team Formation Platform
`;

    const blob = new Blob([presentationContent], {
      type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation;charset=utf-8'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success(`Downloading ${filename}`);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 font-sans text-[#F8FAFC]">
      {SIH_PPTS_DATA.map((entry, index) => (
        <div key={entry.id} className="space-y-4 text-left">
          {/* Team Name Heading */}
          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {entry.teamName}
          </h2>

          {/* Subheading / Tag Line: Theme · Year */}
          <div className="text-xs sm:text-sm font-mono text-[#FBBF24] font-medium tracking-wide flex items-center gap-2 flex-wrap">
            <span>{entry.sihTheme}</span>
            <span className="text-[#64748B]">·</span>
            <span>{entry.year}</span>
            {entry.psCode && (
              <>
                <span className="text-[#64748B]">·</span>
                <span className="text-[#38BDF8]">{entry.psCode}</span>
              </>
            )}
          </div>

          {/* Problem Statement Title */}
          {entry.problemStatementTitle && (
            <p className="text-xs font-mono text-[#94A3B8] font-bold">
              🎯 {entry.problemStatementTitle}
            </p>
          )}

          {/* Description of Problem Statement & Solution */}
          <p className="text-sm sm:text-base text-[#CBD5E1] leading-relaxed whitespace-pre-line font-normal">
            {entry.description}
          </p>

          {/* Technical highlights summary */}
          <div className="bg-[#0B132B]/60 border border-[#1E293B] p-4 rounded-xl text-xs text-[#94A3B8] font-mono whitespace-pre-line leading-relaxed">
            {entry.summaryText}
          </div>

          {/* Download PPT Button */}
          <div className="pt-2">
            <button
              onClick={() => handleDownload(entry)}
              className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#E08D00] text-black font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-amber-500/10 cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>📥</span>
              <span>Download PPT</span>
            </button>
          </div>

          {/* Visual Divider */}
          {index < SIH_PPTS_DATA.length - 1 && (
            <hr className="border-[#1E293B] pt-6 my-6 sm:my-8" />
          )}
        </div>
      ))}
    </div>
  );
};

export default SihPpts;

