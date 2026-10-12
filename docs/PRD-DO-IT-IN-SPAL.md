# SPAL: Do it in SPAL (PRD, draft v0.1)

Status: draft for creative-director review. Extends `VISION.md`. **Built so far:** the records engine (section 7, step 1; see `RECORDS.md`). Everything else is still to build.

## 1. The principle

> At every stage, whatever an entrepreneur needs to do, they should be able to do it **inside SPAL**. If they have to leave, do the work somewhere else and come back to tick a box, SPAL has failed.

Today SPAL tells people what to do ("write down every sale in a notebook"). That is advice. The product is the **doing**: the notebook *is* in SPAL, the plan is written *with* SPAL, the Instagram bio is drafted and ready to paste, the registration pack is assembled and checked.

## 2. Every step has one of four ways of being done

| Kind | What it means | Example | Honest limit |
|---|---|---|---|
| **Do** | A tool inside SPAL does the whole job | Record a sale, log an expense, see this month's profit, price a plate, keep a customer list, track stock | None: it's our software and the person's own data |
| **Draft** | The agent writes it, the person edits and approves | Instagram bio, WhatsApp greeting and catalogue text, one-page business plan, job post, offer message to customers | The person copies or sends it themselves unless an integration exists |
| **Guide and verify** | The job must happen elsewhere (a government portal, a bank branch). SPAL prepares everything, walks them through, and checks the result | Register a business name, open a business account, create an Instagram account | We can't do it for them. We reduce it to a ready pack, exact steps, and a proof check (certificate number, screenshot, a link we can open) |
| **Connect** | SPAL acts through a service the person has authorised | Post to their Instagram business account, send via WhatsApp Business, read bank transactions, take a payment | Needs each platform's approval, costs and terms. Added one at a time |

**Rule:** a step is never "just a checkbox". Every step is assigned a kind, and the app shows the right tool. A checkbox is the *result* of doing, not the doing.

## 3. The agent

### 3.1 What it is
One assistant per business (working name **SPAL Assistant**). The person can **talk to it** (type or, later, speak), **tell it** facts and preferences, and **configure** how it behaves. It acts through *tools* that read and write the person's own SPAL data. It does not browse the web or act outside SPAL unless a Connect integration is switched on.

### 3.2 What it can do (tools)
- **Record:** "Sold 3 plates of jollof for 4,500 and a drink for 500" becomes structured sales. Same for expenses, stock, new customers, staff pay.
- **Answer from their data:** "How much did I make this week?" "What sells best?" "Who owes me?"
- **Draft:** bios, messages, plans, price lists, job posts, in their tone and language.
- **Prepare:** assemble a registration pack, a supplier message, a one-page summary for a bank.
- **Plan and remind:** turn a goal into this week's actions; set reminders.
- **Move them forward:** open the right tool or step ("Let's price your jollof. I've put your ingredient costs in already").

### 3.3 "Configuring the agent" means
1. **Business brain:** the facts the agent works from: business name, what they sell and prices, location, hours, who the customers are, staff, goals. Collected through onboarding and conversation; **always visible and editable** ("Here's what I know about your business").
2. **Preferences:** tone (friendly, formal, short), language (English, Nigerian Pidgin, others later), how much to ask first.
3. **Autonomy level per action type** (see 3.4).

### 3.4 Safety and trust (non-negotiable)
- **Ask first by default.** The agent proposes; the person confirms. Low-risk, reversible actions the person just dictated (recording the sale they just described) can be set to "just do it", with **Undo**.
- **Never without explicit approval:** anything that spends money, sends a message to a customer, posts publicly, submits a form to a third party, or changes or deletes lots of data.
- **Show its work:** every action the agent takes is listed ("Recorded 3 sales", "Drafted your bio") with Undo where possible.
- **No guessing on numbers.** If an amount or quantity is unclear it asks. Money figures are always shown back before saving.
- **No legal, tax or financial advice.** It explains and organises, and says "check with CAC / an accountant" for decisions. Needs review by a Nigerian lawyer before launch.
- **Privacy:** only what's needed goes to the AI model; the model's API key lives on the server, never in the app; IDs such as NIN and BVN are **never stored** by SPAL (the app tells the person what to have ready and checks the *outcome*, not the number). Compliance with Nigeria's data protection law (NDPA 2023) to be confirmed with a lawyer. People can see, export and delete their data.
- **Cost control:** per-person usage limits and caching, since every model call costs money.

## 4. What this means at each stage

Feasibility: **Now** = we can build it with what we have. **Build** = needs real engineering but no outside approval. **Research** = depends on a third party, law or policy we must verify first. These ratings are my best current understanding and must be checked before promising anything.

