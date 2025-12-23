import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (data: string) => void
  onError?: (error: string) => void
}

export function QRScanner({ onScan, onError }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null)
  const [isScanning, setIsScanning] = useState(false)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    const startScanning = async () => {
      try {
        await scanner.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            onScan(decodedText)
            scanner.stop().catch(console.error)
            setIsScanning(false)
          },
          () => {
            // Ignore scan failures (no QR found in frame)
          }
        )
        setIsScanning(true)
      } catch (err) {
        onError?.(`Failed to start scanner: ${err}`)
      }
    }

    startScanning()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [onScan, onError])

  return (
    <div className="qr-scanner-container">
      <div id="qr-reader" style={{ width: '100%', maxWidth: '400px', margin: '0 auto' }} />
      {isScanning && <p className="scanning-text">Point camera at QR code</p>}
    </div>
  )
}
