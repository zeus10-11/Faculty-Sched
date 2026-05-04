export const formatTime = (timeString) => {
  if (!timeString) return ''
  const [hours, minutes] = timeString.split(':')
  const hour = parseInt(hours)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour % 12 || 12
  return `${displayHour}:${minutes} ${ampm}`
}

export const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export const getDateRange = (startDate, days = 7) => {
  const dates = []
  const start = new Date(startDate)
  for (let i = 0; i < days; i++) {
    dates.push(new Date(start.getTime() + i * 24 * 60 * 60 * 1000))
  }
  return dates
}

export const getWeekStart = (date = new Date()) => {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day
  return new Date(d.setDate(diff))
}

export const getDayName = (date) => {
  return new Date(date).toLocaleDateString('en-US', { weekday: 'long' })
}

export const getColorForStatus = (status) => {
  const colors = {
    'Active': 'green',
    'Completed': 'blue',
    'Upcoming': 'gray',
    'On Leave': 'red'
  }
  return colors[status] || 'gray'
}

export const calculateProgress = (current, total) => {
  if (total === 0) return 0
  return Math.round((current / total) * 100)
}
