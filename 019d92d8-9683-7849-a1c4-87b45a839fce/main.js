const GAME_STATE = {
    milk: 0,
    totalMilk: 0,
    totalMilkAllTime: 0,
    clickMultiplier: 1,
    generatorMultiplier: 1,
    combo: 1,
    comboTimeout: null,
    comboAnimationId: null,
    clickHistory: [],
    battlePass: {
        level: 1,
        progress: 0,
        unlockedRewards: []
    },
    generators: {},
    upgrades: {},
    prestigeLevel: 0,
    rebirthCount: 0,
    resetCount: 0,
    lastSaveTime: Date.now(),
    runStartedAt: Date.now(),
    totalPlayTimeMs: 0
};

function getValidatedGameSpeed() {
    const speedParam = new URLSearchParams(window.location.search).get('speed');
    if (speedParam === null) return 1;
    if (!/^\d+$/.test(speedParam)) return 1;
    const speed = Number(speedParam);
    if (!Number.isInteger(speed) || speed < 0 || speed > 10) return 1;
    return speed;
}

const GAME_SPEED = getValidatedGameSpeed();
const FINAL_REBIRTH_AT = 3;
const PRESTIGE_REQUIRED_FOR_REBIRTH = 3;

const GENERATORS = {
    harvesters: {
        name: 'Stagiaires Traiteurs de Lait',
        icon: '<img src="icons/gen_stagiaire.png" alt="Stagiaire">',
        baseCost: 9,
        baseProduction: 0.1,
        description: '+0.1 L/sec',
        requiredLevel: 1
    },
    herbalists: {
        name: 'Vaches Primordiales Mutantes',
        icon: '<img src="icons/gen_vache.png" alt="Vache">',
        baseCost: 85,
        baseProduction: 1,
        description: '+1 L/sec',
        requiredLevel: 2
    },
    farmers: {
        name: 'Extracteurs de Lactose Quantique',
        icon: '<img src="icons/gen_extracteur.png" alt="Extracteur">',
        baseCost: 850,
        baseProduction: 10,
        description: '+10 L/sec',
        requiredLevel: 4
    },
    labs: {
        name: 'Pompes de la Fontaine de Jouvence',
        icon: '<img src="icons/gen_fontaine.png" alt="Fontaine">',
        baseCost: 8500,
        baseProduction: 100,
        description: '+100 L/sec',
        requiredLevel: 7
    },
    facility: {
        name: 'Complexe Alchimique Orbital',
        icon: '<img src="icons/gen_complexe.png" alt="Complexe">',
        baseCost: 85000,
        baseProduction: 1000,
        description: '+1000 L/sec',
        requiredLevel: 11
    }
};

const UPGRADES = {
    efficiency_1: {
        name: 'Pipette de Dégustation en Or',
        icon: '<img src="icons/up_pipette.png" alt="Pipette">',
        cost: 85,
        effect: 'Efficacité du clic x1.5',
        type: 'tap',
        value: 1.5,
        requiredLevel: 2
    },
    efficiency_2: {
        name: 'Gant en Soie de Maxoor',
        icon: '<img src="icons/up_gant.png" alt="Gant">',
        cost: 425,
        effect: 'Efficacité du clic x2.0',
        type: 'tap',
        value: 2,
        requiredLevel: 5
    },
    efficiency_3: {
        name: 'Sceptre de Jouvence Absolue',
        icon: '<img src="icons/up_sceptre.png" alt="Sceptre">',
        cost: 4250,
        effect: 'Efficacité du clic x3.0',
        type: 'tap',
        value: 3,
        requiredLevel: 10
    },
    passive_1: {
        name: 'Filtration au Carbone Noir',
        icon: '<img src="icons/up_filtre.png" alt="Filtre">',
        cost: 425,
        effect: 'Production passive +50%',
        type: 'generator',
        value: 1.5,
        requiredLevel: 3
    },
    passive_2: {
        name: 'Infusion de Minéraux Lunaires',
        icon: '<img src="icons/up_lune.png" alt="Lune">',
        cost: 4250,
        effect: 'Production passive +100%',
        type: 'generator',
        value: 2,
        requiredLevel: 8
    },
    passive_3: {
        name: 'Distillation Spatio-Temporelle',
        icon: '<img src="icons/up_distillation.png" alt="Distillation">',
        cost: 42500,
        effect: 'Production passive +200%',
        type: 'generator',
        value: 3,
        requiredLevel: 15
    },
    combo_1: {
        name: 'Synergie Cosmétique',
        icon: '<img src="icons/up_synergie.png" alt="Synergie">',
        cost: 850,
        effect: 'Multiplicateur de Combo x1.5',
        type: 'combo',
        value: 1.5,
        requiredLevel: 6
    },
    combo_2: {
        name: 'Résonance Cellulaire',
        icon: '<img src="icons/up_resonance.png" alt="Résonance">',
        cost: 8500,
        effect: 'Multiplicateur de Combo x2.0',
        type: 'combo',
        value: 2,
        requiredLevel: 12
    }
};

