/**
 * Dermatologist Report Generator
 * Produces a clinical-grade PDF for sharing with dermatologists.
 */

interface ReportData {
  scanId: string;
  date: string;
  skinType: string;
  confidence: number;
  concerns: string[];
  severity: Record<string, number>;
  recommendations: string[];
  zoneAnalysis?: Array<{
    zone: string;
    concerns: Array<{ type: string; severity: string; confidence: number }>;
    texture_score: number;
    notes: string;
  }>;
  ingredients?: Array<{ name: string; why: string; targets: string[] }>;
}

const SEVERITY_LABEL = (v: number) =>
  v >= 80 ? 'Severe' : v >= 60 ? 'Moderate' : v >= 40 ? 'Mild' : v >= 20 ? 'Light' : 'Clear';

const formatZone = (z: string) =>
  z.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

const formatConcern = (c: string) =>
  c.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export async function generateDermatologistReport(data: ReportData): Promise<void> {
  const { jsPDF } = await import('jspdf');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const margin = 40;
  const contentW = pageW - margin * 2;
  let y = margin;

  const addLine = (text: string, options: { fontSize?: number; fontStyle?: string; color?: [number, number, number]; indent?: number } = {}) => {
    const { fontSize = 10, fontStyle = 'normal', color = [30, 30, 30], indent = 0 } = options;
    pdf.setFontSize(fontSize);
    pdf.setFont('helvetica', fontStyle);
    pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, contentW - indent);
    if (y + lines.length * fontSize * 1.2 > pdf.internal.pageSize.getHeight() - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(lines, margin + indent, y);
    y += lines.length * fontSize * 1.4;
  };

  const addSpacer = (h = 12) => { y += h; };

  // Header
  addLine('PELLICURA', { fontSize: 14, fontStyle: 'bold', color: [31, 111, 235] });
  addLine('Skin Analysis Report — For Dermatologist Review', { fontSize: 10, color: [100, 116, 139] });
  addSpacer(6);
  pdf.setDrawColor(31, 111, 235);
  pdf.setLineWidth(1.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 16;

  // Patient info
  addLine('REPORT DETAILS', { fontSize: 11, fontStyle: 'bold' });
  addSpacer(4);
  addLine(`Analysis Date: ${new Date(data.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { indent: 8 });
  addLine(`Scan ID: ${data.scanId}`, { indent: 8, color: [100, 116, 139] });
  addLine(`Detected Skin Type: ${data.skinType}`, { indent: 8 });
  addLine(`Analysis Confidence: ${data.confidence}%`, { indent: 8 });
  addSpacer();

  // Concerns summary
  addLine('IDENTIFIED CONCERNS', { fontSize: 11, fontStyle: 'bold' });
  addSpacer(4);
  if (data.concerns.length > 0) {
    addLine(data.concerns.map(formatConcern).join(', '), { indent: 8 });
  } else {
    addLine('No significant concerns detected.', { indent: 8, color: [100, 116, 139] });
  }
  addSpacer();

  // Severity breakdown table
  addLine('SEVERITY ANALYSIS', { fontSize: 11, fontStyle: 'bold' });
  addSpacer(6);

  const sortedSeverity = Object.entries(data.severity).sort(([, a], [, b]) => b - a);
  if (sortedSeverity.length > 0) {
    // Table header
    pdf.setFillColor(245, 247, 250);
    pdf.rect(margin, y - 2, contentW, 16, 'F');
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(30, 30, 30);
    pdf.text('Metric', margin + 8, y + 10);
    pdf.text('Score', margin + 200, y + 10);
    pdf.text('Severity', margin + 280, y + 10);
    y += 20;

    // Table rows
    pdf.setFont('helvetica', 'normal');
    for (const [key, value] of sortedSeverity) {
      if (y > pdf.internal.pageSize.getHeight() - margin - 20) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFontSize(9);
      pdf.setTextColor(30, 30, 30);
      pdf.text(formatConcern(key), margin + 8, y + 10);
      pdf.text(`${value}%`, margin + 200, y + 10);

      const label = SEVERITY_LABEL(value);
      const color: [number, number, number] = value >= 60 ? [220, 38, 38] : value >= 40 ? [249, 115, 22] : value >= 20 ? [59, 130, 246] : [34, 197, 94];
      pdf.setTextColor(...color);
      pdf.text(label, margin + 280, y + 10);

      // Mini bar
      pdf.setFillColor(240, 240, 240);
      pdf.rect(margin + 340, y + 4, 120, 8, 'F');
      pdf.setFillColor(...color);
      pdf.rect(margin + 340, y + 4, (value / 100) * 120, 8, 'F');

      y += 18;
    }
  }
  addSpacer();

  // Zone analysis
  if (data.zoneAnalysis && data.zoneAnalysis.length > 0) {
    addLine('REGIONAL ZONE ANALYSIS', { fontSize: 11, fontStyle: 'bold' });
    addSpacer(4);
    for (const zone of data.zoneAnalysis) {
      addLine(`${formatZone(zone.zone)} — Texture: ${zone.texture_score}/100`, { fontStyle: 'bold', indent: 8, fontSize: 9 });
      if (zone.concerns.length > 0) {
        const concernText = zone.concerns.map(c => `${formatConcern(c.type)} (${c.severity})`).join(', ');
        addLine(concernText, { indent: 16, fontSize: 9, color: [100, 116, 139] });
      }
      if (zone.notes) {
        addLine(zone.notes, { indent: 16, fontSize: 9, color: [100, 116, 139] });
      }
      addSpacer(4);
    }
    addSpacer();
  }

  // Ingredient recommendations
  if (data.ingredients && data.ingredients.length > 0) {
    addLine('RECOMMENDED INGREDIENTS', { fontSize: 11, fontStyle: 'bold' });
    addSpacer(4);
    for (const ing of data.ingredients) {
      addLine(`• ${ing.name}`, { fontStyle: 'bold', indent: 8, fontSize: 9 });
      addLine(ing.why, { indent: 16, fontSize: 9, color: [100, 116, 139] });
      addLine(`Targets: ${ing.targets.join(', ')}`, { indent: 16, fontSize: 9, color: [31, 111, 235] });
      addSpacer(4);
    }
    addSpacer();
  }

  // AI recommendations
  if (data.recommendations.length > 0) {
    addLine('AI RECOMMENDATIONS', { fontSize: 11, fontStyle: 'bold' });
    addSpacer(4);
    for (const rec of data.recommendations) {
      addLine(`• ${rec}`, { indent: 8, fontSize: 9 });
    }
    addSpacer();
  }

  // Disclaimer
  addSpacer(8);
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, pageW - margin, y);
  y += 12;
  addLine(
    'DISCLAIMER: This report is generated by AI-powered cosmetic analysis software (Pellicura) and is for informational purposes only. ' +
    'It is NOT a medical diagnosis. Scores reflect visible cosmetic characteristics captured from a photograph and may be affected by ' +
    'lighting, angle, and image quality. Please consult a board-certified dermatologist for medical advice, diagnosis, or treatment.',
    { fontSize: 8, color: [150, 150, 150] }
  );

  addSpacer(6);
  addLine(`Generated: ${new Date().toISOString().slice(0, 19).replace('T', ' ')} UTC — Pellicura AI Skincare Intelligence`, {
    fontSize: 7, color: [180, 180, 180],
  });

  pdf.save(`pellicura-dermatologist-report-${data.scanId.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.pdf`);
}
