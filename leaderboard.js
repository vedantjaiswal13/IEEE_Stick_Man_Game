/**
 * IEEE SB VIT Pune - Tournament Leaderboard & Match History Manager
 * Supports: Official VIT Pune Department Standings, Match History Log,
 * In-line Editing, 1-Click Testing Deletion, CSV Export, Department Filtering, and Mock Test Duel Generation
 */

class LeaderboardManager {
  constructor() {
    this.storageKey = 'ieee_sb_vit_cyberclash_history_v2';
    this.history = [];
    this.currentEditingId = null;
    this.selectedDeptFilter = 'ALL';

    this.loadHistory();
    this.initEventListeners();
    this.populateDeptFilterOptions();
  }

  getDepartments() {
    return window.VIT_DEPARTMENTS || [
      { code: 'CE', name: 'Computer Engineering (CE)', icon: '💻', color: '#00B5E2' },
      { code: 'IT', name: 'Information Technology (IT)', icon: '🌐', color: '#38bdf8' },
      { code: 'ENTC', name: 'Electronics & Telecommunication (E&TC)', icon: '📡', color: '#818cf8' },
      { code: 'AIDS', name: 'AI & Data Science (AIDS)', icon: '🧠', color: '#c026d3' },
      { code: 'CSE-AI', name: 'CSE - Artificial Intelligence', icon: '🤖', color: '#ec4899' },
      { code: 'CSE-AIML', name: 'CSE - AI & Machine Learning', icon: '⚡', color: '#f43f5e' },
      { code: 'CSE-DS', name: 'CSE - Data Science', icon: '📊', color: '#a855f7' },
      { code: 'CSE-IOT', name: 'CSE - IoT & Cyber Security with Blockchain', icon: '🔐', color: '#06b6d4' },
      { code: 'CSE-SE', name: 'Computer Engg - Software Engineering', icon: '⚙️', color: '#3b82f6' },
      { code: 'ME', name: 'Mechanical Engineering (ME)', icon: '🏎️', color: '#f97316' },
      { code: 'CHEM', name: 'Chemical Engineering', icon: '🧪', color: '#10b981' },
      { code: 'CIVIL', name: 'Civil Engineering', icon: '🏗️', color: '#eab308' },
      { code: 'INST', name: 'Instrumentation Engineering', icon: '🎛️', color: '#14b8a6' },
      { code: 'DESH', name: 'Engineering, Science & Humanities (DESH)', icon: '🔬', color: '#6366f1' },
      { code: 'IEEE', name: 'IEEE SB VIT Pune Member', icon: '⭐', color: '#fbbf24' }
    ];
  }

  loadHistory() {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (raw) {
        this.history = JSON.parse(raw);
      } else {
        // Seed initial showcase duels with official VIT Pune departments
        this.history = [
          {
            id: 'match-1',
            winnerName: 'Rohan Deshmukh',
            winnerDept: 'Electronics & Telecommunication (E&TC)',
            loserName: 'Tanvi Kulkarni',
            loserDept: 'Computer Engineering (CE)',
            weaponName: 'Overclocked Ion Plasma Katana',
            subVariantName: 'Dual HF Edge',
            finishMove: 'Sonic Storm Overdrive',
            damage: 1350,
            combo: 6,
            durationSec: 45,
            timestamp: new Date(Date.now() - 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: 'match-2',
            winnerName: 'Aarav Joshi',
            winnerDept: 'AI & Data Science (AIDS)',
            loserName: 'Priya Sharma',
            loserDept: 'Information Technology (IT)',
            weaponName: 'Superheated Plasma Tesla Hammer',
            subVariantName: 'Mjolnir Shock-Coil',
            finishMove: 'Giga-Volt Ground Slam',
            damage: 1480,
            combo: 7,
            durationSec: 45,
            timestamp: new Date(Date.now() - 2400000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: 'match-3',
            winnerName: 'Sneha Patil',
            winnerDept: 'Computer Engineering (CE)',
            loserName: 'Vikram Shinde',
            loserDept: 'Mechanical Engineering (ME)',
            weaponName: 'Cryo-Superconductor EMP Gauntlets',
            subVariantName: 'Arc Surge Knuckles',
            finishMove: 'Overclocked Shockwave Uppercut',
            damage: 1220,
            combo: 5,
            durationSec: 45,
            timestamp: new Date(Date.now() - 1200000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          },
          {
            id: 'match-4',
            winnerName: 'Siddharth Rao',
            winnerDept: 'CSE - Artificial Intelligence',
            loserName: 'Ananya Mehta',
            loserDept: 'CSE - Data Science',
            weaponName: 'Void Quantum Flux Railgun',
            subVariantName: 'Hyper-Beam Lance',
            finishMove: 'Hyper-Beam Annihilator',
            damage: 1410,
            combo: 6,
            durationSec: 60,
            timestamp: new Date(Date.now() - 600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ];
        this.saveHistory();
      }
    } catch (e) {
      console.warn('Failed to load history from localStorage', e);
      this.history = [];
    }
  }

  saveHistory() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.history));
    } catch (e) {
      console.warn('Failed to save history to localStorage', e);
    }
  }