const BATTLE_PASS_REWARDS = {
    1: { milestone: 1000, reward: 'Déverrouille "Pipette de Dégustation en Or"', icon: '<img src="icons/up_pipette.png">' },
    2: { milestone: 3000, reward: 'Qualité +10%', icon: '<img src="icons/bp_chart.png">' },
    3: { milestone: 6000, reward: 'Déverrouille "Filtration au Carbone Noir"', icon: '<img src="icons/up_filtre.png">' },
    4: { milestone: 10000, reward: 'Qualité +20%', icon: '<img src="icons/bp_chart.png">' },
    5: { milestone: 15000, reward: 'Déverrouille "Gant en Soie de Maxoor"', icon: '<img src="icons/up_gant.png">' },
    6: { milestone: 25000, reward: 'Déverrouille "Synergie Cosmétique"', icon: '<img src="icons/up_synergie.png">' },
    7: { milestone: 40000, reward: 'Qualité +50%', icon: '<img src="icons/bp_chart.png">' },
    8: { milestone: 60000, reward: 'Déverrouille "Infusion de Minéraux Lunaires"', icon: '<img src="icons/up_lune.png">' },
    9: { milestone: 90000, reward: 'Qualité +100%', icon: '<img src="icons/bp_chart.png">' },
    10: { milestone: 130000, reward: 'Déverrouille "Sceptre de Jouvence Absolue"', icon: '<img src="icons/up_sceptre.png">' },
    11: { milestone: 180000, reward: 'Bonus de Prestige x2', icon: '<img src="icons/bp_star.png">' },
    12: { milestone: 250000, reward: 'Déverrouille "Résonance Cellulaire"', icon: '<img src="icons/up_resonance.png">' },
    13: { milestone: 350000, reward: 'Qualité +300%', icon: '<img src="icons/bp_chart.png">' },
    14: { milestone: 500000, reward: 'Qualité +400%', icon: '<img src="icons/bp_chart.png">' },
    15: { milestone: 700000, reward: 'Déverrouille "Distillation Spatio-Temporelle"', icon: '<img src="icons/up_distillation.png">' },
    16: { milestone: 1000000, reward: 'Qualité +500%', icon: '<img src="icons/bp_chart.png">' },
    17: { milestone: 1500000, reward: 'Qualité +1000%', icon: '<img src="icons/bp_chart.png">' },
    18: { milestone: 2250000, reward: 'Production x3 temporaire', icon: '<img src="icons/bp_clock.png">' },
    19: { milestone: 3375000, reward: 'Qualité +2000%', icon: '<img src="icons/bp_chart.png">' },
    20: { milestone: 5062500, reward: 'Prestige Accessible! 🌟', icon: '<img src="icons/bp_star.png">' },
    21: { milestone: 7593750, reward: 'Qualité +3000%', icon: '<img src="icons/bp_chart.png">' },
    22: { milestone: 11390625, reward: 'Production x4 temporaire', icon: '<img src="icons/bp_clock.png">' },
    23: { milestone: 17085938, reward: 'Qualité +5000%', icon: '<img src="icons/bp_chart.png">' },
    24: { milestone: 25628906, reward: 'Rebirth Déverrouillé! 👑', icon: '<img src="icons/bp_crown.png">' },
    25: { milestone: 50000000, reward: 'Maître de Maxoor! 🏆', icon: '<img src="icons/bp_trophy.png">' }
};

function initGame() {
    if (window.lucide) {
        lucide.createIcons();
    }
    loadGame();
    initGenerators();
    initUpgrades();
    initClickerHitbox();
    renderAll();
    updateComboDisplay();
    setInterval(generatePassiveIncome, 100);
    setupEventListeners();
}

function initClickerHitbox() {
    const img = new Image();
    img.src = 'icons/verre.png';
    img.onload = function() {
        const maxSize = 180;
        const ratio = img.naturalWidth / img.naturalHeight;
        let width = maxSize;
        let height = maxSize;
        if (ratio > 1) {
            height = maxSize / ratio;
        } else {
            width = maxSize * ratio;
        }
        const btn = document.getElementById('main-clicker');
        btn.style.width = width + 'px';
        btn.style.height = height + 'px';
    };
}

