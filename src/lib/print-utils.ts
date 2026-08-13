export function triggerPrint() {
  window.print()
}

export function numberToWords(amount: number): string {
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

  if (amount === 0) return 'Zero Rupees Only'

  let result = ''

  if (amount >= 10000000) {
    result += numberToWords(Math.floor(amount / 10000000)) + ' Crore '
    amount %= 10000000
  }
  if (amount >= 100000) {
    result += numberToWords(Math.floor(amount / 100000)) + ' Lakh '
    amount %= 100000
  }
  if (amount >= 1000) {
    result += numberToWords(Math.floor(amount / 1000)) + ' Thousand '
    amount %= 1000
  }
  if (amount >= 100) {
    result += ones[Math.floor(amount / 100)] + ' Hundred '
    amount %= 100
  }
  if (amount > 0) {
    if (amount < 20) result += ones[amount]
    else {
      result += tens[Math.floor(amount / 10)] + ' ' + ones[amount % 10]
    }
  }

  return (result.trim() || 'Zero') + ' Rupees Only'
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function formatDateTime(date: Date | string): string {
  return new Date(date).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}