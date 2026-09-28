import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface BarcodeRendererProps {
  value: string;
  size?: number;
  showText?: boolean;
  className?: string;
}

export const QrCodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  size = 180,
  className = '',
}) => {
  const [dataUrl, setDataUrl] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    QRCode.toDataURL(value, {
      width: size * 2, // High resolution for Retina/mobile screens
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => {
        if (isMounted) setDataUrl(url);
      })
      .catch((err) => {
        console.error('Failed to generate QR code', err);
      });

    return () => {
      isMounted = false;
    };
  }, [value, size]);

  return (
    <div className={`flex flex-col items-center justify-center p-2.5 bg-white rounded-xl shadow-inner ${className}`}>
      {dataUrl ? (
        <img
          src={dataUrl}
          alt={`QR Code: ${value}`}
          style={{ width: size, height: size }}
          className="object-contain"
        />
      ) : (
        <div
          style={{ width: size, height: size }}
          className="bg-slate-100 animate-pulse flex items-center justify-center text-xs text-slate-400"
        >
          Membuat QR...
        </div>
      )}
    </div>
  );
};

interface OneDBarcodeProps {
  code?: string;
  value?: string;
  height?: number;
  showText?: boolean;
  className?: string;
}

export const OneDBarcodeRenderer: React.FC<OneDBarcodeProps> = ({
  code,
  value,
  height = 54,
  showText = true,
  className = '',
}) => {
  const targetCode = (code || value || '').toUpperCase();

  // Generate consistent faux Code 128 bar pattern based on code string
  const bars = React.useMemo(() => {
    const list: { width: number; isBlack: boolean }[] = [];
    list.push({ width: 2, isBlack: true });
    list.push({ width: 1, isBlack: false });
    list.push({ width: 1, isBlack: true });
    list.push({ width: 2, isBlack: false });

    for (let i = 0; i < targetCode.length; i++) {
      const charCode = targetCode.charCodeAt(i);
      const b1 = (charCode % 3) + 1;
      const b2 = ((charCode >> 1) % 2) + 1;
      const b3 = ((charCode >> 2) % 3) + 1;
      const b4 = ((charCode >> 3) % 2) + 1;

      list.push({ width: b1, isBlack: true });
      list.push({ width: b2, isBlack: false });
      list.push({ width: b3, isBlack: true });
      list.push({ width: b4, isBlack: false });
    }

    list.push({ width: 3, isBlack: true });
    list.push({ width: 1, isBlack: false });
    list.push({ width: 2, isBlack: true });
    return list;
  }, [targetCode]);

  return (
    <div className={`flex flex-col items-center bg-white p-2.5 ${className}`}>
      <div className="flex items-stretch overflow-hidden justify-center" style={{ height }}>
        {bars.map((bar, index) => (
          <div
            key={index}
            style={{
              width: `${bar.width * 2}px`,
              backgroundColor: bar.isBlack ? '#000000' : '#ffffff',
            }}
          />
        ))}
      </div>
      {showText && (
        <div className="mt-1.5 font-mono text-[11px] font-bold text-black tracking-[0.25em] select-all">
          {targetCode}
        </div>
      )}
    </div>
  );
};