function initGenerators() {
    Object.keys(GENERATORS).forEach(key => {
        if (!GAME_STATE.generators[key]) {
            GAME_STATE.generators[key] = { count: 0 };
        }
    });
}

function initUpgrades() {
    Object.keys(UPGRADES).forEach(key => {
        if (!GAME_STATE.upgrades[key]) {
            GAME_STATE.upgrades[key] = { purchased: false };
        }
    });
}

function setupEventListeners() {
    document.getElementById('main-clicker').addEventListener('click', handleClick);
    document.getElementById('stats-btn').addEventListener('click', toggleStatsPanel);
    document.getElementById('stats-close-btn').addEventListener('click', closeStatsPanel);
    document.getElementById('reset-btn').addEventListener('click', resetGame);
    document.getElementById('prestige-btn').addEventListener('click', handlePrestigeClick);
}

function handlePrestigeClick() {
    const canRebirth = GAME_STATE.battlePass.level >= 25 && GAME_STATE.prestigeLevel >= PRESTIGE_REQUIRED_FOR_REBIRTH;
    if (canRebirth) {
        const isFinalRebirth = GAME_STATE.rebirthCount >= FINAL_REBIRTH_AT - 1;
        const confirmed = confirm(isFinalRebirth
            ? "🏁 DERNIERE RENAISSANCE - C'est votre 3e Rebirth. Cette action met fin à la partie et lance un reset COMPLET du jeu (tout est effacé).\n\nÊtes-vous sûr ?"
            : "🔄 RENAISSANCE - Recommencer complètement à 0 (lait, générateurs, améliorations, BP niveau 1) mais conserver tous vos multiplicateurs de clics et +0.1x bonus supplémentaire.\n\nÊtes-vous sûr?");
        if (confirmed) {
            rebirth();
        }
    } else if (GAME_STATE.battlePass.level >= 20) {
        const confirmed = confirm(
            "⭐ PRESTIGE - Recommencer complètement à 0 (lait, générateurs, améliorations, BP niveau 1, Prestige) mais conserver +0.5x multiplicateur de clics permanent.\n\nÊtes-vous sûr?"
        );
        if (confirmed) {
            prestige();
        }
    }
}

function handleClick(event) {
    if (GAME_SPEED === 0) return;
    const clickValue = calculateEffectiveClickMultiplier();
    GAME_STATE.milk += clickValue;
    GAME_STATE.totalMilk += clickValue;
    GAME_STATE.totalMilkAllTime += clickValue;
    GAME_STATE.combo = Math.min(GAME_STATE.combo + 0.1, 5);
    GAME_STATE.clickHistory.push(Date.now());
    clearTimeout(GAME_STATE.comboTimeout);
    if (GAME_STATE.comboAnimationId) clearInterval(GAME_STATE.comboAnimationId);
    startComboTimer();
    showClickParticle(clickValue, event.clientX, event.clientY);
    updateDisplay();
    checkBattlePassProgress();
    updateComboDisplay();
    saveGame();
}

function startComboTimer() {
    const display = document.getElementById('combo-multiplier');
    const startTime = Date.now();
    const effectiveSpeed = GAME_SPEED > 0 ? GAME_SPEED : 1;
    const duration = 5000 / effectiveSpeed;
    display.classList.add('combo-active');
    display.style.setProperty('--combo-progress', 0);
    GAME_STATE.comboAnimationId = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        display.style.setProperty('--combo-progress', progress);
        if (progress >= 1) {
            clearInterval(GAME_STATE.comboAnimationId);
        }
    }, 30);
    GAME_STATE.comboTimeout = setTimeout(() => {
        GAME_STATE.combo = 1;
        display.classList.remove('combo-active');
        updateComboDisplay();
    }, duration);
}

function showClickParticle(value, mouseX, mouseY) {
    const particle = document.createElement('div');
    particle.textContent = '+' + Math.floor(value);
    particle.className = 'click-particle';
    particle.style.position = 'fixed';
    particle.style.left = mouseX + 'px';
    particle.style.top = mouseY + 'px';
    particle.style.transform = 'translate(-50%, -50%)';
    const horizontalDrift = (Math.random() - 0.5) * 80;
    particle.style.setProperty('--drift', horizontalDrift + 'px');
    particle.style.animation = `float-up 0.8s ease-out forwards`;
    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), 800);
}

