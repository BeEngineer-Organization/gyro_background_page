const canvas = document.getElementById('c');
const context = canvas.getContext('2d');
const debugElement = document.getElementById('debug');
const button = document.getElementById('btn');

const PETAL_COUNT = 90;
const petals = [];
const petalImg = new Image();
petalImg.src = 'img/petal.png';

const userAgent = navigator.userAgent || navigator.vendor || window.opera;
const isIOS = /iPad|iPhone|iPod/.test(userAgent);
const isAndroid = /Android/.test(userAgent);
const osSignX = isAndroid ? -1 : 1;

let tiltX = 0;
let tiltY = 0;

function rand(a, b) {
  return a + Math.random() * (b - a);
}

function clamp(n, min, max) {
  // n の値を範囲 [min, max] に制限する
  if (n > max) {
    return max;
  } else if (n < min) {
    return min;
  } else {
    return n;
  }
}

function resize() {
  const dpr = window.devicePixelRatio || 1;
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

function generatePetals() {
  for (let i = 0; i < PETAL_COUNT; i++) {
    petal = generatePetal((fromTop = false));
    petals.push(petal);
  }
}

function drawPetals(petals) {
  if (!petalImg.complete) return;

  petals.forEach((petal) => {
    // (x, y)を中心に、angle(度)回転した花びらを size の大きさで描画
    context.save();

    context.translate(petal.x, petal.y);
    context.rotate(petal.angle);
    context.globalAlpha = petal.alpha;

    const width = petal.size;
    const height = petal.size;
    context.drawImage(petalImg, -width / 2, -height / 2, width, height);

    context.restore();
  });
}

function getScreenAngle() {
  const a = screen?.orientation?.angle;
  if (typeof a === 'number') return a;
  const w = window.orientation;
  if (typeof w === 'number') return w;
  return 0;
}

function normalizeScreenAxes(accelX, accelY) {
  const screenAngle = ((getScreenAngle() % 360) + 360) % 360; // 角度を0°~360°に正規化

  let virtualAccelX;
  let virtualAccelY;

  if (screenAngle === 0) {
    virtualAccelX = accelX;
    virtualAccelY = accelY;
  } else if (screenAngle === 90) {
    virtualAccelX = accelY;
    virtualAccelY = -accelX;
  } else if (screenAngle === 180) {
    virtualAccelX = -accelX;
    virtualAccelY = -accelY;
  } else if (screenAngle === 270) {
    virtualAccelX = -accelY;
    virtualAccelY = accelX;
  }

  return {virtualAccelX, virtualAccelY, screenAngle};
}

function onMotion(e) {
  const acceleration = e.accelerationIncludingGravity;
  if (!acceleration) return;

  const accelX = -acceleration.x ?? 0;
  const accelY = acceleration.y ?? 0;

  const {virtualAccelX, virtualAccelY, screenAngle} = normalizeScreenAxes(
    accelX,
    accelY
  );

  tiltX = clamp(virtualAccelX / 9.8, -1, 1); // 傾け度合いを[-1, 1]の範囲で設定する
  tiltY = clamp(virtualAccelY / 9.8, -1, 1);

  debugElement.textContent = `OS:${isIOS ? 'iOS' : isAndroid ? 'Android' : 'Other'} angle:${screenAngle} tiltX:${tiltX.toFixed(2)} tiltY:${tiltY.toFixed(2)}`;
}

let last = performance.now();
function tick(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  context.clearRect(0, 0, innerWidth, innerHeight);
  context.fillStyle = 'rgba(11,16,32,1)';
  context.fillRect(0, 0, innerWidth, innerHeight);

  const wind = tiltX * 90;
  const gravityBoost = tiltY * 20;

  for (let i = 0; i < petals.length; i++) {
    const petal = petals[i];
    petal.swayPhase += petal.swayPhaseSpeed * dt;
    const swaySpeed = petal.swayAmp * Math.sin(petal.swayPhase);

    const speedX = petal.driftSpeed + swaySpeed + wind;
    const speedY = petal.fallSpeed + gravityBoost;

    petal.x += speedX * dt;
    petal.y += speedY * dt;
    petal.angle += petal.rotateSpeed * dt;

    if (petal.y > innerHeight || petal.x < -60 || petal.x > innerWidth + 60) {
      const newPetal = generatePetal();

      // 傾きがあるときに描画位置を調整
      if (wind > 30) {
        newPetal.x = rand(-30, innerWidth * 0.2);
      }
      if (wind < -30) {
        newPetal.x = rand(innerWidth * 0.8, innerWidth + 30);
      }

      // 既存の petal を newPetal と入れ替え
      petals[i] = newPetal;
    }
  }
  drawPetals(petals);

  requestAnimationFrame(tick);
}

window.addEventListener('resize', resize);

window.addEventListener('DOMContentLoaded', () => {
  resize();

  generatePetals();

  tick(performance.now());
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
