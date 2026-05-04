import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

/**
 * Generate a PDF of a session (for use with a session detail view)
 */
export const generateSessionPDF = async (session, programme, module, faculty, room, institutionName = 'Faculty Scheduler') => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 10

  // Header
  pdf.setFontSize(14)
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  // Title
  pdf.setFontSize(12)
  pdf.text('Session Details', pageWidth / 2, yPos, { align: 'center' })
  yPos += 10

  // Session info
  pdf.setFontSize(10)
  const info = [
    ['Programme:', programme?.name || 'N/A'],
    ['Module:', module?.name || 'N/A'],
    ['Faculty:', faculty?.name || 'N/A'],
    ['Date:', new Date(session.session_date).toLocaleDateString()],
    ['Start Time:', session.start_time],
    ['Duration:', `${session.duration_hours} hours`],
    ['End Time:', calculateEndTime(session.start_time, session.duration_hours)],
    ['Room:', room?.name || 'TBD'],
    ['Session Type:', session.session_type],
    ['Status:', session.is_locked ? 'Locked' : 'Active'],
  ]

  const colWidth = [50, pageWidth - 70]
  info.forEach(([label, value]) => {
    pdf.setFont(undefined, 'bold')
    pdf.text(label, 15, yPos)
    pdf.setFont(undefined, 'normal')
    pdf.text(String(value), 65, yPos)
    yPos += 6
  })

  if (session.notes) {
    yPos += 5
    pdf.setFont(undefined, 'bold')
    pdf.text('Notes:', 15, yPos)
    yPos += 5
    pdf.setFont(undefined, 'normal')
    const noteLines = pdf.splitTextToSize(session.notes, pageWidth - 30)
    pdf.text(noteLines, 15, yPos)
    yPos += noteLines.length * 5 + 5
  }

  // Footer
  pdf.setFontSize(8)
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 15, pageHeight - 10)

  return pdf
}

/**
 * Generate a weekly timetable PDF
 */
