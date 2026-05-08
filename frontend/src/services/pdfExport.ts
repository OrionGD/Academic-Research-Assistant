import { jsPDF } from 'jspdf';
import { Document } from '../types/api';

/**
 * Enterprise PDF Export Service
 * Programmatically constructs a high-fidelity, brand-aligned academic analysis report.
 */
export const pdfExportService = {
  /**
   * Export document intelligence analysis to a professional PDF file
   */
  exportAnalysisToPDF: async (doc: Document): Promise<void> => {
    if (!doc) {
      throw new Error('No document provided for PDF export');
    }

    const { title, authors, year, uploadDate, analysis } = doc;
    const authorStr = authors && authors.length > 0 ? authors.join(', ') : 'Unknown Author';
    const pubYear = year || new Date().getFullYear();
    const formattedUploadDate = uploadDate ? new Date(uploadDate).toLocaleDateString() : new Date().toLocaleDateString();

    // 1. Initialize jsPDF (A4 Portrait, Unit: mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - margin * 2; // 170mm

    // Color Palette matching premium SaaS aesthetics
    const colors = {
      primary: [15, 23, 42] as [number, number, number],      // Slate-900 (Dark Slate)
      accent: [99, 102, 241] as [number, number, number],     // Indigo-500 (Indigo)
      accentLight: [245, 247, 255] as [number, number, number], // Indigo-50 (Very Light Indigo)
      textDark: [30, 41, 59] as [number, number, number],      // Slate-800
      textMuted: [100, 116, 139] as [number, number, number],  // Slate-500
      border: [226, 232, 240] as [number, number, number],     // Slate-200
      emerald: [16, 185, 129] as [number, number, number],    // Emerald-500
      emeraldLight: [240, 253, 250] as [number, number, number], // Emerald-50
      amber: [245, 158, 11] as [number, number, number],       // Amber-500
      amberLight: [254, 243, 199] as [number, number, number],  // Amber-50
      cardBg: [248, 250, 252] as [number, number, number],     // Slate-50
    };

    let totalPages = 1;

    // Helper: Draw rounded card with optional left-bar accent color
    const drawCard = (
      x: number, 
      y: number, 
      w: number, 
      h: number, 
      bg: [number, number, number], 
      borderColor: [number, number, number], 
      leftBarColor?: [number, number, number]
    ) => {
      pdf.setFillColor(...bg);
      pdf.roundedRect(x, y, w, h, 3, 3, 'F');
      pdf.setDrawColor(...borderColor);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(x, y, w, h, 3, 3, 'D');
      if (leftBarColor) {
        pdf.setFillColor(...leftBarColor);
        pdf.rect(x, y, 2.5, h, 'F');
      }
    };

    // Helper: Draw small text badge
    const drawBadge = (
      x: number, 
      y: number, 
      text: string, 
      bg: [number, number, number], 
      textColor: [number, number, number]
    ): number => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      const textWidth = pdf.getTextWidth(text);
      const w = textWidth + 6;
      const h = 5;
      pdf.setFillColor(...bg);
      pdf.roundedRect(x, y - 3.5, w, h, 1.5, 1.5, 'F');
      pdf.setTextColor(...textColor);
      pdf.text(text, x + 3, y);
      return w;
    };

    // Helper: Draw Header & Footer for inner pages
    const drawHeaderFooter = (pageNumber: number) => {
      pdf.setPage(pageNumber);

      // Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setFillColor(...colors.accent);
      pdf.rect(margin, 12, 10, 1.5, 'F'); // Decorative rectangle

      pdf.setTextColor(...colors.textMuted);
      pdf.text('SCHOLARAI DEEP INTELLIGENCE REPORT', margin + 12, 15.5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.text(title.length > 50 ? `${title.slice(0, 50)}...` : title, pageWidth - margin, 15.5, { align: 'right' });

      // Header line
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.2);
      pdf.line(margin, 18, pageWidth - margin, 18);

      // Footer
      pdf.line(margin, pageHeight - 18, pageWidth - margin, pageHeight - 18);
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('CONFIDENTIAL - ENTERPRISE LEVEL INTELLIGENCE', margin, pageHeight - 13);
      pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, pageHeight - 13, { align: 'right' });
    };

    // Helper: Add wrapping text chunk and handle page overflowing
    const addTextWrapped = (
      text: string, 
      startY: number, 
      fontSize: number, 
      fontStyle: 'normal' | 'bold' | 'italic' = 'normal', 
      textColor = colors.textDark,
      lineHeight = 6
    ): number => {
      pdf.setFont('helvetica', fontStyle);
      pdf.setFontSize(fontSize);
      pdf.setTextColor(...textColor);

      const splitLines = pdf.splitTextToSize(text, contentWidth);
      let currentY = startY;

      for (let i = 0; i < splitLines.length; i++) {
        if (currentY > pageHeight - 25) {
          totalPages++;
          pdf.addPage();
          currentY = 28; // Start below the header
        }
        pdf.text(splitLines[i], margin, currentY);
        currentY += lineHeight;
      }
      return currentY;
    };

    // Helper: Add Section Header
    const addSectionHeader = (text: string, startY: number): number => {
      let currentY = startY;
      if (currentY > pageHeight - 35) {
        totalPages++;
        pdf.addPage();
        currentY = 28;
      }

      // Left bar
      pdf.setFillColor(...colors.accent);
      pdf.rect(margin, currentY - 5, 3, 6, 'F');

      // Title Text
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(...colors.primary);
      pdf.text(text.toUpperCase(), margin + 5, currentY);

      // Underline
      pdf.setDrawColor(...colors.border);
      pdf.setLineWidth(0.2);
      pdf.line(margin, currentY + 3, pageWidth - margin, currentY + 3);

      return currentY + 9;
    };

    // Calculate dynamic derived metrics safely
    const wordCount = doc.content ? doc.content.split(/\s+/).length : (analysis?.summary ? analysis.summary.split(/\s+/).length * 8 : 1250);
    const manualReadingTime = Math.ceil(wordCount / 200);
    const aiAnalysisTime = analysis?.readingTime || 1;
    const timeSaved = Math.max(1, manualReadingTime - aiAnalysisTime);

    // ==========================================
    // PAGE 1: COVER PAGE
    // ==========================================
    // Large top colored background block (Teal/Slate gradient placeholder block)
    pdf.setFillColor(...colors.primary);
    pdf.rect(0, 0, pageWidth, 110, 'F');

    // Visual design: Accent glowing lines
    pdf.setFillColor(...colors.accent);
    pdf.rect(0, 110, pageWidth, 3, 'F');
    pdf.setFillColor(...colors.emerald);
    pdf.rect(0, 113, pageWidth, 1, 'F');

    // Document Branding
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.emerald);
    pdf.text('SCHOLARAI DEEP INTELLIGENCE ENGINE', margin, 32);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(150, 170, 190);
    pdf.text('NEURAL INGESTION PLATFORM v4.2', margin + 74, 32);

    // Cover Page Title
    pdf.setFontSize(23);
    pdf.setTextColor(255, 255, 255);
    const splitTitle = pdf.splitTextToSize(title, contentWidth);
    let titleY = 48;
    for (let i = 0; i < Math.min(splitTitle.length, 3); i++) {
      pdf.text(splitTitle[i], margin, titleY);
      titleY += 9.5;
    }

    // Subheading
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(10.5);
    pdf.setTextColor(190, 200, 220);
    pdf.text('Multi-Dimensional Academic Synthesis & Cognitive Analysis', margin, titleY + 2);

    // Metadata & Pipeline Grid
    const cardY = 125;
    const cardW = (contentWidth - 8) / 2; // ~81mm each
    const cardH = 75;
    
    // Left Card (Source Metadata)
    drawCard(margin, cardY, cardW, cardH, colors.cardBg, colors.border, colors.accent);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.accent);
    pdf.text('DOCUMENT SOURCE METADATA', margin + 6, cardY + 10);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.2);
    pdf.line(margin + 6, cardY + 13, margin + cardW - 6, cardY + 13);
    
    const sourceMeta = [
      { label: 'Primary Investigator', val: authorStr },
      { label: 'Publication Year', val: String(pubYear) },
      { label: 'Ingested Date', val: formattedUploadDate },
      { label: 'Document Hash ID', val: doc.id.toUpperCase() },
    ];
    let metaY = cardY + 21;
    sourceMeta.forEach(row => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textDark);
      pdf.text(row.label, margin + 6, metaY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      const value = row.val.length > 32 ? `${row.val.slice(0, 32)}...` : row.val;
      pdf.text(value, margin + 6, metaY + 4.5);
      metaY += 12;
    });

    // Right Card (Neural Ingestion Pipelines)
    drawCard(margin + cardW + 8, cardY, cardW, cardH, colors.cardBg, colors.border, colors.emerald);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(9);
    pdf.setTextColor(...colors.emerald);
    pdf.text('AI NEURAL PIPELINE', margin + cardW + 14, cardY + 10);
    pdf.setDrawColor(...colors.border);
    pdf.setLineWidth(0.2);
    pdf.line(margin + cardW + 14, cardY + 13, margin + contentWidth - 6, cardY + 13);
    
    const pipelineMeta = [
      { label: 'Embeddings Engine', val: 'BGE-Small-EN (Vectorized)' },
      { label: 'Vector Store Database', val: 'ChromaDB Core (High Density)' },
      { label: 'LLM Inference Engine', val: 'Gemini 1.5 Pro (Dual-Channel)' },
      { label: 'Pipeline Ingestion Latency', val: `${aiAnalysisTime} min (Processing Speed)` },
    ];
    metaY = cardY + 21;
    pipelineMeta.forEach(row => {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textDark);
      pdf.text(row.label, margin + cardW + 14, metaY);
      
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      pdf.setTextColor(...colors.textMuted);
      pdf.text(row.val, margin + cardW + 14, metaY + 4.5);
      metaY += 12;
    });

    // Executive Takeaway Panel (at the bottom of cover page)
    const takeawayY = 212;
    const takeawayH = 48;
    drawCard(margin, takeawayY, contentWidth, takeawayH, colors.emeraldLight, colors.border, colors.emerald);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(10);
    pdf.setTextColor(...colors.primary);
    pdf.text('CORE EXECUTIVE TAKEAWAY', margin + 8, takeawayY + 9);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    pdf.setTextColor(...colors.textDark);
    const summaryIntro = analysis?.summary 
      ? analysis.summary.split('.').slice(0, 3).join('.') + '.'
      : 'Comprehensive document synthesis is fully mapped across vectorized namespaces.';
    const wrappedTakeaway = pdf.splitTextToSize(summaryIntro, contentWidth - 16);
    wrappedTakeaway.slice(0, 4).forEach((line: string, i: number) => {
      pdf.text(line, margin + 8, takeawayY + 16 + i * 5.5);
    });

    // Confidentiality stamp
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(7.5);
    pdf.setTextColor(...colors.textMuted);
    pdf.text('CONFIDENTIAL // SCHOLARAI INTERNAL DISTRIBUTION ONLY // LEVEL 1 SECURITIES', pageWidth / 2, pageHeight - 12, { align: 'center' });

    // ==========================================
    // PAGE 2: THE ANALYTICS DASHBOARD & SUMMARY
    // ==========================================
    totalPages++;
    pdf.addPage();
    let currentY = 28;

    if (analysis) {
      // 1. Dashboard Header
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.setTextColor(...colors.primary);
      pdf.text('RESEARCH ANALYTICS DASHBOARD', margin, currentY);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('High-fidelity synthesis indicators and deep analytical metric blocks.', margin, currentY + 4.5);

      currentY += 12;

      // 2. Three KPI Cards
      const kpiW = (contentWidth - 10) / 3; // ~53mm each
      const kpiH = 22;

      // Card 1: Reliability Index
      drawCard(margin, currentY, kpiW, kpiH, colors.accentLight, colors.border, colors.accent);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('RELIABILITY INDEX', margin + 6, currentY + 6);
      const reliabilityScore = `${Math.round((analysis.confidenceScore || 0.85) * 100)}% Match`;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(...colors.primary);
      pdf.text(reliabilityScore, margin + 6, currentY + 14);
      drawBadge(margin + kpiW - 18, currentY + 12.5, 'HIGH', colors.emeraldLight, colors.emerald);

      // Card 2: Analysis Complexity
      drawCard(margin + kpiW + 5, currentY, kpiW, kpiH, colors.cardBg, colors.border, colors.primary);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('COMPLEXITY INDEX', margin + kpiW + 11, currentY + 6);
      const complexityVal = (analysis.complexity || 'Moderate').toUpperCase();
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(...colors.primary);
      pdf.text(complexityVal, margin + kpiW + 11, currentY + 14);
      drawBadge(margin + kpiW * 2 - 13, currentY + 12.5, 'CORE', colors.accentLight, colors.accent);

      // Card 3: Efficiency Gains
      drawCard(margin + kpiW * 2 + 10, currentY, kpiW, kpiH, colors.emeraldLight, colors.border, colors.emerald);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      pdf.setTextColor(...colors.textMuted);
      pdf.text('EFFICIENCY GAINS', margin + kpiW * 2 + 16, currentY + 6);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(13);
      pdf.setTextColor(...colors.primary);
      pdf.text(`${timeSaved} MIN SAVED`, margin + kpiW * 2 + 16, currentY + 14);
      drawBadge(margin + contentWidth - 16, currentY + 12.5, 'FAST', colors.amberLight, colors.amber);

      currentY += kpiH + 10;

      // Executive Research Summary Section
      currentY = addSectionHeader('Executive Research Summary', currentY);
      
      const summaryBoxH = 46;
      drawCard(margin, currentY, contentWidth, summaryBoxH, colors.cardBg, colors.border);
      // Left emerald accent vertical strip
      pdf.setFillColor(...colors.emerald);
      pdf.rect(margin, currentY, 2.5, summaryBoxH, 'F');

      // Fill with summary text inside the card
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...colors.textDark);
      const summaryText = analysis.summary || 'Summary unavailable.';
      const wrappedSummary = pdf.splitTextToSize(summaryText, contentWidth - 12);
      let textY = currentY + 8;
      wrappedSummary.slice(0, 7).forEach((line: string) => {
        pdf.text(line, margin + 7, textY);
        textY += 5.2;
      });

      currentY += summaryBoxH + 10;

      // Methodology & Experimental Setup
      currentY = addSectionHeader('Methodology & Experimental Framework', currentY);
      currentY = addTextWrapped(analysis.methodology || 'Methodological specifications pending deep extraction.', currentY, 8.5, 'normal', colors.textDark, 5.2);
      currentY += 8;

      // ==========================================
      // PAGE 3: DEEP ANALYTICAL OUTCOMES & INSIGHTS
      // ==========================================
      totalPages++;
      pdf.addPage();
      currentY = 28;

      // Key Results & Analytical Outcomes
      currentY = addSectionHeader('Quantitative Research Outcomes', currentY);
      
      if (typeof analysis.results === 'object' && analysis.results !== null) {
        const resultsEntries = Object.entries(analysis.results);
        let tableY = currentY;
        
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        pdf.setFillColor(...colors.primary);
        pdf.rect(margin, tableY, contentWidth, 8, 'F');
        
        pdf.setTextColor(255, 255, 255);
        pdf.text('ANALYTICAL DIMENSION', margin + 4, tableY + 5.5);
        pdf.text('DETERMINISTIC OUTCOME', margin + 65, tableY + 5.5);
        tableY += 8;
        
        resultsEntries.forEach(([key, val], idx) => {
          if (tableY > pageHeight - 30) {
            totalPages++;
            pdf.addPage();
            tableY = 28;
          }
          
          // Alternating background
          if (idx % 2 === 0) {
            pdf.setFillColor(248, 250, 252);
          } else {
            pdf.setFillColor(255, 255, 255);
          }
          pdf.rect(margin, tableY, contentWidth, 10, 'F');
          
          // Bottom border
          pdf.setDrawColor(...colors.border);
          pdf.setLineWidth(0.2);
          pdf.line(margin, tableY + 10, margin + contentWidth, tableY + 10);
          
          pdf.setFont('helvetica', 'bold');
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.accent);
          const titleKey = key.replace(/_/g, ' ').toUpperCase();
          pdf.text(titleKey.length > 28 ? `${titleKey.slice(0, 28)}...` : titleKey, margin + 4, tableY + 6.5);
          
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8);
          pdf.setTextColor(...colors.textDark);
          const valueStr = String(val);
          const valLines = pdf.splitTextToSize(valueStr, contentWidth - 70);
          pdf.text(valLines[0] || '', margin + 65, tableY + 6.5);
          
          tableY += 10;
        });
        currentY = tableY + 8;
      } else {
        const resultsStr = analysis.results || 'Quantitative and qualitative outcome results map pending.';
        drawCard(margin, currentY, contentWidth, 35, colors.cardBg, colors.border, colors.accent);
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(9);
        pdf.setTextColor(...colors.primary);
        pdf.text('KEY RESEARCH RESULTS:', margin + 6, currentY + 8);
        
        currentY = addTextWrapped(resultsStr, currentY + 14, 8.5, 'normal', colors.textDark, 5.2);
        currentY += 8;
      }

      // Key Insights Highlights
      if (analysis.keyInsights && analysis.keyInsights.length > 0) {
        currentY = addSectionHeader('Key Extracted Semantic Insights', currentY);
        
        for (let i = 0; i < analysis.keyInsights.length; i++) {
          const insight = analysis.keyInsights[i];
          const splitInsight = pdf.splitTextToSize(insight, contentWidth - 14);
          const cardHeight = splitInsight.length * 5 + 8;
          
          if (currentY + cardHeight > pageHeight - 25) {
            totalPages++;
            pdf.addPage();
            currentY = 28;
          }
          
          drawCard(margin, currentY, contentWidth, cardHeight, colors.cardBg, colors.border, colors.accent);
          
          // Bullet dot
          pdf.setFillColor(...colors.accent);
          pdf.circle(margin + 6, currentY + 5.5, 1, 'F');
          
          // Text lines
          pdf.setFont('helvetica', 'normal');
          pdf.setFontSize(8.5);
          pdf.setTextColor(...colors.textDark);
          splitInsight.forEach((line: string, lineIdx: number) => {
            pdf.text(line, margin + 11, currentY + 6.5 + lineIdx * 5);
          });
          
          currentY += cardHeight + 4; // Spacing between cards
        }
      }

      // ==========================================
      // PAGE 4: LIMITATIONS & FUTURE TRAJECTORIES
      // ==========================================
      if (currentY > pageHeight - 110) {
        totalPages++;
        pdf.addPage();
        currentY = 28;
      } else {
        currentY += 8;
      }

      currentY = addSectionHeader('Limitations & Future Research Directions', currentY);

      // Acknowledged Constraints Card (Amber)
      const constraintsText = analysis.limitations || 'No explicit constraints annotated by authors.';
      const splitConstraints = pdf.splitTextToSize(constraintsText, contentWidth - 14);
      const constraintsH = splitConstraints.length * 5.2 + 16;

      if (currentY + constraintsH > pageHeight - 25) {
        totalPages++;
        pdf.addPage();
        currentY = 28;
      }

      drawCard(margin, currentY, contentWidth, constraintsH, colors.amberLight, colors.border, colors.amber);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.amber);
      pdf.text('ACKNOWLEDGED CONSTRAINTS & METHODOLOGICAL LIMITATIONS', margin + 8, currentY + 8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...colors.textDark);
      splitConstraints.forEach((line: string, idx: number) => {
        pdf.text(line, margin + 8, currentY + 14.5 + idx * 5.2);
      });

      currentY += constraintsH + 6;

      // Proposed Horizons Card (Emerald)
      const futureText = analysis.futureWork || 'Conceptual trajectory is bounded within standard baselines.';
      const splitFuture = pdf.splitTextToSize(futureText, contentWidth - 14);
      const futureH = splitFuture.length * 5.2 + 16;

      if (currentY + futureH > pageHeight - 25) {
        totalPages++;
        pdf.addPage();
        currentY = 28;
      }

      drawCard(margin, currentY, contentWidth, futureH, colors.emeraldLight, colors.border, colors.emerald);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(...colors.emerald);
      pdf.text('PROPOSED HORIZONS & NEXT-GENERATION TRAJECTORIES', margin + 8, currentY + 8);

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8.5);
      pdf.setTextColor(...colors.textDark);
      splitFuture.forEach((line: string, idx: number) => {
        pdf.text(line, margin + 8, currentY + 14.5 + idx * 5.2);
      });

    } else {
      // No analysis fallback
      currentY = addSectionHeader('Analysis Report Not Complete', currentY);
      currentY = addTextWrapped('This document has not completed full vector synthesis and AI analysis. Please run neural ingestion first.', currentY, 10, 'italic', colors.textMuted);
    }

    // ==========================================
    // DRAW INNER HEADERS & FOOTERS (Post-processing)
    // ==========================================
    // Draw on all pages except the first one (Cover page)
    for (let p = 2; p <= totalPages; p++) {
      drawHeaderFooter(p);
    }

    // ==========================================
    // SAVE PDF
    // ==========================================
    const safeFilename = title.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 30);
    pdf.save(`${safeFilename}_analysis_report.pdf`);
  },
};
