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

  pdf.save(filename || 'quote.pdf')
}
