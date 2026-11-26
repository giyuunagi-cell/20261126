let bgImage; // 儲存背景圖片 bg/3.png
let bgOffsetX = 0; // 記錄背景水平捲動偏移量（負值代表背景往左移動）
let characterSprite; // 儲存角色一的精靈圖
let walkSprite; // 儲存角色一的走路精靈圖
let magicSprite; // 儲存角色一的施法精靈圖
let magicEffectSprite; // 儲存角色一的魔法特效精靈圖
let characterX; // 儲存角色一目前的水平中心位置
let isWalking = false; // 記錄角色是否已切換為走路動畫
let facingDirection = 1; // 記錄角色朝向（1 為右，-1 為左）
let isCasting = false; // 記錄角色是否正在播放施法動畫
let magicStartFrame = 0; // 記錄施法動畫開始時的畫面計數
let magicDirection = 1; // 記錄施法時鎖定的方向
let spaceIsDown = false; // 記錄空白鍵是否已按住以避免重複觸發
let activeEffects = []; // 儲存目前畫面上飛行中的魔法特效

// 角色二相關變數與精靈圖
let char2StopSprite; // 儲存角色二的站立精靈圖
let char2ActionSprite; // 儲存角色二的互動動作精靈圖

// 數學測驗與互動特效變數
let wasNearChar2 = false; // 記錄上一幀是否靠近角色二
let currentQuestion = null; // 儲存目前的數學加法題目與選項
let quizAnswered = false; // 記錄目前題目是否已作答
let quizResultText = ""; // 顯示答對或答錯的回饋文字
let fireworks = []; // 儲存煙火粒子陣列
let lightnings = []; // 儲存閃電特效陣列

// 角色一精靈圖參數
const frameCountInSprite = 10; // 設定精靈圖包含的影格數
const frameWidth = 139.5; // 設定每個影格的寬度（1395 除以 10）
const frameHeight = 196; // 設定每個影格的高度
const walkFrameCount = 9; // 設定走路精靈圖包含的影格數
const walkFrameWidth = 1246 / walkFrameCount; // 計算走路動畫每格的寬度
const walkFrameHeight = 198; // 設定走路動畫每格的高度
const magicFrameCount = 4; // 設定施法精靈圖包含的影格數
const magicFrameWidth = 1039 / magicFrameCount; // 計算施法動畫每格的寬度
const magicFrameHeight = 146; // 設定施法動畫每格的高度
const effectFrameCount = 5; // 設定魔法特效精靈圖包含的影格數
const effectFrameWidth = 740 / effectFrameCount; // 計算魔法特效每格的寬度
const effectFrameHeight = 19; // 設定魔法特效每格的高度
const framesPerStep = 8; // 設定動畫每隔幾個畫面更新一格

// 角色二精靈圖參數
const char2StopFrameCount = 8; // 角色二站立影格數
const char2StopFrameWidth = 699 / char2StopFrameCount; // 角色二站立單格寬度
const char2StopFrameHeight = 190; // 角色二站立高度
const char2ActionFrameCount = 14; // 角色二互動動作影格數
const char2ActionFrameWidth = 1817 / char2ActionFrameCount; // 角色二互動動作單格寬度
const char2ActionFrameHeight = 177; // 角色二互動動作高度

function preload() {
  bgImage = loadImage("bg/3.png");
  characterSprite = loadImage("1/stop/stop.png");
  walkSprite = loadImage("1/walk/walk.png");
  magicSprite = loadImage("1/magic/magic.png");
  magicEffectSprite = loadImage("1/magic_effect/magic_effect.png");
  char2StopSprite = loadImage("2/stop/stop.png");
  char2ActionSprite = loadImage("2/action/action.png");
}

function setup() {
  createCanvas(windowWidth, windowHeight);
  imageMode(CENTER);
  characterX = (width * 2) / 3;
  frameRate(60);
}

// 產生數學加法選擇題（1 個正確答案 + 3 個錯誤選項）
function generateMathQuestion() {
  const num1 = floor(random(1, 50));
  const num2 = floor(random(1, 50));
  const answer = num1 + num2;
  let options = [answer];

  while (options.length < 4) {
    let wrong = answer + floor(random(-12, 13));
    if (wrong > 0 && !options.includes(wrong)) {
      options.push(wrong);
    }
  }
  options = shuffle(options);

  currentQuestion = {
    text: `${num1} + ${num2} = ?`,
    answer: answer,
    options: options,
    selectedIndex: -1
  };
  quizAnswered = false;
  quizResultText = "";
}

