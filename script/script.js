const canvas = document.getElementById('c');
const context = canvas.getContext('2d');
const debugElement = document.getElementById('debug');
const button = document.getElementById('btn');

const userAgent = navigator.userAgent ?? navigator.vendor ?? window.opera;
const isIOS = /iPad|iPhone|iPod/.test(userAgent);
const isAndroid = /Android/.test(userAgent);
const osSignX = isIOS ? -1 : 1;

function resize() {
  const dpr = window.devicePixelRatio ?? 1;
  canvas.width = Math.floor(innerWidth * dpr);
  canvas.height = Math.floor(innerHeight * dpr);
  canvas.style.width = innerWidth + 'px';
  canvas.style.height = innerHeight + 'px';
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function generatePetal(fromTop = true) {
  const petal = {};
  petal.x = rand(0, innerWidth);
  petal.y = fromTop ? rand(-innerHeight * 0.2, 0) : rand(0, innerHeight);
  petal.size = rand(32, 64);
  petal.fallSpeed = rand(40, 90);
  // petal.fallSpeed = 0;
  petal.driftSpeed = rand(-15, 15); // 横滑り
  petal.angle = rand(0, 2 * Math.PI); // 生成時の角度
  petal.rotateSpeed = rand((-Math.PI * 2) / 3, (Math.PI * 2) / 3); // 回転速度
  petal.swayPhase = rand(0, 2 * Math.PI); // 揺れの初期位相
  petal.swayAmp = rand(4, 16); // 揺れの振幅
  petal.swayPhaseSpeed = rand(0.6, 1.6); // 揺れの変化率(角速度)
  petal.alpha = rand(0.6, 1); // 透明度
  return petal;
}

window.addEventListener('resize', resize);

window.addEventListener('DOMContentLoaded', () => {
  resize();
});

btn.addEventListener('click', async () => {
  try {
    if (
      typeof DeviceMotionEvent !== 'undefined' &&
      typeof DeviceMotionEvent.requestPermission === 'function'
    ) {
      const res = await DeviceMotionEvent.requestPermission();
      if (res !== 'granted') {
        btn.textContent = '許可されませんでした';
        return;
      }
    }
    window.addEventListener('devicemotion', onMotion, {passive: true});
    btn.textContent = '許可OK';
    btn.disabled = true;
  } catch (err) {
    btn.textContent = '失敗しました';
  }
});
