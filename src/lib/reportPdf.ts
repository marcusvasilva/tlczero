import jsPDF from 'jspdf'

export interface ReportData {
  collection_number: number
  collection_date: string
  executor_name: string | null
  client_name: string | null
  space_name: string | null
  weight_collected: number
  notes: string | null
}

export interface ReportFilters {
  clientName: string
  spaceName: string
  startDate: string
  endDate: string
}

export interface ReportSummary {
  totalCollections: number
  totalWeight: number
}

export function generateCollectionsReportPdf(
  data: ReportData[],
  filters: ReportFilters,
  summary: ReportSummary
): void {
  const doc = new jsPDF('landscape', 'mm', 'a4')
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 15
  let yPos = margin

  // Cores
  const greenPrimary: [number, number, number] = [34, 139, 34]
  const greenLight: [number, number, number] = [144, 238, 144]
  const grayText: [number, number, number] = [60, 60, 60]
  const grayLight: [number, number, number] = [245, 245, 245]

  // Header com linha verde
  doc.setFillColor(...greenPrimary)
  doc.rect(0, 0, pageWidth, 3, 'F')

  // Logo/Título
  yPos = 15
  doc.setFontSize(20)
  doc.setTextColor(...greenPrimary)
  doc.setFont('helvetica', 'bold')
  doc.text('TLC AGRO', margin, yPos)

  // Título do relatório
  doc.setFontSize(18)
  doc.text('Relatório de Coletas', pageWidth - margin, yPos, { align: 'right' })

  // Linha separadora
  yPos += 5
  doc.setDrawColor(...greenPrimary)
  doc.setLineWidth(0.5)
  doc.line(margin, yPos, pageWidth - margin, yPos)

  // Informações do filtro
  yPos += 10
  doc.setFontSize(10)
  doc.setTextColor(...grayText)
  doc.setFont('helvetica', 'normal')

  const filterLines = [
    `Cliente: ${filters.clientName || 'Todos os clientes'}`,
    `Espaço: ${filters.spaceName || 'Todos os espaços'}`,
    `Período: ${formatDateBR(filters.startDate)} até ${formatDateBR(filters.endDate)}`,
    `Data de Emissão: ${formatDateTimeBR(new Date().toISOString())}`
  ]

  filterLines.forEach(line => {
    doc.text(line, margin, yPos)
    yPos += 5
  })

  // Resumo
  yPos += 5
  doc.setFillColor(...grayLight)
  doc.roundedRect(margin, yPos, pageWidth - margin * 2, 12, 2, 2, 'F')

  yPos += 8
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...greenPrimary)

  const summaryText = `Total de Coletas: ${summary.totalCollections}          Peso Total: ${formatWeight(summary.totalWeight)}`
  doc.text(summaryText, pageWidth / 2, yPos, { align: 'center' })

  // Tabela
  yPos += 15
  const colWidths = [25, 25, 45, 50, 50, 30, 42]
  const headers = ['Nº Coleta', 'Data', 'Executor', 'Cliente', 'Espaço', 'Peso (g)', 'Observações']

  // Header da tabela
  doc.setFillColor(...greenPrimary)
  doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')

  let xPos = margin + 2
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPos + 5.5)
    xPos += colWidths[i]
  })

  yPos += 8

  // Linhas da tabela
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(...grayText)
  doc.setFontSize(8)

  let rowCount = 0
  const maxRowsPerPage = 18

  data.forEach((row, index) => {
    // Nova página se necessário
    if (rowCount >= maxRowsPerPage) {
      doc.addPage()
      yPos = margin

      // Header da nova página
      doc.setFillColor(...greenPrimary)
      doc.rect(margin, yPos, pageWidth - margin * 2, 8, 'F')

      doc.setTextColor(255, 255, 255)
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')

      xPos = margin + 2
      headers.forEach((header, i) => {
        doc.text(header, xPos, yPos + 5.5)
        xPos += colWidths[i]
      })

      yPos += 8
      rowCount = 0
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(...grayText)
      doc.setFontSize(8)
    }

    // Alternância de cor de fundo
    if (index % 2 === 0) {
      doc.setFillColor(...grayLight)
      doc.rect(margin, yPos, pageWidth - margin * 2, 7, 'F')
    }

    xPos = margin + 2
    const rowData = [
      String(row.collection_number).padStart(4, '0'),
      formatDateBR(row.collection_date),
      truncateText(row.executor_name || '-', 20),
      truncateText(row.client_name || '-', 22),
      truncateText(row.space_name || '-', 22),
      formatWeight(row.weight_collected),
      truncateText(row.notes || '-', 18)
    ]

    rowData.forEach((cell, i) => {
      doc.text(cell, xPos, yPos + 5)
      xPos += colWidths[i]
    })

    yPos += 7
    rowCount++
  })

  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Página ${i} de ${totalPages}`,
      pageWidth / 2,
      pageHeight - 10,
      { align: 'center' }
    )
    doc.text(
      'TLC Agro - Sistema de Monitoramento',
      pageWidth - margin,
      pageHeight - 10,
      { align: 'right' }
    )
  }

  // Download
  const fileName = `relatorio-coletas-${formatDateFile(new Date())}.pdf`
  doc.save(fileName)
}

// Funções auxiliares
function formatDateBR(dateStr: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleDateString('pt-BR')
}

function formatDateTimeBR(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('pt-BR')
}

function formatDateFile(date: Date): string {
  return date.toISOString().split('T')[0]
}

function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(2)} kg`
  }
  return `${weight.toFixed(0)} g`
}

function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 2) + '..'
}
