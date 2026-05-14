import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CalendarDays, ChevronDown, Clock, Lock, MessageSquareText, Phone, User } from 'lucide-react';
import './styles.css';

const products = [
  { title: '종합운세', image: '/assets/product-total.jpg' },
  { title: '연애운', image: '/assets/product-love.jpg' },
  { title: '재물운', image: '/assets/product-money.jpg' },
  { title: '태몽풀이', image: '/assets/product-birth.jpg' },
  { title: '꿈해몽', image: '/assets/product-dream.jpg' },
];

const fieldBase = [
  { id: 'name', label: '이름', type: 'text', placeholder: '이름을 입력해주세요', icon: User },
  { id: 'birth', label: '생년월일', type: 'text', placeholder: '예: 1990.01.01', icon: CalendarDays },
  { id: 'time', label: '태어난 시간', type: 'text', placeholder: '예: 오전 11:30 / 모름', icon: Clock },
  { id: 'contact', label: '연락처', type: 'tel', placeholder: '예: 010-1234-5678', icon: Phone },
];

function App() {
  const [active, setActive] = useState(0);
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
        <form onSubmit={(event) => event.preventDefault()}>
          <div className="form-grid">
            {fieldBase.map(({ id, label, type, placeholder, icon: Icon }) => (
              <label key={id} htmlFor={id}>
                <span>{label}</span>
                <div className="input-wrap">
                  <Icon size={18} />
                  <input id={id} name={id} type={type} placeholder={placeholder} />
                </div>
              </label>
            ))}
            <label htmlFor="gender">
              <span>성별</span>
              <div className="segmented" role="radiogroup" aria-label="성별 선택">
                <input id="male" name="gender" type="radio" defaultChecked />
                <label htmlFor="male">남성</label>
                <input id="female" name="gender" type="radio" />
                <label htmlFor="female">여성</label>
              </div>
            </label>
            <label htmlFor="product">
              <span>원하는 상품 선택</span>
              <div className="select-wrap">
                <MessageSquareText size={18} />
                <select id="product" name="product" defaultValue="종합운세">
                  {products.map((product) => <option key={product.title}>{product.title}</option>)}
                </select>
                <ChevronDown size={18} />
              </div>
            </label>
          </div>
          <label className="wide" htmlFor="memo">
            <span>추가 메모 <small>(선택)</small></span>
            <textarea id="memo" name="memo" rows="3" placeholder="문의사항이나 특별히 알고 싶은 내용을 자유롭게 입력해주세요" />
          </label>
          <p className="privacy"><Lock size={14} /> 입력하신 정보는 상담 및 리포트 제작에만 사용됩니다.</p>
          <button className="submit-button" type="submit">신청하기</button>
        </form>
      </section>

      <footer>© {year} 사주언박싱</footer>
    </main>
  );
}

createRoot(document.getElementById('root')).render(<App />);
