import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, ChevronDown, Clock, Lock, Mail, MapPin, MessageSquareText, Phone, User, X } from 'lucide-react';
import './styles.css';

const products = [
  { title: '1인 종합사주', price: 40000, type: 'general_saju', image: '/assets/product-total.jpg' },
  { title: '2인 종합사주', price: 70000, type: 'love_compatibility', image: '/assets/product-love.jpg' },
  { title: '태몽풀이', price: 10000, type: 'custom_question', image: '/assets/product-birth.jpg' },
];

function normalizeBirthDate(value) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})[.\-/\s]?(\d{1,2})[.\-/\s]?(\d{1,2})$/);
  if (!match) return '';

  const [, year, rawMonth, rawDay] = match;
  const month = rawMonth.padStart(2, '0');
  const day = rawDay.padStart(2, '0');
  const date = new Date(`${year}-${month}-${day}T00:00:00`);

  if (
    Number.isNaN(date.getTime())
    || date.getFullYear() !== Number(year)
    || date.getMonth() + 1 !== Number(month)
    || date.getDate() !== Number(day)
  ) {
    return '';
  }

  return `${year}-${month}-${day}`;
}

function normalizeBirthTime(value) {
  const trimmed = value.trim();
  if (!trimmed || /모름|몰라|미상|unknown/i.test(trimmed)) return '';

  const compact = trimmed.replace(/\s+/g, '');
  const meridiem = compact.match(/^(오전|오후|am|pm)/i)?.[1]?.toLowerCase();
  const timeText = compact.replace(/^(오전|오후|am|pm)/i, '');
  const match = timeText.match(/^(\d{1,2})(?::?(\d{2}))?$/);
  if (!match) return null;

  let hour = Number(match[1]);
  const minute = Number(match[2] || '0');

  if (meridiem === '오후' || meridiem === 'pm') {
    if (hour < 12) hour += 12;
  }
  if (meridiem === '오전' || meridiem === 'am') {
    if (hour === 12) hour = 0;
  }

  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function SuccessModal({ orderId, productTitle, price, onClose }) {
  const formattedPrice = price.toLocaleString('ko-KR');

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="modal-content">
        <h2 id="modal-title">신청접수 완료</h2>
        <p className="modal-message">신청이 정상적으로 접수되었습니다.</p>
        {orderId && <p className="modal-order-id">접수번호: {orderId}</p>}
        <div className="modal-account-info">
          <h3>입금 안내</h3>
          <dl>
            <div>
              <dt>입금 은행</dt>
              <dd>카카오뱅크</dd>
            </div>
            <div>
              <dt>계좌번호</dt>
              <dd>3333-30-2628338</dd>
            </div>
            <div>
              <dt>예금주</dt>
              <dd>와이비</dd>
            </div>
            <div>
              <dt>결제금액</dt>
              <dd className="modal-price">{formattedPrice}원</dd>
            </div>
          </dl>
        </div>
        <p className="modal-notice">위 계좌로 입금 확인 후 리포트가 작성됩니다.</p>
        <button className="modal-close-button" type="button" onClick={onClose}>
          <X size={18} />
          닫기
        </button>
      </div>
    </div>
  );
}