// 計算上方黃色方框尺寸與位置（高為畫布 1/2、寬為畫布 1/3、上方靠近畫布上方、水平置中）
function getQuizBoxBounds() {
  const boxW = width / 3;
  const boxH = height / 2;
  const boxX = width / 2 - boxW / 2;
  const boxY = 15;
  return { x: boxX, y: boxY, w: boxW, h: boxH };
}

// 計算四個選項按鈕的位置與尺寸
function getOptionButtons(box) {
  const btnW = box.w * 0.38;
  const btnH = box.h * 0.18;
  const gapX = box.w * 0.08;
  const gapY = box.h * 0.08;
  const startX = box.x + (box.w - (btnW * 2 + gapX)) / 2;
  const startY = box.y + box.h * 0.42;

  let buttons = [];
  for (let i = 0; i < 4; i++) {
    const col = i % 2;
    const row = floor(i / 2);
    buttons.push({
      index: i,
      x: startX + col * (btnW + gapX),
      y: startY + row * (btnH + gapY),
      w: btnW,
      h: btnH
    });
  }
  return buttons;
}

function draw() {
  background("#87CEEB");

  // 計算單張背景圖等比例縮放後的寬度與高度
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const singleBgHeight = height;

  // 計算三張背景串接後的可捲動範圍
  const minBgOffset = width - singleBgWidth * 2;
  const maxBgOffset = singleBgWidth;
  const anchorX = (width * 2) / 3;

  const movingRight = keyIsDown(RIGHT_ARROW);
  const movingLeft = keyIsDown(LEFT_ARROW);
  isWalking = movingRight || movingLeft;
  const movementStep = constrain(width * 0.004, 2, 8);

  const characterScale = (height / 3) / frameHeight;
  const characterWidth = frameWidth * characterScale;
  const characterHeight = height / 3;

  if (movingRight) {
    isWalking = true;
    facingDirection = 1;
    if (characterX < anchorX) {
      characterX = min(anchorX, characterX + movementStep);
    } else if (bgOffsetX > minBgOffset) {
      bgOffsetX = max(minBgOffset, bgOffsetX - movementStep);
    } else {
      characterX += movementStep;
    }
  } else if (movingLeft) {
    isWalking = true;
    facingDirection = -1;
    if (characterX > anchorX) {
      characterX = max(anchorX, characterX - movementStep);
    } else if (bgOffsetX < maxBgOffset) {
      bgOffsetX = min(maxBgOffset, bgOffsetX + movementStep);
    } else {
      characterX -= movementStep;
    }
  }

  characterX = constrain(characterX, characterWidth / 2, width - characterWidth / 2);

  // 繪製左、中、右三張串接背景圖
  if (bgImage) {
    push();
    imageMode(CORNER);
    for (let i = -1; i <= 1; i++) {
      const drawX = bgOffsetX + i * singleBgWidth;
      image(bgImage, drawX, 0, singleBgWidth, singleBgHeight);
    }
    pop();
  }

  // ================= 角色二位置、動畫與轉向 =================
  // 左邊背景圖 (i = -1) 的水平中間位置
  const char2X = bgOffsetX - singleBgWidth / 2;
  const interactDistance = 250;
  const isNearChar2 = abs(characterX - char2X) < interactDistance;

  // 剛靠近角色二時產生新題目
  if (isNearChar2 && !wasNearChar2) {
    generateMathQuestion();
  }
  wasNearChar2 = isNearChar2;

  const activeChar2Sprite = isNearChar2 ? char2ActionSprite : char2StopSprite;
  const activeChar2FrameCount = isNearChar2 ? char2ActionFrameCount : char2StopFrameCount;
  const activeChar2FrameWidth = isNearChar2 ? char2ActionFrameWidth : char2StopFrameWidth;
  const activeChar2FrameHeight = isNearChar2 ? char2ActionFrameHeight : char2StopFrameHeight;

  const char2Scale = (height / 3) / char2StopFrameHeight;
  const char2FrameIndex = floor(frameCount / framesPerStep) % activeChar2FrameCount;
  const char2SourceX = char2FrameIndex * activeChar2FrameWidth;
  const char2Width = activeChar2FrameWidth * char2Scale;
  const char2Height = activeChar2FrameHeight * char2Scale;
  const char2Y = height - char2Height / 2;

  // 角色1在角色2左邊時轉向 (-1)，在右邊時朝右 (1)
  const char2Direction = characterX < char2X ? -1 : 1;

  if (activeChar2Sprite) {
    push();
    translate(char2X, char2Y);
    scale(char2Direction, 1);
    image(
      activeChar2Sprite,
      0,
      0,
      char2Width,
      char2Height,
      char2SourceX,
      0,
      activeChar2FrameWidth,
      activeChar2FrameHeight
    );
    pop();
  }

  // ================= 角色一位置與動畫 =================
  if (isCasting && frameCount - magicStartFrame >= magicFrameCount * framesPerStep) {
    isCasting = false;
    activeEffects.push({
      x: characterX + magicDirection * characterWidth / 2,
      y: height - characterHeight * 0.58,
      direction: magicDirection
    });
  }

  const activeSprite = isCasting ? magicSprite : isWalking ? walkSprite : characterSprite;
  const activeFrameCount = isCasting ? magicFrameCount : isWalking ? walkFrameCount : frameCountInSprite;
  const activeFrameWidth = isCasting ? magicFrameWidth : isWalking ? walkFrameWidth : frameWidth;
  const activeFrameHeight = isCasting ? magicFrameHeight : isWalking ? walkFrameHeight : frameHeight;
  const elapsedMagicFrames = frameCount - magicStartFrame;
  const frameIndex = isCasting ? floor(elapsedMagicFrames / framesPerStep) : floor(frameCount / framesPerStep) % activeFrameCount;
  const sourceX = frameIndex * activeFrameWidth;
  const activeWidth = activeFrameWidth * characterScale;
  const activeHeight = activeFrameHeight * characterScale;
  const characterY = height - activeHeight / 2;

  push();
  translate(characterX, characterY);
  scale(isCasting ? magicDirection : facingDirection, 1);
  image(activeSprite, 0, 0, activeWidth, activeHeight, sourceX, 0, activeFrameWidth, activeFrameHeight);
  pop();

  // ================= 繪製魔法特效 =================
  const effectScale = characterScale;
  const effectWidth = effectFrameWidth * effectScale;
  const effectHeight = effectFrameHeight * effectScale;
  const effectSpeed = max(6, width * 0.008);
  for (let effectIndex = activeEffects.length - 1; effectIndex >= 0; effectIndex--) {
    const effect = activeEffects[effectIndex];
    effect.x += effect.direction * effectSpeed;
    if (effect.x > width || effect.x < 0) {
      activeEffects.splice(effectIndex, 1);
      continue;
    }
    const effectFrameIndex = floor(frameCount / framesPerStep) % effectFrameCount;
    push();
    translate(effect.x, effect.y);
    scale(effect.direction, 1);
    image(magicEffectSprite, 0, 0, effectWidth, effectHeight, effectFrameIndex * effectFrameWidth, 0, effectFrameWidth, effectFrameHeight);
    pop();
  }

  // ================= 繪製數學測驗黃色方框 =================
  if (isNearChar2 && currentQuestion) {
    drawQuizBox();
  }

  // ================= 繪製煙火與閃電特效 =================
  updateAndDrawFireworks();
  updateAndDrawLightnings();
}

