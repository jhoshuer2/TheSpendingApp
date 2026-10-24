import type { Answers, Band, Module } from "./types";

/** The module library. One step is shown at a time; the rest wait here until they fit. */
export const MODULES: Module[] = [
  {
    id: "setup-name", kind: "guide", need: "setup", bands: ["starting", "growing"], minutes: 10, stages: ["idea"],
    title: "Choose your business name",
    why: "A clear name is the base for registering, branding and your pages.",
    steps: [
      "Write down three names you like.",
      "Say each one out loud. Is it easy to spell and remember?",
      "Search each name on Google and Instagram to see if it's taken.",
      "Pick your favourite and keep one backup.",
    ],
  },
  {
    id: "setup-register", kind: "guide", tool: { label: "Open the registration guide", to: "/business/register" }, need: "setup", bands: ["starting", "growing"], minutes: 20, skipIfHave: "registered",
    title: "Register your business name",
    why: "Registering lets you open a business account and look trustworthy to bigger customers.",
    steps: [
      "Gather your ID, a phone number and an email you check.",
      "Search your chosen name on the CAC website.",
      "Start the business name registration on the CAC website, or ask an accredited agent.",
      "Check the current requirements and fees on the CAC website before you pay.",
      "Save your certificate on your phone and keep a printed copy.",
    ],
  },
  {
    id: "setup-plan", kind: "guide", need: "setup", bands: ["starting"], minutes: 20, stages: ["idea", "under1"],
    title: "Write your one-page plan",
    why: "Putting it on paper shows you what you need before you spend.",
    steps: [
      "Describe who you will sell to in one sentence.",
      "List what you will sell and the price of each.",
      "List what you must buy or pay for to start.",
      "Write what you want to earn in your first three months.",
    ],
  },
  {
    id: "money-account", kind: "guide", need: "money", bands: ["starting", "growing"], minutes: 15, skipIfHave: "bank",
    title: "Open a separate business account",
    why: "Keeping business money apart shows you what the business really earns.",
    steps: [
      "Compare a bank and a wallet on charges and how good the app is.",
      "Gather your ID and BVN.",
      "Open the account.",
      "Send your next business payment to it, not to your personal account.",
    ],
  },
  {
    id: "money-profit", kind: "do", need: "money", bands: ["growing", "scaling"], minutes: 20,
    title: "Work out what you really keep",
    why: "Sales are not profit. Knowing the difference tells you where to act.",
    tool: { label: "Open Money", to: "/app/money" },
    auto: { 0: "salesMonth>=3", 1: "expenses>=1" },
    steps: [
      "Record at least three sales this month.",
      "Record what you spent: stock, transport, data and helpers.",
      "Open Money and look at what you kept this month.",
      "Pick one cost you can cut next month.",
    ],
  },
  {
    id: "food-price", kind: "guide", need: "money", bands: ["starting", "growing"], minutes: 20, types: ["food"],
    title: "Price a plate so you make money",
    why: "Many food sellers price by guessing. A proper price protects your pocket.",
    steps: [
      "Write the cost of ingredients for one portion.",
      "Add gas, packaging and delivery.",
      "Add something for your time.",
      "Compare the total to your price. Is there money left over?",
    ],
  },
  {
    id: "fashion-deposit", kind: "guide", need: "money", bands: ["starting", "growing"], minutes: 15, types: ["fashion"],
    title: "Set a deposit and pickup rule",
    why: "A deposit covers your materials and stops orders going uncollected.",
    steps: [
      "Decide the deposit you take before you start, for example half.",
      "Choose the delivery date you can really keep.",
      "Write what happens if an item isn't collected.",
      "Send the rule to your next customer before you start.",
    ],
  },
  {
    id: "brand-logo", kind: "guide", need: "brand", bands: ["starting", "growing"], minutes: 20, skipIfHave: "logo",
    title: "Get a simple logo",
    why: "A logo makes your business easy to spot and remember.",
    steps: [
      "Write three words your customers should feel about your business.",
      "Look at three brands you like and note what you like about them.",
      "Make a simple logo with a free design app, or ask a designer for a quote.",
      "Save it as a square picture for WhatsApp and Instagram.",
    ],
  },
  {
    id: "brand-look", kind: "guide", need: "brand", bands: ["growing", "scaling"], minutes: 15,
    title: "Make everything look the same",
    why: "A consistent look makes a small business feel established.",
    steps: [
      "Pick one or two colours and use them everywhere.",
      "Use the same logo and name on every page and packaging.",
      "Write one line about what you do and use it in every bio.",
    ],
  },
  {
    id: "online-whatsapp", kind: "draft", tool: { label: "Write my messages", to: "/write" }, need: "online", bands: ["starting", "growing"], minutes: 15,
    title: "Set up WhatsApp Business",
    why: "Most of your customers are already on WhatsApp. Make it easy to order there.",
    steps: [
      "Download WhatsApp Business and use your business number.",
      "Add your name, address, opening hours and a short description.",
      "Add your best five products with prices and photos.",
      "Set a greeting message for new customers.",
    ],
  },
  {
    id: "online-instagram", kind: "draft", tool: { label: "Write my bio", to: "/assistant?say=Write%20my%20Instagram%20bio" }, need: "online", bands: ["starting", "growing"], minutes: 20, skipIfHave: "social",
    title: "Start a page customers can trust",
    why: "Strangers check your page before they buy. A clear page earns their trust.",
    steps: [
      "Use your business name and logo as the profile.",
      "Write a bio: what you sell, where, and how to order.",
      "Post three clear photos of your best work.",
      "Add your WhatsApp link to the bio.",
    ],
  },
  {
    id: "online-store", kind: "guide", need: "online", bands: ["growing", "scaling"], minutes: 30, skipIfHave: "online",
    title: "Open a simple online store",
    why: "A store lets customers order any time, even when you're busy.",
    steps: [
      "Pick a store builder or marketplace that fits what you sell.",
      "List your five best sellers with clear photos and prices.",
      "Set the areas you deliver to and the price for each.",
      "Place a test order yourself, from start to finish.",
    ],
  },
  {
    id: "customers-ask", kind: "guide", need: "customers", bands: ["growing", "scaling"], minutes: 15,
    title: "Ask ten customers one question",
    why: "Your customers can tell you quickly what would bring in more people like them.",
    steps: [
      "Choose one question, like \"What nearly stopped you from buying?\"",
      "Message ten recent customers.",
      "Write down their answers.",
      "Pick one thing to change this week.",
    ],
  },
  {
    id: "customers-referral", kind: "guide", need: "customers", bands: ["starting", "growing"], minutes: 15, stages: ["under1", "y1to3", "y3plus"],
    title: "Ask happy customers to tell others",
    why: "People trust a friend's word more than any advert.",
    steps: [
      "List five customers who were happy with you.",
      "Message each one and ask who else might want your work.",
      "Offer a small thank-you for each new customer they bring.",
      "Note who sent whom, so you can thank them.",
    ],
  },
  {
    id: "customers-offer", kind: "guide", need: "customers", bands: ["growing", "scaling"], minutes: 20,
    title: "Run a one-week offer",
    why: "A short, clear offer gives people a reason to buy now.",
    steps: [
      "Pick one product to push.",
      "Set a simple offer and an end date.",
      "Tell your customers on WhatsApp and Instagram.",
      "At the end, count the orders and note what worked.",
    ],
  },
  {
    id: "records-sales", kind: "do", need: "records", bands: ["starting", "growing", "scaling"], minutes: 10, stages: ["under1", "y1to3", "y3plus"], skipIfHave: "tracking",
    title: "Write down every sale",
    why: "You can't improve what you can't see. A few taps a day is enough.",
    tool: { label: "Record a sale", to: "/money/sale" },
    auto: { 0: "sales>=1", 1: "salesDays>=3", 2: "expenses>=1" },
    steps: [
      "Record your first sale in SPAL.",
      "Record sales on three different days.",
      "Add one thing you spent money on, so SPAL can show what you kept.",
    ],
  },
  {
    id: "demand-capacity", kind: "guide", need: "demand", bands: ["growing", "scaling"], minutes: 20,
    title: "Know what you can supply in a week",
    why: "Knowing your limit lets you promise only what you can deliver.",
    steps: [
      "Count how many orders you can finish in a normal week.",
      "Note what slows you down most.",
      "Set your limit and tell customers how long orders take.",
      "Write what you would need to double it.",
    ],
  },
  {
    id: "team-first-helper", kind: "guide", need: "team", bands: ["growing", "scaling"], minutes: 20,
    title: "Plan your first helper",
    why: "The right helper gives you back time to do what only you can do.",
    steps: [
      "List the tasks that eat most of your time.",
      "Pick one task a helper could do alone.",
      "Write what a good job looks like and what you will pay.",
      "Try someone for one week, then review it together.",
    ],
  },
  {
    id: "team-delegate", kind: "guide", need: "team", bands: ["scaling"], minutes: 20,
    title: "Hand over one task for good",
    why: "A task that runs without you is how a business grows past one person.",
    steps: [
      "Write the task and the result you expect.",
      "Agree pay and hours in writing.",
      "Train them once, then let them do it.",
      "Check the result, not every step.",
    ],
  },
  {
    id: "idea-test", kind: "guide", need: "customers", bands: ["starting"], minutes: 20, stages: ["idea"],
    title: "Test your idea with five people",
    why: "Hearing it from people who could buy saves you from making something nobody wants.",
    steps: [
      "Write your idea in one sentence: what you'll sell and who it's for.",
      "Pick five people who could really buy it, not only friends who'll be kind.",
      "Ask each one: would you buy this, and what would you pay?",
      "Write down what they said, in their words.",
      "Note what surprised you and what you'd change.",
    ],
  },
  {
    id: "idea-costs", kind: "guide", need: "money", bands: ["starting"], minutes: 20, stages: ["idea"],
    title: "Work out what it costs to start",
    why: "Knowing the number before you begin tells you how much to save, and what you'll need to charge.",
    steps: [
      "List everything you must buy before your first sale: stock, tools, packaging, transport.",
      "Add what you'll pay every month: data, rent, helpers.",
      "Add it all up, then add a little extra for surprises.",
      "Decide where the money will come from.",
    ],
  },
  {
    id: "idea-first-customers", kind: "guide", need: "customers", bands: ["starting"], minutes: 15, stages: ["idea"],
    title: "Line up your first three customers",
    why: "A launch with people waiting is far easier than a launch to nobody.",
    steps: [
      "Write down three people or places that could buy in your first week.",
      "Message each one: say what you're starting and when.",
      "Ask what they'd want from you.",
      "Pick a date for your first sale and write it where you'll see it.",
    ],
  },
  {
    id: "direction-goal", kind: "guide", need: "direction", bands: ["starting", "growing", "scaling"], minutes: 10,
    title: "Pick one goal for the next 30 days",
    why: "One clear goal beats ten half-started ones.",
    steps: [
      "Write the one thing that would make the next 30 days a win.",
      "Turn it into a number: orders, customers or naira.",
      "Write the three actions that move you towards it.",
      "Put a check-in date on your phone.",
    ],
  },
  {
    id: "direction-mentor", kind: "guide", need: "direction", bands: ["starting", "growing"], minutes: 20,
    title: "Find someone to learn from",
    why: "Someone a few steps ahead can save you months of trial and error.",
    steps: [
      "Write what you most want help with.",
      "List three people a few steps ahead of you.",
      "Message one with a specific question.",
      "Thank them, and act on what they tell you.",
    ],
  },
];

/** Whether a step suits this person: their band and business type, their stage, and what they already have. */
export function fitsPerson(m: Module, band: Band, answers: Answers): boolean {
  if (!m.bands.includes(band)) return false;
  if (m.types && !(answers.type !== undefined && m.types.includes(answers.type))) return false;
  if (m.stages && answers.stage !== undefined && !m.stages.includes(answers.stage)) return false;
  if (m.skipIfHave && answers.have?.includes(m.skipIfHave)) return false;
  return true;
}

export const moduleById = (id: string): Module | undefined => MODULES.find((m) => m.id === id);