  recordDuel(winnerData, winnerFighter, loserData, loserFighter, durationSec) {
    const subName = winnerFighter.subVariant ? winnerFighter.subVariant.name : 'Standard Core';
    const duel = {
      id: 'match-' + Date.now(),
      winnerName: winnerData.name,
      winnerDept: winnerData.dept,
      loserName: loserData.name,
      loserDept: loserData.dept,
      weaponName: `${winnerFighter.energyMod.name} ${winnerFighter.weapon.name}`,
      subVariantName: subName,
      finishMove: winnerFighter.weapon.specialMove,
      damage: winnerFighter.totalDamageDealt || 1200,
      combo: Math.max(3, winnerFighter.maxCombo),
      durationSec: durationSec || 45,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.history.unshift(duel); // newest first
    this.saveHistory();
    this.renderUI();
  }

  // Add match result from live duel
  addMatchResult(duelData) {
    this.history.unshift(duelData);
    this.saveHistory();
    this.renderUI();
  }

  // 1-Click Delete for testing
  deleteDuel(matchId) {
    this.history = this.history.filter(m => m.id !== matchId);
    this.saveHistory();
    this.renderUI();
    if (window.sounds) window.sounds.playClick();
  }

  // Delete latest match (e.g. from Victory screen testing button)
  deleteLastDuel() {
    if (this.history.length > 0) {
      const removed = this.history.shift();
      this.saveHistory();
      this.renderUI();
      if (window.sounds) window.sounds.playClick();
      return removed;
    }
    return null;
  }

  // Generate a random mock duel between VIT departments to test leaderboard
  addMockTestDuel() {
    const depts = this.getDepartments();
    const d1 = depts[Math.floor(Math.random() * depts.length)];
    let d2 = depts[Math.floor(Math.random() * depts.length)];
    while (d2.name === d1.name) {
      d2 = depts[Math.floor(Math.random() * depts.length)];
    }

    const firstNames = ['Aditya', 'Riya', 'Kunal', 'Ishaan', 'Neha', 'Gaurav', 'Meera', 'Tejas', 'Ankita', 'Harsh'];
    const lastNames = ['Patil', 'Deshmukh', 'Kulkarni', 'Joshi', 'Sharma', 'Pawar', 'More', 'Chavan', 'Kale', 'Bhide'];

    const p1Name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;
    const p2Name = `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`;

    const weaponsList = Object.values(window.WEAPONS_DATA || {});
    const w = weaponsList[Math.floor(Math.random() * weaponsList.length)];
    const modsList = Object.values(window.ENERGY_MODS || {});
    const m = modsList[Math.floor(Math.random() * modsList.length)];
    const subVar = (w.subVariants && w.subVariants.length > 0) 
      ? w.subVariants[Math.floor(Math.random() * w.subVariants.length)].name 
      : 'Standard Core';

    const duel = {
      id: 'match-' + Date.now(),
      winnerName: p1Name,
      winnerDept: d1.name,
      loserName: p2Name,
      loserDept: d2.name,
      weaponName: `${m.name} ${w.name}`,
      subVariantName: subVar,
      finishMove: w.specialMove || 'Knockout Blow',
      damage: Math.floor(1000 + Math.random() * 600),
      combo: Math.floor(4 + Math.random() * 5),
      durationSec: 45,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    this.history.unshift(duel);
    this.saveHistory();
    this.renderUI();
    if (window.sounds) window.sounds.playSelect();
  }

  openEditModal(matchId) {
    const match = this.history.find(m => m.id === matchId);
    if (!match) return;

    this.currentEditingId = matchId;
    const numEl = document.getElementById('edit-match-num');
    if (numEl) numEl.innerText = match.id.replace('match-', '');

    const winNameInput = document.getElementById('edit-winner-name');
    if (winNameInput) winNameInput.value = match.winnerName;

    const winDeptSelect = document.getElementById('edit-winner-dept');
    if (winDeptSelect) {
      this.ensureDeptInSelect(winDeptSelect, match.winnerDept);
      winDeptSelect.value = match.winnerDept;
    }

    const loserNameInput = document.getElementById('edit-loser-name');
    if (loserNameInput) loserNameInput.value = match.loserName;

    const loserDeptSelect = document.getElementById('edit-loser-dept');
    if (loserDeptSelect) {
      this.ensureDeptInSelect(loserDeptSelect, match.loserDept);
      loserDeptSelect.value = match.loserDept;
    }

    const weaponInput = document.getElementById('edit-weapon-name');
    if (weaponInput) weaponInput.value = match.weaponName + (match.subVariantName ? ` [${match.subVariantName}]` : '');

    const dmgInput = document.getElementById('edit-damage');
    if (dmgInput) dmgInput.value = match.damage;

    const modal = document.getElementById('modal-edit-match');
    if (modal) modal.classList.add('active');
    if (window.sounds) window.sounds.playSelect();
  }

  ensureDeptInSelect(selectEl, deptName) {
    if (!selectEl) return;
    let found = false;
    for (let i = 0; i < selectEl.options.length; i++) {
      if (selectEl.options[i].value === deptName) {
        found = true;
        break;
      }
    }
    if (!found && deptName) {
      const opt = document.createElement('option');
      opt.value = deptName;
      opt.text = deptName;
      selectEl.appendChild(opt);
    }
  }

  saveEditedMatch() {
    if (!this.currentEditingId) return;
    const match = this.history.find(m => m.id === this.currentEditingId);
    if (match) {
      const winName = document.getElementById('edit-winner-name');
      const winDept = document.getElementById('edit-winner-dept');
      const loserName = document.getElementById('edit-loser-name');
      const loserDept = document.getElementById('edit-loser-dept');
      const dmgInput = document.getElementById('edit-damage');

      if (winName && winName.value.trim()) match.winnerName = winName.value.trim();
      if (winDept && winDept.value) match.winnerDept = winDept.value;
      if (loserName && loserName.value.trim()) match.loserName = loserName.value.trim();
      if (loserDept && loserDept.value) match.loserDept = loserDept.value;
      if (dmgInput && !isNaN(parseInt(dmgInput.value, 10))) match.damage = parseInt(dmgInput.value, 10);

      this.saveHistory();
      this.renderUI();
      if (window.sounds) window.sounds.playSelect();
    }
    this.closeEditModal();
  }

  closeEditModal() {
    this.currentEditingId = null;
    const modal = document.getElementById('modal-edit-match');
    if (modal) modal.classList.remove('active');
  }

  resetAllHistory() {
    if (confirm('Are you sure you want to clear all match history and test records?')) {
      this.history = [];
      this.saveHistory();
      this.renderUI();
      if (window.sounds) window.sounds.playSlam();
    }
  }

  exportCSV() {
    if (this.history.length === 0) {
      alert('No match history to export.');
      return;
    }

    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Match ID,Timestamp,Winner Name,Winner Dept,Runner-Up Name,Runner-Up Dept,Winning Weapon,Sub-Variant,Finishing Move,Damage,Max Combo,Duration (s)\r\n';

    this.history.forEach((m, idx) => {
      const row = [
        `Duel #${this.history.length - idx}`,
        `"${m.timestamp || ''}"`,
        `"${m.winnerName}"`,
        `"${m.winnerDept}"`,
        `"${m.loserName}"`,
        `"${m.loserDept}"`,
        `"${m.weaponName}"`,
        `"${m.subVariantName || 'Standard'}"`,
        `"${m.finishMove || ''}"`,
        m.damage || 0,
        m.combo || 3,
        m.durationSec || 45
      ].join(',');
      csvContent += row + '\r\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `IEEE_SB_VIT_Pune_Leaderboard_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    if (window.sounds) window.sounds.playSelect();
  }

  populateDeptFilterOptions() {
    const filterSelect = document.getElementById('lb-dept-filter');
    if (!filterSelect) return;

    filterSelect.innerHTML = '<option value="ALL">All Official VIT Pune Departments</option>';
    const depts = this.getDepartments();
    depts.forEach(d => {
      const opt = document.createElement('option');
      opt.value = d.name;
      opt.innerText = `${d.icon} ${d.name}`;
      filterSelect.appendChild(opt);
    });

    filterSelect.addEventListener('change', (e) => {
      this.selectedDeptFilter = e.target.value;
      this.renderUI();
      if (window.sounds) window.sounds.playClick();
    });
  }

  renderUI() {
    const historyBody = document.getElementById('lb-history-body');
    const rankingsBody = document.getElementById('lb-rankings-body');
    const deptStandingsBody = document.getElementById('lb-dept-standings-body');
    const deptPodiumCards = document.getElementById('lb-dept-podium-cards');
    const historyCount = document.getElementById('lb-history-count');
    const quickStats = document.getElementById('lb-quick-stats');

    if (historyCount) historyCount.innerText = this.history.length;

    // Filter history if filter is active
    const filteredHistory = (this.selectedDeptFilter === 'ALL')
      ? this.history
      : this.history.filter(m => m.winnerDept === this.selectedDeptFilter || m.loserDept === this.selectedDeptFilter);

    // 1. Render Match History Log Table
    if (historyBody) {
      historyBody.innerHTML = '';
      if (filteredHistory.length === 0) {
        historyBody.innerHTML = `<tr><td colspan="6" style="text-align:center; padding: 20px; color: var(--text-muted);">
          No match records found ${this.selectedDeptFilter !== 'ALL' ? 'for ' + this.selectedDeptFilter : ''}.
        </td></tr>`;
      } else {
        filteredHistory.forEach((m) => {
          const tr = document.createElement('tr');
          const duelNum = this.history.length - this.history.indexOf(m);
          
          tr.innerHTML = `
            <td><strong style="color: var(--gold-accent);">#${duelNum}</strong></td>
            <td>
              <strong>👑 ${m.winnerName}</strong>
              <span class="dept-badge-mini" title="${m.winnerDept}">${m.winnerDept}</span>
            </td>
            <td>
              <span>${m.loserName}</span>
              <span class="dept-badge-mini" style="background: #faf5ff; border-color: #ddd6fe; color: #7c3aed;" title="${m.loserDept}">${m.loserDept}</span>
            </td>
            <td><span class="weapon-tag-mini">${m.weaponName}</span></td>
            <td><strong style="color: var(--ieee-cyan);">${m.damage.toLocaleString()} DMG</strong></td>
            <td>
              <div class="row-actions">
                <button class="btn-action edit" title="Edit Duel Entry" data-id="${m.id}">✏️</button>
                <button class="btn-action delete" title="Delete Duel" data-id="${m.id}">🗑️</button>
              </div>
            </td>
          `;

          tr.querySelector('.btn-action.edit').addEventListener('click', () => this.openEditModal(m.id));
          tr.querySelector('.btn-action.delete').addEventListener('click', () => this.deleteDuel(m.id));

          historyBody.appendChild(tr);
        });
      }
    }

    // 2. Compute Aggregated Student Rankings & Department Standings
    const statsMap = {};
    const deptStats = {};
    const allVITDepts = this.getDepartments();

    // Initialize all official departments so each has representation
    allVITDepts.forEach(d => {
      deptStats[d.name] = {
        code: d.code,
        name: d.name,
        icon: d.icon,
        color: d.color,
        contested: 0,
        wins: 0,
        losses: 0,
        totalDamage: 0,
        weapons: {},
        students: {}
      };
    });

    this.history.forEach(m => {
      // Winner student stats
      if (!statsMap[m.winnerName]) {
        statsMap[m.winnerName] = {
          name: m.winnerName,
          dept: m.winnerDept,
          wins: 0,
          losses: 0,
          totalDamage: 0,
          maxCombo: 0,
          weapons: {}
        };
      }
      statsMap[m.winnerName].wins++;
      statsMap[m.winnerName].totalDamage += m.damage;
      if (m.combo > statsMap[m.winnerName].maxCombo) {
        statsMap[m.winnerName].maxCombo = m.combo;
      }
      statsMap[m.winnerName].weapons[m.weaponName] = (statsMap[m.winnerName].weapons[m.weaponName] || 0) + 1;

      // Loser student stats
      if (!statsMap[m.loserName]) {
        statsMap[m.loserName] = {
          name: m.loserName,
          dept: m.loserDept,
          wins: 0,
          losses: 0,
          totalDamage: 0,
          maxCombo: 0,
          weapons: {}
        };
      }
      statsMap[m.loserName].losses++;

      // Department calculations
      if (!deptStats[m.winnerDept]) {
        deptStats[m.winnerDept] = {
          code: 'VIT',
          name: m.winnerDept,
          icon: '🏛️',
          color: '#00B5E2',
          contested: 0,
          wins: 0,
          losses: 0,
          totalDamage: 0,
          weapons: {},
          students: {}
        };
      }
      deptStats[m.winnerDept].contested++;
      deptStats[m.winnerDept].wins++;
      deptStats[m.winnerDept].totalDamage += m.damage;
      deptStats[m.winnerDept].weapons[m.weaponName] = (deptStats[m.winnerDept].weapons[m.weaponName] || 0) + 1;
      deptStats[m.winnerDept].students[m.winnerName] = (deptStats[m.winnerDept].students[m.winnerName] || 0) + 1;

      if (!deptStats[m.loserDept]) {
        deptStats[m.loserDept] = {
          code: 'VIT',
          name: m.loserDept,
          icon: '🏛️',
          color: '#c026d3',
          contested: 0,
          wins: 0,
          losses: 0,
          totalDamage: 0,
          weapons: {},
          students: {}
        };
      }
      deptStats[m.loserDept].contested++;
      deptStats[m.loserDept].losses++;
    });

    // 3. Render Student Rankings Table
    let rankedStudents = Object.values(statsMap);
    if (this.selectedDeptFilter !== 'ALL') {
      rankedStudents = rankedStudents.filter(st => st.dept === this.selectedDeptFilter);
    }
    rankedStudents.sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      return b.totalDamage - a.totalDamage;
    });

    if (rankingsBody) {
      rankingsBody.innerHTML = '';
      if (rankedStudents.length === 0) {
        rankingsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 20px; color: var(--text-muted);">
          No student rankings recorded yet ${this.selectedDeptFilter !== 'ALL' ? 'for ' + this.selectedDeptFilter : ''}.
        </td></tr>`;
      } else {
        rankedStudents.forEach((st, idx) => {
          const tr = document.createElement('tr');

          let rankBadge = `#${idx + 1}`;
          if (idx === 0) rankBadge = '🥇 1st';
          else if (idx === 1) rankBadge = '🥈 2nd';
          else if (idx === 2) rankBadge = '🥉 3rd';

          tr.innerHTML = `
            <td><strong class="rank-label ${idx < 3 ? 'podium-' + (idx + 1) : ''}">${rankBadge}</strong></td>
            <td><strong>${st.name}</strong></td>
            <td><span class="dept-badge-mini">${st.dept}</span></td>
            <td><strong style="color: var(--ieee-cyan);">${st.wins} Wins</strong></td>
            <td><strong style="color: var(--gold-accent);">${st.totalDamage.toLocaleString()} DMG</strong></td>
          `;
          rankingsBody.appendChild(tr);
        });
      }
    }

    // 4. Render Department Leaderboard (Department Standings)
    const sortedDepts = Object.values(deptStats).sort((a, b) => {
      if (b.wins !== a.wins) return b.wins - a.wins;
      if (b.totalDamage !== a.totalDamage) return b.totalDamage - a.totalDamage;
      return b.contested - a.contested;
    });

    // Top 3 Podium Department Cards
    if (deptPodiumCards) {
      deptPodiumCards.innerHTML = '';
      const top3 = sortedDepts.slice(0, 3);
      top3.forEach((d, idx) => {
        const medal = idx === 0 ? '🥇 1st Place' : (idx === 1 ? '🥈 2nd Place' : '🥉 3rd Place');
        const card = document.createElement('div');
        card.className = `dept-podium-card podium-card-${idx + 1} glass-panel`;
        card.style.borderColor = d.color || '#00B5E2';
        card.innerHTML = `
          <div class="podium-badge">${medal}</div>
          <div class="podium-icon">${d.icon || '🏛️'}</div>
          <div class="podium-dept-name">${d.name}</div>
          <div class="podium-stats-row" style="justify-content: center;">
            <div class="pod-stat">
              <span class="pod-stat-val" style="font-size: 1.25rem; font-weight: 900; color: var(--ieee-blue);">${d.wins}</span>
              <span class="pod-stat-lbl">Victories</span>
            </div>
          </div>
        `;
        deptPodiumCards.appendChild(card);
      });
    }

    // Department Standings Table
    if (deptStandingsBody) {
      deptStandingsBody.innerHTML = '';
      sortedDepts.forEach((d, idx) => {
        const tr = document.createElement('tr');
        
        let rankBadge = `#${idx + 1}`;
        if (idx === 0) rankBadge = '🥇 1st';
        else if (idx === 1) rankBadge = '🥈 2nd';
        else if (idx === 2) rankBadge = '🥉 3rd';

        tr.innerHTML = `
          <td><strong class="rank-label ${idx < 3 ? 'podium-' + (idx + 1) : ''}">${rankBadge}</strong></td>
          <td>
            <div class="dept-col-title" style="display: flex; align-items: center; gap: 8px;">
              <span class="dept-icon">${d.icon || '🏛️'}</span>
              <strong>${d.name}</strong>
            </div>
          </td>
          <td><strong>${d.contested}</strong></td>
          <td><strong style="color: var(--ieee-cyan);">${d.wins}</strong></td>
          <td><strong style="color: var(--gold-accent);">${d.totalDamage.toLocaleString()} DMG</strong></td>
        `;

        deptStandingsBody.appendChild(tr);
      });
    }
  }

