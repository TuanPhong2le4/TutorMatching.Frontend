import React, { useState } from 'react';
import { creditService } from '../services/creditService';

interface WalletDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepositSuccess: (newBalance: number) => void;
}

export const WalletDepositModal: React.FC<WalletDepositModalProps> = ({ isOpen, onClose, onDepositSuccess }) => {
  const [amount, setAmount] = useState<string>('500');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  // Card details mock states for premium visual aesthetics
  const [cardNumber, setCardNumber] = useState<string>('4111 2222 3333 4444');
  const [cardHolder, setCardHolder] = useState<string>('NGUYEN VAN A');
  const [cardExpiry, setCardExpiry] = useState<string>('12/30');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const parsedAmount = parseFloat(amount);

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMsg('Vui lòng nhập số tiền nạp hợp lệ (lớn hơn 0).');
      return;
    }

    try {
      setSubmitting(true);
      const paymentUrl = await creditService.deposit(parsedAmount);
      // Redirect directly to VNPAY payment portal
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || 'Có lỗi xảy ra khi nạp tiền. Vui lòng thử lại.');
      setSubmitting(false);
    }
  };

  const handleQuickSelect = (val: number) => {
    setAmount(val.toString());
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1300,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        className="glass-panel"
        style={{
          width: '100%',
          maxWidth: '480px',
          padding: '28px',
          borderRadius: '24px',
          position: 'relative',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <h3 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💳 Nạp Tiền Vào Ví Tín Dụng
        </h3>

        {success ? (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '54px', marginBottom: '12px' }}>💎</div>
            <h4 style={{ color: '#4ade80', fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>Nạp Tiền Thành Công!</h4>
            <p style={{ color: '#94a3b8', fontSize: '14px' }}>Tín chỉ đã được cộng vào tài khoản của bạn.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {errorMsg && (
              <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#f87171', fontSize: '13px', marginBottom: '16px' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Credit Card Graphic (For premium visual styling) */}
            <div
              style={{
                width: '100%',
                height: '180px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                padding: '20px',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 10px 25px rgba(168, 85, 247, 0.3)',
                position: 'relative',
                overflow: 'hidden',
                marginBottom: '20px',
              }}
            >
              {/* Glassmorphic glowing circles in background */}
              <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', filter: 'blur(10px)' }} />
              <div style={{ position: 'absolute', bottom: '-40px', left: '-10px', width: '100px', height: '100px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', filter: 'blur(10px)' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '18px', fontWeight: 'bold', letterSpacing: '1px' }}>TUTOR WALLET</span>
                <span style={{ fontSize: '24px' }}>💳</span>
              </div>

              <div style={{ fontSize: '18px', fontWeight: 600, letterSpacing: '3px', margin: '20px 0 10px' }}>
                {cardNumber}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', textTransform: 'uppercase' }}>
                <div>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', marginBottom: '2px' }}>Chủ Thẻ</div>
                  <div style={{ fontWeight: 600 }}>{cardHolder}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '9px', marginBottom: '2px' }}>Hạn Dùng</div>
                  <div style={{ fontWeight: 600 }}>{cardExpiry}</div>
                </div>
              </div>
            </div>

            {/* Simulated credit card fields */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>Mã số thẻ (Simulated):</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                  }}
                />
              </div>
              <div style={{ width: '90px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '6px' }}>CVC:</label>
                <input
                  type="password"
                  defaultValue="***"
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '13px',
                    outline: 'none',
                    textAlign: 'center',
                  }}
                />
              </div>
            </div>

            {/* Custom Amount input */}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '13px', color: '#cbd5e1', fontWeight: 600, marginBottom: '8px' }}>
                Số Tín Chỉ Cần Nạp:
              </label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: '12px', top: '12px', color: '#a855f7', fontWeight: 'bold' }}>💎</span>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Nhập số tín chỉ..."
                  style={{
                    width: '100%',
                    padding: '12px 12px 12px 36px',
                    borderRadius: '10px',
                    backgroundColor: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 'bold',
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Quick selectors */}
            <div style={{ marginBottom: '24px' }}>
              <span style={{ display: 'block', fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>Nạp nhanh:</span>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[100, 500, 1000, 2000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => handleQuickSelect(val)}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: amount === val.toString() ? 'rgba(168, 85, 247, 0.15)' : 'transparent',
                      borderColor: amount === val.toString() ? '#a855f7' : 'rgba(255,255,255,0.1)',
                      color: amount === val.toString() ? '#fff' : '#cbd5e1',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: 600,
                      transition: 'all 0.2s',
                    }}
                  >
                    + {val} tc
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                style={{
                  padding: '10px 20px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  backgroundColor: 'transparent',
                  color: '#94a3b8',
                  fontSize: '14px',
                  cursor: 'pointer',
                }}
              >
                Đóng
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary"
                style={{
                  padding: '10px 24px',
                  fontSize: '14px',
                  opacity: submitting ? 0.7 : 1,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                }}
              >
                {submitting ? 'Đang kết nối VNPAY...' : '💳 Xác Nhận Nạp'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
