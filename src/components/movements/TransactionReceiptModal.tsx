import { X, Building2, Share2, Download, MessageCircle, Mail, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { useState, useRef } from "react";
import { toPng } from 'html-to-image';
import { useToast } from "@/hooks/use-toast";

export interface TransactionDetails {
  id: string;
  icon: LucideIcon;
  name: string;
  category: string;
  time: string;
  amount: string;
  type: "income" | "expense";
  dateGroup: string;
  concept?: string;
}

interface TransactionReceiptModalProps {
  transaction: TransactionDetails | null;
  onClose: () => void;
}

const TransactionReceiptModal = ({ transaction, onClose }: TransactionReceiptModalProps) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  if (!transaction) return null;

  const isIncome = transaction.type === "income";
  const transactionId = `MAG-${transaction.id.slice(0, 8).toUpperCase()}-${isIncome ? 'I' : 'E'}`;
  const cleanAmount = transaction.amount.replace(/[+-]/g, '');

  const handleDownload = async () => {
    if (!receiptRef.current) return;

    setIsDownloading(true);
    try {
      const dataUrl = await toPng(receiptRef.current, { cacheBust: true, backgroundColor: 'white' });
      const link = document.createElement('a');
      link.download = `comprobante-magnate-${transactionId}.png`;
      link.href = dataUrl;
      link.click();
      setShowShareMenu(false);
      toast({
        title: "Comprobante descargado",
        description: "La imagen se ha guardado en tu dispositivo.",
      });
    } catch (err) {
      console.error('Error downloading receipt:', err);
      toast({
        title: "Error al descargar",
        description: "No se pudo generar la imagen del comprobante.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: "Comprobante de Transacción - Magnate",
      text: `${isIncome ? 'Ingreso' : 'Pago'}: ${transaction.name} por ${cleanAmount}. ID: ${transactionId}`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      setShowShareMenu(true);
    }
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `${isIncome ? '✅ Ingreso recibido' : '💸 Pago realizado'} con Magnate\n\n${isIncome ? 'Origen' : 'Destinatario'}: ${transaction.name}\nMonto: ${cleanAmount}\nMotivo: ${transaction.concept || transaction.category}\nFecha: ${transaction.dateGroup} ${transaction.time}\nID: ${transactionId}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
    setShowShareMenu(false);
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent("Comprobante de Transacción - Magnate");
    const body = encodeURIComponent(
      `Comprobante de ${isIncome ? 'Ingreso' : 'Pago'}\n\n${isIncome ? 'Origen' : 'Destinatario'}: ${transaction.name}\nMotivo: ${transaction.concept || transaction.category}\nMonto: ${cleanAmount}\nFecha: ${transaction.dateGroup} ${transaction.time}\nID de Transacción: ${transactionId}`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
    setShowShareMenu(false);
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#1a3a5c] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div ref={receiptRef}>
          {/* Header */}
          <div className={`px-6 py-5 ${isIncome ? 'bg-[#27AE60]' : 'bg-[#0A2540]'} text-white relative`}>
            <button
              onClick={onClose}
              data-html2canvas-ignore
              className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="h-5 w-5" />
            </button>

            <p className="text-sm text-white/80 mb-1">
              {isIncome ? 'Ingreso recibido' : 'Pago realizado'}
            </p>
            <p className="text-3xl font-bold">{cleanAmount}</p>
          </div>

          {/* Details */}
          <div className="p-6 space-y-4">
            {/* Recipient/Origin */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2F80ED]/10 rounded-full flex items-center justify-center flex-shrink-0">
                <Building2 className="h-6 w-6 text-[#2F80ED]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {isIncome ? 'Origen' : 'Destinatario'}
                </p>
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                  {transaction.name || "Desconocido"}
                </p>
                <p className="text-sm text-gray-500 dark:text-white/60">
                  {transaction.concept || transaction.category || "Sin detalle"}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10" />

            {/* Date & Time */}
            <div className="flex justify-between">
              <div>
                <p className="text-sm text-gray-500 dark:text-white/60">Fecha</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {transaction.dateGroup}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-white/60">Hora</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {transaction.time}
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-dashed border-gray-200 dark:border-white/10" />

            {/* Transaction ID */}
            <div>
              <p className="text-sm text-gray-500 dark:text-white/60">ID de Transacción</p>
              <p className="font-mono font-semibold text-[#2F80ED]">
                {transactionId}
              </p>
            </div>
          </div>
        </div>

        {/* Actions - Outside ref to avoid capture */}
        <div className="px-6 pb-6 pt-0 space-y-3">
          <Button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full h-12 bg-[#2F80ED] hover:bg-[#2F80ED]/90 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
          >
            {isDownloading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Descargar Imagen
          </Button>

          <Button
            onClick={onClose}
            className="w-full h-12 bg-[#0A2540] hover:bg-[#0A2540]/90 text-white font-semibold rounded-xl"
          >
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TransactionReceiptModal;
