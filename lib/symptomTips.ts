export type SymptomType = 
  // Symptoms
  | 'everything_fine'
  | 'cramps' 
  | 'tender_breasts'
  | 'headache'
  | 'acne'
  | 'backache'
  | 'fatigue'
  | 'cravings'
  | 'insomnia'
  | 'abdominal_pain'
  | 'vaginal_itching'
  | 'vaginal_dryness'
  | 'bloating'
  | 'nausea'
  | 'constipation'
  | 'diarrhea'
  // Vaginal Discharge
  | 'no_discharge'
  | 'creamy'
  | 'watery'
  | 'sticky'
  | 'egg_white'
  | 'spotting'
  | 'unusual'
  | 'clumpy_white'
  | 'gray'
  // Digestion and Stool
  | 'normal_stool'
  | 'hard_stool'
  | 'loose_stool'

export type MoodType = 
  | 'calm'
  | 'happy'
  | 'energetic'
  | 'frisky'
  | 'mood_swings'
  | 'irritated'
  | 'sad'
  | 'anxious'
  | 'depressed'
  | 'feeling_guilty'
  | 'obsessive_thoughts'
  | 'low_energy'
  | 'apathetic'
  | 'confused'
  | 'very_self_critical'

export interface SymptomTip {
  title: string
  emoji: string
  supportiveMessage: string
  tips: string[]
  deliveryAppLinks?: {
    app: string
    productName: string
    searchTerm: string
    deepLink?: string
  }[]
  reminderFrequency: 'hourly' | 'every_2_hours' | 'every_4_hours' | 'daily'
  encouragingNote: string
}

