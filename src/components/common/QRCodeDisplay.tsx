import React, { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Printer, Link, QrCode as QrIcon, X } from 'lucide-react'

interface QRCodeDisplayProps {
  spaceId: string
  spaceName: string
  publicToken: string
  size?: number
  showDialog?: boolean
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  spaceId,
  spaceName,
  publicToken,
  size = 200,
  showDialog = true
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  // Gerar URL para coleta anônima
  const getCollectionUrl = () => {
    const baseUrl = window.location.origin
    return `${baseUrl}/collect/${publicToken}`
  }

  // Gerar QR Code
  useEffect(() => {
    const generateQR = async () => {
      try {
        const url = getCollectionUrl()
        console.log('🔄 Gerando QR Code para URL:', url)
        
        // Verificar se a URL está válida
        if (!url || !publicToken) {
          console.warn('⚠️ URL ou token inválido:', { url, publicToken })
          return
        }
        
        // Gerar como data URL para exibição e download
        const dataUrl = await QRCode.toDataURL(url, {
          width: 400,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          },
          errorCorrectionLevel: 'H'
        })
        
        console.log('✅ QR Code gerado com sucesso, tamanho:', dataUrl.length)
        setQrDataUrl(dataUrl)

      } catch (error) {
        console.error('❌ Erro ao gerar QR Code:', error)
        setQrDataUrl('') // Limpar em caso de erro
      }
    }

    if (publicToken) {
      generateQR()
    } else {
      console.warn('⚠️ Token público não fornecido')
    }
  }, [publicToken, size])

  // Download do QR Code
  const handleDownload = () => {
    const link = document.createElement('a')
    link.download = `qrcode-${spaceName.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = qrDataUrl
    link.click()
  }

  // Imprimir QR Code
  const handlePrint = () => {
    const printWindow = window.open('', '', 'width=600,height=800')
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>QR Code - ${spaceName}</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                display: flex;
                flex-direction: column;
                align-items: center;
                padding: 20px;
              }
              h1 { font-size: 24px; margin-bottom: 10px; }
              h2 { font-size: 18px; color: #666; margin-bottom: 20px; }
              img { border: 2px solid #ddd; padding: 20px; }
              .url { 
                margin-top: 20px; 
                padding: 10px; 
                background: #f5f5f5; 
                border-radius: 4px;
                word-break: break-all;
              }
              .instructions {
                margin-top: 30px;
                padding: 20px;
                border: 1px dashed #ccc;
                text-align: left;
                max-width: 500px;
              }
              .instructions h3 { margin-top: 0; }
              .instructions ol { padding-left: 20px; }
              .dev-note {
                margin-top: 20px;
                padding: 15px;
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                border-radius: 4px;
                font-size: 14px;
              }
            </style>
          </head>
          <body>
            <h1>TLC Zero - Controle de Pragas</h1>
            <h2>Espaço: ${spaceName}</h2>
            <img src="${qrDataUrl}" alt="QR Code" />
            <div class="url">
              <strong>URL:</strong> ${getCollectionUrl()}
            </div>
            <div class="instructions">
              <h3>Instruções de Uso:</h3>
              <ol>
                <li>Escaneie o QR Code com a câmera do celular</li>
                <li>Será aberto o formulário de coleta</li>
                <li>Preencha o peso coletado e tire uma foto</li>
                <li>Envie os dados - não é necessário login!</li>
              </ol>
            </div>
            <div class="dev-note">
              <strong>💡 Importante:</strong> Este QR Code usa localhost para desenvolvimento. 
              Em produção, será gerada uma URL pública acessível de qualquer lugar.
            </div>
          </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 250)
    }
  }

  // Copiar link
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getCollectionUrl())
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Erro ao copiar link:', error)
      // Fallback para navegadores que não suportam clipboard API
      const textArea = document.createElement('textarea')
      textArea.value = getCollectionUrl()
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    }
  }

  const content = (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="bg-white p-4 rounded-lg shadow-sm">
          {qrDataUrl ? (
            <img 
              src={qrDataUrl} 
              alt="QR Code para coleta" 
              className="w-48 h-48 object-contain"
              onLoad={() => console.log('✅ Imagem do QR Code carregada com sucesso')}
              onError={() => console.error('❌ Erro ao carregar imagem do QR Code')}
            />
          ) : publicToken ? (
            <div className="w-48 h-48 flex items-center justify-center bg-gray-100 rounded">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-2"></div>
                <p className="text-gray-500 text-sm">Gerando QR Code...</p>
              </div>
            </div>
          ) : (
            <div className="w-48 h-48 flex items-center justify-center bg-red-50 rounded border-2 border-red-200">
              <div className="text-center">
                <p className="text-red-500 text-sm">Erro: Token não encontrado</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Escaneie para registrar coleta
        </p>
        <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          <p className="font-mono text-xs text-gray-700 dark:text-gray-300 break-all">
            {getCollectionUrl()}
          </p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
          <p className="text-xs text-blue-700 dark:text-blue-300">
            💡 <strong>Dica:</strong> Em desenvolvimento, o QR Code usa localhost. 
            Em produção, será uma URL pública acessível de qualquer lugar.
          </p>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Download className="w-4 h-4" />
          Baixar
        </button>
        
        <button
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
        >
          <Printer className="w-4 h-4" />
          Imprimir
        </button>
        
        <button
          onClick={handleCopyLink}
          className={`inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
            linkCopied 
              ? 'text-green-700 bg-green-50 border-green-300' 
              : 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50'
          }`}
        >
          <Link className="w-4 h-4" />
          {linkCopied ? 'Link Copiado!' : 'Copiar Link'}
        </button>
      </div>
    </div>
  )

  if (!showDialog) {
    return content
  }

  return (
    <>
      <button
        onClick={() => setIsDialogOpen(true)}
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        <QrIcon className="w-4 h-4" />
        QR Code
      </button>

      {isDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setIsDialogOpen(false)} />
            
            <div className="inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  QR Code - {spaceName}
                </h3>
                <button
                  onClick={() => setIsDialogOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {content}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default QRCodeDisplay 