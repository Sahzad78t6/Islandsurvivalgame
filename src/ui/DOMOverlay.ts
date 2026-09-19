// DOM Overlay UI: Modals, Menus, Crafting/Inventory Windows, Lobby, Settings

import type { LevelDefinition, CraftingRecipe, BuildingDef } from '../types';
import { SaveSystem } from '../systems/SaveSystem';
import { Player, CHARACTER_CLASSES } from '../entities/Player';
import { CRAFTING_RECIPES, CraftingSystem } from '../systems/Crafting';
import { BUILDING_DEFINITIONS } from '../entities/Building';
import { ITEM_DEFINITIONS } from '../systems/Inventory';
import { audioSystem } from '../engine/AudioSystem';

export class DOMOverlay {
  private container: HTMLElement;
  private selectedInventorySlot: number | null = null;
  public activeBuildingGhost: string | null = null;
  public mobileControls: any = null;

  public onLogin: (saveData: any) => void = () => {};
  public onLogout: () => void = () => {};
  public onStartGame: (charClassId: string, levelNum: number, botCount: number, roomCode: string) => void = () => {};
  public onNextLevel: () => void = () => {};
  public onRestartLevel: () => void = () => {};
  public onReturnToMenu: () => void = () => {};
  public onSelectBuilding: (buildingId: string) => void = () => {};

  constructor() {
    let existing = document.getElementById('game-ui-overlay');
    if (!existing) {
      existing = document.createElement('div');
      existing.id = 'game-ui-overlay';
      document.body.appendChild(existing);
    }
    this.container = existing;
  }

