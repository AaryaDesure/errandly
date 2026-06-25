import jsPDF from 'jspdf'

export function downloadPdfReceipt(task) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20

  // Header background
  doc.setFillColor(37, 99, 235)
  doc.rect(0, 0, pageWidth, 45, 'F')

  // Logo text
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text('Errandly', margin, 22)

  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Hyperlocal Task Platform', margin, 30)

  // Receipt title
  doc.setFontSize(12)
  doc.text('OFFICIAL RECEIPT', pageWidth - margin, 22, { align: 'right' })
  doc.setFontSize(9)
  doc.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin, 30, { align: 'right' })

  // Receipt ID
  doc.setFontSize(9)
  doc.text(`Receipt #ERR-${task.id}-${Date.now().toString().slice(-6)}`, pageWidth - margin, 38, { align: 'right' })

  let y = 60

  // Status badge
  if (task.status === 'done') {
    doc.setFillColor(220, 252, 231)
    doc.roundedRect(margin, y - 7, 40, 10, 3, 3, 'F')
    doc.setTextColor(22, 163, 74)
    doc.setFontSize(9)
    doc.setFont('helvetica', 'bold')
    doc.text('✓ COMPLETED', margin + 5, y)
  }
  y += 10

  // Divider
  doc.setDrawColor(229, 231, 235)
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Task Details Section
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TASK DETAILS', margin, y)
  y += 8

  const details = [
    ['Task Title', task.title],
    ['Category', task.category?.charAt(0).toUpperCase() + task.category?.slice(1)],
    ['Location', task.location],
    ['Description', task.description],
  ]

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  details.forEach(([label, value]) => {
    doc.setTextColor(107, 114, 128)
    doc.text(label, margin, y)
    doc.setTextColor(31, 41, 55)
    const lines = doc.splitTextToSize(String(value || 'N/A'), pageWidth - margin - 70)
    doc.text(lines, margin + 50, y)
    y += lines.length > 1 ? lines.length * 5 + 2 : 7
  })

  y += 5
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // People Section
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PARTIES INVOLVED', margin, y)
  y += 8

  const people = [
    ['Customer', localStorage.getItem('name')],
    ['Helper', task.helper_name || 'N/A'],
  ]
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  people.forEach(([label, value]) => {
    doc.setTextColor(107, 114, 128)
    doc.text(label, margin, y)
    doc.setTextColor(31, 41, 55)
    doc.text(String(value), margin + 50, y)
    y += 7
  })

  y += 5
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Timeline Section
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('TIMELINE', margin, y)
  y += 8

  const timeline = [
    ['Posted', task.created_at],
    ['Accepted', task.accepted_at],
    ['Completed', task.completed_at],
    ['Confirmed', task.confirmed_at],
  ].filter(([, v]) => v)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  timeline.forEach(([label, value]) => {
    doc.setTextColor(107, 114, 128)
    doc.text(label, margin, y)
    doc.setTextColor(31, 41, 55)
    doc.text(String(value), margin + 50, y)
    y += 7
  })

  if (task.completion_note) {
    y += 3
    doc.setTextColor(107, 114, 128)
    doc.text("Helper's Note", margin, y)
    doc.setTextColor(31, 41, 55)
    const noteLines = doc.splitTextToSize(task.completion_note, pageWidth - margin - 70)
    doc.text(noteLines, margin + 50, y)
    y += noteLines.length * 5 + 4
  }

  y += 5
  doc.setDrawColor(229, 231, 235)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // Payment Section
  doc.setTextColor(37, 99, 235)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('PAYMENT SUMMARY', margin, y)
  y += 10

  // Amount box
  doc.setFillColor(239, 246, 255)
  doc.roundedRect(margin, y - 5, pageWidth - margin * 2, 22, 4, 4, 'F')
  doc.setTextColor(31, 41, 55)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text('Task Reward', margin + 5, y + 5)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(37, 99, 235)
  doc.text(`INR ${task.reward}`, pageWidth - margin - 5, y + 7, { align: 'right' })
  y += 30

  // Footer
  doc.setFillColor(249, 250, 251)
  doc.rect(0, 260, pageWidth, 37, 'F')
  doc.setTextColor(107, 114, 128)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text('Thank you for using Errandly!', pageWidth / 2, 270, { align: 'center' })
  doc.text('This is a computer-generated receipt and does not require a signature.', pageWidth / 2, 277, { align: 'center' })
  doc.text('© 2026 Errandly. Built with React & Flask.', pageWidth / 2, 284, { align: 'center' })

  doc.save(`errandly_receipt_${task.id}.pdf`)
}