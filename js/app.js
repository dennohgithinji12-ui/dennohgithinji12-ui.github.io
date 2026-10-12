/**
 * TERRAFORM & CRAFT ARCHITECTURAL CONSTRUCTION
 * Main Application Interactions, 3D Tilt, Estimator & Audio Engine
 * Lead Project Manager: Raphael
 */

(function () {
  'use strict';

  // ==========================================================================
  // 1. WEB AUDIO SYNTHESIZER FOR SUBTLE ARCHITECTURAL UI SOUNDS
  // ==========================================================================
  let audioCtx = null;
  let audioEnabled = false;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  window.playSfx = function (type) {
    if (!audioEnabled || !audioCtx) return;

    try {
      const now = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      if (type === 'click') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.05);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
      } else if (type === 'swoosh') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.12);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === 'toggle') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(540, now);
        osc.frequency.exponentialRampToValueAtTime(720, now + 0.08);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
      } else if (type === 'ping') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, now);
        osc.frequency.exponentialRampToValueAtTime(1600, now + 0.15);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn("Audio SFX Error", e);
    }
  };

  // Setup Audio Toggle Button
  const audioBtn = document.getElementById('audio-toggle-btn');
  if (audioBtn) {
    audioBtn.addEventListener('click', () => {
      initAudio();
      audioEnabled = !audioEnabled;
      audioBtn.classList.toggle('active', audioEnabled);
      audioBtn.setAttribute('title', audioEnabled ? 'Sound Effects Enabled' : 'Sound Effects Muted');
      if (audioEnabled) window.playSfx('ping');
    });
  }

  // ==========================================================================
  // 2. HEADER SCROLL EFFECT
  // ==========================================================================
  const headerNav = document.querySelector('.header-nav');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      headerNav?.classList.add('scrolled');
    } else {
      headerNav?.classList.remove('scrolled');
    }
  }, { passive: true });

  // ==========================================================================
  // 3. INTERACTIVE 3D PERSPECTIVE TILT ON CARDS
  // ==========================================================================
  function init3DTilt() {
    const tiltCards = document.querySelectorAll('.tilt-3d');
    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -8;
        const rotateY = ((x - centerX) / centerX) * 8;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)`;
      });
    });
  }

  // ==========================================================================
  // 4. INTERACTIVE BEFORE / AFTER SLIDER: PLAN TO REALITY
  // ==========================================================================
  function initSplitSlider() {
    const container = document.getElementById('split-slider-container');
    const afterLayer = document.getElementById('split-after-layer');
    const handle = document.getElementById('split-slider-handle');

    if (!container || !afterLayer || !handle) return;

    let isDragging = false;

    function updateSliderPos(clientX) {
      const rect = container.getBoundingClientRect();
      let offsetX = clientX - rect.left;
      if (offsetX < 0) offsetX = 0;
      if (offsetX > rect.width) offsetX = rect.width;

      const percentage = (offsetX / rect.width) * 100;
      afterLayer.style.width = `${percentage}%`;
      handle.style.left = `${percentage}%`;
    }

    handle.addEventListener('mousedown', () => {
      isDragging = true;
      initAudio();
    });

    window.addEventListener('mouseup', () => {
      isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      updateSliderPos(e.clientX);
    });

    // Touch support for mobile devices
    handle.addEventListener('touchstart', () => { isDragging = true; }, { passive: true });
    window.addEventListener('touchend', () => { isDragging = false; });
    window.addEventListener('touchmove', (e) => {
      if (!isDragging || !e.touches[0]) return;
      updateSliderPos(e.touches[0].clientX);
    }, { passive: true });
  }

  // ==========================================================================
  // 5. INTERACTIVE "LAND + BUILD" ESTIMATOR CALCULATOR
  // ==========================================================================
  const estimatorState = {
    landOption: 'need_scout', // 'need_scout' or 'has_land'
    location: 'karen', // 'karen', 'tigoni', 'coast', 'rift', 'kangundo', 'kitengela', 'juja'
    style: 'minimalist', // 'minimalist', 'brutalist', 'timber', 'mediterranean'
    sqft: 3500,
    tier: 'executive' // 'starter', 'executive', 'bespoke', 'passive'
  };

  const rates = {
    land: {
      karen: 55000000,     // KSh 55M prime Karen / Muthaiga 1-acre plot
      tigoni: 32000000,    // KSh 32M Tigoni / Limuru 1.5-acre plot
      coast: 42000000,     // KSh 42M Diani / Kilifi Beachfront plot
      rift: 24000000,      // KSh 24M Naivasha / Nanyuki 3-acre parcel
      kangundo: 1200000,   // KSh 1.2M Joska / Malaa (50x100 plot)
      kitengela: 1800000,  // KSh 1.8M Kitengela / Isinya plot
      juja: 2200000        // KSh 2.2M Juja Farm / Ruiru East plot
    },
    buildPerSqFt: {
      starter: 3600,       // KSh 3,600/sq ft (Affordable modern standard: ~KSh 38,000/sqm)
      executive: 5800,     // KSh 5,800/sq ft (Executive contemporary: ~KSh 62,000/sqm)
      bespoke: 11500,      // KSh 11,500/sq ft (Bespoke luxury: ~KSh 124,000/sqm)
      passive: 14800       // KSh 14,800/sq ft (Passive net-zero: ~KSh 160,000/sqm)
    },
    archPercent: 0.10 // 10% for master architecture, 3D BIM, NEMA & County permits
  };

  function calculateEstimate() {
    const landCost = estimatorState.landOption === 'need_scout' ? rates.land[estimatorState.location] : 0;
    const baseBuildCost = estimatorState.sqft * rates.buildPerSqFt[estimatorState.tier];
    const archCost = Math.round(baseBuildCost * rates.archPercent);
    const totalCost = landCost + baseBuildCost + archCost;

    // Timeline calculation based on sqft and land acquisition
    let months = 10;
    if (estimatorState.sqft > 4000) months = 12;
    if (estimatorState.sqft > 7000) months = 15;
    if (estimatorState.sqft > 10000) months = 18;
    if (estimatorState.landOption === 'need_scout') months += 2; // scouting & title deed due diligence

    // Update DOM elements in KSh (Kenyan Shillings)
    const formatCurrency = (val) => 'KSh ' + Number(val).toLocaleString();

    const landEl = document.getElementById('est-land-amount');
    const archEl = document.getElementById('est-arch-amount');
    const buildEl = document.getElementById('est-build-amount');
    const totalEl = document.getElementById('est-total-amount');
    const timelineEl = document.getElementById('est-timeline-val');
    const sqftValEl = document.getElementById('sqft-range-val');

    if (landEl) landEl.textContent = estimatorState.landOption === 'need_scout' ? formatCurrency(landCost) : 'KSh 0 (Client Owned Plot)';
    if (archEl) archEl.textContent = formatCurrency(archCost);
    if (buildEl) buildEl.textContent = formatCurrency(baseBuildCost);
    if (totalEl) totalEl.textContent = formatCurrency(totalCost);
    if (timelineEl) timelineEl.textContent = `${months} - ${months + 2} Months`;
    if (sqftValEl) sqftValEl.textContent = `${Number(estimatorState.sqft).toLocaleString()} sq ft`;
  }

  function initEstimator() {
    // Land Option toggle buttons
    const landBtns = document.querySelectorAll('.seg-btn[data-land]');
    landBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        landBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        estimatorState.landOption = e.currentTarget.getAttribute('data-land');
        calculateEstimate();
        if (window.playSfx) window.playSfx('click');
      });
    });

    // Location Profile buttons
    const locBtns = document.querySelectorAll('.seg-btn[data-loc]');
    locBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        locBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        estimatorState.location = e.currentTarget.getAttribute('data-loc');
        calculateEstimate();
        if (window.playSfx) window.playSfx('click');
      });
    });

    // Size Slider
    const sqftSlider = document.getElementById('sqft-range-input');
    if (sqftSlider) {
      sqftSlider.addEventListener('input', (e) => {
        estimatorState.sqft = parseInt(e.target.value, 10);
        calculateEstimate();
      });
    }

    // Finishing Tier buttons
    const tierBtns = document.querySelectorAll('.seg-btn[data-tier]');
    tierBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        tierBtns.forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        estimatorState.tier = e.currentTarget.getAttribute('data-tier');
        calculateEstimate();
        if (window.playSfx) window.playSfx('click');
      });
    });

    // Initial calculation
    calculateEstimate();

    // Export spec button
    const exportBtn = document.getElementById('btn-export-spec');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        openConsultationModalWithSpec();
        if (window.playSfx) window.playSfx('ping');
      });
    }
  }

  // ==========================================================================
  // 6. PORTFOLIO FILTERING
  // ==========================================================================
  function initPortfolioFilter() {
    const filterPills = document.querySelectorAll('.filter-pill');
    const projectCards = document.querySelectorAll('.project-card');

    filterPills.forEach(pill => {
      pill.addEventListener('click', (e) => {
        const cat = e.currentTarget.getAttribute('data-filter');
        filterPills.forEach(p => p.classList.remove('active'));
        e.currentTarget.classList.add('active');

        projectCards.forEach(card => {
          const cardCat = card.getAttribute('data-category');
          if (cat === 'all' || cardCat.includes(cat)) {
            card.style.display = 'block';
          } else {
            card.style.display = 'none';
          }
        });

        if (window.playSfx) window.playSfx('click');
      });
    });
  }

  // ==========================================================================
  // 7. CONSULTATION & BOOKING MODAL
  // ==========================================================================
  const modalOverlay = document.getElementById('consultation-modal');
  const modalCloseBtn = document.getElementById('modal-close-btn');
  const consultationForm = document.getElementById('consultation-form');
  const toastAlert = document.getElementById('toast-alert');

  function openConsultationModal() {
    if (modalOverlay) {
      modalOverlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (window.playSfx) window.playSfx('swoosh');
    }
  }

  function closeConsultationModal() {
    if (modalOverlay) {
      modalOverlay.classList.remove('open');
      document.body.style.overflow = '';
    }
  }

  function openConsultationModalWithSpec() {
    openConsultationModal();
    const notesInput = document.getElementById('modal-notes-input');
    const projectTypeSelect = document.getElementById('modal-project-type');

    if (notesInput) {
      notesInput.value = `[Estimator Spec Auto-Generated]