function drawQuizBox() {
  const box = getQuizBoxBounds();
  const buttons = getOptionButtons(box);

  push();
  // 透明度為 90 的黃色方框
  fill(255, 235, 59, 90);
  stroke(255, 193, 7, 200);
  strokeWeight(3);
  rect(box.x, box.y, box.w, box.h, 16);

  // 題目文字
  fill(30, 30, 30);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(min(box.w * 0.09, box.h * 0.14));
  textStyle(BOLD);
  text(currentQuestion.text, box.x + box.w / 2, box.y + box.h * 0.22);

  // 四個選項按鈕
  const labels = ["A", "B", "C", "D"];
  for (let i = 0; i < buttons.length; i++) {
    const btn = buttons[i];
    const isHovered = mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h;

    if (quizAnswered) {
      if (currentQuestion.options[i] === currentQuestion.answer) {
        fill(76, 175, 80, 230); // 答對顯示綠色
      } else if (i === currentQuestion.selectedIndex) {
        fill(244, 67, 54, 230); // 答錯顯示紅色
      } else {
        fill(255, 255, 255, 180);
      }
    } else {
      fill(isHovered ? color(255, 255, 255, 250) : color(255, 255, 255, 210));
    }

    stroke(80);
    strokeWeight(2);
    rect(btn.x, btn.y, btn.w, btn.h, 10);

    fill(quizAnswered && (currentQuestion.options[i] === currentQuestion.answer || i === currentQuestion.selectedIndex) ? 255 : 30);
    noStroke();
    textSize(min(btn.w * 0.22, btn.h * 0.45));
    text(`${labels[i]}. ${currentQuestion.options[i]}`, btn.x + btn.w / 2, btn.y + btn.h / 2);
  }

  if (quizAnswered) {
    textSize(min(box.w * 0.06, box.h * 0.09));
    fill(quizResultText.includes("答對") ? color(27, 94, 32) : color(183, 28, 28));
    text(quizResultText, box.x + box.w / 2, box.y + box.h * 0.89);
  }
  pop();
}

