export const img = (n) => `/img/${n}`

export const CITIES = ['Miami', 'Brooklyn', 'Montréal', 'Boston', 'Port-au-Prince', 'Paris', 'Orlando', 'Cap-Haïtien']

export const MEMBERS = [
  { id: 'nadia', name: 'Nadia', age: 29, gender: 'woman', city: 'Miami', photo: 'p-nadia.jpg', verified: true, online: true, job: 'Pediatric nurse', langs: ['English', 'Kreyòl'], interests: ['Kompa', 'Beach days', 'Cooking', 'Church choir'], bio: 'Little Haiti girl with a big laugh. Sunday = griot at manman\'s, then the beach. Looking for someone who calls home every week.', match: 94 },
  { id: 'jean', name: 'Jean-Robert', age: 33, gender: 'man', city: 'Brooklyn', photo: 'p-jean.jpg', verified: true, online: false, job: 'Architect', langs: ['English', 'French', 'Kreyòl'], interests: ['Design', 'Soccer', 'Rara', 'Travel'], bio: 'Designing buildings in Flatbush, dreaming of a house in Jacmel. I make a serious soup joumou every January 1st.', match: 88 },
  { id: 'roselande', name: 'Roselande', age: 26, gender: 'woman', city: 'Montréal', photo: 'p-roselande.jpg', verified: true, online: true, job: 'Law student', langs: ['French', 'Kreyòl'], interests: ['Poetry', 'Konpa', 'Hiking', 'Art'], bio: 'Étudiante en droit, poète le soir. Kreyòl is my love language. Show me your favourite Frankétienne line.', match: 91 },
  { id: 'marc', name: 'Marc', age: 36, gender: 'man', city: 'Miami', photo: 'p-marc.jpg', verified: false, online: true, job: 'Restaurant owner', langs: ['English', 'Kreyòl'], interests: ['Food', 'Fishing', 'Kompa', 'Family'], bio: 'I run a little Haitian spot on NE 2nd Ave. If you like pikliz, we\'re already friends.', match: 79 },
  { id: 'esther', name: 'Esther', age: 31, gender: 'woman', city: 'Boston', photo: 'p-esther.jpg', verified: true, online: false, job: 'Software engineer', langs: ['English', 'French', 'Kreyòl'], interests: ['Tech', 'Running', 'Books', 'Dance'], bio: 'Building apps by day, dancing kompa by night. Proud Gonaïvienne. Bring good conversation and better jokes.', match: 86 },
  { id: 'wilson', name: 'Wilson', age: 28, gender: 'man', city: 'Orlando', photo: 'p-wilson.jpg', verified: true, online: true, job: 'Physical therapist', langs: ['English', 'Kreyòl'], interests: ['Basketball', 'Gym', 'Music', 'Church'], bio: 'Gym in the morning, family dinner at night. Looking for my partner in everything — including dominoes.', match: 82 },
  { id: 'mika', name: 'Mika', age: 24, gender: 'woman', city: 'Paris', photo: 'p-mika.jpg', verified: true, online: true, job: 'Fashion designer', langs: ['French', 'Kreyòl', 'English'], interests: ['Fashion', 'Photography', 'Rara', 'Travel'], bio: 'Paris-born, Port-au-Prince at heart. I design with colours from the tap-taps of my childhood summers.', match: 89 },
  { id: 'ricardo', name: 'Ricardo', age: 41, gender: 'man', city: 'Montréal', photo: 'p-ricardo.jpg', verified: true, online: false, job: 'High school teacher', langs: ['French', 'Kreyòl'], interests: ['History', 'Jazz', 'Chess', 'Cooking'], bio: 'Prof d\'histoire. I can talk 1804 for hours. Divorced, two great kids, ready for something real.', match: 77 },
  { id: 'sabine', name: 'Sabine', age: 38, gender: 'woman', city: 'Brooklyn', photo: 'p-sabine.jpg', verified: true, online: true, job: 'Entrepreneur', langs: ['English', 'Kreyòl'], interests: ['Business', 'Wine', 'Kompa', 'Travel'], bio: 'Founder of a natural hair brand. I work hard and love harder. Family first, always.', match: 84 },
  { id: 'fritz', name: 'Fritz', age: 45, gender: 'man', city: 'Port-au-Prince', photo: 'p-fritz.jpg', verified: false, online: false, job: 'Agronomist', langs: ['Kreyòl', 'French'], interests: ['Nature', 'Farming', 'Music', 'Faith'], bio: 'Mwen renmen tè a. Coffee from Thiotte, music from Tabou Combo. Looking for a kind heart.', match: 72 },
]

