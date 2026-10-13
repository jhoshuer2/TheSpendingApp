# Real-phone test (about 45 minutes)

My automated checks use a fake server and a desktop browser. They can't tell me how SPAL feels on a real phone, on real mobile data, with real thumbs. This list covers what only a phone can show.

**Use:** 2 or 3 different phones if you can (one Android, one iPhone; one old or cheap if possible). Use the live app: https://thespendingapp.vercel.app. Use a test account, not your real books.

**How to report:** for each problem, note the phone, what you did, what you expected and what happened. A screenshot or a screen recording is best. Voice notes are fine; send them to me and I'll write them up.

## Before you start
- [ ] You ran the stock SQL in Supabase and deployed the assistant function (`npx supabase functions deploy assistant`).

## 1. Install and open
- [ ] Open the link in the phone's browser. Does it load in under about 5 seconds on mobile data?
- [ ] Add it to your home screen (Android: browser menu, Install app. iPhone: Share, Add to Home Screen).
- [ ] Open it from the home screen icon. Does it open full screen, with the right icon and name?
- [ ] Does the splash screen look right and go away quickly?

## 2. Sign up and set up
- [ ] Create an account. Does the keyboard cover the button or the field you're typing in?
- [ ] Does the password field behave (show/hide, paste from a password manager)?
- [ ] Go through the setup questions with one thumb. Is anything hard to reach or tap?

## 3. Record money (the most important test)
- [ ] Record a sale with the number pad. Is it fast? Any wrong digits?
- [ ] Record a sale that someone owes you, then mark it paid.
- [ ] Record an expense.
- [ ] Add 3 products with prices. Record a sale by picking products.
- [ ] Is anything in naira hard to read or wrapping badly?

## 4. Stock
- [ ] Turn on "Track how many I have" for a product and count 10.
- [ ] Sell 3 by picking the product. Does it say 7 left?
- [ ] Sell more than you have. Do you get the warning, and can you still record it?
- [ ] Delete that sale. Does the stock come back?
- [ ] Does "Running low" show on Money when it should?

## 5. Offline and sync (what real phones do that tests can't)
- [ ] Turn on airplane mode. Record a sale and an expense. Does it still work?
- [ ] Turn airplane mode off. Wait a minute. Log in on a second phone: are they there?
- [ ] Close the app fully and reopen it. Is everything still there?

## 6. The assistant
- [ ] Type: "I sold 2 plates of jollof for 5k". Do you get a card? Save it. Undo it.
- [ ] Say the same thing in Pidgin: "I don sell 2 plate jollof for 5k".
- [ ] Use the keyboard's microphone (dictation) to speak a sale. Does it work well?
- [ ] Ask: "How much did I make this week?"
- [ ] Ask it: "I bought 20 more bottles of zobo" (stock). Save and undo.
- [ ] Try something silly or unrelated. Is the reply sensible?

## 7. Customers and messages
- [ ] Add a customer with a phone number. Tap Call, and open the WhatsApp reminder. Does WhatsApp open with the message ready? (Nothing is sent until you press send.)
- [ ] Use Copy on a drafted message. Paste it somewhere. Did it work?

## 8. Register your business name
- [ ] Open Your business, then Register your business name. Fill in names, tick the list.
- [ ] Tap Copy on the pack. Paste it somewhere.
- [ ] Tap "Open the CAC website". Does it open in a new tab and let you come back to SPAL?
- [ ] Enter a fake number like BN 1234567 and save. Does it show as registered?

## 9. Look and feel
- [ ] Turn your phone's text size up to the largest. Is anything cut off or overlapping?
- [ ] Rotate the phone. Is it still usable?
- [ ] Use it in bright sunlight, or turn the brightness up. Can you read the grey text?
- [ ] Any button too small to tap without missing?
- [ ] Does the bottom bar ever cover the last item in a list?

## 10. Gut check
- [ ] Which screen made you confused or slowed you down?
- [ ] What would a market trader think "what is this?" about?
- [ ] What did you want to do that you couldn't?