• Land Status: ${estimatorState.landOption === 'need_scout' ? 'Client Needs Land Scouted & Acquired' : 'Client Already Owns Parcel'}
• Location Preference: ${estimatorState.location.toUpperCase()}
• Estimated Size: ${Number(estimatorState.sqft).toLocaleString()} sq ft
• Finishing Tier: ${estimatorState.tier.toUpperCase()} Luxury
• Est. Budget Bracket: ${document.getElementById('est-total-amount')?.textContent || 'Bespoke'}`;
    }

    if (projectTypeSelect) {
      projectTypeSelect.value = estimatorState.landOption === 'need_scout' ? 'land_and_build' : 'build_only';
    }
  }

  // Attach modal trigger buttons
  document.querySelectorAll('.open-consultation-trigger').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      openConsultationModal();
    });
  });

  if (modalCloseBtn) {
    modalCloseBtn.addEventListener('click', closeConsultationModal);
  }

  if (modalOverlay) {
    modalOverlay.addEventListener('click', (e) => {
      if (e.target === modalOverlay) closeConsultationModal();
    });
  }

  // Handle Form Submission
  if (consultationForm) {
    consultationForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const submitBtn = consultationForm.querySelector('button[type="submit"]');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Securing Milestone with Raphael...';
      }

      setTimeout(() => {
        closeConsultationModal();
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = 'Confirm Appointment with Raphael';
        }
        consultationForm.reset();

        // Show Toast
        if (toastAlert) {
          toastAlert.classList.add('show');
          if (window.playSfx) window.playSfx('ping');
          setTimeout(() => {
            toastAlert.classList.remove('show');
          }, 4500);
        }
      }, 900);
    });
  }

  // ==========================================================================
  // 8. CASE STUDY MODAL FOR PROJECTS
  // ==========================================================================
  const caseStudyModal = document.getElementById('case-study-modal');
  const caseStudyClose = document.getElementById('case-study-close');
  const projectCards = document.querySelectorAll('.project-card');

  const projectDetails = {
    "solstice": {
      title: "The Solstice Ridge Villa",
      location: "Miotoni Ridge, Karen, Nairobi, Kenya",
      scope: "Land Acquisition, Red Soil Mechanics, 3D BIM & Full Turnkey Build",
      stats: "7,400 sq ft • 2.5 Acres • 14 Months Delivered • KSh 148,000,000",
      diary: "Raphael Kamau scouted 6 private off-market parcels in Karen before securing this pristine 2.5-acre property. Handled full approval processes with Nairobi City County and NEMA. Poured reinforced deep strip footings to guarantee complete structural permanence.",
      pmFocus: "Rigorous red-soil geotechnical stabilization and custom architectural triple-glazing with zero budget overruns."
    },
    "auracrest": {
      title: "Aura Crest Sanctuary",
      location: "Tigoni Tea Hills, Kiambu, Kenya",
      scope: "Hillside Terracing, Cantilevered Steel & Sustainable Cedar Accents",
      stats: "5,800 sq ft • 1.8 Acres • 11 Months Delivered • KSh 98,500,000",
      diary: "Overcame a 35-degree volcanic hillside slope overlooking tea plantations. Coordinated local Ndarugo machine-cut stone core with imported structural steel frames and solar thermal water heating under Raphael Kamau's direct supervision.",
      pmFocus: "Daily drone volumetric scans ensured excavation earth-balance matched engineering specs within 1%."
    },
    "obsidian": {
      title: "The Obsidian Rift Estate",
      location: "Great Rift Valley (Lake Naivasha), Kenya",
      scope: "5-Acre Raw Land Sourcing, Solar Microgrid & Turnkey Luxury Compound",
      stats: "9,200 sq ft • 5.0 Acres • 15 Months Delivered • KSh 185,000,000",
      diary: "Secured riparian survey clearance, borehole drilling permits, and installed a 30kW solar microgrid with battery storage. Rammed earth and volcanic stone construction keep ambient temperatures comfortable without active air conditioning.",
      pmFocus: "Guaranteed Maximum Price (GMP) audited with 100% sign-off and zero hidden variation charges."
    },
    "zephyr": {
      title: "Zephyr Oceanfront Pavilion",
      location: "Diani Beach (Galu Bluffs), Kwale, Kenya",
      scope: "Beachfront Parcel Acquisition, Marine Coral Foundation & Turnkey Handover",
      stats: "6,100 sq ft • 2.2 Acres • 13 Months Delivered • KSh 128,000,000",
      diary: "Engineered marine-grade sulfate-resistant concrete piles anchored directly into coral bedrock with integrated infinity drainage. Client enjoyed weekly 4K drone progress audits and digital milestone payments.",
      pmFocus: "Raphael Kamau conducted bi-weekly on-site client walkthroughs with virtual 3D BIM overlay."
    }
  };

  projectCards.forEach(card => {
    card.addEventListener('click', () => {
      const pid = card.getAttribute('data-project-id');
      const data = projectDetails[pid];
      if (!data || !caseStudyModal) return;

      document.getElementById('cs-modal-title').textContent = data.title;
      document.getElementById('cs-modal-location').textContent = data.location;
      document.getElementById('cs-modal-scope').textContent = data.scope;
      document.getElementById('cs-modal-stats').textContent = data.stats;
      document.getElementById('cs-modal-diary').textContent = data.diary;
      document.getElementById('cs-modal-pm').textContent = data.pmFocus;

      caseStudyModal.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (window.playSfx) window.playSfx('swoosh');
    });
  });

  if (caseStudyClose) {
    caseStudyClose.addEventListener('click', () => {
      caseStudyModal.classList.remove('open');
      document.body.style.overflow = '';
    });
  }

  if (caseStudyModal) {
    caseStudyModal.addEventListener('click', (e) => {
      if (e.target === caseStudyModal) {
        caseStudyModal.classList.remove('open');
        document.body.style.overflow = '';
      }
    });
  }

  // ==========================================================================
  // INITIALIZE ON DOM READY
  // ==========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    init3DTilt();
    initSplitSlider();
    initEstimator();
    initPortfolioFilter();
  });

})();