export const ME = {
  id: 'me', name: 'Daniela', age: 30, gender: 'woman', city: 'Miami', photo: 'p-nadia.jpg', verified: true, job: 'Marketing manager',
  langs: ['English', 'Kreyòl'], interests: ['Kompa', 'Travel', 'Cooking', 'Books'],
  bio: 'Miami-raised, Jacmel roots. I love long dinners, loud families and Sunday drives with old kompa on.', lookingFor: 'Something serious',
}

const now = Date.now()
export const THREADS = [
  { id: 't1', with: 'jean', unread: 2, messages: [
    { from: 'jean', text: 'Bonjou Daniela! I saw you love Jacmel — my grandmother is from there too.', at: '9:12' },
    { from: 'me', text: 'Sak pase! No way, which part?', at: '9:20' },
    { from: 'jean', text: 'Près de la plage, near Raymond-les-Bains. Have you been to the carnival?', at: '9:24' },
    { from: 'jean', text: 'We should compare soup joumou recipes 😄', at: '9:25' },
  ] },
  { id: 't2', with: 'roselande', unread: 0, messages: [
    { from: 'roselande', text: 'Mèsi for the poetry rec! Reading it tonight.', at: 'Yesterday' },
    { from: 'me', text: 'Tell me what you think of the last poem 💙', at: 'Yesterday' },
  ] },
  { id: 't3', with: 'wilson', unread: 1, messages: [
    { from: 'wilson', text: 'Are you going to the Lakou Kompa night on Saturday?', at: 'Mon' },
  ] },
  { id: 't4', with: 'esther', unread: 0, messages: [
    { from: 'me', text: 'Your app idea for the church sounds amazing.', at: 'Sun' },
    { from: 'esther', text: 'Haha mèsi! Coffee next time you\'re in Boston?', at: 'Sun' },
  ] },
]

export const POST_CATS = ['All', 'Housing', 'Jobs', 'Events', 'Food', 'Advice', 'Business']

export const POSTS = [
  { id: 'p1', author: 'sabine', cat: 'Business', time: '2h', status: 'approved', text: 'Haitian-owned businesses in Brooklyn: I\'m putting together a free directory for the kominote. Drop your business below 👇🏾', image: 'toast.jpg', likes: 128, comments: 34 },
  { id: 'p2', author: 'marc', cat: 'Food', time: '4h', status: 'approved', text: 'Griot Friday is back at the restaurant! First 20 Rekonekte members get free pikliz to go. Mèsi for the love, Miami.', image: 'cooking.jpg', likes: 212, comments: 41 },
  { id: 'p3', author: 'esther', cat: 'Jobs', time: '6h', status: 'approved', text: 'My company is hiring 2 junior developers in Boston (remote-friendly). Kreyòl speakers very welcome — DM me for a referral.', likes: 96, comments: 22 },
  { id: 'p4', author: 'ricardo', cat: 'Housing', time: '1d', status: 'approved', text: 'Room available in a family home in Montréal-Nord from December 1st. Quiet, close to the metro. Ideal for a student.', image: 'hillside.jpg', likes: 31, comments: 9 },
  { id: 'p5', author: 'mika', cat: 'Events', time: '1d', status: 'approved', text: 'Paris fam! We\'re organising a Fèt Drapo picnic recap night — photos, music, and a little fashion pop-up.', image: 'dancers.jpg', likes: 150, comments: 27 },
  { id: 'p6', author: 'wilson', cat: 'Advice', time: '2d', status: 'approved', text: 'How do you all keep Kreyòl alive with your kids in the diaspora? My nephew only answers in English 😅', likes: 77, comments: 58 },
]

