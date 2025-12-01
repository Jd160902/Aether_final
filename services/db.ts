import type { User, ReflectionEntry, Aspiration, Goal, UserSettings, AiPersona, Mood } from '../types';

const DB_KEY = 'aether_db';

interface Database {
  users: Record<string, Omit<User, 'email'> & { password: string }>; // email is the key
  userData: Record<string, {
    reflectionEntries: ReflectionEntry[];
    aspirations: Aspiration[];
    goals: Goal[];
    hasOnboarded: boolean;
    settings: UserSettings;
  }>;
}

// --- Helper Functions ---

const readDb = (): Database => {
  try {
    const dbString = localStorage.getItem(DB_KEY);
    if (dbString) {
      return JSON.parse(dbString);
    }
  } catch (error) {
    console.error("Failed to read from localStorage", error);
  }
  // Default structure if DB is empty or corrupted
  return { users: {}, userData: {} };
};

const writeDb = (db: Database): void => {
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch (error) {
    console.error("Failed to write to localStorage", error);
  }
};

const generateSeedReflections = (): ReflectionEntry[] => {
  const reflections: ReflectionEntry[] = [];
  const today = new Date();

  // 10 distinct entries for the past 10 days.
  const seedEntries = [
    { text: "Today was really nice. I took a long walk and listened to my favorite music. Simple pleasures are the best.", mood: 'good' as Mood },
    { text: "I tried a new recipe for dinner and it turned out amazing! It feels so good to create something delicious.", mood: 'good' as Mood, analysis: "How wonderful! The satisfaction of creating something with your own hands, especially something that nourishes, is a unique and joyful experience. This sense of accomplishment and sensory pleasure can feel grounding and centering. It's a beautiful reminder of your own capability and creativity." },
    { text: "Another day, another dollar. Work was fine. The evening was quiet. Not much to report.", mood: 'meh' as Mood },
    { text: "Feeling a little anxious about the week ahead. There's a lot of uncertainty and it's making me uneasy.", mood: 'bad' as Mood, analysis: "Anxiety about the future is a very common experience. This uneasiness can feel like a knot in your stomach or a quickened heartbeat. Your body is in a state of alert. Try placing a hand on your heart and just feeling its rhythm for a moment. Remind yourself that in this exact moment, you are safe. Acknowledging the physical sensation without judgment can sometimes soften its intensity." },
    { text: "Had a great time with my family today. We just laughed and shared stories. It was simple but so fulfilling.", mood: 'rad' as Mood, analysis: "The warmth of family and shared laughter is such a powerful, uplifting force. It's wonderful that you're soaking in this fulfilling experience. This joy often translates into a physical sensation of openness in your chest or a smile that reaches your eyes. These moments are precious anchors that remind us of connection and love." },
    { text: "I'm exhausted. Too much to do and not enough time. I feel like I'm running on empty and can't seem to catch up.", mood: 'awful' as Mood, analysis: "Running on empty is an incredibly draining state, both mentally and physically. This feeling of being overwhelmed can manifest as heavy shoulders or a tense jaw. Your body is signaling a deep need for rest and replenishment. Please be kind to yourself. Acknowledging this exhaustion is the first step. Even a few moments of intentional stillness can be a small gift to your system." },
    { text: "Spent the afternoon reading in the park. The sun was warm and it was so peaceful. I feel recharged and content.", mood: 'good' as Mood, analysis: "What a beautiful way to recharge. Connecting with nature and enjoying a simple pleasure like reading in the sun can be deeply restorative. You might feel a sense of warmth not just from the sun, but radiating from within your chest. This feeling of contentment is a signal from your body that it's found a moment of safety and peace. It's a lovely state to be in." },
    { text: "Feeling a bit down. A conversation with a friend didn't go as I hoped and it's left me feeling misunderstood and a little lonely.", mood: 'bad' as Mood, analysis: "It's tough when conversations leave you feeling misunderstood; that sense of loneliness is a heavy weight. When we feel this way, it's common to notice a tightness in the throat or a hollow feeling in the stomach. Be gentle with yourself right now. It's okay to feel this way. Perhaps taking a few slow, deep breaths can offer your body a small anchor in this moment of emotional turbulence." },
    { text: "A pretty average day. Nothing special happened, but nothing bad either. Just went through the motions.", mood: 'meh' as Mood, analysis: "It's completely okay to have days that feel neutral, like you're simply moving through them. These 'meh' days can be a quiet space for your mind and body to rest without high highs or low lows. Sometimes, the body craves this simplicity. It's a chance to just 'be' without the pressure of feeling a certain way. Notice if there's a sense of stillness or quiet in your body today." },
    { text: "Felt really productive. Managed to finish a big project at work and still had energy for a run. It's a good feeling to be on top of things.", mood: 'rad' as Mood, analysis: "It sounds like you had a fantastic day filled with accomplishment and vitality. It's wonderful that you're recognizing this feeling of being 'on top of things.' This sense of efficacy can be a powerful source of positive energy. Physically, you might notice a feeling of lightness or expansiveness in your chest. Cherish this feeling of alignment between your efforts and your results." },
  ];

  for (let i = 1; i <= 10; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i); // i=1 is yesterday, i=10 is 10 days ago
    
    const entryData = seedEntries[i - 1];

    reflections.push({
      id: date.toISOString(),
      date: date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
      text: entryData.text,
      mood: entryData.mood,
      analysis: entryData.analysis,
    });
  }

  return reflections; // Already sorted newest (yesterday) to oldest
};

