document.querySelectorAll('.temp-fade-up.temp-animate').forEach(function (el) {
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  obs.observe(el);
  if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add('visible');
});

(function initTemperatureSection() {
  var tempData = [
    { display: '-25°C', title: 'Ultra Deep Freeze', desc: 'Ideal for long-term frozen goods, ice cream, and deep-frozen commodities', theme: 'freeze' },
    { display: '-15°C', title: 'Frozen Storage', desc: 'Perfect for frozen vegetables, meats, seafood, and ready-to-eat products', theme: 'frozen' },
    { display: '0°C', title: 'Chilled Storage', desc: 'Perfect for fresh fruits, vegetables and dairy', theme: 'chill' },
    { display: '+5°C', title: 'Cool Storage', desc: 'Optimal for beverages, confectionery, and temperature-sensitive packaged goods', theme: 'cool' },
    { display: '+15°C', title: 'Controlled Ambient', desc: 'Suitable for chocolates, cosmetics, and pharma-grade ambient storage', theme: 'ambient' },
    { display: '+25°C', title: 'Ambient Storage', desc: 'Dry goods, FMCG, and non-refrigerated inventory with climate control', theme: 'warm' }
  ];

  var accentByIndex = ['#0ea5e9', '#197d7d', '#197d7d', '#2d9d8a', '#c88e1e', '#d4a017'];
  var displayGradients = [
    'linear-gradient(135deg,#0c4a6e,#0ea5e9,#7dd3fc)',
    'linear-gradient(135deg,#051919,#0f4b4b,#197d7d)',
    'linear-gradient(135deg,#051919,#146464,#197d7d,#47b7b7)',
    'linear-gradient(135deg,#0f4b4b,#197d7d,#75c9c9)',
    'linear-gradient(135deg,#78350f,#c88e1e,#fbbf24)',
    'linear-gradient(135deg,#92400e,#d4a017,#fde68a)'
  ];

  var tempSection = document.getElementById('temperature');
  var tempFogLayer = document.getElementById('tempCinemaFog');
  var tempSlider = document.getElementById('tempSlider');
  var tempSliderWrap = document.getElementById('tempSliderWrap');
  if (!tempSection || !tempFogLayer || !tempSlider || !tempSliderWrap) return;

  var tempDisplayValue = document.getElementById('tempDisplayValue');
  var tempDisplayTitle = document.getElementById('tempDisplayTitle');
  var tempDisplayDesc = document.getElementById('tempDisplayDesc');
  var tempMarkers = document.querySelectorAll('.temp-marker');
  var tempCountNeg = document.getElementById('tempCountNeg');
  var tempCountPos = document.getElementById('tempCountPos');
  var tempRangeHeadline = document.getElementById('tempRangeHeadline');

  var countAnimFrame = null;
  var countDone = false;
  var activeIndex = 2;
  var isDragging = false;
  var targetPct = 40;
  var currentPct = 40;
  var sliderAnimId = null;
  var lastIndex = 2;
  var currentSmoke = 0;
  var targetSmoke = 0;

  function pctFromIndex(i) { return (i / 5) * 100; }

  function indexFromPct(pct) {
    return Math.max(0, Math.min(5, Math.round((pct / 100) * 5)));
  }

  function clampedPct(pct) {
    return Math.max(0, Math.min(100, pct));
  }

  function pctFromEvent(e) {
    var rect = tempSliderWrap.getBoundingClientRect();
    var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - rect.left;
    return Math.max(0, Math.min(100, (x / rect.width) * 100));
  }

  function computeSmoke(pct) {
    var p = clampedPct(pct);
    var zeroAt = 40;
    if (p >= zeroAt) return 0;
    return Math.pow(1 - p / zeroAt, 0.78);
  }

  function applySmokeVisual() {
    currentSmoke = targetSmoke;
    tempFogLayer.style.setProperty('--temp-fog-deep', currentSmoke.toFixed(3));
    tempSection.style.setProperty('--temp-veil', (currentSmoke * 0.38).toFixed(3));
  }

  function applySliderVisual(pct) {
    var p = clampedPct(pct);
    tempSliderWrap.style.setProperty('--slider-pct', p + '%');
    tempSlider.value = p;
    targetSmoke = computeSmoke(p);
    applySmokeVisual();
  }

  function applyTempAccent(index) {
    var accent = accentByIndex[index] || '#197d7d';
    tempSection.style.setProperty('--temp-accent', accent);
    tempSection.dataset.tempTheme = tempData[index] ? tempData[index].theme : 'chill';
    if (tempDisplayValue) {
      tempDisplayValue.style.background = displayGradients[index] || displayGradients[2];
      tempDisplayValue.style.webkitBackgroundClip = 'text';
      tempDisplayValue.style.backgroundClip = 'text';
      tempDisplayValue.style.webkitTextFillColor = 'transparent';
      tempDisplayValue.style.color = 'transparent';
    }
  }

  function updateTemperature(index, syncSlider) {
    var i = Math.max(0, Math.min(5, parseInt(index, 10)));
    activeIndex = i;
    var data = tempData[i];
    applyTempAccent(i);
    [tempDisplayValue, tempDisplayTitle, tempDisplayDesc].forEach(function (el) {
      if (el) el.classList.add('updating');
    });
    setTimeout(function () {
      if (tempDisplayValue) tempDisplayValue.textContent = data.display;
      if (tempDisplayTitle) tempDisplayTitle.textContent = data.title;
      if (tempDisplayDesc) tempDisplayDesc.textContent = data.desc;
      [tempDisplayValue, tempDisplayTitle, tempDisplayDesc].forEach(function (el) {
        if (el) el.classList.remove('updating');
      });
    }, 180);
    tempMarkers.forEach(function (m, idx) {
      m.classList.toggle('active', idx === i);
    });
    lastIndex = i;
    if (syncSlider) setSliderPosition(pctFromIndex(i), false, true);
    tempSlider.setAttribute('aria-valuenow', data.display.replace('°C', ''));
  }

  function tickSliderSmooth() {
    var diff = targetPct - currentPct;
    if (Math.abs(diff) < 0.15) {
      currentPct = targetPct;
    } else {
      currentPct += diff * (isDragging ? 0.35 : 0.22);
    }
    applySliderVisual(currentPct);
    var i = indexFromPct(currentPct);
    if (i !== lastIndex) {
      lastIndex = i;
      updateTemperature(i, false);
    } else {
      applyTempAccent(i);
    }
    if (Math.abs(targetPct - currentPct) >= 0.15) {
      sliderAnimId = requestAnimationFrame(tickSliderSmooth);
    } else {
      sliderAnimId = null;
    }
  }

  function startSmoothSlider(pct) {
    targetPct = clampedPct(pct);
    if (!sliderAnimId) sliderAnimId = requestAnimationFrame(tickSliderSmooth);
  }

  function setSliderPosition(pct, updateContent, instant) {
    var clamped = clampedPct(pct);
    targetPct = clamped;
    if (instant) {
      currentPct = clamped;
      applySliderVisual(clamped);
      if (updateContent) {
        var i = indexFromPct(clamped);
        lastIndex = i;
        if (i !== activeIndex) updateTemperature(i, false);
        else applyTempAccent(i);
      }
      return;
    }
    if (updateContent) startSmoothSlider(clamped);
    else {
      currentPct = clamped;
      applySliderVisual(clamped);
    }
  }

  function animateCountTo25() {
    if (!tempCountNeg || !tempCountPos) return;
    if (countAnimFrame) cancelAnimationFrame(countAnimFrame);
    var duration = 1600;
    var start = performance.now();
    function tick(now) {
      var t = Math.min((now - start) / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      var n = Math.max(1, Math.round(1 + eased * 24));
      tempCountNeg.textContent = n;
      tempCountPos.textContent = n;
      if (t < 1) {
        countAnimFrame = requestAnimationFrame(tick);
      } else {
        tempCountNeg.textContent = '25';
        tempCountPos.textContent = '25';
        countDone = true;
      }
    }
    countAnimFrame = requestAnimationFrame(tick);
  }

  tempSliderWrap.addEventListener('mousemove', function (e) { startSmoothSlider(pctFromEvent(e)); });
  tempSliderWrap.addEventListener('mousedown', function (e) {
    isDragging = true;
    tempSliderWrap.classList.add('is-dragging');
    startSmoothSlider(pctFromEvent(e));
  });
  document.addEventListener('mouseup', function () {
    isDragging = false;
    tempSliderWrap.classList.remove('is-dragging');
  });
  document.addEventListener('mousemove', function (e) {
    if (isDragging) startSmoothSlider(pctFromEvent(e));
  });
  tempSliderWrap.addEventListener('touchstart', function (e) {
    isDragging = true;
    tempSliderWrap.classList.add('is-dragging');
    startSmoothSlider(pctFromEvent(e));
  }, { passive: true });
  tempSliderWrap.addEventListener('touchmove', function (e) {
    if (isDragging) startSmoothSlider(pctFromEvent(e));
  }, { passive: true });
  tempSliderWrap.addEventListener('touchend', function () {
    isDragging = false;
    tempSliderWrap.classList.remove('is-dragging');
  });
  tempSlider.addEventListener('input', function (e) {
    startSmoothSlider(parseFloat(e.target.value));
  });
  tempMarkers.forEach(function (m) {
    m.addEventListener('click', function () {
      updateTemperature(m.dataset.index);
    });
  });

  if (tempRangeHeadline) {
    var countObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !countDone) animateCountTo25();
      });
    }, { threshold: 0.35 });
    countObserver.observe(tempRangeHeadline);
    if (tempRangeHeadline.getBoundingClientRect().top < window.innerHeight * 0.85) animateCountTo25();
  }

  targetSmoke = computeSmoke(40);
  currentSmoke = targetSmoke;
  applySmokeVisual();
  setSliderPosition(pctFromIndex(2), false, true);
  lastIndex = 2;
  updateTemperature(2, false);
})();