function updateComboDisplay() {
    const display = document.getElementById('combo-multiplier');
    display.textContent = `Combo: x${calculateEffectiveClickMultiplier().toFixed(2)}`;
    display.hidden = false;
    if (GAME_STATE.combo > 1) {
        display.classList.remove('combo-active');
        void display.offsetWidth;
        display.classList.add('combo-active');
    } else {
        display.classList.remove('combo-active');
    }
}

function generatePassiveIncome() {
    if (GAME_SPEED === 0) return;
    let totalProduction = 0;
    Object.keys(GENERATORS).forEach(key => {
        const gen = GENERATORS[key];
        const count = GAME_STATE.generators[key].count;
        let production = gen.baseProduction * count;
        Object.keys(GAME_STATE.upgrades).forEach(upgradeKey => {
            const upgrade = UPGRADES[upgradeKey];
            if (GAME_STATE.upgrades[upgradeKey].purchased && upgrade.type === 'generator') {
                production *= upgrade.value;
            }
        });
        totalProduction += production;
    });
    totalProduction *= GAME_STATE.generatorMultiplier;
    const earnedMilk = (totalProduction / 10) * GAME_SPEED;
    GAME_STATE.milk += earnedMilk;
    GAME_STATE.totalMilk += earnedMilk;
    GAME_STATE.totalMilkAllTime += earnedMilk;
    checkBattlePassProgress();
    updateDisplay();
}

function updateDisplay() {
    document.getElementById('milk-count').textContent = formatNumber(Math.floor(GAME_STATE.milk));
    const tapPerSecond = calculateTapPerSecond();
    const generatorPerSecond = calculatePerSecond();
    const totalPerSecond = tapPerSecond + generatorPerSecond;
    document.getElementById('tap-per-second').textContent = formatNumber(tapPerSecond);
    document.getElementById('gen-per-second').textContent = formatNumber(generatorPerSecond);
    document.getElementById('milk-per-second').textContent = formatNumber(totalPerSecond);
    const allMultipliers = calculateAllMultipliers();
    document.getElementById('multiplier').textContent = 'x' + allMultipliers.toFixed(2);
    document.getElementById('game-runtime').textContent = formatRuntime();
    updateComboDisplay();
    updateStatsPanel();
    updateBuyButtons();
}

function calculateTapPerSecond() {
    const now = Date.now();
    const oneSecondAgo = now - 1000;
    GAME_STATE.clickHistory = GAME_STATE.clickHistory.filter(timestamp => timestamp > oneSecondAgo);
    return GAME_STATE.clickHistory.length;
}

function calculatePerSecond() {
    let total = 0;
    Object.keys(GENERATORS).forEach(key => {
        const gen = GENERATORS[key];
        const count = GAME_STATE.generators[key].count;
        let production = gen.baseProduction * count;
        Object.keys(GAME_STATE.upgrades).forEach(upgradeKey => {
            const upgrade = UPGRADES[upgradeKey];
            if (GAME_STATE.upgrades[upgradeKey].purchased && upgrade.type === 'generator') {
                production *= upgrade.value;
            }
        });
        total += production;
    });
    total *= GAME_STATE.generatorMultiplier;
    return total;
}

function calculateAllMultipliers() {
    return GAME_STATE.clickMultiplier;
}

function calculateEffectiveClickMultiplier() {
    return GAME_STATE.clickMultiplier * GAME_STATE.combo * GAME_SPEED;
}