// --- Auth Functions ---

export const registerUser = async (email: string, password: string): Promise<User> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const db = readDb();
      const normalizedEmail = email.toLowerCase();

      if (db.users[normalizedEmail]) {
        return reject(new Error("An account with this email already exists."));
      }
      
      const userId = `user_${new Date().getTime()}`;
      db.users[normalizedEmail] = { id: userId, password };
      db.userData[userId] = {
        reflectionEntries: generateSeedReflections(),
        aspirations: [],
        goals: [],
        hasOnboarded: false, // New user has not been onboarded
        settings: {
          aiPersona: 'empathetic_companion', // Default persona
          customPersona: {
            name: 'My Custom Aether',
            description: 'A persona I created to help me on my journey.',
            prompts: {}, // Start with empty prompts, will fall back to default
          },
        },
      };
      
      writeDb(db);

      const newUser: User = { id: userId, email: normalizedEmail };
      resolve(newUser);
    }, 500);
  });
};

export const loginUser = async (email: string, password: string): Promise<User> => {
   return new Promise((resolve, reject) => {
    setTimeout(() => { // Simulate network delay
      const db = readDb();
      const normalizedEmail = email.toLowerCase();
      const userRecord = db.users[normalizedEmail];

      if (!userRecord || userRecord.password !== password) {
        return reject(new Error("Invalid email or password."));
      }
      
      const loggedInUser: User = { id: userRecord.id, email: normalizedEmail };
      resolve(loggedInUser);
    }, 500);
  });
};

// --- Onboarding Status ---
export const getUserOnboardingStatus = async (userId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const db = readDb();
    resolve(db.userData[userId]?.hasOnboarded || false);
  });
};

export const setUserOnboardingStatus = async (userId: string, status: boolean): Promise<void> => {
  return new Promise((resolve) => {
    const db = readDb();
    if (db.userData[userId]) {
      db.userData[userId].hasOnboarded = status;
      writeDb(db);
    }
    resolve();
  });
};

// --- User Settings ---
export const getUserSettings = async (userId: string): Promise<UserSettings> => {
  return new Promise((resolve) => {
    const db = readDb();
    const userSettings = db.userData[userId]?.settings;

    const defaultSettings: UserSettings = { 
      aiPersona: 'empathetic_companion',
      customPersona: {
        name: 'My Custom Aether',
        description: 'A persona I created.',
        prompts: {},
      }
    };

    if (userSettings) {
      // Simple migration: if customPersona doesn't exist, add it.
      if (!userSettings.customPersona) {
          userSettings.customPersona = defaultSettings.customPersona;
      }
      // @ts-ignore - To handle migration from old `customPersonaInstruction`
      delete userSettings.customPersonaInstruction; 
      resolve(userSettings);
    } else {
        resolve(defaultSettings);
    }
  });
};

export const saveUserSettings = async (userId: string, settings: UserSettings): Promise<void> => {
  return new Promise((resolve) => {
    const db = readDb();
    if (db.userData[userId]) {
      db.userData[userId].settings = settings;
      writeDb(db);
    }
    resolve();
  });
};


// --- Data Access Functions ---

const getUserData = async <T>(userId: string, key: 'reflectionEntries' | 'aspirations' | 'goals'): Promise<T[]> => {
  return new Promise((resolve) => {
    const db = readDb();
    const data = db.userData[userId]?.[key] || [];
    resolve(data as T[]);
  });
};

const saveUserData = async <T>(userId: string, key: 'reflectionEntries' | 'aspirations' | 'goals', data: T[]): Promise<void> => {
   return new Promise((resolve) => {
    const db = readDb();
    if (db.userData[userId]) {
      db.userData[userId][key] = data as any;
      writeDb(db);
    }
    resolve();
  });
};

// Reflections
export const getReflectionEntries = (userId: string): Promise<ReflectionEntry[]> => getUserData<ReflectionEntry>(userId, 'reflectionEntries');
export const saveReflectionEntries = (userId: string, entries: ReflectionEntry[]): Promise<void> => saveUserData<ReflectionEntry>(userId, 'reflectionEntries', entries);

// Aspirations
export const getAspirations = (userId: string): Promise<Aspiration[]> => getUserData<Aspiration>(userId, 'aspirations');
export const saveAspirations = (userId: string, aspirations: Aspiration[]): Promise<void> => saveUserData<Aspiration>(userId, 'aspirations', aspirations);

// Goals
export const getGoals = (userId: string): Promise<Goal[]> => getUserData<Goal>(userId, 'goals');
export const saveGoals = (userId: string, goals: Goal[]): Promise<void> => saveUserData<Goal>(userId, 'goals', goals);