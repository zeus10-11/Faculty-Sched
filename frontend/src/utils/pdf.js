import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export const generateTimetablePDF = async (element, filename = 'timetable.pdf') => {
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false
    })

    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4'
    })

    const pdfWidth = pdf.internal.pageSize.getWidth()
    const pdfHeight = pdf.internal.pageSize.getHeight()
    const imgWidth = pdfWidth - 20
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight)
    pdf.save(filename)
  } catch (error) {
    console.error('PDF generation failed:', error)
    throw error
  }
}

export const generateTablePDF = (title, headers, data, filename = 'report.pdf') => {
  const pdf = new jsPDF()
  
  // Add title
  pdf.setFontSize(16)
  pdf.text(title, 14, 10)
  
  // Add table
  const tableData = data.map(row => headers.map(header => row[header.key] || ''))
  
  pdf.autoTable({
    head: [headers.map(h => h.label)],
    body: tableData,
    startY: 20,
    margin: { top: 20 },
  })
  
  pdf.save(filename)
}