function checkBattlePassProgress() {
    let newLevel = 1;
    for (let i = 25; i >= 1; i--) {
        const reward = BATTLE_PASS_REWARDS[i];
        if (reward && GAME_STATE.totalMilk >= reward.milestone) {
            newLevel = i;
            break;
        }
    }
    const previousLevel = GAME_STATE.battlePass.level;
    let leveledUp = false;
    if (newLevel > previousLevel) {
        leveledUp = true;
        for (let i = previousLevel + 1; i <= newLevel; i++) {
            GAME_STATE.battlePass.level = i;
            GAME_STATE.battlePass.unlockedRewards.push(i);
        }
    }
    const currentReward = BATTLE_PASS_REWARDS[GAME_STATE.battlePass.level];
    const previousReward = GAME_STATE.battlePass.level > 1 ? BATTLE_PASS_REWARDS[GAME_STATE.battlePass.level - 1] : { milestone: 0 };
    if (currentReward) {
        const rangeStart = previousReward.milestone;
        const rangeEnd = currentReward.milestone;
        const progress = ((GAME_STATE.totalMilk - rangeStart) / (rangeEnd - rangeStart)) * 100;
        GAME_STATE.battlePass.progress = Math.min(Math.max(progress, 0), 100);
    }

    if (leveledUp) {
        // Re-render shop cards immediately so freshly unlocked items appear without extra actions.
        renderGenerators();
        renderUpgrades();
    }

    updateBattlePassDisplay();
    if (GAME_STATE.battlePass.level >= 25 && GAME_STATE.prestigeLevel >= PRESTIGE_REQUIRED_FOR_REBIRTH) {
        const btn = document.getElementById('prestige-btn');
        const desc = document.getElementById('prestige-description');
        const isFinalRebirth = GAME_STATE.rebirthCount >= FINAL_REBIRTH_AT - 1;
        if (btn) {
            btn.disabled = false;
            btn.textContent = isFinalRebirth ? '🏁 Fin du jeu' : '🔄 Rebirth';
        }
        if (desc) {
            desc.removeAttribute('hidden');
            desc.innerHTML = isFinalRebirth
                ? '<strong>3e Rebirth = fin de partie</strong><br>Déclenche un reset COMPLET du jeu.'
                : '<strong>Renaissance à 0</strong> mais garder tous les multiplicateurs de clics + bonus +0.1x supplémentaire';
        }
    } else if (GAME_STATE.battlePass.level >= 20) {
        const btn = document.getElementById('prestige-btn');
        const desc = document.getElementById('prestige-description');
        if (btn) {
            btn.disabled = false;
            btn.textContent = '⭐ Prestige';
        }
        if (desc) {
            desc.removeAttribute('hidden');
            if (GAME_STATE.battlePass.level >= 25) {
                desc.innerHTML = `<strong>Rebirth nécessite ${PRESTIGE_REQUIRED_FOR_REBIRTH} Prestige</strong><br>Prestige actuel: ${GAME_STATE.prestigeLevel}/${PRESTIGE_REQUIRED_FOR_REBIRTH}`;
            } else {
                desc.innerHTML = '<strong>Recommencer à 0</strong> mais garder +0.5x multiplicateur de clics permanent';
            }
        }
    } else {
        const btn = document.getElementById('prestige-btn');
        const desc = document.getElementById('prestige-description');
        if (btn) {
            btn.disabled = true;
        }
        if (desc) {
            desc.setAttribute('hidden', '');
        }
    }
}

function updateBattlePassDisplay() {
    const level = GAME_STATE.battlePass.level;
    const nextRewardLevel = level < 25 ? level + 1 : null;
    const bpLevelBadge = document.getElementById('bp-level');
    if (bpLevelBadge) {
        bpLevelBadge.textContent = `Niv. ${level}`;
    }
    if (nextRewardLevel) {
        const previousMilestone = level === 1 ? 0 : (BATTLE_PASS_REWARDS[level]?.milestone ?? 0);
        const targetMilestone = BATTLE_PASS_REWARDS[nextRewardLevel].milestone;
        const milkSinceLevelStart = Math.max(0, GAME_STATE.totalMilk - previousMilestone);
        const neededInLevel = Math.max(1, targetMilestone - previousMilestone);
        const progressToNext = Math.min(100, (milkSinceLevelStart / neededInLevel) * 100);
        document.getElementById('bp-progress').style.width = progressToNext + '%';
        document.getElementById('bp-progress-text').textContent = 
            `${formatNumber(Math.floor(milkSinceLevelStart))} / ${formatNumber(neededInLevel)}`;
    } else {
        document.getElementById('bp-progress').style.width = '100%';
        document.getElementById('bp-progress-text').textContent = 'MAX';
    }
    renderBattlePassRewards();
}

function renderBattlePassRewards() {
    const levelDisplay = document.getElementById('bp-level-display');
    levelDisplay.textContent = `Battle Pass Niv. ${GAME_STATE.battlePass.level}/25`;
    
    const nextLevel = GAME_STATE.battlePass.level < 25 ? GAME_STATE.battlePass.level + 1 : null;
    const nextRewardDisplay = document.getElementById('bp-next-reward');
    if (nextRewardDisplay && nextLevel) {
        const nextReward = BATTLE_PASS_REWARDS[nextLevel];
        if (nextReward) {
            nextRewardDisplay.innerHTML = `<strong>Prochain palier :</strong><br>${nextReward.reward}`;
        }
    } else if (nextRewardDisplay) {
        nextRewardDisplay.innerHTML = '<strong>Battle Pass terminé</strong>';
    }
}

function renderAll() {
    renderGenerators();
    renderUpgrades();
    renderBattlePassRewards();
    updateDisplay();
}

