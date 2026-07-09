export interface Quote {
  text: string
  author: string
  title: string
}

// Curated: philosophers, builders, and athletes most people have never
// heard of — no overplayed names. One per day, rotating by date.
export const QUOTES: Quote[] = [
  // ——— Old philosophers ———
  { text: 'Character is destiny.', author: 'Heraclitus', title: 'Greek philosopher, c. 500 BC' },
  { text: 'No one knows what he can do till he tries.', author: 'Publilius Syrus', title: 'Roman writer, former slave, 1st century BC' },
  { text: 'No man is free who is not master of himself.', author: 'Epictetus', title: 'Stoic philosopher, born a slave' },
  { text: 'Difficulties strengthen the mind, as labor does the body.', author: 'Seneca', title: 'Roman Stoic philosopher' },
  { text: 'If you accomplish something good with hard work, the labor passes quickly, but the good endures.', author: 'Musonius Rufus', title: 'Roman Stoic, teacher of Epictetus' },
  { text: 'We have two ears and one mouth, so we should listen more than we say.', author: 'Zeno of Citium', title: 'Founder of Stoicism' },
  { text: 'A wise man gets more use from his enemies than a fool from his friends.', author: 'Baltasar Gracián', title: 'Spanish philosopher, 1600s' },
  { text: 'The greatest thing in the world is to know how to belong to oneself.', author: 'Michel de Montaigne', title: 'French Renaissance philosopher' },
  { text: 'Talent hits a target no one else can hit; genius hits a target no one else can see.', author: 'Arthur Schopenhauer', title: 'German philosopher' },
  { text: 'He who conquers others is strong; he who conquers himself is mighty.', author: 'Lao Tzu', title: 'Ancient Chinese philosopher' },
  { text: 'The secret of happiness is freedom, and the secret of freedom is courage.', author: 'Thucydides', title: 'Greek historian and general' },
  { text: 'What we achieve inwardly will change outer reality.', author: 'Plutarch', title: 'Greek biographer of great men' },
  { text: 'Do not spoil what you have by desiring what you have not.', author: 'Epicurus', title: 'Greek philosopher' },
  { text: 'Knowing is not as good as acting.', author: 'Xunzi', title: 'Chinese Confucian philosopher, 3rd century BC' },
  { text: 'Today is victory over yourself of yesterday; tomorrow is your victory over lesser men.', author: 'Miyamoto Musashi', title: 'Undefeated samurai, author of The Book of Five Rings' },
  { text: 'I would rather men ask why I have no monument than why I have one.', author: 'Cato the Elder', title: 'Roman statesman and soldier' },
  { text: 'The most useful piece of learning is to unlearn what is untrue.', author: 'Antisthenes', title: 'Greek philosopher, student of Socrates' },
  { text: 'I will either find a way or make one.', author: 'Hannibal Barca', title: 'Carthaginian general who crossed the Alps' },
  { text: 'Victorious warriors win first and then go to war; defeated warriors go to war first and then seek to win.', author: 'Sun Tzu', title: 'Chinese general and strategist' },

  // ——— Builders and titans ———
  { text: 'The formula for success: rise early, work hard, strike oil.', author: 'J. Paul Getty', title: 'Oil tycoon, once the richest man alive' },
  { text: 'Only those who are asleep make no mistakes.', author: 'Ingvar Kamprad', title: 'Founder of IKEA, started at 17' },
  { text: 'Knowledge changes fate.', author: 'Li Ka-shing', title: 'Hong Kong magnate, left school at 12' },
  { text: 'The world takes off its hat to those who put in more than fifty percent of their energy.', author: 'Andrew Carnegie', title: 'Steel magnate, started as a bobbin boy' },
  { text: 'The secret of business is to know something that nobody else knows.', author: 'Aristotle Onassis', title: 'Greek shipping magnate' },
  { text: 'I never dreamed about success. I worked for it.', author: 'Estée Lauder', title: 'Built a beauty empire from her kitchen' },
  { text: 'The growth and development of people is the highest calling of leadership.', author: 'Harvey Firestone', title: 'Founder, Firestone Tire' },
  { text: 'If you want to increase your success rate, double your failure rate.', author: 'Thomas J. Watson', title: 'Built IBM' },
  { text: 'The safest way to get what you want is to try to deserve what you want.', author: 'Charlie Munger', title: 'Investor, Warren Buffett’s partner' },
  { text: 'It was never my thinking that made the big money for me. It was always my sitting.', author: 'Jesse Livermore', title: 'Legendary trader, 1920s' },
  { text: 'Don’t be afraid to give up the good to go for the great.', author: 'John D. Rockefeller', title: 'Oil magnate, history’s richest man' },
  { text: 'Success is 99% failure.', author: 'Soichiro Honda', title: 'Mechanic who founded Honda' },
  { text: 'I couldn’t find the sports car of my dreams, so I built it myself.', author: 'Ferdinand Porsche', title: 'Engineer and founder of Porsche' },

  // ——— Athletes and iron minds ———
  { text: 'It’s at the borders of pain and suffering that the men are separated from the boys.', author: 'Emil Zátopek', title: 'Czech runner, 4× Olympic gold, invented interval training' },
  { text: 'Mind is everything. Muscle — pieces of rubber. All that I am, I am because of my mind.', author: 'Paavo Nurmi', title: 'The Flying Finn, 9 Olympic golds' },
  { text: 'The man who can drive himself further once the effort gets painful is the man who will win.', author: 'Roger Bannister', title: 'First man to run a sub-4-minute mile' },
  { text: 'You only ever grow as a human being if you’re outside your comfort zone.', author: 'Percy Cerutty', title: 'Eccentric Australian coach of champions' },
  { text: 'The hero and the coward both feel the same thing. It’s what they do that makes them different.', author: 'Cus D’Amato', title: 'Boxing trainer who forged champions from nothing' },
  { text: 'Exercise is king. Nutrition is queen. Put them together and you’ve got a kingdom.', author: 'Jack LaLanne', title: 'Godfather of fitness, towed 70 boats at age 70' },
  { text: 'Never underestimate the power of dreams and the influence of the human spirit.', author: 'Wilma Rudolph', title: 'Overcame polio to win 3 Olympic golds' },
  { text: 'To give anything less than your best is to sacrifice the gift.', author: 'Steve Prefontaine', title: 'American distance runner, died at 24' },
  { text: 'In the dust of defeat as well as the laurels of victory there is a glory to be found if one has done his best.', author: 'Eric Liddell', title: 'Olympic champion who refused to run on principle' },
  { text: 'When other people get tired, they stop. I don’t. I take over my body with my mind.', author: 'Yiannis Kouros', title: 'Greek ultramarathoner, holds records no one has touched' },
  { text: 'The formula for success is simple: practice and concentration, then more practice and more concentration.', author: 'Babe Didrikson Zaharias', title: 'Won Olympic golds and 10 golf majors' },

  // ——— Explorers and iron wills ———
  { text: 'Difficulties are just things to overcome, after all.', author: 'Ernest Shackleton', title: 'Antarctic explorer, brought every man home alive' },
  { text: 'The difficult is what takes a little time; the impossible is what takes a little longer.', author: 'Fridtjof Nansen', title: 'Polar explorer and Nobel laureate' },
  { text: 'Victory awaits him who has everything in order — luck, people call it.', author: 'Roald Amundsen', title: 'First man to reach the South Pole' },
  { text: 'I attribute my success to this: I never gave or took any excuse.', author: 'Florence Nightingale', title: 'Founder of modern nursing' },
  { text: 'The most difficult thing is the decision to act. The rest is merely tenacity.', author: 'Amelia Earhart', title: 'First woman to fly the Atlantic solo' },
  { text: 'Life is not easy for any of us. But what of that? We must have perseverance.', author: 'Marie Curie', title: 'Only person with Nobel Prizes in two sciences' },
]

// Same quote for everyone all day; advances at midnight UTC.
export function quoteForToday(): Quote {
  const now = new Date()
  const dayIndex = Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / 86400000)
  return QUOTES[dayIndex % QUOTES.length]
}
