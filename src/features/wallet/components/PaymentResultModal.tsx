import React from 'react';

interface PaymentResultModalProps {
  isOpen: boolean;
  status: 'success' | 'failed' | null;
  onClose: () => void;
  onNavigateToTutors?: () => void;
  onRetryDeposit?: () => void;
}

export const PaymentResultModal: React.FC<PaymentResultModalProps> = ({
  isOpen,
  status,
  onClose,
  onNavigateToTutors,
  onRetryDeposit,
}) => {
  if (!isOpen || !status) return null;

  const isSuccess = status === 'success';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(5, 8, 22, 0.78)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        padding: '16px',
        animation: 'fadeIn 0.25s ease-out',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '460px',
          background: 'linear-gradient(165deg, #1e1b4b 0%, #0f172a 45%, #090d16 100%)',
          borderRadius: '24px',
          border: isSuccess ? '1px solid rgba(52, 211, 153, 0.28)' : '1px solid rgba(248, 113, 113, 0.28)',
          boxShadow: isSuccess
            ? '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(16, 185, 129, 0.18)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.7), 0 0 40px rgba(239, 68, 68, 0.18)',
          padding: '36px 30px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          animation: 'scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Ambient Top Glow */}
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '220px',
            height: '140px',
            borderRadius: '50%',
            background: isSuccess
              ? 'radial-gradient(circle, rgba(16, 185, 129, 0.4) 0%, transparent 70%)'
              : 'radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Close Button top-right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#94a3b8',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '14px',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#fff';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94a3b8';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          ✕
        </button>

        {/* Animated Status Icon */}
        <div
          style={{
            width: '84px',
            height: '84px',
            margin: '0 auto 20px',
            borderRadius: '50%',
            background: isSuccess
              ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(5, 150, 105, 0.35) 100%)'
              : 'linear-gradient(135deg, rgba(239, 68, 68, 0.2) 0%, rgba(185, 28, 28, 0.35) 100%)',
            border: isSuccess ? '2px solid #10b981' : '2px solid #ef4444',
            boxShadow: isSuccess ? '0 0 30px rgba(16, 185, 129, 0.35)' : '0 0 30px rgba(239, 68, 68, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '36px',
            color: isSuccess ? '#34d399' : '#f87171',
            animation: 'pulseIcon 2s infinite',
          }}
        >
          {isSuccess ? '✓' : '✕'}
        </div>

        {/* Pill Tag */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 14px',
            borderRadius: '9999px',
            fontSize: '12px',
            fontWeight: 700,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            marginBottom: '12px',
            background: isSuccess ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
            border: isSuccess ? '1px solid rgba(16, 185, 129, 0.35)' : '1px solid rgba(239, 68, 68, 0.35)',
            color: isSuccess ? '#34d399' : '#f87171',
          }}
        >
          {isSuccess ? '🎉 Giao Dịch Hoàn Tất' : '⚠️ Giao Dịch Gián Đoạn'}
        </div>

        {/* Title */}
        <h3
          style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#f8fafc',
            margin: '0 0 10px 0',
            letterSpacing: '-0.3px',
          }}
        >
          {isSuccess ? 'Nạp Tín Chỉ VNPAY Thành Công!' : 'Thanh Toán Không Thành Công'}
        </h3>

        {/* Description */}
        <p
          style={{
            fontSize: '14px',
            lineHeight: '1.6',
            color: '#94a3b8',
            margin: '0 0 24px 0',
          }}
        >
          {isSuccess
            ? 'Cổng thanh toán VNPAY đã xác thực giao dịch thành công. Số dư tín chỉ đã được cộng ngay vào ví của bạn.'
            : 'Giao dịch qua VNPAY đã bị hủy hoặc gặp sự cố kỹ thuật. Số dư ví của bạn chưa bị thay đổi.'}
        </p>

        {/* Info Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.07)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '26px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            fontSize: '13px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Cổng thanh toán:</span>
            <span style={{ color: '#f8fafc', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ color: '#0284c7', fontWeight: 800 }}>VNPAY</span> QR / ATM / Visa
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Trạng thái xử lý:</span>
            <span
              style={{
                color: isSuccess ? '#34d399' : '#f87171',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: isSuccess ? '#10b981' : '#ef4444',
                }}
              />
              {isSuccess ? 'Đã ghi nhận & Cập nhật ví' : 'Thất bại / Hủy bỏ'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: '#64748b' }}>Thời gian:</span>
            <span style={{ color: '#cbd5e1' }}>Vừa xong</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {isSuccess ? (
            <>
              {onNavigateToTutors && (
                <button
                  onClick={() => {
                    onClose();
                    onNavigateToTutors();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(99, 102, 241, 0.45)',
                    transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 14px 28px -5px rgba(99, 102, 241, 0.55)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(99, 102, 241, 0.45)';
                  }}
                >
                  🚀 Tìm Kiếm & Đặt Lịch Gia Sư Ngay
                </button>
              )}

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Ở Lại Trang Ví
              </button>
            </>
          ) : (
            <>
              {onRetryDeposit && (
                <button
                  onClick={() => {
                    onClose();
                    onRetryDeposit();
                  }}
                  style={{
                    width: '100%',
                    padding: '14px',
                    borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 10px 25px -5px rgba(239, 68, 68, 0.4)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  🔄 Thử Nạp Lại
                </button>
              )}

              <button
                onClick={onClose}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                }}
              >
                Đóng
              </button>
            </>
          )}
        </div>

        {/* Global Keyframe Styles */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes scaleUp {
            from { opacity: 0; transform: scale(0.92) translateY(12px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulseIcon {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  );
};
