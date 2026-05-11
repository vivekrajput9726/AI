export const formatDate = (dateStr) => {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' })
}

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount)
}

export const getStatusColor = (status) => {
  const colors = {
    pending: 'badge-pending',
    confirmed: 'badge-confirmed',
    cancelled: 'badge-cancelled',
    completed: 'badge-completed',
  }
  return colors[status] || 'badge-pending'
}

export const getInitials = (name) => {
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

export const generateTimeSlots = () => {
  const slots = []
  for (let h = 9; h <= 17; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`)
    if (h < 17) slots.push(`${String(h).padStart(2, '0')}:30`)
  }
  return slots
}

export const severityColor = (level) => {
  const map = {
    Mild: 'text-green-600 bg-green-50',
    Moderate: 'text-yellow-600 bg-yellow-50',
    Severe: 'text-orange-600 bg-orange-50',
    Emergency: 'text-red-600 bg-red-50',
  }
  return map[level] || 'text-gray-600 bg-gray-50'
}