function renderGenerators() {
    const grid = document.getElementById('generators-grid');
    grid.innerHTML = '';
    const sortedGenerators = Object.entries(GENERATORS).sort(([, a], [, b]) => {
        if (a.requiredLevel !== b.requiredLevel) {
            return a.requiredLevel - b.requiredLevel;
        }
        return a.baseCost - b.baseCost;
    });
    sortedGenerators.forEach(([key, gen]) => {
        const count = GAME_STATE.generators[key].count;
        const cost = calculateCost(gen.baseCost, count);
        const hasMoney = GAME_STATE.milk >= cost;
        const available = GAME_STATE.battlePass.level >= gen.requiredLevel;
        const canBuy = hasMoney && available;
        const card = document.createElement('div');
        card.className = 'generator-card';
        card.setAttribute('data-price', Math.round(cost));
        card.setAttribute('data-id', key);
        card.innerHTML = `
            <div class="generator-icon">${gen.icon}</div>
            <div class="generator-name">${gen.name}</div>
            <div class="generator-effect">${gen.description}</div>
            <div class="generator-price">💰 ${formatNumber(Math.round(cost))}</div>
            <div class="generator-count">Vous avez: ${count}</div>
            ${!available ? `<div style="color: #888; font-size: 0.85rem;">Niveau ${gen.requiredLevel} requis</div>` : ''}
            <button class="buy-btn" 
                    onclick="buyGenerator('${key}')" 
                    style="display: ${canBuy ? 'block' : 'none'}">
                Acheter
            </button>
        `;
        grid.appendChild(card);
    });
}

function renderUpgrades() {
    const grid = document.getElementById('upgrades-grid');
    grid.innerHTML = '';
    const sortedUpgrades = Object.entries(UPGRADES).sort(([, a], [, b]) => {
        if (a.requiredLevel !== b.requiredLevel) {
            return a.requiredLevel - b.requiredLevel;
        }
        return a.cost - b.cost;
    });
    sortedUpgrades.forEach(([key, upgrade]) => {
        const purchased = GAME_STATE.upgrades[key].purchased;
        const available = GAME_STATE.battlePass.level >= upgrade.requiredLevel;
        const hasMoney = GAME_STATE.milk >= upgrade.cost;
        const card = document.createElement('div');
        card.className = `upgrade-card ${!available ? 'locked' : ''} ${purchased ? 'purchased' : ''}`;
        card.setAttribute('data-price', upgrade.cost);
        card.setAttribute('data-id', key);
        let html = `
            <div class="upgrade-icon">${upgrade.icon}</div>
            <div class="upgrade-name">${upgrade.name}</div>
            <div class="upgrade-effect">${upgrade.effect}</div>
                        ${purchased ? '<div class="upgrade-bought-label">✓ ACHETÉ</div>' : 
              `<div class="upgrade-price">💰 ${formatNumber(upgrade.cost)}</div>`}
            ${!available ? `<div style="color: #888; font-size: 0.85rem;">Niveau ${upgrade.requiredLevel} requis</div>` : ''}
        `;
        if (!purchased && available) {
            html += `<button class="buy-btn" onclick="buyUpgrade('${key}')" ${hasMoney ? '' : 'disabled'}>Acheter</button>`;
        }
        card.innerHTML = html;
        grid.appendChild(card);
    });
}

function buyGenerator(key) {
    const gen = GENERATORS[key];
    const count = GAME_STATE.generators[key].count;
    const cost = calculateCost(gen.baseCost, count);
    if (GAME_STATE.battlePass.level < gen.requiredLevel) {
        alert(`❌ Tu dois atteindre le niveau ${gen.requiredLevel} (tu es au niveau ${GAME_STATE.battlePass.level})`);
        return;
    }
    if (GAME_STATE.milk >= cost) {
        GAME_STATE.milk -= cost;
        GAME_STATE.generators[key].count++;
        renderAll();
        saveGame();
    } else {
        alert(`❌ Tu n'as pas assez d'argent! Il te manque ${formatNumber(Math.round(cost - GAME_STATE.milk))}`);
    }
}

function buyUpgrade(key) {
    const upgrade = UPGRADES[key];
    if (GAME_STATE.battlePass.level < upgrade.requiredLevel) {
        alert(`❌ Tu dois atteindre le niveau ${upgrade.requiredLevel} (tu es au niveau ${GAME_STATE.battlePass.level})`);
        return;
    }
    if (GAME_STATE.milk >= upgrade.cost && 
        !GAME_STATE.upgrades[key].purchased) {
        GAME_STATE.milk -= upgrade.cost;
        GAME_STATE.upgrades[key].purchased = true;
        if (upgrade.type === 'tap') {
            GAME_STATE.clickMultiplier *= upgrade.value;
        } else if (upgrade.type === 'combo') {
        }
        renderAll();
        saveGame();
    }
}