  initEventListeners() {
    // Open Leaderboard Modal
    const openBtn = document.getElementById('btn-open-leaderboard');
    if (openBtn) {
      openBtn.addEventListener('click', () => this.openLeaderboard());
    }

    const victoryViewBtn = document.getElementById('btn-victory-leaderboard');
    if (victoryViewBtn) {
      victoryViewBtn.addEventListener('click', () => this.openLeaderboard());
    }

    // Close Modal
    const closeBtn = document.getElementById('btn-close-leaderboard');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeLeaderboard());
    }

    // Tabs inside modal
    const tabRankings = document.getElementById('lb-tab-rankings');
    const tabHistory = document.getElementById('lb-tab-history');
    const tabDepts = document.getElementById('lb-tab-departments');

    const viewRankings = document.getElementById('lb-view-rankings');
    const viewHistory = document.getElementById('lb-view-history');
    const viewDepts = document.getElementById('lb-view-departments');

    const activateTab = (activeTab, activeView) => {
      [tabRankings, tabHistory, tabDepts].filter(Boolean).forEach(b => b.classList.remove('active'));
      [viewRankings, viewHistory, viewDepts].filter(Boolean).forEach(v => v.classList.remove('active'));
      if (activeTab) activeTab.classList.add('active');
      if (activeView) activeView.classList.add('active');
      if (window.sounds) window.sounds.playClick();
    };

    if (tabDepts) tabDepts.addEventListener('click', () => activateTab(tabDepts, viewDepts));
    if (tabRankings) tabRankings.addEventListener('click', () => activateTab(tabRankings, viewRankings));
    if (tabHistory) tabHistory.addEventListener('click', () => activateTab(tabHistory, viewHistory));


    // Reset All History for Testing
    const resetBtn = document.getElementById('btn-reset-leaderboard');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetAllHistory());
    }

    // Add Mock Test Duel
    const addTestBtn = document.getElementById('btn-add-test-duel');
    if (addTestBtn) {
      addTestBtn.addEventListener('click', () => this.addMockTestDuel());
    }

    // Edit modal events
    const closeEditBtn = document.getElementById('btn-close-edit-match');
    const cancelEditBtn = document.getElementById('btn-cancel-edit');
    const saveEditBtn = document.getElementById('btn-save-edit');

    if (closeEditBtn) closeEditBtn.addEventListener('click', () => this.closeEditModal());
    if (cancelEditBtn) cancelEditBtn.addEventListener('click', () => this.closeEditModal());
    if (saveEditBtn) saveEditBtn.addEventListener('click', () => this.saveEditedMatch());
  }

  openLeaderboard() {
    this.renderUI();
    const modal = document.getElementById('modal-leaderboard');
    if (modal) modal.classList.add('active');
    if (window.sounds) window.sounds.playSelect();
  }

  closeLeaderboard() {
    const modal = document.getElementById('modal-leaderboard');
    if (modal) modal.classList.remove('active');
    if (window.sounds) window.sounds.playClick();
  }
}

// Global Leaderboard Instance
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
  });
} else {
  window.leaderboardManager = new LeaderboardManager();
}