export const generateWeeklyTimetablePDF = async (sessions, programmes, modules, faculty, rooms, weekStart, institutionName = 'Faculty Scheduler') => {
  const pdf = new jsPDF('l') // landscape
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 10

  // Header
  pdf.setFontSize(14)
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  pdf.setFontSize(12)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  pdf.text(
    `Weekly Timetable: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 10

  // Create timetable
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(day)
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am to 8pm
  const cellWidth = (pageWidth - 20) / 8
  const cellHeight = 20

  // Column headers
  pdf.setFontSize(9)
  let xPos = 10

  pdf.rect(xPos, yPos, cellWidth, cellHeight)
  pdf.text('Time', xPos + 2, yPos + 12)
  xPos += cellWidth

  days.forEach((day, idx) => {
    pdf.rect(xPos, yPos, cellWidth, cellHeight)
    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = day.getDate()
    pdf.text(`${dayName} ${dayNum}`, xPos + 2, yPos + 8)
    xPos += cellWidth
  })

  yPos += cellHeight

  // Time slots
  hours.forEach((hour) => {
    let maxHeight = cellHeight
    xPos = 10

    // Time cell
    pdf.rect(xPos, yPos, cellWidth, cellHeight)
    pdf.setFontSize(8)
    pdf.text(`${hour}:00`, xPos + 2, yPos + 12)
    xPos += cellWidth

    // Session cells
    days.forEach((day, dayIdx) => {
      pdf.rect(xPos, yPos, cellWidth, cellHeight)
      
      const dayStr = day.toISOString().split('T')[0]
      const daySessions = sessions.filter(s => {
        if (s.session_date !== dayStr) return false
        const [h] = s.start_time.split(':')
        return parseInt(h) === hour
      })

      let sessionYPos = yPos + 2
      daySessions.forEach(s => {
        const mod = modules.find(m => m.id === s.module_id)
        const fac = faculty.find(f => f.id === s.faculty_id)
        const room = rooms.find(r => r.id === s.room_id)
        
        const sessionText = [
          `${mod?.code}`,
          `${fac?.name}`,
          `${s.start_time} (${s.duration_hours}h)`,
          room ? room.code : 'TBD'
        ]

        pdf.setFontSize(7)
        sessionText.forEach((line, idx) => {
          if (sessionYPos < yPos + cellHeight - 2) {
            pdf.text(line, xPos + 2, sessionYPos)
            sessionYPos += 3
          }
        })
      })

      xPos += cellWidth
    })

    yPos += cellHeight
  })

  // Footer
  pdf.setFontSize(8)
  pdf.text(`Page 1 of 1`, 10, pageHeight - 5)
  pdf.text(`Generated on ${new Date().toLocaleString()}`, pageWidth - 60, pageHeight - 5)

  return pdf
}

/**
 * Generate a monthly summary PDF
 */
export const generateMonthlySummaryPDF = async (sessions, programmes, modules, faculty, rooms, month, year, institutionName = 'Faculty Scheduler') => {
  const pdf = new jsPDF()
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 15

  // Header
  pdf.setFontSize(14)
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  pdf.setFontSize(12)
  const monthName = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  pdf.text(`Monthly Summary: ${monthName}`, pageWidth / 2, yPos, { align: 'center' })
  yPos += 12

  // Filter sessions for month
  const monthSessions = sessions.filter(s => {
    const sessionDate = new Date(s.session_date)
    return sessionDate.getMonth() === month && sessionDate.getFullYear() === year
  })

  if (monthSessions.length === 0) {
    pdf.setFontSize(10)
    pdf.text('No sessions scheduled for this month', 15, yPos)
    return pdf
  }

  // Group by week
  const weeks = {}
  monthSessions.forEach(s => {
    const date = new Date(s.session_date)
    const weekStart = new Date(date)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]
    
    if (!weeks[weekKey]) weeks[weekKey] = []
    weeks[weekKey].push(s)
  })

  // Module hours tracking
  const moduleHours = {}
  monthSessions.forEach(s => {
    if (!moduleHours[s.module_id]) {
      const mod = modules.find(m => m.id === s.module_id)
      moduleHours[s.module_id] = { name: mod?.name, code: mod?.code, hours: 0 }
    }
    moduleHours[s.module_id].hours += s.duration_hours || 0
  })

  // Sessions by week
  pdf.setFontSize(10)
  pdf.setFont(undefined, 'bold')
  pdf.text('Sessions by Week:', 15, yPos)
  yPos += 8

  Object.entries(weeks).forEach(([weekKey, weekSessions]) => {
    pdf.setFontSize(9)
    pdf.setFont(undefined, 'bold')
    const weekDate = new Date(weekKey)
    const weekEnd = new Date(weekDate)
    weekEnd.setDate(weekEnd.getDate() + 6)
    pdf.text(
      `Week of ${weekDate.toLocaleDateString()} - ${weekEnd.toLocaleDateString()}`,
      15,
      yPos
    )
    yPos += 6

    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(8)

    weekSessions.forEach(s => {
      const mod = modules.find(m => m.id === s.module_id)
      const fac = faculty.find(f => f.id === s.faculty_id)
      const room = rooms.find(r => r.id === s.room_id)

      const sessionText = `${new Date(s.session_date).toLocaleDateString()} - ${mod?.code} (${fac?.name}) ${s.start_time} ${s.duration_hours}h ${room?.code || 'TBD'}`
      
      if (yPos > pageHeight - 15) {
        pdf.addPage()
        yPos = 15
      }

      pdf.text(sessionText, 20, yPos)
      yPos += 5
    })

    yPos += 3
  })

  // Module summary table
  if (yPos > pageHeight - 40) {
    pdf.addPage()
    yPos = 15
  }

  yPos += 5
  pdf.setFont(undefined, 'bold')
  pdf.setFontSize(10)
  pdf.text('Module Hours Summary:', 15, yPos)
  yPos += 8

  // Table headers
  pdf.setFontSize(9)
  pdf.setFont(undefined, 'bold')
  const colWidths = [30, 60, 40]
  const headers = ['Module Code', 'Module Name', 'Total Hours']
  let xPos = 15
  headers.forEach((header, idx) => {
    pdf.text(header, xPos, yPos)
    xPos += colWidths[idx]
  })

  yPos += 6
  pdf.setFont(undefined, 'normal')
  pdf.setFontSize(8)

  Object.values(moduleHours).forEach(mod => {
    if (yPos > pageHeight - 15) {
      pdf.addPage()
      yPos = 15
    }

    xPos = 15
    pdf.text(mod.code, xPos, yPos)
    xPos += colWidths[0]
    pdf.text(mod.name.substring(0, 30), xPos, yPos)
    xPos += colWidths[1]
    pdf.text(`${mod.hours}h`, xPos, yPos)
    yPos += 6
  })

  // Total hours
  const totalHours = Object.values(moduleHours).reduce((sum, m) => sum + m.hours, 0)
  yPos += 4
  pdf.setFont(undefined, 'bold')
  pdf.text(`Total Hours: ${totalHours}h`, 15, yPos)

  // Footer
  yPos = pageHeight - 10
  pdf.setFontSize(8)
  pdf.setFont(undefined, 'normal')
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 15, yPos)

  return pdf
}

/**
 * Generate faculty schedule PDF
 */
export const generateFacultySchedulePDF = async (facultyId, sessions, programmes, modules, faculty, rooms, weekStart, institutionName = 'Faculty Scheduler') => {
  const fac = faculty.find(f => f.id === facultyId)
  if (!fac) throw new Error('Faculty not found')

  const pdf = new jsPDF('l') // landscape
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  let yPos = 10

  // Header
  pdf.setFontSize(14)
  pdf.text(institutionName, pageWidth / 2, yPos, { align: 'center' })
  yPos += 8

  pdf.setFontSize(12)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  pdf.text(
    `${fac.name} - Weekly Schedule`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 5
  pdf.setFontSize(10)
  pdf.text(
    `${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 10

  // Filter faculty sessions
  const facultySessions = sessions.filter(s => s.faculty_id === facultyId)

  if (facultySessions.length === 0) {
    pdf.setFontSize(10)
    pdf.text('No sessions scheduled for this week', 15, yPos)
    return pdf
  }

  // Create timetable
  const days = []
  for (let i = 0; i < 7; i++) {
    const day = new Date(weekStart)
    day.setDate(day.getDate() + i)
    days.push(day)
  }

  const hours = Array.from({ length: 12 }, (_, i) => i + 8) // 8am to 8pm
  const cellWidth = (pageWidth - 20) / 8
  const cellHeight = 20

  // Column headers
  pdf.setFontSize(9)
  let xPos = 10

  pdf.rect(xPos, yPos, cellWidth, cellHeight)
  pdf.text('Time', xPos + 2, yPos + 12)
  xPos += cellWidth

  days.forEach((day, idx) => {
    pdf.rect(xPos, yPos, cellWidth, cellHeight)
    const dayName = day.toLocaleDateString('en-US', { weekday: 'short' })
    const dayNum = day.getDate()
    pdf.text(`${dayName} ${dayNum}`, xPos + 2, yPos + 8)
    xPos += cellWidth
  })

  yPos += cellHeight

  // Time slots
  hours.forEach((hour) => {
    xPos = 10

    // Time cell
    pdf.rect(xPos, yPos, cellWidth, cellHeight)
    pdf.setFontSize(8)
    pdf.text(`${hour}:00`, xPos + 2, yPos + 12)
    xPos += cellWidth

    // Session cells
    days.forEach((day, dayIdx) => {
      pdf.rect(xPos, yPos, cellWidth, cellHeight)
      
      const dayStr = day.toISOString().split('T')[0]
      const daySessions = facultySessions.filter(s => {
        if (s.session_date !== dayStr) return false
        const [h] = s.start_time.split(':')
        return parseInt(h) === hour
      })

      let sessionYPos = yPos + 2
      daySessions.forEach(s => {
        const mod = modules.find(m => m.id === s.module_id)
        const prog = programmes.find(p => p.id === s.programme_id)
        const room = rooms.find(r => r.id === s.room_id)
        
        const sessionText = [
          `${mod?.code}`,
          `${prog?.name}`,
          `${s.start_time} (${s.duration_hours}h)`,
          room ? room.code : 'TBD'
        ]

        pdf.setFontSize(7)
        sessionText.forEach((line, idx) => {
          if (sessionYPos < yPos + cellHeight - 2) {
            pdf.text(line, xPos + 2, sessionYPos)
            sessionYPos += 3
          }
        })
      })

      xPos += cellWidth
    })

    yPos += cellHeight
  })

  // Summary
  const totalHours = facultySessions.reduce((sum, s) => sum + (s.duration_hours || 0), 0)
  const maxHours = fac.max_weekly_hours || 40

  yPos = pageHeight - 20
  pdf.setFontSize(9)
  pdf.setFont(undefined, 'bold')
  pdf.text(`Total Hours This Week: ${totalHours}h / ${maxHours}h`, 15, yPos)
  yPos += 6
  
  const percentage = ((totalHours / maxHours) * 100).toFixed(1)
  const statusColor = totalHours > maxHours ? 'red' : totalHours > maxHours * 0.8 ? 'yellow' : 'green'
  pdf.text(`Load: ${percentage}%`, 15, yPos)

  // Footer
  pdf.setFontSize(8)
  pdf.text(`Generated on ${new Date().toLocaleString()}`, 15, pageHeight - 5)

  return pdf
}

/**
 * Calculate end time from start time and duration
 */
function calculateEndTime(startTime, durationHours) {
  const [h, m] = startTime.split(':').map(Number)
  const totalMinutes = h * 60 + m + (durationHours * 60)
  const endH = Math.floor(totalMinutes / 60)
  const endM = totalMinutes % 60
  return `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`
}

/**
 * Download PDF file
 */
export const downloadPDF = (pdf, filename) => {
  pdf.save(filename)
}