export const EVENTS = [
  { id: 'e1', title: 'Lakou Kompa Night', date: 'Sat, Nov 8', time: '9:00 PM', city: 'Miami', venue: 'Little Haiti Cultural Complex', image: 'live-crowd.jpg', going: 214, tag: 'Music', price: 'Free for members' },
  { id: 'e2', title: 'Soup Joumou Cook-off', date: 'Sun, Nov 16', time: '1:00 PM', city: 'Brooklyn', venue: 'Flatbush Community Hall', image: 'kitchen.jpg', going: 96, tag: 'Food', price: '$10' },
  { id: 'e3', title: 'Speed Dating — Ann Pale', date: 'Fri, Nov 21', time: '7:30 PM', city: 'Montréal', venue: 'Café Lakay, Saint-Michel', image: 'dinner.jpg', going: 48, tag: 'Dating', price: '$15' },
  { id: 'e4', title: 'Rara on the Beach', date: 'Sat, Nov 29', time: '4:00 PM', city: 'Miami', venue: 'North Beach Bandshell', image: 'parade.jpg', going: 330, tag: 'Culture', price: 'Free' },
  { id: 'e5', title: 'Diaspora Founders Brunch', date: 'Sun, Dec 7', time: '11:00 AM', city: 'Boston', venue: 'Mattapan Commons', image: 'toast.jpg', going: 62, tag: 'Business', price: '$20' },
  { id: 'e6', title: 'Live: Voices of Lakay', date: 'Sat, Dec 13', time: '8:00 PM', city: 'Paris', venue: 'La Bellevilloise', image: 'live-yellow.jpg', going: 180, tag: 'Music', price: '€18' },
]

export const ADMIN_USERS = [
  ...MEMBERS.map((m, i) => ({ id: m.id, name: m.name, email: `${m.id}@mail.com`, city: m.city, joined: ['Oct 2', 'Oct 4', 'Oct 5', 'Oct 9', 'Oct 11', 'Oct 12', 'Oct 14', 'Oct 15', 'Oct 18', 'Oct 19'][i], status: i === 3 ? 'flagged' : i === 9 ? 'suspended' : 'active', verified: m.verified, photo: m.photo })),
]

export const REPORTS = [
  { id: 'r1', target: 'marc', by: 'nadia', reason: 'Inappropriate messages', detail: 'Sent several unwanted messages after I said no.', time: '12 min ago', status: 'open', severity: 'high' },
  { id: 'r2', target: 'fritz', by: 'esther', reason: 'Fake profile / scam', detail: 'Asked me to send money for a "visa fee".', time: '1h ago', status: 'open', severity: 'high' },
  { id: 'r3', target: 'wilson', by: 'mika', reason: 'Spam', detail: 'Posting the same promo in multiple threads.', time: '3h ago', status: 'open', severity: 'low' },
  { id: 'r4', target: 'ricardo', by: 'sabine', reason: 'Underage concern', detail: 'Photos look much younger than stated age.', time: 'Yesterday', status: 'open', severity: 'medium' },
  { id: 'r5', target: 'jean', by: 'roselande', reason: 'Harassment', detail: 'Resolved after warning.', time: '2d ago', status: 'resolved', severity: 'medium' },
]

export const PENDING_POSTS = [
  { id: 'q1', author: 'fritz', cat: 'Business', text: 'Send me $50 and I will triple it in a week, guaranteed!!! DM now', time: '20 min ago', flags: 3 },
  { id: 'q2', author: 'mika', cat: 'Events', text: 'Pop-up shop this Saturday in Belleville — Haitian designers only. Come through!', time: '1h ago', flags: 0 },
  { id: 'q3', author: 'wilson', cat: 'Advice', text: 'Looking for a Kreyòl tutor for my kids in Orlando, any recommendations?', time: '2h ago', flags: 0 },
]

export const REPORT_REASONS = ['Fake profile / scam', 'Inappropriate messages', 'Harassment or bullying', 'Underage concern', 'Spam or promotion', 'Hate speech', 'Something else']

export const member = (id) => MEMBERS.find((m) => m.id === id)
