import { useEffect, useState } from 'react';

const useCountdown = (targetDate) => {
  const countDownDate = targetDate;

  const [countDown, setCountDown] = useState(
    Math.max(0, countDownDate - new Date().getTime())
  );

  useEffect(() => {
    if (countDownDate === 0 || countDownDate - new Date().getTime() <= 0) {
      setCountDown(0);
      return;
    }
    const interval = setInterval(() => {
      setCountDown(countDownDate - new Date().getTime());
    }, 1000);

    return () => clearInterval(interval);
  }, [countDownDate]);

  return getReturnValues(countDown);
};

const getReturnValues = (countDown) => {
  if (countDown <= 0) {
    return [0, 0];
  }
  // calculate time left
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return [minutes, seconds];
};

export { useCountdown };
