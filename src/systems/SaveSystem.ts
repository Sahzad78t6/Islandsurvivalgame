// LocalStorage Save and Progress Persistence System

export interface SaveData {
  unlockedLevel: number;
  currentLevel: number;
  totalSurvivalTime: number; // in seconds
  totalResourcesGathered: number;
  settings: {
    masterVolume: number;
    sfxVolume: number;
    musicVolume: number;
    reducedEffects: boolean;
  };
  highScores: {
    levelNumber: number;
    bestTime: number;
    survivorsSaved: number;
  }[];
  // Authentication fields
  username: string;
  password: string;
  // Optional last selected character class
  lastCharClassId: string;
}

const SAVE_KEY = 'ISLAND_SURVIVAL_SAVE_V1';
const ACCOUNTS_KEY = 'ISLAND_SURVIVAL_ACCOUNTS_V1';
const CURRENT_USER_KEY = 'ISLAND_SURVIVAL_CURRENT_USER_V1';

export class SaveSystem {
  public static getDefaultSave(username: string = ''): SaveData {
    return {
      unlockedLevel: 1,
      currentLevel: 1,
      totalSurvivalTime: 0,
      totalResourcesGathered: 0,
      settings: {
        masterVolume: 0.8,
        sfxVolume: 0.8,
        musicVolume: 0.5,
        reducedEffects: false,
      },
      highScores: [],
      username: username,
      password: '',
      lastCharClassId: 'jack',
    };
  }

  public static getAllAccounts(): Record<string, SaveData> {
    try {
      const raw = localStorage.getItem(ACCOUNTS_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
      const oldRaw = localStorage.getItem(SAVE_KEY);
      if (oldRaw) {
        const oldSave = JSON.parse(oldRaw);
        if (oldSave && oldSave.username) {
          const accounts: Record<string, SaveData> = { [oldSave.username.toLowerCase()]: oldSave };
          localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
          return accounts;
        }
      }
    } catch (e) {
      console.warn('Failed to parse accounts:', e);
    }
    return {};
  }

  public static saveAllAccounts(accounts: Record<string, SaveData>) {
    try {
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch (e) {
      console.warn('Failed to save accounts:', e);
    }
  }

  public static getCurrentUsername(): string {
    try {
      return localStorage.getItem(CURRENT_USER_KEY) || '';
    } catch {
      return '';
    }
  }

  public static setCurrentUsername(username: string) {
    try {
      if (username) {
        localStorage.setItem(CURRENT_USER_KEY, username);
      } else {
        localStorage.removeItem(CURRENT_USER_KEY);
      }
    } catch (e) {
      console.warn(e);
    }
  }

  public static logout() {
    this.setCurrentUsername('');
  }

  public static load(): SaveData {
    const currentUser = this.getCurrentUsername().toLowerCase();
    const accounts = this.getAllAccounts();
    if (currentUser && accounts[currentUser]) {
      return { ...this.getDefaultSave(currentUser), ...accounts[currentUser] };
    }

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        return { ...this.getDefaultSave(), ...JSON.parse(raw) };
      }
    } catch (e) {
      console.warn('Failed to load save from localStorage:', e);
    }
    return this.getDefaultSave();
  }

  public static save(data: SaveData) {
    const key = (data.username || this.getCurrentUsername()).trim().toLowerCase();
    if (key) {
      const accounts = this.getAllAccounts();
      accounts[key] = { ...data };
      this.saveAllAccounts(accounts);
    }

    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('Failed to write save to localStorage:', e);
    }
  }

  public static login(username: string, password: string): SaveData {
    const cleanUser = username.trim();
    if (!cleanUser) throw new Error('Please enter a survivor callsign (username).');
    if (!password) throw new Error('Please enter your account password.');

    const key = cleanUser.toLowerCase();
    const accounts = this.getAllAccounts();

    if (accounts[key]) {
      if (accounts[key].password && accounts[key].password !== password) {
        throw new Error('Incorrect password. Please verify and try again.');
      }
      this.setCurrentUsername(cleanUser);
      if (!accounts[key].unlockedLevel || accounts[key].unlockedLevel < 1) {
        accounts[key].unlockedLevel = 1;
      }
      this.save(accounts[key]);
      return accounts[key];
    } else {
      const newSave: SaveData = {
        ...this.getDefaultSave(cleanUser),
        password: password,
      };
      accounts[key] = newSave;
      this.saveAllAccounts(accounts);
      this.setCurrentUsername(cleanUser);
      this.save(newSave);
      return newSave;
    }
  }

  public static unlockNextLevel(completedLevelNumber: number) {
    const data = this.load();
    if (completedLevelNumber >= data.unlockedLevel && data.unlockedLevel < 10) {
      data.unlockedLevel = completedLevelNumber + 1;
      data.currentLevel = data.unlockedLevel;
      this.save(data);
    }
  }

  public static recordLevelCompletion(levelNum: number, time: number, survivors: number, resources: number) {
    const data = this.load();
    data.totalSurvivalTime += time;
    data.totalResourcesGathered += resources;

    const existingIndex = data.highScores.findIndex(h => h.levelNumber === levelNum);
    if (existingIndex >= 0) {
      if (time < data.highScores[existingIndex].bestTime) {
        data.highScores[existingIndex].bestTime = time;
      }
      data.highScores[existingIndex].survivorsSaved = Math.max(data.highScores[existingIndex].survivorsSaved, survivors);
    } else {
      data.highScores.push({ levelNumber: levelNum, bestTime: time, survivorsSaved: survivors });
    }
    this.save(data);
  }

  public static resetProgress() {
    try {
      const current = this.getCurrentUsername().toLowerCase();
      if (current) {
        const accounts = this.getAllAccounts();
        delete accounts[current];
        this.saveAllAccounts(accounts);
      }
      localStorage.removeItem(SAVE_KEY);
      localStorage.removeItem(CURRENT_USER_KEY);
    } catch (e) {
      console.warn(e);
    }
  }
}
