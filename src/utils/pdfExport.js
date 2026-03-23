import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export async function exportQuotePDF(elementId, filename) {
  const element = document.getElementById(elementId)
  if (!element) return

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#0f0f11'
  })

  const pdf = new jsPDF({ format: 'a4', unit: 'mm' })
  const imgData = canvas.toDataURL('image/png')
  const pdfWidth = pdf.internal.pageSize.getWidth()
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width
  const pageHeight = pdf.internal.pageSize.getHeight()

  if (pdfHeight > pageHeight) {
    const totalPages = Math.ceil(pdfHeight / pageHeight)
    for (let i = 0; i < totalPages; i++) {
      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, -i * pageHeight, pdfWidth, pdfHeight)
    }
  } else {
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
  }

  // Open as blob URL in a new tab — works reliably on iOS Safari and Android.
  // Falls back to direct save if popup is blocked (e.g. desktop with strict settings).
  const blob = pdf.output('blob')
  const blobUrl = URL.createObjectURL(blob)
  const newWindow = window.open(blobUrl, '_blank')
  if (!newWindow) {
    pdf.save(filename || 'quote.pdf')
  }
  setTimeout(() => URL.revokeObjectURL(blobUrl), 15000)
}