### Getting started
| Need | Do it in SPAL | Kind | Feasibility |
|---|---|---|---|
| Choose a name | Name ideas with the agent, check Google/Instagram links, save the shortlist | Draft + Guide | Now |
| Plan | One-page plan built by answering questions, saved, editable, exportable | Draft | Build |
| Price what you sell | Price calculator (ingredients, packaging, time) that saves prices into the product list | Do | Build |
| Register the business | A readiness checklist, a prepared pack (name options, details to enter), exact portal steps; then verify with the certificate | Guide and verify | Research: no third-party API is assumed. CAC's current process, who can file (the person or an accredited agent) and fees must be confirmed |
| Separate business account | Compare options, list what to bring, then verify | Guide and verify | Research (bank partnerships later) |
| Start selling | Product catalogue; WhatsApp greeting and product text ready to paste | Do + Draft | Build |
| Instagram or WhatsApp presence | Bio, first posts and captions drafted; photo guidance | Draft + Guide | Now. **Creating an Instagram account can't be done by an app** (to my knowledge no API creates accounts), so: guide + verify the link. Posting to an *existing* professional account is a Connect option needing Meta app review |
| Logo | Generated options or brief for a designer; saved as their brand asset | Draft | Research (image generation cost and quality) |

### Growing
| Need | Do it in SPAL | Kind | Feasibility |
|---|---|---|---|
| Know your numbers | **Record sales and expenses; see profit this week and month** | Do | Build. **First thing to build** |
| Customers | Customer list; "ask ten customers" sends a shareable message and collects the answers in SPAL | Do + Draft | Build |
| Offers | Offer builder; message ready to share; count the orders in SPAL to see if it worked | Do + Draft | Build |
| Stock | Product list with stock counts and low-stock alerts | Do | Build |
| Online store | Simple catalogue page with a shareable link and WhatsApp order button | Do | Build |
| Payments | Payment links | Connect | Research (Paystack, Flutterwave, compliance) |

### Scaling
| Need | Do it in SPAL | Kind | Feasibility |
|---|---|---|---|
| Staff | Staff list, roles, pay, simple schedule; job posts drafted | Do + Draft | Build |
| Demand vs supply | Weekly capacity planner using recorded sales | Do | Build |
| Reports | Weekly and monthly summaries, exportable for a bank or investor | Do | Build |
| Records for tax | Organised, exportable records | Do | Build (advice stays with an accountant) |

## 5. Where "learning from use" fits
The learning layer in progress today (hiding steps, variety, recap, welcome back) works only from step activity. **The real version learns from what people actually record**: sales trends ("Saturdays are your best day"), what sells, how profit is moving, which costs are growing. That is where "insights about your journey and how you've grown" becomes real and valuable, and it is only possible once recording exists. So the learning layer is built to extend to action data, not replaced.

## 6. Data model (sketch)
`business` (the business brain: facts, preferences) · `products` · `sales` · `expenses` · `customers` · `staff` · `tasks` (steps, now with a kind and a tool) · `agent_actions` (what it did, with undo). Everything is row-level-secured to the owner, as today.

## 7. Build order (proposed)
1. **Records engine (the in-app notebook): BUILT.** Products, record a sale (paid or owed), record an expense, what you kept today / this week / this month, and insights from the numbers. "Write down every sale" and "Work out what you really keep" are now real tools whose steps tick themselves. See `RECORDS.md`.
2. **Finish the learning layer** on top of steps and records, so insights use real numbers.
3. **Assistant, v1 (text):** talk to it to record and to ask about the numbers; business brain screen; action log with undo; server-side model call with limits.
4. **Draft tools:** bios, messages, plans, price lists, using the business brain.
5. **Guide and verify framework:** a proper "do this elsewhere" flow with prepared packs, deep links and proof checks, starting with business name registration (after research).
6. **Voice entry** ("sold three plates...") for people who would rather speak than type. Accuracy with Nigerian accents needs testing.
7. **Connections** one at a time: WhatsApp, Instagram posting, payments, bank data.

## 8. Success measures
Share of steps completed *inside* SPAL (target: most); time from sign-up to first recorded sale; people who record on three or more days a week; weekly returning users; agent actions accepted without edits; people who reach "I know my profit this month".

## 9. Open questions
- **Law and process (research needed):** CAC business-name registration (who may file, requirements, cost, any third-party route), tax registration, what we may and may not say, and data-protection obligations. Needs a Nigerian lawyer or accountant, not guesses.
- **Platform limits:** current Instagram and WhatsApp business API rules, approval time and cost.
- **Model cost:** price per active person per month at expected use; free versus paid limits. Links to the monetisation question.
- **Language:** English first? Nigerian Pidgin, Yoruba, Igbo, Hausa later?
- **Offline:** recording must work with a weak connection; the assistant needs a connection.
- **Trust:** how much autonomy people want, and how we earn it.