export const symptomData: Record<SymptomType, SymptomTip> = {
  everything_fine: {
    title: 'Everything is Fine',
    emoji: '👍',
    supportiveMessage: 'Great to hear you\'re feeling good! Keep taking care of yourself 💕',
    tips: [
      'Maintain a balanced diet',
      'Stay hydrated',
      'Get regular exercise',
      'Continue tracking your cycle',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'You\'re doing great! Keep listening to your body 🌸',
  },
  cramps: {
    title: 'Menstrual Cramps',
    emoji: '😣',
    supportiveMessage: 'I know cramps can be really uncomfortable. Let\'s take gentle care of yourself today 💕',
    tips: [
      'Apply a hot water bottle or heating pad to your lower abdomen - warmth can help relax those tight muscles',
      'Take a warm bath - the soothing water can ease the discomfort',
      'Gently massage your lower abdomen in slow circular motions',
      'Try some gentle stretches or a short walk - movement can help',
      'Stay hydrated and try warm herbal tea like chamomile',
      'Consider an over-the-counter pain relief (always check with a doctor if unsure)',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Hot Water Bottle',
        searchTerm: 'hot water bottle heating pad',
        deepLink: 'blinkit://search?q=hot water bottle',
      },
      {
        app: 'Swiggy Instamart',
        productName: 'Hot Water Bottle',
        searchTerm: 'hot water bottle',
        deepLink: 'swiggy://instamart/search?q=hot water bottle',
      },
      {
        app: 'Zepto',
        productName: 'Hot Water Bottle',
        searchTerm: 'hot water bottle',
        deepLink: 'zepto://search?q=hot water bottle',
      },
    ],
    reminderFrequency: 'every_4_hours',
    encouragingNote: 'Remember, this discomfort will pass. You\'re doing great by taking care of yourself 🌸',
  },
  tender_breasts: {
    title: 'Tender Breasts',
    emoji: '💔',
    supportiveMessage: 'This tenderness is temporary, but I know it can be uncomfortable. Let\'s take care 💗',
    tips: [
      'Wear a supportive, comfortable bra - consider a softer one if needed',
      'Apply a warm or cold compress for 15-20 minutes',
      'Try to reduce caffeine intake which can worsen tenderness',
      'Gentle massage with natural oils can help',
      'Consider reducing salt intake',
      'Loose, comfortable clothing can make a big difference',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body is going through natural changes. This discomfort is temporary 🌺',
  },
  headache: {
    title: 'Headache',
    emoji: '🤕',
    supportiveMessage: 'Headaches can make everything feel harder. Let\'s find some relief together 💜',
    tips: [
      'Rest in a quiet, dimly lit room if possible',
      'Apply a cold or warm compress to your forehead',
      'Stay hydrated - sometimes headaches are a sign we need more water',
      'Avoid bright lights and loud noises',
      'Try gentle neck and shoulder stretches',
      'A warm shower might help relax tension',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Pain Relief',
        searchTerm: 'paracetamol headache medicine',
        deepLink: 'blinkit://search?q=paracetamol',
      },
    ],
    reminderFrequency: 'every_4_hours',
    encouragingNote: 'Be gentle with yourself. Rest is not a luxury, it\'s necessary 🕯️',
  },
  acne: {
    title: 'Acne',
    emoji: '😤',
    supportiveMessage: 'Hormonal changes can cause breakouts - this is completely normal and temporary 💛',
    tips: [
      'Keep your skin clean but don\'t over-wash',
      'Use gentle, non-comedogenic products',
      'Avoid picking at blemishes',
      'Stay hydrated',
      'Consider talking to a dermatologist if it persists',
      'Be patient - hormonal acne often clears up',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your skin will balance out. Be gentle with yourself 🌿',
  },
  backache: {
    title: 'Back Pain',
    emoji: '🩹',
    supportiveMessage: 'Back pain can really drain your energy. Let\'s find ways to soothe it 💛',
    tips: [
      'Apply heat or a cold pack to the affected area',
      'Try gentle stretches - especially for your lower back',
      'Maintain good posture when sitting',
      'Use a pillow between your knees when sleeping on your side',
      'A warm bath with Epsom salts can work wonders',
      'Light walking can improve circulation and ease stiffness',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Epsom Salt',
        searchTerm: 'epsom salt',
        deepLink: 'blinkit://search?q=epsom salt',
      },
      {
        app: 'Swiggy Instamart',
        productName: 'Epsom Salt',
        searchTerm: 'epsom salt',
        deepLink: 'swiggy://instamart/search?q=epsom salt',
      },
    ],
    reminderFrequency: 'every_4_hours',
    encouragingNote: 'Your body deserves comfort. Take it easy and be kind to yourself 🌼',
  },
  fatigue: {
    title: 'Fatigue',
    emoji: '😴',
    supportiveMessage: 'Feeling tired is your body\'s way of asking for rest. Honor that need 💚',
    tips: [
      'Listen to your body - rest when you need to',
      'Short power naps (20-30 minutes) can help',
      'Stay hydrated and eat nutritious, balanced meals',
      'Avoid overexerting yourself - it\'s okay to slow down',
      'Gentle yoga or stretching can help boost energy',
      'Ensure you\'re getting enough iron-rich foods',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Resting is productive. You\'re doing exactly what your body needs right now ✨',
  },
  cravings: {
    title: 'Cravings',
    emoji: '🍔',
    supportiveMessage: 'Food cravings are a natural part of your cycle - it\'s okay to honor them in moderation 💙',
    tips: [
      'It\'s okay to satisfy cravings in moderation',
      'Try to balance cravings with nutritious foods',
      'Stay hydrated - sometimes we mistake thirst for hunger',
      'Get enough sleep - tiredness can increase cravings',
      'Consider healthy alternatives to your cravings',
      'Be gentle with yourself - it\'s normal!',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body knows what it needs. Listen to it with kindness 🌸',
  },
  insomnia: {
    title: 'Insomnia',
    emoji: '🌙',
    supportiveMessage: 'Trouble sleeping can make everything harder. Let\'s find ways to help you rest 💜',
    tips: [
      'Establish a relaxing bedtime routine',
      'Avoid screens an hour before bed',
      'Create a cool, dark, quiet sleep environment',
      'Try gentle breathing exercises or meditation',
      'Avoid caffeine and heavy meals before bedtime',
      'Consider herbal teas like chamomile or valerian',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Chamomile Tea',
        searchTerm: 'chamomile tea',
        deepLink: 'blinkit://search?q=chamomile tea',
      },
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Rest will come. Be patient and gentle with yourself 🌙',
  },
  abdominal_pain: {
    title: 'Abdominal Pain',
    emoji: '🤕',
    supportiveMessage: 'Abdominal discomfort can be challenging. Let\'s find some relief 💛',
    tips: [
      'Apply a heating pad to your abdomen',
      'Try gentle abdominal massage',
      'Stay hydrated',
      'Eat smaller, more frequent meals',
      'Avoid foods that trigger discomfort',
      'Consider over-the-counter remedies if appropriate',
    ],
    reminderFrequency: 'every_4_hours',
    encouragingNote: 'Your discomfort is valid. Take care of yourself 🌿',
  },
  vaginal_itching: {
    title: 'Vaginal Itching',
    emoji: '😔',
    supportiveMessage: 'This can be uncomfortable. Let\'s find some relief and comfort 💗',
    tips: [
      'Wear cotton underwear and avoid tight clothing',
      'Keep the area clean and dry',
      'Avoid scented products',
      'Consider seeing a healthcare provider if it persists',
      'Use gentle, fragrance-free cleansers',
      'Avoid scratching to prevent irritation',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Take care of yourself and don\'t hesitate to seek medical advice if needed 🌸',
  },
  vaginal_dryness: {
    title: 'Vaginal Dryness',
    emoji: '💧',
    supportiveMessage: 'This can be uncomfortable, but there are ways to help 💙',
    tips: [
      'Stay well hydrated',
      'Consider using a water-based lubricant if needed',
      'Avoid harsh soaps and products',
      'Talk to your healthcare provider about options',
      'Hormonal changes during your cycle can affect this',
      'Be gentle with yourself',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body changes are normal. You\'re taking good care of yourself 🌺',
  },
  bloating: {
    title: 'Bloating',
    emoji: '🤰',
    supportiveMessage: 'Bloating can feel really uncomfortable. Your body is just adjusting - this is normal 💙',
    tips: [
      'Drink plenty of water to help reduce water retention',
      'Try to avoid very salty foods and processed foods today',
      'Eat smaller, more frequent meals instead of large ones',
      'A gentle walk can help with digestion',
      'Avoid carbonated drinks which can make it worse',
      'Herbal teas like peppermint or chamomile can be soothing',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Herbal Tea',
        searchTerm: 'peppermint tea chamomile tea',
        deepLink: 'blinkit://search?q=peppermint tea',
      },
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body is working hard. Be patient and kind with yourself 🌿',
  },
  nausea: {
    title: 'Nausea',
    emoji: '🤢',
    supportiveMessage: 'Nausea can make everything feel harder. Let\'s find gentle ways to settle your stomach 💚',
    tips: [
      'Eat small, frequent meals throughout the day instead of large ones',
      'Ginger tea or ginger candies can really help settle your stomach',
      'Avoid strong smells and triggers if possible',
      'Stay hydrated with small sips of water',
      'Try bland foods like crackers or toast',
      'Rest and avoid sudden movements',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Ginger Tea',
        searchTerm: 'ginger tea',
        deepLink: 'blinkit://search?q=ginger tea',
      },
      {
        app: 'Swiggy Instamart',
        productName: 'Ginger Tea',
        searchTerm: 'ginger tea',
        deepLink: 'swiggy://instamart/search?q=ginger tea',
      },
    ],
    reminderFrequency: 'every_4_hours',
    encouragingNote: 'Take it slow. Your body is asking for gentle care right now 🍃',
  },
  constipation: {
    title: 'Constipation',
    emoji: '😖',
    supportiveMessage: 'This can be uncomfortable, but there are gentle ways to help your body 💛',
    tips: [
      'Increase fiber intake - try adding more fruits and vegetables',
      'Drink plenty of water throughout the day',
      'Gentle exercise like walking can stimulate digestion',
      'Natural remedies like prunes can help',
      'Try to avoid processed foods',
      'Establish a regular bathroom routine when possible',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Fiber Supplements',
        searchTerm: 'fiber supplements prunes',
        deepLink: 'blinkit://search?q=prunes',
      },
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Be patient with your body. Small changes can make a big difference 🌱',
  },
  diarrhea: {
    title: 'Diarrhea',
    emoji: '😰',
    supportiveMessage: 'I know this can be really uncomfortable. Let\'s focus on staying hydrated and resting 💧',
    tips: [
      'Stay hydrated - drink water or electrolyte solutions',
      'Try the BRAT diet: bananas, rice, applesauce, toast',
      'Avoid dairy, fatty foods, and caffeine',
      'Get plenty of rest - your body needs it',
      'Consider probiotics to help restore gut health',
      'Sip fluids frequently rather than drinking large amounts',
    ],
    deliveryAppLinks: [
      {
        app: 'Blinkit',
        productName: 'Electrolyte Solution',
        searchTerm: 'ORS electrolyte solution',
        deepLink: 'blinkit://search?q=ORS',
      },
    ],
    reminderFrequency: 'hourly',
    encouragingNote: 'Your body is working hard. Stay hydrated and rest - you\'re doing everything right 🌊',
  },
  no_discharge: {
    title: 'No Discharge',
    emoji: '🚫',
    supportiveMessage: 'Tracking discharge is important for understanding your cycle 💙',
    tips: [
      'Discharge changes throughout your cycle',
      'Absence of discharge at certain times is normal',
      'Continue tracking to understand your pattern',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your cycle has natural variations. This is normal 🌸',
  },
  creamy: {
    title: 'Creamy Discharge',
    emoji: '💧',
    supportiveMessage: 'Creamy discharge is a normal part of your cycle 💛',
    tips: [
      'Common after ovulation',
      'Usually white or off-white',
      'Thicker consistency is normal',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body is functioning normally 🌿',
  },
  watery: {
    title: 'Watery Discharge',
    emoji: '💧',
    supportiveMessage: 'Watery discharge is normal and common 💙',
    tips: [
      'Often occurs during different cycle phases',
      'Can increase around ovulation',
      'Keep track to understand your pattern',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'This is a natural part of your cycle 🌸',
  },
  sticky: {
    title: 'Sticky Discharge',
    emoji: '💧',
    supportiveMessage: 'Sticky discharge is normal at certain times of your cycle 💛',
    tips: [
      'Common during certain cycle phases',
      'Consistency changes throughout cycle',
      'Tracking helps understand your pattern',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body goes through natural changes 🌿',
  },
  egg_white: {
    title: 'Egg White Discharge',
    emoji: '🥚',
    supportiveMessage: 'Egg white discharge often indicates fertile days 💙',
    tips: [
      'Usually occurs around ovulation',
      'Stretchy, clear consistency',
      'Sign of peak fertility',
      'This is a positive sign of cycle health',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body is showing healthy signs 🌸',
  },
  spotting: {
    title: 'Spotting',
    emoji: '🔴',
    supportiveMessage: 'Light spotting can be normal, but it\'s good to track it 💙',
    tips: [
      'Can occur around ovulation or period',
      'Different from regular period flow',
      'Track frequency and timing',
      'See a healthcare provider if it\'s frequent or concerning',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Tracking helps you understand what\'s normal for you 🌺',
  },
  unusual: {
    title: 'Unusual Discharge',
    emoji: '⚠️',
    supportiveMessage: 'It\'s good that you\'re tracking this. Pay attention to changes 💛',
    tips: [
      'Note color, odor, and consistency',
      'See a healthcare provider if concerned',
      'Changes can indicate various things',
      'Trust your instincts about your body',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'You\'re taking good care of yourself by tracking this 🌸',
  },
  clumpy_white: {
    title: 'Clumpy White Discharge',
    emoji: '⚪',
    supportiveMessage: 'This type of discharge can indicate different things 💙',
    tips: [
      'Could be normal variation',
      'Might indicate yeast infection if accompanied by itching',
      'Track other symptoms',
      'See a healthcare provider if concerned',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'You\'re doing the right thing by tracking this 🌿',
  },
  gray: {
    title: 'Gray Discharge',
    emoji: '⚫',
    supportiveMessage: 'Gray discharge should be evaluated by a healthcare provider 💛',
    tips: [
      'Usually not normal',
      'See a healthcare provider',
      'Track any other symptoms',
      'Don\'t ignore this sign',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Taking care of yourself means seeking help when needed 🌸',
  },
  normal_stool: {
    title: 'Normal Stool',
    emoji: '✅',
    supportiveMessage: 'Great! Your digestion is functioning normally 💚',
    tips: [
      'Maintain a balanced diet',
      'Stay hydrated',
      'Continue tracking',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Your body is doing well! 🌸',
  },
  hard_stool: {
    title: 'Hard Stool',
    emoji: '💩',
    supportiveMessage: 'Hard stools can be uncomfortable. Let\'s help your digestion 💛',
    tips: [
      'Increase fiber intake',
      'Drink plenty of water',
      'Gentle exercise can help',
      'Consider adding prunes or fiber supplements',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Small changes can make a big difference 🌿',
  },
  loose_stool: {
    title: 'Loose Stool',
    emoji: '💩',
    supportiveMessage: 'Loose stools can be uncomfortable. Focus on staying hydrated 💧',
    tips: [
      'Stay hydrated',
      'Eat bland foods',
      'Avoid dairy and spicy foods',
      'Consider probiotics',
      'See a healthcare provider if persistent',
    ],
    reminderFrequency: 'daily',
    encouragingNote: 'Take care of yourself and listen to your body 🌸',
  },
}

export const symptomOptions: Array<{
  type: SymptomType
  label: string
  emoji: string
  category: 'symptoms' | 'discharge' | 'digestion'
}> = [
  // Symptoms
  { type: 'everything_fine', label: 'Everything is fine', emoji: '👍', category: 'symptoms' },
  { type: 'cramps', label: 'Cramps', emoji: '😣', category: 'symptoms' },
  { type: 'tender_breasts', label: 'Tender breasts', emoji: '💔', category: 'symptoms' },
  { type: 'headache', label: 'Headache', emoji: '🤕', category: 'symptoms' },
  { type: 'acne', label: 'Acne', emoji: '😤', category: 'symptoms' },
  { type: 'backache', label: 'Backache', emoji: '🩹', category: 'symptoms' },
  { type: 'fatigue', label: 'Fatigue', emoji: '😴', category: 'symptoms' },
  { type: 'cravings', label: 'Cravings', emoji: '🍔', category: 'symptoms' },
  { type: 'insomnia', label: 'Insomnia', emoji: '🌙', category: 'symptoms' },
  { type: 'abdominal_pain', label: 'Abdominal pain', emoji: '🤕', category: 'symptoms' },
  { type: 'vaginal_itching', label: 'Vaginal itching', emoji: '😔', category: 'symptoms' },
  { type: 'vaginal_dryness', label: 'Vaginal dryness', emoji: '💧', category: 'symptoms' },
  // Vaginal Discharge
  { type: 'no_discharge', label: 'No discharge', emoji: '🚫', category: 'discharge' },
  { type: 'creamy', label: 'Creamy', emoji: '💧', category: 'discharge' },
  { type: 'watery', label: 'Watery', emoji: '💧', category: 'discharge' },
  { type: 'sticky', label: 'Sticky', emoji: '💧', category: 'discharge' },
  { type: 'egg_white', label: 'Egg white', emoji: '🥚', category: 'discharge' },
  { type: 'spotting', label: 'Spotting', emoji: '🔴', category: 'discharge' },
  { type: 'unusual', label: 'Unusual', emoji: '⚠️', category: 'discharge' },
  { type: 'clumpy_white', label: 'Clumpy white', emoji: '⚪', category: 'discharge' },
  { type: 'gray', label: 'Gray', emoji: '⚫', category: 'discharge' },
  // Digestion and Stool
  { type: 'normal_stool', label: 'Normal', emoji: '✅', category: 'digestion' },
  { type: 'hard_stool', label: 'Hard', emoji: '💩', category: 'digestion' },
  { type: 'loose_stool', label: 'Loose', emoji: '💩', category: 'digestion' },
  { type: 'constipation', label: 'Constipation', emoji: '😖', category: 'digestion' },
  { type: 'diarrhea', label: 'Diarrhea', emoji: '😰', category: 'digestion' },
  { type: 'bloating', label: 'Bloating', emoji: '🤰', category: 'digestion' },
  { type: 'nausea', label: 'Nausea', emoji: '🤢', category: 'digestion' },
]

export const moodOptions: Array<{
  type: MoodType
  label: string
  emoji: string
}> = [
  { type: 'calm', label: 'Calm', emoji: '😌' },
  { type: 'happy', label: 'Happy', emoji: '😊' },
  { type: 'energetic', label: 'Energetic', emoji: '⚡' },
  { type: 'frisky', label: 'Frisky', emoji: '😏' },
  { type: 'mood_swings', label: 'Mood swings', emoji: '😔' },
  { type: 'irritated', label: 'Irritated', emoji: '😠' },
  { type: 'sad', label: 'Sad', emoji: '😢' },
  { type: 'anxious', label: 'Anxious', emoji: '😰' },
  { type: 'depressed', label: 'Depressed', emoji: '😞' },
  { type: 'feeling_guilty', label: 'Feeling guilty', emoji: '😔' },
  { type: 'obsessive_thoughts', label: 'Obsessive thoughts', emoji: '☁️' },
  { type: 'low_energy', label: 'Low energy', emoji: '🔋' },
  { type: 'apathetic', label: 'Apathetic', emoji: '😑' },
  { type: 'confused', label: 'Confused', emoji: '😕' },
  { type: 'very_self_critical', label: 'Very self-critical', emoji: '❗' },
]
