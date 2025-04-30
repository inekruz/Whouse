import React, { useEffect, useState } from 'react';
import './LoadingScreen.css';
import Lottie from 'react-lottie';
import banAnimation from './ban.json';

function LoadingScreen({ error, banned }) {
  const finalText = 'Загружаем магию...';
  const [displayedText, setDisplayedText] = useState('');
  const chars = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЫЬЭЮЯabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
  const speed = 30;
  const stepsPerLetter = 6;

  useEffect(() => {
    let currentIndex = 0;
    let step = 0;
    let tempText = '';

    const interval = setInterval(() => {
      if (currentIndex >= finalText.length) {
        clearInterval(interval);
        return;
      }

      if (finalText[currentIndex] === ' ') {
        tempText += ' ';
        setDisplayedText(tempText);
        currentIndex++;
        step = 0;
      } else {
        if (step < stepsPerLetter) {
          const fakeChar = chars[Math.floor(Math.random() * chars.length)];
          const fullText = tempText + fakeChar;
          setDisplayedText(fullText);
          step++;
        } else {
          tempText += finalText[currentIndex];
          setDisplayedText(tempText);
          currentIndex++;
          step = 0;
        }
      }
    }, speed);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="loading-screen">
      {banned ? (
        <div className="banned-container">
          <Lottie options={{ animationData: banAnimation, loop: true, autoplay: true }} height={150} width={150} />
          {banned.reason === 'Приложение уже открыто в другом окне' ? (
            <>
              <p className="banned-text">Ошибка!</p>
              <p className="banned-reason">Приложение уже открыто в другом окне или вкладке.</p>
              <p className="banned-date">Пожалуйста, закройте другие окна и обновите страницу.</p>
            </>
          ) : (
            <>
              <p className="banned-text">Ваш аккаунт заблокирован!</p>
              <p className="banned-reason">Причина: {banned.reason}</p>
              <p className="banned-date">Блокировка до: {new Date(banned.date_end).toLocaleString()}</p>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="pulse-logo">
            <span className="circle" />
            <span className="circle delay-1" />
            <span className="circle delay-2" />
          </div>
          <p className="decode-text">{displayedText}</p>
          {error && <p className="error-text">Ошибка подключения. Попробуйте позже.</p>}
        </>
      )}
    </div>
  );
}

export default LoadingScreen;