function calculateCost(base, count) {
    return Math.floor(base * Math.pow(1.20, count));
}

function prestige() {
    if (GAME_STATE.battlePass.level >= 20) {
        commitSessionPlayTime();
        GAME_STATE.prestigeLevel++;
        const prestigeBoost = 1 + (GAME_STATE.prestigeLevel * 0.5);
        GAME_STATE.milk = 0;
        GAME_STATE.totalMilk = 0;
        GAME_STATE.battlePass = { level: 1, progress: 0, unlockedRewards: [] };
        GAME_STATE.generators = {};
        GAME_STATE.upgrades = {};
        GAME_STATE.clickMultiplier = prestigeBoost;
        GAME_STATE.generatorMultiplier = 1;
        GAME_STATE.combo = 1;
        GAME_STATE.runStartedAt = Date.now();
        initGenerators();
        initUpgrades();
        renderAll();
        saveGame();
    }
}

function rebirth() {
    if (GAME_STATE.battlePass.level >= 25) {
        if (GAME_STATE.prestigeLevel < PRESTIGE_REQUIRED_FOR_REBIRTH) {
            alert(`⚠️ Rebirth nécessite ${PRESTIGE_REQUIRED_FOR_REBIRTH} Prestige! Vous en avez: ${GAME_STATE.prestigeLevel}`);
            return;
        }

        if (GAME_STATE.rebirthCount >= FINAL_REBIRTH_AT - 1) {
            performCompleteReset();
            saveGame();
            alert('🏁 Fin du jeu atteinte: 3e Rebirth effectué. Reset complet appliqué.');
            return;
        }

        GAME_STATE.rebirthCount++;
        commitSessionPlayTime();
        const rebirthBoost = 1 + (GAME_STATE.prestigeLevel * 0.5) + (GAME_STATE.rebirthCount * 0.1);
        GAME_STATE.milk = 0;
        GAME_STATE.totalMilk = 0;
        GAME_STATE.battlePass = { level: 1, progress: 0, unlockedRewards: [] };
        GAME_STATE.generators = {};
        GAME_STATE.upgrades = {};
        GAME_STATE.clickMultiplier = rebirthBoost;
        GAME_STATE.generatorMultiplier = 1;
        GAME_STATE.combo = 1;
        GAME_STATE.prestigeLevel = 0;
        GAME_STATE.runStartedAt = Date.now();
        initGenerators();
        initUpgrades();
        renderAll();
        saveGame();
        alert(`🎉 Rebirth #${GAME_STATE.rebirthCount}! Multiplicateur: x${rebirthBoost.toFixed(2)}`);
    }
}

function performCompleteReset() {
    commitSessionPlayTime();
    const resetCount = GAME_STATE.resetCount || 0;
    localStorage.removeItem('maxoor-sanctuary-save');
    GAME_STATE.milk = 0;
    GAME_STATE.totalMilk = 0;
    GAME_STATE.totalMilkAllTime = 0;
    GAME_STATE.clickMultiplier = 1;
    GAME_STATE.generatorMultiplier = 1;
    GAME_STATE.combo = 1;
    GAME_STATE.clickHistory = [];
    GAME_STATE.battlePass = { level: 1, progress: 0, unlockedRewards: [] };
    GAME_STATE.generators = {};
    GAME_STATE.upgrades = {};
    GAME_STATE.prestigeLevel = 0;
    GAME_STATE.rebirthCount = 0;
    GAME_STATE.resetCount = resetCount + 1;
    GAME_STATE.runStartedAt = Date.now();
    initGenerators();
    initUpgrades();
    renderAll();
}

function resetGame() {
    const resetWarning = '⚠️ RESET TOTAL\n\nCe reset supprime VRAIMENT tout le jeu sur cette sauvegarde: lait, progression Battle Pass, générateurs, améliorations, prestige, rebirth et multiplicateurs.\n\nCette action est irréversible. Continuer ?';
    if (confirm(resetWarning)) {
        performCompleteReset();
    }
}

function saveGame() {
    localStorage.setItem('maxoor-sanctuary-save', JSON.stringify(GAME_STATE));
}