  public renderLogin() {
    const defaultUser = SaveSystem.getCurrentUsername();
    this.container.innerHTML = `
      <div class="screen-overlay login-screen">
        <div class="modal-card login-card">
          <div class="badge-tag">EXPEDITION TERMINAL • ACCESS CONTROL</div>
          <h1 class="login-title">SURVIVOR LOGIN</h1>
          <p class="login-desc">Enter your callsign and password. Expedition logs, unlocked sector levels, and survival records will be stored to your profile.</p>

          <div class="login-form">
            <div class="login-field">
              <label for="login-username">👤 SURVIVOR CALLSIGN (USERNAME)</label>
              <input type="text" id="login-username" class="login-input" placeholder="e.g. Survivor_Alex" value="${defaultUser}" maxlength="24" autocomplete="username" />
            </div>

            <div class="login-field">
              <label for="login-password">🔑 SECURITY PASSCODE</label>
              <input type="password" id="login-password" class="login-input" placeholder="Enter passcode" maxlength="32" autocomplete="current-password" />
            </div>

            <div id="login-feedback" class="login-feedback"></div>

            <div class="login-button-group">
              <button class="btn btn-primary btn-large" id="btn-login-submit">▶ ENTER EXPEDITION (LOGIN / REGISTER)</button>
            </div>

            <div class="login-tip-box">
              <span>ℹ️ <strong>PERSISTENT PROGRESSION:</strong> New survivors are registered automatically. Returning players immediately continue from where they left off!</span>
            </div>
          </div>
        </div>
      </div>
    `;

    const handleLogin = () => {
      const userInput = (document.getElementById('login-username') as HTMLInputElement)?.value.trim() || '';
      const passInput = (document.getElementById('login-password') as HTMLInputElement)?.value || '';
      const feedbackEl = document.getElementById('login-feedback');

      if (!userInput) {
        if (feedbackEl) {
          feedbackEl.textContent = '⚠️ Please enter your survivor callsign.';
          feedbackEl.className = 'login-feedback error';
        }
        return;
      }
      if (!passInput) {
        if (feedbackEl) {
          feedbackEl.textContent = '⚠️ Please enter a passcode to protect your expedition profile.';
          feedbackEl.className = 'login-feedback error';
        }
        return;
      }

      try {
        const saved = SaveSystem.login(userInput, passInput);
        audioSystem.init();
        audioSystem.playUIClick();
        if (feedbackEl) {
          feedbackEl.textContent = '✓ Access granted! Loading expedition logs...';
          feedbackEl.className = 'login-feedback success';
        }
        setTimeout(() => {
          if (this.onLogin) this.onLogin(saved);
          this.renderTitleScreen(saved.unlockedLevel);
        }, 250);
      } catch (e: any) {
        if (feedbackEl) {
          feedbackEl.textContent = `❌ ${e.message || 'Login failed. Check credentials.'}`;
          feedbackEl.className = 'login-feedback error';
        }
      }
    };

    document.getElementById('btn-login-submit')?.addEventListener('click', handleLogin);
    document.getElementById('login-password')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleLogin();
    });
    document.getElementById('login-username')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const passEl = document.getElementById('login-password') as HTMLInputElement;
        if (passEl && !passEl.value) passEl.focus();
        else handleLogin();
      }
    });

    setTimeout(() => {
      const userEl = document.getElementById('login-username') as HTMLInputElement;
      const passEl = document.getElementById('login-password') as HTMLInputElement;
      if (userEl && userEl.value) {
        passEl?.focus();
      } else {
        userEl?.focus();
      }
    }, 100);
  }

  public renderTitleScreen(unlockedLevel: number) {
    const activeName = (SaveSystem.getCurrentUsername() || 'GUEST').toUpperCase();
    this.container.innerHTML = `
      <div class="screen-overlay title-screen">
        <div class="title-content">
          <div class="badge-tag">2D CO-OP MULTIPLAYER SURVIVAL</div>
          <h1 class="main-title">ISLAND SURVIVAL</h1>
          <p class="subtitle">Stranded after disaster. Gather resources, craft tools, build shelter, and signal for rescue.</p>

          <div class="survivor-profile-bar">
            <div class="profile-info">
              <span class="profile-icon">👤</span>
              <span class="profile-name">CALLSIGN: <strong>${activeName}</strong></span>
              <span class="profile-level-badge">SECTOR: LVL ${unlockedLevel} / 10</span>
            </div>
            <button class="btn btn-sm btn-logout" id="btn-logout-profile">SWITCH / LOGOUT</button>
          </div>

          <div class="menu-button-group">
            <button class="btn btn-primary" id="btn-play">▶ PLAY EXPEDITION (LEVEL ${unlockedLevel})</button>
            <button class="btn btn-secondary" id="btn-lobby">👥 MULTIPLAYER LOBBY</button>
            <button class="btn btn-secondary" id="btn-howtoplay">📖 SURVIVAL GUIDE</button>
            <button class="btn btn-secondary" id="btn-settings">⚙️ SETTINGS</button>
            <button class="btn btn-secondary" id="btn-credits">ℹ️ CREDITS</button>
          </div>

          <div class="title-footer">
            <span>Progress: Level ${unlockedLevel} of 10 Unlocked</span>
            <span>Realistic Survival • No Supernatural Enemies • 2–4 Players</span>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-play')?.addEventListener('click', () => {
      audioSystem.init();
      audioSystem.playUIClick();
      this.renderCharacterSelect(unlockedLevel);
    });

    document.getElementById('btn-lobby')?.addEventListener('click', () => {
      audioSystem.init();
      audioSystem.playUIClick();
      this.renderMultiplayerLobby(unlockedLevel);
    });

    document.getElementById('btn-howtoplay')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.renderHowToPlay();
    });

    document.getElementById('btn-settings')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.renderSettingsModal(this.mobileControls);
    });

    document.getElementById('btn-credits')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.renderCredits();
    });

    document.getElementById('btn-logout-profile')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      SaveSystem.logout();
      if (this.onLogout) this.onLogout();
      this.renderLogin();
    });
  }

  public renderCharacterSelect(unlockedLevel: number) {
    let selectedClass = 'jack';
    let selectedLvl = unlockedLevel;

    const render = () => {
      this.container.innerHTML = `
        <div class="screen-overlay modal-backdrop">
          <div class="modal-card select-modal">
            <div class="modal-header">
              <h2>CHOOSE YOUR SURVIVOR</h2>
              <button class="btn-close" id="btn-back-title">✕</button>
            </div>
            
            <div class="char-grid">
              ${CHARACTER_CLASSES.map(c => `
                <div class="char-card ${c.id === selectedClass ? 'active' : ''}" data-char="${c.id}">
                  <div class="char-avatar" style="background:${c.bodyColor}; border-color:${c.accentColor};">
                    <span class="avatar-sym">${c.id === 'jack' ? '🪓' : c.id === 'elena' ? '💉' : c.id === 'leo' ? '🧭' : '🛠️'}</span>
                  </div>
                  <h3>${c.name}</h3>
                  <div class="char-title" style="color:${c.accentColor}">${c.title}</div>
                  <p class="char-desc">${c.description}</p>
                  <div class="char-trait"><strong>Trait:</strong> ${c.traitDescription}</div>
                </div>
              `).join('')}
            </div>

            <div class="level-select-row">
              <label>Select Level (1 to ${unlockedLevel}):</label>
              <select id="select-level-dropdown" class="input-select">
                ${Array.from({ length: unlockedLevel }, (_, i) => i + 1).map(lvl => `
                  <option value="${lvl}" ${lvl === selectedLvl ? 'selected' : ''}>Level ${lvl} ${this.getLevelShortName(lvl)}</option>
                `).join('')}
              </select>
            </div>

            <div class="modal-footer">
              <button class="btn btn-secondary" id="btn-cancel-select">BACK</button>
              <button class="btn btn-primary" id="btn-launch-game">START EXPEDITION ▶</button>
            </div>
          </div>
        </div>
      `;

      this.container.querySelectorAll('.char-card').forEach(el => {
        el.addEventListener('click', () => {
          selectedClass = el.getAttribute('data-char') || 'jack';
          audioSystem.playUIClick();
          render();
        });
      });

      const lvlSelect = document.getElementById('select-level-dropdown') as HTMLSelectElement;
      if (lvlSelect) {
        lvlSelect.addEventListener('change', () => {
          selectedLvl = parseInt(lvlSelect.value, 10);
        });
      }

      document.getElementById('btn-back-title')?.addEventListener('click', () => this.renderTitleScreen(unlockedLevel));
      document.getElementById('btn-cancel-select')?.addEventListener('click', () => this.renderTitleScreen(unlockedLevel));
      document.getElementById('btn-launch-game')?.addEventListener('click', () => {
        audioSystem.playUIClick();
        this.clear();
        this.onStartGame(selectedClass, selectedLvl, 3, 'ISLAND-1');
      });
    };

    render();
  }

  private getLevelShortName(lvl: number): string {
    const names = [
      'Beach Camp', 'Coastal Forest', 'Deep Forest', 'Caverns',
      'River Valley', 'Mountain Peak', 'Ruins', 'Storm Island',
      'Facility', 'Final Escape'
    ];
    return `— ${names[lvl - 1] || ''}`;
  }

  public renderMultiplayerLobby(unlockedLevel: number) {
    const roomCode = 'SURVIVE-' + Math.floor(1000 + Math.random() * 9000);
    let myClass = 'jack';
    const p2Status = 'AI Companion (Leo)';
    const p3Status = 'AI Companion (Elena)';
    const p4Status = 'AI Companion (Maya)';

    const render = () => {
      this.container.innerHTML = `
        <div class="screen-overlay modal-backdrop">
          <div class="modal-card lobby-modal">
            <div class="modal-header">
              <h2>CO-OP MULTIPLAYER EXPEDITION LOBBY</h2>
              <button class="btn-close" id="btn-lobby-back">✕</button>
            </div>

            <div class="room-code-banner">
              <span>ROOM CODE: <strong>${roomCode}</strong></span>
              <span class="room-mode-tag">BroadcastChannel / WebRTC Ready</span>
            </div>

            <div class="lobby-players-list">
              <div class="lobby-player-row host">
                <div class="p-num">P1 (HOST)</div>
                <div class="p-name">You (Leader)</div>
                <select id="lobby-char-p1" class="input-select">
                  ${CHARACTER_CLASSES.map(c => `
                    <option value="${c.id}" ${c.id === myClass ? 'selected' : ''}>${c.name} (${c.title})</option>
                  `).join('')}
                </select>
                <span class="ready-badge ready">READY ✅</span>
              </div>

              <div class="lobby-player-row">
                <div class="p-num">P2</div>
                <div class="p-name">${p2Status}</div>
                <span class="ready-badge ready">ASSISTING BOT ✅</span>
              </div>

              <div class="lobby-player-row">
                <div class="p-num">P3</div>
                <div class="p-name">${p3Status}</div>
                <span class="ready-badge ready">ASSISTING BOT ✅</span>
              </div>

              <div class="lobby-player-row">
                <div class="p-num">P4</div>
                <div class="p-name">${p4Status}</div>
                <span class="ready-badge ready">ASSISTING BOT ✅</span>
              </div>
            </div>

            <p class="lobby-note">
              💡 Open another browser window or tab with this same URL to join the room via real-time BroadcastChannel sync!
            </p>

            <div class="modal-footer">
              <button class="btn btn-secondary" id="btn-lobby-exit">BACK</button>
              <button class="btn btn-primary" id="btn-start-lobby-game">LAUNCH EXPEDITION ▶</button>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-lobby-back')?.addEventListener('click', () => this.renderTitleScreen(unlockedLevel));
      document.getElementById('btn-lobby-exit')?.addEventListener('click', () => this.renderTitleScreen(unlockedLevel));

      const charSelect = document.getElementById('lobby-char-p1') as HTMLSelectElement;
      if (charSelect) {
        charSelect.addEventListener('change', () => {
          myClass = charSelect.value;
        });
      }

      document.getElementById('btn-start-lobby-game')?.addEventListener('click', () => {
        audioSystem.playUIClick();
        this.clear();
        this.onStartGame(myClass, 1, 3, roomCode);
      });
    };

    render();
  }

  public renderLoadingScreen(levelDef: LevelDefinition, onComplete: () => void) {
    this.container.innerHTML = `
      <div class="screen-overlay loading-screen">
        <div class="loading-box">
          <div class="loading-compass">🧭</div>
          <h2>ISLAND SURVIVAL</h2>
          <h3 class="loading-level-title">${levelDef.name}: ${levelDef.subtitle}</h3>
          <p class="loading-desc">${levelDef.description}</p>
          
          <div class="loading-bar-container">
            <div class="loading-bar-fill" id="load-progress"></div>
          </div>

          <div class="survival-tip-box">
            <strong>SURVIVAL TIP:</strong>
            <span>"${levelDef.tip}"</span>
          </div>
        </div>
      </div>
    `;

    const bar = document.getElementById('load-progress');
    let p = 0;
    const interval = window.setInterval(() => {
      p += 20;
      if (bar) bar.style.width = `${p}%`;
      if (p >= 100) {
        window.clearInterval(interval);
        setTimeout(() => {
          this.clear();
          onComplete();
        }, 300);
      }
    }, 150);
  }

  public renderInventoryAndCrafting(
    player: Player,
    onCraft: (recipe: CraftingRecipe) => void,
    onUseItem: (itemId: string) => void,
    onDropSlot: (slotIdx: number) => void
  ) {
    let currentTab: 'SURVIVAL' | 'TOOLS' | 'EQUIPMENT' | 'ADVANCED' = 'SURVIVAL';
    let selectedRecipeId: string = CRAFTING_RECIPES[0].id;
    let mobileViewSection: 'BACKPACK' | 'CRAFTING' = 'BACKPACK';

    const render = () => {
      const selectedRecipe = CRAFTING_RECIPES.find(r => r.id === selectedRecipeId) || CRAFTING_RECIPES[0];
      const canCraft = CraftingSystem.canCraft(selectedRecipe, player.inventory);

      const selectedStack = this.selectedInventorySlot !== null ? player.inventory.slots[this.selectedInventorySlot] : null;
      const selectedItemDef = selectedStack ? ITEM_DEFINITIONS[selectedStack.itemId] : null;

      this.container.innerHTML = `
        <div class="screen-overlay modal-backdrop" id="inv-modal-backdrop">
          <div class="modal-card dual-panel-modal">
            <div class="modal-header">
              <h2>INVENTORY & FIELD CRAFTING</h2>
              <button class="btn-close" id="btn-close-inv" aria-label="Close">✕</button>
            </div>

            <!-- Mobile View Switcher Tabs -->
            <div class="mobile-dual-switcher">
              <button class="switcher-btn ${mobileViewSection === 'BACKPACK' ? 'active' : ''}" id="switch-to-backpack">🎒 BACKPACK</button>
              <button class="switcher-btn ${mobileViewSection === 'CRAFTING' ? 'active' : ''}" id="switch-to-crafting">⚒️ CRAFTING</button>
            </div>

            <div class="dual-body ${mobileViewSection === 'CRAFTING' ? 'show-crafting-mobile' : 'show-backpack-mobile'}">
              <div class="panel-section inv-section">
                <div class="section-title-bar">
                  <h3>SURVIVOR BACKPACK</h3>
                  <span class="weight-badge">Weight: ${player.inventory.getTotalWeight()} / ${player.inventory.maxWeight} kg</span>
                </div>

                <div class="inv-grid">
                  ${player.inventory.slots.map((slot, idx) => {
                    const isSelected = this.selectedInventorySlot === idx;
                    if (!slot) {
                      return `<div class="inv-slot empty ${isSelected ? 'selected' : ''}" data-slot="${idx}"></div>`;
                    }
                    const def = ITEM_DEFINITIONS[slot.itemId];
                    return `
                      <div class="inv-slot occupied ${isSelected ? 'selected' : ''}" data-slot="${idx}">
                        <span class="slot-icon">${def ? def.iconSymbol : '📦'}</span>
                        ${slot.quantity > 1 ? `<span class="slot-count">${slot.quantity}</span>` : ''}
                      </div>
                    `;
                  }).join('')}
                </div>

                <div class="item-detail-card">
                  ${selectedItemDef && selectedStack ? `
                    <div class="detail-header">
                      <span class="detail-icon">${selectedItemDef.iconSymbol}</span>
                      <div>
                        <h4>${selectedItemDef.name} (x${selectedStack.quantity})</h4>
                        <span class="detail-cat">${selectedItemDef.category} • ${selectedItemDef.weight * selectedStack.quantity} kg</span>
                      </div>
                    </div>
                    <p class="detail-desc">${selectedItemDef.description}</p>
                    <div class="detail-actions">
                      ${(selectedItemDef.category === 'FOOD' || selectedItemDef.category === 'WATER' || selectedItemDef.id === 'herbs') ? `
                        <button class="btn btn-sm btn-primary" id="btn-use-item">USE / CONSUME</button>
                      ` : ''}
                      <button class="btn btn-sm btn-danger" id="btn-drop-item">DROP ON GROUND</button>
                    </div>
                  ` : `
                    <div class="no-selection">Tap an item to inspect, consume, or drop.</div>
                  `}
                </div>
              </div>

              <div class="panel-section craft-section">
                <div class="section-title-bar">
                  <h3>CRAFTING BENCH</h3>
                </div>

                <div class="craft-tabs">
                  ${(['SURVIVAL', 'TOOLS', 'EQUIPMENT', 'ADVANCED'] as const).map(tab => `
                    <button class="tab-btn ${currentTab === tab ? 'active' : ''}" data-tab="${tab}">${tab}</button>
                  `).join('')}
                </div>

                <div class="recipes-list">
                  ${CRAFTING_RECIPES.filter(r => r.category === currentTab).map(recipe => {
                    const isSel = recipe.id === selectedRecipeId;
                    const cCraft = CraftingSystem.canCraft(recipe, player.inventory);
                    return `
                      <div class="recipe-row ${isSel ? 'selected' : ''} ${cCraft ? 'craftable' : 'locked'}" data-recipe="${recipe.id}">
                        <span class="recipe-name">${recipe.name}</span>
                        <span class="recipe-tag ${cCraft ? 'ready' : 'missing'}">${cCraft ? 'READY' : 'NEEDS MATERIALS'}</span>
                      </div>
                    `;
                  }).join('')}
                </div>

                <div class="recipe-detail-box">
                  <h4>${selectedRecipe.name}</h4>
                  <p class="recipe-desc">${selectedRecipe.description}</p>
                  
                  <div class="ingredients-list">
                    <strong>REQUIRED RESOURCES:</strong>
                    ${selectedRecipe.ingredients.map(ing => {
                      const have = player.inventory.getItemCount(ing.itemId);
                      const def = ITEM_DEFINITIONS[ing.itemId];
                      const isOk = have >= ing.quantity;
                      return `
                        <div class="ing-row ${isOk ? 'ok' : 'missing'}">
                          <span>${def ? def.iconSymbol : ''} ${def ? def.name : ing.itemId}: ${have} / ${ing.quantity}</span>
                          <span>${isOk ? '✓' : '✗ MISSING'}</span>
                        </div>
                      `;
                    }).join('')}
                  </div>

                  <button class="btn ${canCraft ? 'btn-primary' : 'btn-disabled'}" id="btn-craft-action" ${!canCraft ? 'disabled' : ''}>
                    ⚒️ CRAFT ${selectedRecipe.name.toUpperCase()}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.getElementById('btn-close-inv')?.addEventListener('click', () => this.clear());
      
      document.getElementById('switch-to-backpack')?.addEventListener('click', () => {
        mobileViewSection = 'BACKPACK';
        audioSystem.playUIClick();
        render();
      });

      document.getElementById('switch-to-crafting')?.addEventListener('click', () => {
        mobileViewSection = 'CRAFTING';
        audioSystem.playUIClick();
        render();
      });

      this.container.querySelectorAll('.inv-slot').forEach(el => {
        el.addEventListener('click', () => {
          const slotIdx = parseInt(el.getAttribute('data-slot') || '0', 10);
          this.selectedInventorySlot = slotIdx;
          audioSystem.playUIClick();
          render();
        });
      });

      this.container.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          currentTab = (btn.getAttribute('data-tab') as any) || 'SURVIVAL';
          const firstInTab = CRAFTING_RECIPES.find(r => r.category === currentTab);
          if (firstInTab) selectedRecipeId = firstInTab.id;
          audioSystem.playUIClick();
          render();
        });
      });

      this.container.querySelectorAll('.recipe-row').forEach(el => {
        el.addEventListener('click', () => {
          selectedRecipeId = el.getAttribute('data-recipe') || '';
          audioSystem.playUIClick();
          render();
        });
      });

      document.getElementById('btn-use-item')?.addEventListener('click', () => {
        if (selectedItemDef) {
          onUseItem(selectedItemDef.id);
          render();
        }
      });

      document.getElementById('btn-drop-item')?.addEventListener('click', () => {
        if (this.selectedInventorySlot !== null) {
          onDropSlot(this.selectedInventorySlot);
          this.selectedInventorySlot = null;
          render();
        }
      });

      document.getElementById('btn-craft-action')?.addEventListener('click', () => {
        if (canCraft) {
          onCraft(selectedRecipe);
          render();
        }
      });
    };

    render();
  }

  public renderBuildWheel(
    player: Player,
    onChooseStructure: (defId: string) => void
  ) {
    const list = Object.values(BUILDING_DEFINITIONS);

    this.container.innerHTML = `
      <div class="screen-overlay modal-backdrop" id="build-wheel-backdrop">
        <div class="modal-card build-modal">
          <div class="modal-header">
            <h2>FIELD CONSTRUCTION BLUEPRINTS</h2>
            <button class="btn-close" id="btn-close-build">✕</button>
          </div>

          <div class="build-grid">
            ${list.map(b => {
              const canBuild = BuildingSystemCanBuild(b, player.inventory);
              return `
                <div class="build-card ${canBuild ? 'available' : 'unavailable'}" data-build="${b.id}">
                  <div class="build-color-box" style="background:${b.color}"></div>
                  <h4>${b.name}</h4>
                  <p class="b-desc">${b.description}</p>
                  <div class="b-cost">
                    ${b.ingredients.map(ing => {
                      const def = ITEM_DEFINITIONS[ing.itemId];
                      const have = player.inventory.getItemCount(ing.itemId);
                      const isOk = have >= ing.quantity;
                      return `<span class="${isOk ? 'cost-ok' : 'cost-missing'}">${def ? def.name : ing.itemId}: ${have}/${ing.quantity}</span>`;
                    }).join(' • ')}
                  </div>
                  <button class="btn btn-sm ${canBuild ? 'btn-primary' : 'btn-disabled'}" ${!canBuild ? 'disabled' : ''}>
                    ${canBuild ? 'SELECT BLUEPRINT' : 'LACKING RESOURCES'}
                  </button>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-build')?.addEventListener('click', () => this.clear());

    this.container.querySelectorAll('.build-card.available').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.getAttribute('data-build');
        if (id) {
          audioSystem.playUIClick();
          this.activeBuildingGhost = id;
          this.clear();
          onChooseStructure(id);
        }
      });
    });
  }

  public renderLevelCompleteScreen(
    levelNum: number,
    survivorsCount: number,
    resourcesCount: number,
    timeSeconds: number,
    onContinue: () => void,
    onReturnToMenu?: () => void
  ) {
    const mins = Math.floor(timeSeconds / 60);
    const secs = Math.floor(timeSeconds % 60);

    this.container.innerHTML = `
      <div class="screen-overlay modal-backdrop victory-overlay">
        <div class="modal-card completion-card">
          <div class="win-banner">★ AREA SECURED ★</div>
          <h2>LEVEL ${levelNum} COMPLETE</h2>
          <p class="congrats-text">All primary objectives completed and team extracted to safety!</p>

          <div class="stats-summary-grid">
            <div class="stat-box">
              <span class="stat-label">SURVIVORS RESCUED</span>
              <span class="stat-val">${survivorsCount} / 4</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">EXPEDITION TIME</span>
              <span class="stat-val">${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}</span>
            </div>
            <div class="stat-box">
              <span class="stat-label">RESOURCES SECURED</span>
              <span class="stat-val">${resourcesCount} UNITS</span>
            </div>
          </div>

          <div class="modal-footer center level-complete-btns">
            <button class="btn btn-primary btn-large" id="btn-next-level">PROCEED TO LEVEL ${levelNum + 1} ▶</button>
            <button class="btn btn-secondary btn-large" id="btn-finish-menu">RETURN TO EXPEDITION HUB</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-next-level')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onContinue();
    });

    document.getElementById('btn-finish-menu')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      if (onReturnToMenu) onReturnToMenu();
      else this.renderTitleScreen(SaveSystem.load().unlockedLevel);
    });
  }

  public renderFinalVictoryScreen(
    totalTime: number,
    totalResources: number,
    onPlayAgain: () => void,
    onMainMenu: () => void
  ) {
    const mins = Math.floor(totalTime / 60);
    const secs = Math.floor(totalTime % 60);

    this.container.innerHTML = `
      <div class="screen-overlay victory-screen">
        <div class="victory-box">
          <div class="heli-badge">🚁 EXTRACTION COMPLETE</div>
          <h1 class="victory-title">ISLAND ESCAPED</h1>
          <p class="victory-subtitle">The helicopter has airlifted your squad across the sea. You survived the island against all odds.</p>

          <div class="final-stats-table">
            <div class="f-stat-row"><span>LEVELS CONQUERED:</span><strong>10 / 10</strong></div>
            <div class="f-stat-row"><span>ALL SQUAD RESCUED:</span><strong>4 / 4 SURVIVORS</strong></div>
            <div class="f-stat-row"><span>TOTAL SURVIVAL TIME:</span><strong>${mins}m ${secs}s</strong></div>
            <div class="f-stat-row"><span>TOTAL RESOURCES HARVESTED:</span><strong>${totalResources}</strong></div>
          </div>

          <div class="victory-buttons">
            <button class="btn btn-primary btn-large" id="btn-victory-again">PLAY AGAIN</button>
            <button class="btn btn-secondary" id="btn-victory-menu">MAIN MENU</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-victory-again')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onPlayAgain();
    });

    document.getElementById('btn-victory-menu')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onMainMenu();
    });
  }

  public renderGameOverScreen(onRetry: () => void, onMenu: () => void) {
    this.container.innerHTML = `
      <div class="screen-overlay game-over-screen">
        <div class="game-over-box">
          <h2>EXPEDITION LOST</h2>
          <p>All survivors were incapacitated by environmental hazards or starvation.</p>
          <div class="modal-footer center">
            <button class="btn btn-primary" id="btn-retry-level">RETRY LEVEL</button>
            <button class="btn btn-secondary" id="btn-over-menu">MAIN MENU</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-retry-level')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onRetry();
    });

    document.getElementById('btn-over-menu')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onMenu();
    });
  }

  public renderSettingsModal(mobileControls?: any) {
    const touchSettings = mobileControls?.settings || {
      joystickSize: 'medium',
      opacity: 0.85,
      leftHanded: false,
      haptics: true
    };

    this.container.innerHTML = `
      <div class="screen-overlay modal-backdrop">
        <div class="modal-card settings-modal">
          <div class="modal-header">
            <h2>SETTINGS & PREFERENCES</h2>
            <button class="btn-close" id="btn-close-settings" aria-label="Close">✕</button>
          </div>

          <div class="settings-rows">
            <h3 class="settings-section-title">🔊 AUDIO SETTINGS</h3>
            <div class="setting-row">
              <label>Master Volume:</label>
              <input type="range" id="vol-master" min="0" max="1" step="0.05" value="0.8">
            </div>
            <div class="setting-row">
              <label>Sound Effects (SFX):</label>
              <input type="range" id="vol-sfx" min="0" max="1" step="0.05" value="0.8">
            </div>
            <div class="setting-row">
              <label>Atmospheric Music:</label>
              <input type="range" id="vol-music" min="0" max="1" step="0.05" value="0.5">
            </div>
            <div class="setting-row">
              <label>Mute All Audio:</label>
              <button class="btn btn-sm btn-secondary" id="btn-toggle-mute">Toggle Mute</button>
            </div>

            <h3 class="settings-section-title" style="margin-top: 14px;">📱 TOUCH & MOBILE CONTROLS</h3>
            <div class="setting-row">
              <label>Joystick Size:</label>
              <select id="setting-joy-size" class="input-select">
                <option value="small" ${touchSettings.joystickSize === 'small' ? 'selected' : ''}>Small (Compact)</option>
                <option value="medium" ${touchSettings.joystickSize === 'medium' ? 'selected' : ''}>Medium (Standard)</option>
                <option value="large" ${touchSettings.joystickSize === 'large' ? 'selected' : ''}>Large (Comfort)</option>
              </select>
            </div>
            <div class="setting-row">
              <label>Control Opacity:</label>
              <input type="range" id="setting-touch-opacity" min="0.3" max="1.0" step="0.05" value="${touchSettings.opacity}">
            </div>
            <div class="setting-row">
              <label>Left-Handed Mode:</label>
              <button class="btn btn-sm ${touchSettings.leftHanded ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-lefthanded">
                ${touchSettings.leftHanded ? 'ON (Flipped Controls)' : 'OFF (Standard)'}
              </button>
            </div>
            <div class="setting-row">
              <label>Haptic Feedback (Vibration):</label>
              <button class="btn btn-sm ${touchSettings.haptics ? 'btn-primary' : 'btn-secondary'}" id="btn-toggle-haptics">
                ${touchSettings.haptics ? 'ON ✅' : 'OFF ❌'}
              </button>
            </div>
          </div>

          <div class="controls-guide">
            <h4>CONTROLS QUICK REFERENCE</h4>
            <ul>
              <li><strong>WASD / Arrow Keys / Virtual Joystick</strong>: 8-Direction Movement</li>
              <li><strong>Left Shift / Sprint Button</strong>: Sprint (Uses Stamina)</li>
              <li><strong>E / Tap [USE]</strong>: Interact / Harvest / Drink / Revive Teammate</li>
              <li><strong>1 - 6 / Tap Hotbar Slots</strong>: Quick Hotbar Item Selection</li>
              <li><strong>Tab / I / Tap [BAG]</strong>: Open Inventory & Field Crafting</li>
              <li><strong>B / Tap [BUILD]</strong>: Open Building Placement Menu</li>
              <li><strong>Esc / Close Button</strong>: Close Modals / Pause</li>
            </ul>
          </div>

          <div class="modal-footer">
            <button class="btn btn-primary" id="btn-save-settings">DONE</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-settings')?.addEventListener('click', () => this.clear());
    document.getElementById('btn-save-settings')?.addEventListener('click', () => this.clear());
    document.getElementById('btn-toggle-mute')?.addEventListener('click', () => {
      audioSystem.toggleMute();
    });

    const m = document.getElementById('vol-master') as HTMLInputElement;
    const s = document.getElementById('vol-sfx') as HTMLInputElement;
    const mu = document.getElementById('vol-music') as HTMLInputElement;

    const updateVols = () => {
      if (m && s && mu) {
        audioSystem.setVolumes(parseFloat(m.value), parseFloat(s.value), parseFloat(mu.value), 0.6);
      }
    };

    m?.addEventListener('input', updateVols);
    s?.addEventListener('input', updateVols);
    mu?.addEventListener('input', updateVols);

    // Mobile controls bindings
    const joySelect = document.getElementById('setting-joy-size') as HTMLSelectElement;
    joySelect?.addEventListener('change', () => {
      mobileControls?.saveSettings({ joystickSize: joySelect.value as any });
      audioSystem.playUIClick();
    });

    const opSlider = document.getElementById('setting-touch-opacity') as HTMLInputElement;
    opSlider?.addEventListener('input', () => {
      mobileControls?.saveSettings({ opacity: parseFloat(opSlider.value) });
    });

    const leftBtn = document.getElementById('btn-toggle-lefthanded');
    leftBtn?.addEventListener('click', () => {
      if (mobileControls) {
        const next = !mobileControls.settings.leftHanded;
        mobileControls.saveSettings({ leftHanded: next });
        audioSystem.playUIClick();
        this.renderSettingsModal(mobileControls);
      }
    });

    const hapBtn = document.getElementById('btn-toggle-haptics');
    hapBtn?.addEventListener('click', () => {
      if (mobileControls) {
        const next = !mobileControls.settings.haptics;
        mobileControls.saveSettings({ haptics: next });
        if (next) mobileControls.triggerHaptic(25);
        audioSystem.playUIClick();
        this.renderSettingsModal(mobileControls);
      }
    });
  }

  public renderOrientationPrompt(onDismiss: () => void) {
    this.container.innerHTML = `
      <div class="screen-overlay mobile-rotate-overlay">
        <div class="rotate-card">
          <div class="rotate-anim-icon">🔄</div>
          <h2>LANDSCAPE RECOMMENDED</h2>
          <p>For the widest survival field of view and comfortable two-thumb controls, please rotate your device to landscape mode.</p>
          <div class="modal-footer center" style="flex-direction: column; gap: 8px;">
            <button class="btn btn-primary btn-large" id="btn-dismiss-rotate">PLAY IN PORTRAIT ANYWAY ▶</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-dismiss-rotate')?.addEventListener('click', () => {
      audioSystem.playUIClick();
      this.clear();
      onDismiss();
    });
  }

  public renderHowToPlay() {
    this.container.innerHTML = `
      <div class="screen-overlay modal-backdrop">
        <div class="modal-card how-modal">
          <div class="modal-header">
            <h2>HOW TO SURVIVE THE ISLAND</h2>
            <button class="btn-close" id="btn-close-how">✕</button>
          </div>
          <div class="how-body">
            <div class="how-step">
              <span class="step-num">1</span>
              <div>
                <h4>MANAGE HUNGER & THIRST</h4>
                <p>Thirst depletes faster than hunger. Harvest berries, crack open coconuts, and boil river water over a campfire to stay healthy.</p>
              </div>
            </div>
            <div class="how-step">
              <span class="step-num">2</span>
              <div>
                <h4>HARVEST & CRAFT TOOLS</h4>
                <p>Trees yield wood; boulders yield stone and metal. Craft a Stone Axe and Pickaxe to gather materials much faster.</p>
              </div>
            </div>
            <div class="how-step">
              <span class="step-num">3</span>
              <div>
                <h4>BUILD FOR PROTECTION</h4>
                <p>Press <strong>[B]</strong> to enter Build mode. Place Campfires to cook raw meat, and Shelters to survive rain and freezing mountain winds.</p>
              </div>
            </div>
            <div class="how-step">
              <span class="step-num">4</span>
              <div>
                <h4>COOPERATE & REVIVE TEAMMATES</h4>
                <p>If a player loses all health, they become DOWNED. Stand near them and hold <strong>[E]</strong> to revive them before their timer expires!</p>
              </div>
            </div>
            <div class="how-step">
              <span class="step-num">5</span>
              <div>
                <h4>COMPLETE OBJECTIVES & REACH EXTRACTION</h4>
                <p>Follow the objective tracker at the top. Once all tasks are complete, the extraction beacon activates. Lead your squad to the exit zone to advance!</p>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="btn-how-done">GOT IT</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-how')?.addEventListener('click', () => this.clear());
    document.getElementById('btn-how-done')?.addEventListener('click', () => this.clear());
  }

  public renderCredits() {
    this.container.innerHTML = `
      <div class="screen-overlay modal-backdrop">
        <div class="modal-card how-modal">
          <div class="modal-header">
            <h2>CREDITS</h2>
            <button class="btn-close" id="btn-close-cred">✕</button>
          </div>
          <div class="how-body" style="text-align:center; padding: 20px 0;">
            <h3 style="color:#ffb300">ISLAND SURVIVAL</h3>
            <p style="color:#b0bec5">A Polish 2D Top-Down Multiplayer Survival Indie Game</p>
            <p>Designed with procedural Canvas 2D graphics, dynamic 24h lighting, particle engines, Web Audio sound synthesis, and real-time co-op multiplayer systems.</p>
            <p style="margin-top:20px; color:#81c784">Thank you for playing!</p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" id="btn-cred-done">CLOSE</button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-close-cred')?.addEventListener('click', () => this.clear());
    document.getElementById('btn-cred-done')?.addEventListener('click', () => this.clear());
  }

  public clear() {
    this.container.innerHTML = '';
  }
}

function BuildingSystemCanBuild(def: BuildingDef, inventory: any): boolean {
  for (const ing of def.ingredients) {
    if (inventory.getItemCount(ing.itemId) < ing.quantity) return false;
  }
  return true;
}

export const domOverlay = new DOMOverlay();