// 產生煙火特效
function spawnFireworks() {
  for (let b = 0; b < 5; b++) {
    const cx = random(width * 0.2, width * 0.8);
    const cy = random(height * 0.15, height * 0.55);
    const hueColor = color(random(100, 255), random(100, 255), random(100, 255));
    for (let i = 0; i < 45; i++) {
      const angle = random(TWO_PI);
      const speed = random(2, 9);
      fireworks.push({
        x: cx,
        y: cy,
        vx: cos(angle) * speed,
        vy: sin(angle) * speed,
        alpha: 255,
        col: hueColor
      });
    }
  }
}

function updateAndDrawFireworks() {
  push();
  noStroke();
  for (let i = fireworks.length - 1; i >= 0; i--) {
    const p = fireworks[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.12;
    p.alpha -= 4;
    if (p.alpha <= 0) {
      fireworks.splice(i, 1);
      continue;
    }
    fill(red(p.col), green(p.col), blue(p.col), p.alpha);
    circle(p.x, p.y, 7);
  }
  pop();
}

// 產生閃電特效
function spawnLightning() {
  for (let b = 0; b < 3; b++) {
    let startX = random(width * 0.25, width * 0.75);
    let currX = startX;
    let currY = 0;
    let segments = [];
    while (currY < height * 0.85) {
      let nextX = currX + random(-35, 35);
      let nextY = currY + random(25, 55);
      segments.push({ x1: currX, y1: currY, x2: nextX, y2: nextY });
      currX = nextX;
      currY = nextY;
    }
    lightnings.push({
      segments: segments,
      alpha: 255
    });
  }
}

function updateAndDrawLightnings() {
  push();
  for (let i = lightnings.length - 1; i >= 0; i--) {
    const bolt = lightnings[i];
    bolt.alpha -= 10;
    if (bolt.alpha <= 0) {
      lightnings.splice(i, 1);
      continue;
    }
    stroke(120, 180, 255, bolt.alpha * 0.6);
    strokeWeight(8);
    for (const seg of bolt.segments) {
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }
    stroke(255, 255, 220, bolt.alpha);
    strokeWeight(3);
    for (const seg of bolt.segments) {
      line(seg.x1, seg.y1, seg.x2, seg.y2);
    }
  }
  pop();
}

function mousePressed() {
  const bgAspect = bgImage && bgImage.height > 0 ? bgImage.width / bgImage.height : 1;
  const singleBgWidth = max(width, height * bgAspect);
  const char2X = bgOffsetX - singleBgWidth / 2;
  const isNearChar2 = abs(characterX - char2X) < 250;

  if (isNearChar2 && currentQuestion && !quizAnswered) {
    const box = getQuizBoxBounds();
    const buttons = getOptionButtons(box);

    for (let i = 0; i < buttons.length; i++) {
      const btn = buttons[i];
      if (mouseX >= btn.x && mouseX <= btn.x + btn.w && mouseY >= btn.y && mouseY <= btn.y + btn.h) {
        quizAnswered = true;
        currentQuestion.selectedIndex = i;

        if (currentQuestion.options[i] === currentQuestion.answer) {
          quizResultText = "答對了！太棒了！（離開再靠近可出下一題）";
          spawnFireworks();
        } else {
          quizResultText = `答錯了！正確答案是 ${currentQuestion.answer}`;
          spawnLightning();
        }
        break;
      }
    }
  }
}

function keyPressed() {
  if (keyCode === RIGHT_ARROW) {
    isWalking = true;
    facingDirection = 1;
    return false;
  }
  if (keyCode === LEFT_ARROW) {
    isWalking = true;
    facingDirection = -1;
    return false;
  }
  if (keyCode === 32) {
    if (!spaceIsDown && !isCasting) {
      isCasting = true;
      magicStartFrame = frameCount;
      magicDirection = facingDirection;
    }
    spaceIsDown = true;
    return false;
  }
}

function keyReleased() {
  if (keyCode === 32) {
    spaceIsDown = false;
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  characterX = constrain(characterX, 1, width - 1);
}