function loadGame() {
    const saved = localStorage.getItem('maxoor-sanctuary-save');
    if (saved) {
        try {
            Object.assign(GAME_STATE, JSON.parse(saved));
            if (!GAME_STATE.runStartedAt) {
                GAME_STATE.runStartedAt = Date.now();
            }
            if (typeof GAME_STATE.resetCount !== 'number') {
                GAME_STATE.resetCount = 0;
            }
            if (typeof GAME_STATE.totalMilkAllTime !== 'number') {
                GAME_STATE.totalMilkAllTime = GAME_STATE.totalMilk || 0;
            }
            if (typeof GAME_STATE.totalPlayTimeMs !== 'number') {
                GAME_STATE.totalPlayTimeMs = 0;
            }
        } catch (err) {
            console.error('Erreur de chargement:', err);
        }
    }
}

setInterval(saveGame, 2000);

function formatNumber(num) {
    if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
    if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
    if (num >= 1e3) return (num / 1e3).toFixed(2) + 'K';
    if (num >= 10) return Math.round(num).toString();
    return num.toFixed(2);
}

function formatRuntime() {
    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - GAME_STATE.runStartedAt) / 1000));
    const hours = Math.floor(elapsedSeconds / 3600);
    const minutes = Math.floor((elapsedSeconds % 3600) / 60);
    const seconds = elapsedSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function formatMilliseconds(ms) {
    const totalSeconds = Math.max(0, Math.floor(ms / 1000));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function commitSessionPlayTime() {
    GAME_STATE.totalPlayTimeMs += Math.max(0, Date.now() - GAME_STATE.runStartedAt);
    GAME_STATE.runStartedAt = Date.now();
}

function toggleStatsPanel() {
    const panel = document.getElementById('stats-panel');
    if (!panel) return;
    if (panel.hasAttribute('hidden')) {
        panel.removeAttribute('hidden');
        updateStatsPanel();
    } else {
        panel.setAttribute('hidden', '');
    }
}

function closeStatsPanel() {
    const panel = document.getElementById('stats-panel');
    if (panel) {
        panel.setAttribute('hidden', '');
    }
}

function updateStatsPanel() {
    const resetCount = document.getElementById('stats-reset-count');
    const totalMilk = document.getElementById('stats-total-milk');
    const prestigeCount = document.getElementById('stats-prestige-count');
    const rebirthCount = document.getElementById('stats-rebirth-count');
    const bpLevel = document.getElementById('stats-bp-level');
    const speed = document.getElementById('stats-speed');
    const clickMult = document.getElementById('stats-click-mult');
    const totalPlayTime = document.getElementById('stats-total-playtime');

    if (resetCount) resetCount.textContent = String(GAME_STATE.resetCount || 0);
    if (totalMilk) totalMilk.textContent = formatNumber(Math.floor(GAME_STATE.totalMilkAllTime || 0));
    if (prestigeCount) prestigeCount.textContent = String(GAME_STATE.prestigeLevel);
    if (rebirthCount) rebirthCount.textContent = String(GAME_STATE.rebirthCount);
    if (bpLevel) bpLevel.textContent = `Niv. ${GAME_STATE.battlePass.level}/25`;
    if (speed) speed.textContent = `x${GAME_SPEED}`;
    if (clickMult) clickMult.textContent = `x${calculateAllMultipliers().toFixed(2)}`;
    if (totalPlayTime) totalPlayTime.textContent = formatMilliseconds((GAME_STATE.totalPlayTimeMs || 0) + Math.max(0, Date.now() - GAME_STATE.runStartedAt));
}

function updateBuyButtons() {
    document.querySelectorAll('.buy-btn').forEach(btn => {
        if (btn.textContent.includes('ACHETÉ')) return;
        const parent = btn.closest('.generator-card, .upgrade-card');
        if (!parent) return;
        const price = parseInt(parent.getAttribute('data-price'));
        const key = parent.getAttribute('data-id');
        if (isNaN(price) || !key) return;
        
        let requiredLevel = 0;
        const isGenerator = parent.classList.contains('generator-card');
        
        if (isGenerator) {
            requiredLevel = GENERATORS[key].requiredLevel;
        } else {
            requiredLevel = UPGRADES[key].requiredLevel;
        }
        
        const hasLevel = GAME_STATE.battlePass.level >= requiredLevel;
        const hasMoney = GAME_STATE.milk >= price;

        if (isGenerator) {
            btn.style.display = (hasLevel && hasMoney) ? 'block' : 'none';
            return;
        }

        btn.style.display = hasLevel ? 'block' : 'none';
        btn.disabled = !hasMoney;
    });
}

document.addEventListener('DOMContentLoaded', initGame);