function App() {
  const [active, setActive] = useState(0);
  const [submitState, setSubmitState] = useState({ status: 'idle', message: '' });
  const [modalData, setModalData] = useState(null);
  const dragStart = useRef(null);
  const year = useMemo(() => new Date().getFullYear(), []);

  const moveProduct = (direction) => {
    setActive((current) => (current + direction + products.length) % products.length);
  };

  const handlePointerDown = (event) => {
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      pointerId: event.pointerId,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerUp = (event) => {
    const start = dragStart.current;
    dragStart.current = null;
    if (!start) return;

    const dx = event.clientX - start.x;
    const dy = event.clientY - start.y;
    if (Math.abs(dx) < 32 || Math.abs(dx) < Math.abs(dy)) return;

    moveProduct(dx < 0 ? 1 : -1);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const name = String(formData.get('name') || '').trim();
    const gender = String(formData.get('gender') || '');
    const birthDate = normalizeBirthDate(String(formData.get('birth') || ''));
    const calendarType = String(formData.get('calendar_type') || 'solar');
    const isLeapMonth = formData.get('is_leap_month') === 'on';
    const birthTime = normalizeBirthTime(String(formData.get('time') || ''));
    const birthPlace = String(formData.get('birth_place') || '').trim();
    const contact = String(formData.get('contact') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const productTitle = String(formData.get('product') || '1인 종합사주');
    const memo = String(formData.get('memo') || '').trim();

    // 필수값 검증
    if (!name) {
      setSubmitState({ status: 'error', message: '이름을 입력해주세요.' });
      return;
    }
    if (!gender) {
      setSubmitState({ status: 'error', message: '성별을 선택해주세요.' });
      return;
    }
    if (!birthDate) {
      setSubmitState({ status: 'error', message: '생년월일을 1990.01.01 형식으로 입력해주세요.' });
      return;
    }
    if (!calendarType) {
      setSubmitState({ status: 'error', message: '양력/음력을 선택해주세요.' });
      return;
    }
    if (birthTime === null) {
      setSubmitState({ status: 'error', message: '태어난 시간은 오전 11:30, 14:30 또는 모름으로 입력해주세요.' });
      return;
    }
    if (!contact) {
      setSubmitState({ status: 'error', message: '연락처를 입력해주세요.' });
      return;
    }

    const selectedProduct = products.find((p) => p.title === productTitle) || products[0];
    const questionText = [productTitle, memo].filter(Boolean).join(' - ');

    const payload = {
      customer_name: name,
      gender,
      product_type: selectedProduct.type,
      birth_date: birthDate,
      calendar_type: calendarType,
      is_leap_month: isLeapMonth,
      ...(birthTime && { birth_time: birthTime }),
      ...(birthPlace && { birth_place: birthPlace }),
      phone: contact,
      ...(email && { email }),
      ...(memo && { question_text: questionText }),
    };

    setSubmitState({ status: 'loading', message: '신청 정보를 접수하고 있습니다.' });

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || '신청 접수 중 문제가 발생했습니다.');
      }

      form.reset();
      setSubmitState({ status: 'idle', message: '' });
      setModalData({
        orderId: result.order_id,
        productTitle: selectedProduct.title,
        price: selectedProduct.price,
      });
    } catch (error) {
      setSubmitState({
        status: 'error',
        message: error.message || '신청 접수 중 문제가 발생했습니다.',
      });
    }
  };

  return (
    <main className="landing-shell">
      <section className="hero-image-section" aria-label="사주언박싱 소개 이미지">
        <img src="/assets/saju-main-20260514.png" alt="사주언박싱 서비스 소개" />
      </section>

      <section className="carousel-section" aria-label="상품 소개 캐러셀">
        <div
          className="carousel-frame"
          onPointerDown={handlePointerDown}
          onPointerCancel={() => { dragStart.current = null; }}
          onPointerUp={handlePointerUp}
        >
          {products.map((product, index) => (
            <img
              key={product.title}
              src={product.image}
              alt={`${product.title} 상품 소개 이미지`}
              className={index === active ? 'active' : ''}
              draggable="false"
            />
          ))}
          <div className="carousel-caption">
            <span>상품 소개</span>
            <strong>{products[active].title}</strong>
          </div>
          <div className="dots" aria-label="상품 캐러셀 위치">
            {products.map((product, index) => (
              <i
                key={product.title}
                className={index === active ? 'active' : ''}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="price-image-section" aria-label="가격 안내 이미지">
        <img src="/assets/saju-price-20260514.png" alt="사주언박싱 가격 안내" />
      </section>

      <section className="form-section" aria-labelledby="form-title">
        <h1 id="form-title">신청 정보 입력</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Row 1: 이름 | 성별 */}
            <label htmlFor="name">
              <span>이름 <em className="required">*</em></span>
              <div className="input-wrap">
                <User size={18} />
                <input id="name" name="name" type="text" placeholder="이름을 입력해주세요" />
              </div>
            </label>
            <label htmlFor="gender">
              <span>성별 <em className="required">*</em></span>
              <div className="segmented" role="radiogroup" aria-label="성별 선택">
                <input id="male" name="gender" type="radio" value="male" defaultChecked />
                <label htmlFor="male">남성</label>
                <input id="female" name="gender" type="radio" value="female" />
                <label htmlFor="female">여성</label>
              </div>
            </label>

            {/* Row 2: 생년월일 | 양력/음력 + 윤달 */}
            <label htmlFor="birth">
              <span>생년월일 <em className="required">*</em></span>
              <div className="input-wrap">
                <CalendarDays size={18} />
                <input id="birth" name="birth" type="text" placeholder="예: 1990.01.01" />
              </div>
            </label>
            <label htmlFor="calendar_type">
              <span>양력/음력 <em className="required">*</em></span>
              <div className="calendar-group">
                <div className="segmented" role="radiogroup" aria-label="양력/음력 선택">
                  <input id="solar" name="calendar_type" type="radio" value="solar" defaultChecked />
                  <label htmlFor="solar">양력</label>
                  <input id="lunar" name="calendar_type" type="radio" value="lunar" />
                  <label htmlFor="lunar">음력</label>
                </div>
                <label className="leap-check" htmlFor="is_leap_month">
                  <input id="is_leap_month" name="is_leap_month" type="checkbox" />
                  <span>윤달</span>
                </label>
              </div>
            </label>

            {/* Row 3: 태어난 시간 | 태어난 장소 */}
            <label htmlFor="time">
              <span>태어난 시간</span>
              <div className="input-wrap">
                <Clock size={18} />
                <input id="time" name="time" type="text" placeholder="예: 오전 11:30 / 모름" />
              </div>
            </label>
            <label htmlFor="birth_place">
              <span>태어난 장소</span>
              <div className="input-wrap">
                <MapPin size={18} />
                <input id="birth_place" name="birth_place" type="text" placeholder="예: 서울 / 모름" />
              </div>
            </label>

            {/* Row 4: 연락처 | 상품 선택 */}
            <label htmlFor="contact">
              <span>연락처 <em className="required">*</em></span>
              <div className="input-wrap">
                <Phone size={18} />
                <input id="contact" name="contact" type="tel" placeholder="예: 010-1234-5678" />
              </div>
            </label>
            <label htmlFor="product">
              <span>상품 선택 <em className="required">*</em></span>
              <div className="select-wrap">
                <MessageSquareText size={18} />
                <select id="product" name="product" defaultValue="1인 종합사주">
                  {products.map((product) => (
                    <option key={product.title} value={product.title}>
                      {product.title} ({product.price.toLocaleString('ko-KR')}원)
                    </option>
                  ))}
                </select>
                <ChevronDown size={18} />
              </div>
            </label>
          </div>

          {/* 이메일 (선택) */}
          <label htmlFor="email">
            <span>이메일 <small>(선택)</small></span>
            <div className="input-wrap">
              <Mail size={18} />
              <input id="email" name="email" type="email" placeholder="예: example@email.com" />
            </div>
          </label>

          <label className="wide" htmlFor="memo">
            <span>추가 메모 <small>(선택)</small></span>
            <textarea id="memo" name="memo" rows="3" placeholder="문의사항이나 특별히 알고 싶은 내용을 자유롭게 입력해주세요" />
          </label>

          <p className="privacy"><Lock size={14} /> 입력하신 정보는 상담 및 리포트 제작에만 사용됩니다.</p>
          {submitState.message && (
            <p className={`form-alert ${submitState.status}`} role="status">
              {submitState.message}
            </p>
          )}
          <button className="submit-button" type="submit" disabled={submitState.status === 'loading'}>
            {submitState.status === 'loading' ? '접수 중' : '신청하기'}
          </button>
        </form>
      </section>

      <footer>
        <p>© {year} 사주언박싱</p>
        <dl className="business-info" aria-label="사업자 정보">
          <div>
            <dt>사업자명</dt>
            <dd>와이비</dd>
          </div>
          <div>
            <dt>사업자등록번호</dt>
            <dd>447-35-01307</dd>
          </div>
          <div>
            <dt>대표자명</dt>
            <dd>변유나</dd>
          </div>
          <div>
            <dt>서비스명</dt>
            <dd>사주언박싱</dd>
          </div>
        </dl>
      </footer>

      {modalData && (
        <SuccessModal
          orderId={modalData.orderId}
          productTitle={modalData.productTitle}
          price={modalData.price}
          onClose={() => setModalData(null)}
        />
      )}
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
