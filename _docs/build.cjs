// Builds kavedi.com/docs: one HTML file per page in ../docs, plus search.json. Run `node _docs/build.cjs` from the repo
// root after editing a page below. This folder (_docs) is listed in .assetsignore, so it's never published.
// Copy rules: plain words, no long dashes, no semicolons in sentences, never "AI-powered".
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'docs');

// ---- Icons (Lucide shapes) ----
const ICON = {
  rocket: '<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>',
  plug: '<path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-12 0V8z"/>',
  book: '<path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"/>',
  bot: '<path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/>',
  inbox: '<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>',
  calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/>',
  send: '<path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/>',
  puzzle: '<path d="M19.44 7.85c-.4-.4-1.04-.4-1.44 0l-.85.85a2 2 0 1 1-2.83-2.83l.85-.85c.4-.4.4-1.04 0-1.44L13.1 1.5a1 1 0 0 0-1.41 0L9.5 3.69"/><path d="M4.56 16.15c.4.4 1.04.4 1.44 0l.85-.85a2 2 0 1 1 2.83 2.83l-.85.85c-.4.4-.4 1.04 0 1.44l2.07 2.08a1 1 0 0 0 1.41 0l2.19-2.19"/><path d="M3.69 9.5 1.5 11.69a1 1 0 0 0 0 1.41l8.4 8.4a1 1 0 0 0 1.41 0l2.19-2.19"/><path d="M20.31 14.5l2.19-2.19a1 1 0 0 0 0-1.41l-8.4-8.4a1 1 0 0 0-1.41 0L10.5 4.69"/>',
  sparkles: '<path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>',
  shield: '<path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
  bulb: '<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',
  alert: '<path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  theme: '<path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>',
  menu: '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
};
const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[name]}</svg>`;

// ---- Pieces a page is written with ----
const slug = (text) => text.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const h2 = (text) => `<h2 id="${slug(text)}"><a class="d-anchor" href="#${slug(text)}">${text}<span class="d-hash">#</span></a></h2>`;
const h3 = (text) => `<h3 id="${slug(text)}"><a class="d-anchor" href="#${slug(text)}">${text}<span class="d-hash">#</span></a></h3>`;
const note = (html) => `<div class="d-callout is-note">${icon('info')}<div><p>${html}</p></div></div>`;
const tip = (html) => `<div class="d-callout is-tip">${icon('bulb')}<div><p>${html}</p></div></div>`;
const warn = (html) => `<div class="d-callout is-warn">${icon('alert')}<div><p>${html}</p></div></div>`;
const steps = (list) => `<ol class="d-steps">${list.map(([title, html]) => `<li><strong>${title}</strong><p>${html}</p></li>`).join('')}</ol>`;
const cards = (list) => `<div class="d-cards">${list.map(([href, ic, title, text]) => `<a class="d-card" href="${href}"><span class="d-card-icon">${icon(ic)}</span><b>${title}</b><span>${text}</span></a>`).join('')}</div>`;
const table = (head, rows) => `<table><thead><tr>${head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const ol = (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;
const p = (html) => `<p>${html}</p>`;
const d = (s) => `/docs/${s}`;

// ---- The pages, in sidebar order ----
const PAGES = [
  {
    group: 'Getting started', slug: '', title: 'Introduction', nav: 'Introduction',
    lead: 'Kavedi takes the repetitive work off the WhatsApp number you already use. It answers the questions you get all day, books people in, sends reminders, and hands you anything it can’t handle.',
    body: [
      h2('How it works'),
      p('You connect your number, teach Kavedi your answers once in your own words, and switch on <strong>agents</strong>. Each agent is a worker with one job: a Receptionist for questions, a Booker for bookings, a Reminder before appointments, a Follow-up for people who went quiet. You can build your own for anything else.'),
      p('Anything an agent doesn’t know comes to your <strong>Inbox</strong>. Kavedi never makes up an answer.'),
      note('Kavedi is in beta. It’s free while we test it with the first people. <a href="/beta">Apply for the beta</a>.'),
      h2('Start here'),
      cards([
        [d('quickstart'), 'rocket', 'Quickstart', 'From sign-in to your first automatic answer in about ten minutes.'],
        [d('connect-whatsapp'), 'plug', 'Connect WhatsApp', 'Link your number with a pairing code.'],
        [d('agents'), 'bot', 'Agents', 'What agents are and the four that come with Kavedi.'],
        [d('knowledge'), 'book', 'Teach Kavedi', 'Give it your prices, hours and answers.'],
        [d('inbox'), 'inbox', 'Your Inbox', 'Where handed-over chats land.'],
        [d('troubleshooting'), 'info', 'Troubleshooting', 'Fixes for the things people run into.'],
      ]),
    ],
  },
  {
    group: 'Getting started', slug: 'quickstart', title: 'Quickstart',
    lead: 'Set up Kavedi and get your first automatic answer. It takes about ten minutes.',
    body: [
      steps([
        ['Sign in', 'Go to <a href="/sign-in">kavedi.com/sign-in</a> and continue with Google or your email. During the beta your email has to be let in first.'],
        ['Answer the welcome', 'Kavedi asks your name or your business’s, what you do, and the questions people ask you most. Each step can be skipped, and everything can be changed later.'],
        ['Connect WhatsApp', 'Enter your number and type the pairing code into WhatsApp on your phone. See <a href="' + d('connect-whatsapp') + '">Connect WhatsApp</a>.'],
        ['Teach your answers', 'In <strong>Knowledge</strong>, type the things you tell people every day: prices, opening hours, how to pay, where you are.'],
        ['Switch on an agent', 'On <strong>Agents</strong>, switch on the Receptionist to answer questions, or build your own agent for just one job.'],
        ['Test it', 'From another phone, message your number with a question you taught. The answer arrives in seconds.'],
      ]),
      tip('The <strong>Setup</strong> button at the top (or the card on Today on a phone) shows what’s left to do.'),
    ],
  },
  {
    group: 'Getting started', slug: 'connect-whatsapp', title: 'Connect WhatsApp',
    lead: 'Kavedi links to your number as a linked device, the same way WhatsApp Web does. Your phone keeps working exactly as before.',
    body: [
      h2('Link your number'),
      steps([
        ['Enter your number', 'In Kavedi, type your WhatsApp number with its country code and press <strong>Get code</strong>.'],
        ['Open Linked devices on your phone', 'In WhatsApp, open Settings, then <strong>Linked devices</strong>, then <strong>Link a device</strong>.'],
        ['Use the code', 'Tap <strong>Link with phone number instead</strong> and type the 8 character code Kavedi shows.'],
        ['Done', 'Kavedi says Connected. It shows up on your phone as a linked device.'],
      ]),
      note('Kavedi isn’t WhatsApp or Meta, and it never needs your WhatsApp password.'),
      h2('If it doesn’t connect'),
      ul([
        'Codes expire after a few minutes. Ask for a new one.',
        'Type the code under <strong>Link with phone number instead</strong>, not the QR scanner.',
        'If your phone says it can’t link devices right now, WhatsApp has paused linking on that number for a while. Try again later.',
      ]),
      h2('Disconnect'),
      p('Settings, WhatsApp, <strong>Disconnect</strong>. You can also remove Kavedi from Linked devices on your phone. Either way Kavedi stops at once and forgets the login.'),
    ],
  },
  {
    group: 'Core concepts', slug: 'agents', title: 'Agents',
    lead: 'An agent is a worker with one job. It has a start, steps, what it knows, and its rules.',
    body: [
      h2('The four that come with Kavedi'),
      table(['Agent', 'Its job', 'Starts'], [
        ['<strong>Receptionist</strong>', 'Answers questions from what you taught it', 'Any message no other agent took'],
        ['<strong>Booker</strong>', 'Books, moves and cancels appointments', 'When someone wants a booking'],
        ['<strong>Reminder</strong>', 'Reminds people before their booking', '24 hours before, or when you choose'],
        ['<strong>Follow-up</strong>', 'Checks in with people who went quiet', 'After a number of quiet days'],
      ]),
      p('Switch each one on or off on the <strong>Agents</strong> page. Open one to change how it works.'),
      warn('While the Receptionist is on, every question someone sends gets an answer. If you only want some things answered, switch it off and build agents just for those.'),
      h2('Your own agents'),
      p('Describe what you want (“when someone asks how to pay, send my account details”) and press <strong>Build</strong>, start from a template, or start from scratch. See <a href="' + d('create-an-agent') + '">Create an agent</a>.'),
      h2('Deleting one of the four'),
      p('Deleting the Receptionist, Booker, Reminder or Follow-up switches its setting off. <strong>Add back</strong> on the Agents page brings it back as it started.'),
    ],
  },
  {
    group: 'Core concepts', slug: 'how-agents-decide', title: 'How agents decide',
    lead: 'For every message, Kavedi picks at most one agent to answer. Here is the order.',
    body: [
      h2('The order'),
      ol([
        'If an agent asked them a question, their message is the answer and that agent carries on.',
        'If they’re waiting in your Inbox after a handover, agents that answer anything leave them alone.',
        'Someone messaging for the first time gets your welcome agent, if you have one.',
        'The agents that start on a message are tried, oldest first. <strong>The first one that takes it answers, and only that one.</strong>',
        'If none took it, the Receptionist answers, if it’s on. If nothing is on, nothing is sent.',
      ]),
      h2('Always true'),
      ul([
        'One reply per message. Two agents never both answer the same message.',
        'Hellos, thanks and small talk get no reply unless an agent is set to answer them.',
        'Agents never answer groups with AI, and never read photos, voice notes or files as questions. Those come to your Inbox.',
        'Anyone set to <strong>Only you reply</strong> is never answered by an agent.',
        'A very fast back and forth (6 replies in 3 minutes, or 10 in 10) stops agents in that chat and sends it to your Inbox, so two bots can’t answer each other.',
      ]),
      h2('Skipped agents'),
      p('An agent that is switched off, outside its hours, or inside its “how often” wait is skipped. The message goes on to the next agent, often the Receptionist.'),
    ],
  },
  {
    group: 'Core concepts', slug: 'knowledge', title: 'Teach Kavedi',
    lead: 'Everything agents say comes from what you teach them in Knowledge.',
    body: [
      h2('The teach box'),
      p('Type or say it the way you would to a new member of staff: “A cut is $40. Braids start at $120. We’re closed on Sundays.” Kavedi turns it into answers, each with the question people ask and other ways they ask it, sorted into topics.'),
      p('If something disagrees with an answer you already have, it asks which one to keep. Saved answers have Undo.'),
      h2('Upload a file'),
      p('A price list, flyer, timetable, PDF, Word document or a photo of a menu. Kavedi reads it into answers for you to check before anything is saved. The file itself isn’t kept.'),
      h2('Questions it couldn’t answer'),
      p('These are listed at the top of Knowledge. Answer one and the answer is sent to everyone who asked, as a reply to what they asked.'),
      h2('Word for word'),
      p('Mark an answer as word for word and it’s sent exactly as you wrote it, with names filled in. Otherwise agents use your answer in their own words.'),
      tip('Fill in <strong>About you</strong> in Settings. Your name, what you do, address, phone and website go with every answer, so “where are you?” is always right.'),
    ],
  },
  {
    group: 'Build agents', slug: 'create-an-agent', title: 'Create an agent',
    lead: 'Three ways to make one, all from the Agents page.',
    body: [
      h2('Describe it'),
      p('Type what you want in the box at the top (“when someone sends a photo of a payment, thank them and tell me”) and press <strong>Build</strong>. The assistant puts the agent together in front of you. Check it, then switch it on.'),
      h2('From a template'),
      p('Templates cover the common jobs: price list, opening hours, how to pay, “I’ve paid”, delivery, voice notes, someone wants to order. Open one, change the words, switch it on.'),
      h2('From scratch'),
      p('Every agent is the same four parts:'),
      table(['Part', 'What it says'], [
        ['<a href="' + d('when-to-use-it') + '">When to use it</a>', 'Which messages it takes'],
        ['<a href="' + d('steps') + '">Steps</a>', 'What it does, in order'],
        ['<a href="' + d('knowledge-and-rules') + '">Knowledge and rules</a>', 'What it knows and what it must never do'],
        ['<a href="' + d('handing-over') + '">Hand over to me when</a>', 'When a chat comes to you'],
      ]),
      tip('Test it before switching it on. See <a href="' + d('test-an-agent') + '">Test an agent</a>.'),
    ],
  },
  {
    group: 'Build agents', slug: 'when-to-use-it', title: 'When to use it',
    lead: 'An agent takes a message by what it means, or on something exact.',
    body: [
      h2('By what they mean'),
      p('Write one sentence (“someone wants to order something”) and, if you like, examples of what people send. Any message that means it, in any words or language, is picked for this agent.'),
      warn('Use whole phrases as examples, never single words. An example that appears word for word in a message is taken straight away, so the example “book” would take every message with the word “book” in it.'),
      p('By what they mean works for messages people send you, in chats with one person.'),
      h2('On something exact'),
      table(['Start', 'Runs when'], [
        ['Certain words', 'The message has any of your words, is exactly them, or starts with them'],
        ['A photo, voice note or file', 'They send one of the kinds you tick'],
        ['Someone new', 'Their first message ever to your number'],
        ['Before or after a booking', 'Hours or days before or after a booking'],
        ['Someone goes quiet', 'They haven’t written for a number of days'],
        ['Another agent hands it over', 'Another agent’s Hand over step names it'],
        ['Nothing else took it', 'No other agent took the message'],
      ]),
      h3('Words you send yourself'),
      p('Set <strong>Sent by</strong> to Me and words you type, like <code>/hours</code>, start the agent. You choose whether your message stays, turns into the reply, or is deleted. A <code>/</code> in front keeps it from going off in an ordinary message.'),
      h2('When it works and how often'),
      ul([
        '<strong>When it works:</strong> days and hours, during or outside them, in your time zone.',
        '<strong>How often:</strong> every time, or at most once an hour, a day or a week for each person.',
        '<strong>Another agent can answer too:</strong> only matters when this agent sends nothing, like an agent that only adds a label.',
      ]),
    ],
  },
  {
    group: 'Build agents', slug: 'steps', title: 'Steps',
    lead: 'Steps are what an agent does, in order. There are eight kinds.',
    body: [
      table(['Step', 'What it does'], [
        ['<strong>Instructions</strong>', 'Plain words for the AI to carry out. See below.'],
        ['<strong>Say</strong>', 'Exactly your words, with a picture, file, sticker or reaction if you like.'],
        ['<strong>Ask</strong>', 'Asks a question, waits for their reply and keeps it. Can offer a numbered list to pick from.'],
        ['<strong>If</strong>', 'Does one thing or another, depending on what they said, a label, or chance.'],
        ['<strong>Do</strong>', 'One action: look up free times, book, move or cancel, send later, label, payment link, get something from a web address, wait, tell me.'],
        ['<strong>Run</strong>', 'Runs another agent’s steps here.'],
        ['<strong>Hand over</strong>', 'To you (it lands in your Inbox) or to another agent.'],
        ['<strong>End</strong>', 'Stops, with last words or none.'],
      ]),
      h2('Instructions'),
      p('Write what you want in plain words: “Answer their question from what you know.” With nothing else, it answers once from your Knowledge.'),
      p('Type <strong>@</strong> to add tools: free times, book, move or cancel, send later, label. Name something to find out, like their email, and it asks for it. With tools or something to find out, it holds a conversation until the job is done.'),
      p('<strong>When it can’t</strong> says what happens if it gets stuck: hand over to you, carry on to the next step, or run steps you choose.'),
      h2('Limits'),
      ul(['Up to 20 steps, counting the ones inside an If.', 'Up to 3 Ask steps.', 'An If can’t have another If inside it.']),
    ],
  },
  {
    group: 'Build agents', slug: 'knowledge-and-rules', title: 'Knowledge and rules',
    lead: 'What an agent knows, and what it must always or never do.',
    body: [
      h2('What it knows'),
      ul([
        '<strong>All of Knowledge</strong>, the default.',
        '<strong>Some topics</strong>, for an agent with a narrow job.',
        '<strong>Only its notes</strong>, for facts no other agent should use.',
      ]),
      p('Every agent also knows About you: your name, what you do and where you are.'),
      h2('Rules'),
      p('Your own lines it follows, like “never offer Sundays” or “always mention the deposit”. Up to 12, each with its own switch.'),
      note('Two rules are fixed: it never makes up a price, a time or a fact, and it never answers in a group. Your rules add to these and can’t switch them off.'),
      h2('Steps back while you’re chatting'),
      p('On by default. After you send anything in a chat, the agent stays quiet for your Pause after you reply time. Turn it off and the agent keeps answering even right after you reply.'),
    ],
  },
  {
    group: 'Build agents', slug: 'handing-over', title: 'Hand over to me when',
    lead: 'When an agent sends a chat to you instead of answering.',
    body: [
      table(['Case', 'What happens'], [
        ['They ask for a person', 'Always comes to your Inbox at once. This can’t be switched off.'],
        ['It doesn’t know', 'It asks “want me to pass this on?” and only a yes comes to you. Or choose <strong>Hand over straight away</strong>.'],
        ['Your own cases', 'Write them in plain words, like “they want a refund”. Any one that’s true hands it over, and your Inbox says which.'],
      ]),
      h2('Hellos and small talk'),
      p('By default an agent stays quiet for messages that ask nothing: “good morning”, “thanks”, “ok”, an emoji. They aren’t answered and don’t come to your Inbox. A greeting with a question in it still gets an answer.'),
      p('Choose <strong>Reply</strong> if you want it to say hello back and answer chit-chat.'),
      h2('What they’re told'),
      p('When a chat comes to you, Kavedi sends your holding message, or nothing if it’s blank. Change it in Settings, AI replies, When a chat comes to you.'),
    ],
  },
  {
    group: 'Build agents', slug: 'test-an-agent', title: 'Test an agent',
    lead: 'Try an agent before real people meet it.',
    body: [
      h2('Try it'),
      p('Open an agent and use <strong>Try it</strong>. Type as if you were someone messaging you. It runs the real steps with the real AI and your real free times, and sends nothing. Anything it would do, like booking, is shown as a line instead.'),
      h2('Tests'),
      p('Save up to 10 tests on an agent: what someone says, and what should happen (says some words, books a time, hands it to you, sends nothing). Run them after every change.'),
      note('Try it and Tests show what an agent does once it has a message. They don’t show whether the agent would be picked for that message. Only a real message tests that.'),
      h2('Test with a real message'),
      steps([
        ['Use a second phone', 'Message your Kavedi number from another phone. Messages you send from your own number count as you, not a customer.'],
        ['Wait half a minute after saving', 'Changes reach WhatsApp within 30 seconds.'],
        ['Send what a customer would', 'Check the right agent answered, and that hellos get no reply.'],
      ]),
    ],
  },
  {
    group: 'Using Kavedi', slug: 'inbox', title: 'Your Inbox',
    lead: 'Everything handed to you, with the conversation that led to it and why.',
    body: [
      h2('Working through it'),
      ul([
        '<strong>Handle in WhatsApp</strong> opens their chat on your phone. Reply there, as you always have.',
        '<strong>Done</strong> when it’s sorted. Undo if you pressed it by mistake.',
        '<strong>Request payment</strong> sends a payment link when Stripe or Paystack is connected.',
        '<strong>+</strong> adds anyone who has messaged you, to keep them at hand.',
      ]),
      h2('Quiet after a handover'),
      p('While someone is waiting in your Inbox, agents that answer anything leave them alone, whatever they send, for 12 hours or until you press Done. Agents on exact words still answer.'),
      p('Change the time in Settings, AI replies, <strong>Quiet after a handover</strong>: from an hour to a week, or until you press Done.'),
      h2('Agents reply or Only you reply'),
      p('Set on each person. <strong>Only you reply</strong> means no agent ever answers them.'),
      h2('When you reply yourself'),
      p('Anything you send in a chat, from your phone or anywhere else (text, a voice note, a photo, a sticker, even a reaction), tells agents you’re there. Agents that answer anything stay quiet for your <strong>Pause after you reply</strong> time.'),
    ],
  },
  {
    group: 'Using Kavedi', slug: 'bookings', title: 'Bookings',
    lead: 'Services, availability and the agenda. The Booker fills it from chats.',
    body: [
      h2('Services'),
      p('What can be booked, how long it takes, its price, and questions to ask (like “first time?”).'),
      h2('Availability'),
      ul([
        'Weekly hours, with breaks.',
        'Time off. It asks what to do about anyone already booked: ask them to pick another time, or keep them.',
        'Rules: notice needed, how far ahead people can book, bookings per day.',
      ]),
      h2('The agenda'),
      ul([
        'Today first, each booking with who added it.',
        'Add a booking by hand, with free times shown.',
        'Move a booking. Its reminders move too.',
        'Cancel, with the message they’ll get shown first.',
        '<strong>Didn’t come?</strong> only offers a short “sorry we missed you” in your words.',
      ]),
      note('Two people can never be booked into the same time. Every time is in your time zone.'),
    ],
  },
  {
    group: 'Using Kavedi', slug: 'messages', title: 'Messages',
    lead: 'Schedule a message, or send one to many people, carefully.',
    body: [
      h2('Schedule a message'),
      p('To a person, a label or a group, once or repeating every day, week or month. Names fill themselves in: <code>{firstname}</code> becomes their first name.'),
      h2('Broadcast'),
      p('Send to many people at once, with rails that protect your number:'),
      ul([
        'Only people who have messaged you.',
        'One at a time, with gaps, in small bursts.',
        'Between 8am and 8pm.',
        'At most 50 a day.',
        'Never to anyone who replied STOP.',
      ]),
      warn('A list of 50 takes about an hour. That’s on purpose: sending fast is what gets numbers flagged.'),
      h2('Going out'),
      p('Everything waiting, sent or not sent is listed with the reason, and can be stopped.'),
    ],
  },
  {
    group: 'Using Kavedi', slug: 'connected-apps', title: 'Connected apps',
    lead: 'Connect your calendar and take payments.',
    body: [
      table(['App', 'What it does'], [
        ['Google Calendar', 'Bookings go into your calendar, and your busy times block bookings.'],
        ['Apple Calendar, Outlook', 'A private calendar link that shows your bookings. Your calendar app refreshes it when it chooses.'],
        ['Stripe', 'Payment links, and Paid when someone pays.'],
        ['Paystack', 'Payment links, and Paid when someone pays.'],
      ]),
      note('Money goes straight to your own Stripe or Paystack account. Kavedi never holds it or sees a card.'),
      p('Make a payment link from your Inbox, an agent (Do, Payment link), or the assistant. Apps marked Coming soon don’t connect yet.'),
    ],
  },
  {
    group: 'Using Kavedi', slug: 'assistant', title: 'The assistant',
    lead: 'An assistant that knows your account and can do things for you.',
    body: [
      p('It sits on the right on a computer, and in the middle of the tab bar on a phone.'),
      h2('Ask it'),
      ul(['“Who’s booked tomorrow?”', '“What did people ask most this week?”', '“Is Sofia waiting for me?”']),
      h2('Tell it'),
      ul(['“Make an agent that sends my menu when someone asks for it.”', '“Take Friday off.”', '“Reply to everyone waiting that we’re open again.”']),
      p('Settings change at once, with Undo. Anything that messages people, adds an agent or deletes something waits for your tap.'),
      tip('Use the microphone to talk to it, and + to attach a file.'),
    ],
  },
  {
    group: 'Account', slug: 'settings', title: 'Settings',
    lead: 'What each setting changes.',
    body: [
      table(['Setting', 'What it changes'], [
        ['About you', 'Name, what you do, address, phone, website, time zone'],
        ['Tone', 'Friendly, short or professional'],
        ['Say it’s an assistant', 'Whether the first reply says so. It always admits it when asked'],
        ['When a chat comes to you', 'The holding message, or nothing'],
        ['Pause after you reply', 'How long agents stay quiet after you send something in a chat'],
        ['Quiet after a handover', 'How long agents leave someone in your Inbox alone'],
        ['Wait before replying', 'Your head start before the Receptionist answers'],
        ['Chats set to Me', 'People agents never answer'],
        ['Notifications', 'Push and email, and what about'],
        ['Privacy and data', 'What’s kept and for how long, and deleting your account'],
      ]),
    ],
  },
  {
    group: 'Account', slug: 'notifications', title: 'Notifications and the app',
    lead: 'Get told when someone needs you, on your phone or by email.',
    body: [
      h2('What you can be told'),
      ul(['Someone is waiting for you.', 'A new booking.', 'Someone paid.', 'WhatsApp disconnected, and when it’s back.']),
      h2('Install Kavedi on your phone'),
      steps([
        ['Android', 'Open Kavedi in Chrome, then <strong>Install</strong> in the account menu.'],
        ['iPhone', 'Open Kavedi in Safari, tap Share, then <strong>Add to Home Screen</strong>. iPhones only show notifications for apps added this way.'],
        ['Turn notifications on', 'Settings, Notifications, then turn on this device.'],
      ]),
      p('The app icon shows how many people are waiting.'),
    ],
  },
  {
    group: 'Account', slug: 'credits-and-limits', title: 'Credits and limits',
    lead: 'What AI answers cost, and the limits that keep things safe.',
    body: [
      h2('Credits'),
      p('Every AI answer uses credits. One credit is 1,000 tokens, roughly a short reply. During the beta it’s free, with up to <strong>30 credits an hour</strong> per account, about 15 replies.'),
      p('Over the limit, messages come to your Inbox as “Hourly AI limit reached” until the hour is up. See your use in Settings, Plan and billing.'),
      h2('Limits'),
      table(['What', 'Limit'], [
        ['AI per account', '30 credits an hour during the beta'],
        ['Replies in one chat', '6 in 3 minutes, 10 in 10'],
        ['Broadcast', '50 a day, 8am to 8pm'],
        ['Groups agents can read', '3 across all agents'],
        ['Steps in an agent', '20'],
      ]),
    ],
  },
  {
    group: 'Account', slug: 'number-safety', title: 'Keeping your number safe',
    lead: 'How Kavedi behaves so your number looks like a person using WhatsApp, not a bot.',
    body: [
      ul([
        'It only replies to people who messaged you first, and never starts a new chat on its own.',
        'It isn’t shown online all day, and it doesn’t type before scheduled messages.',
        'Your number is only ever connected once. Two copies fighting over one number is a warning sign to WhatsApp, so Kavedi prevents it.',
        'Broadcasts are slow and capped. See <a href="' + d('messages') + '">Messages</a>.',
        'Groups are never answered with AI.',
      ]),
      warn('Like any tool that links to WhatsApp this way, there is some risk. The <a href="/terms">terms</a> explain it.'),
    ],
  },
  {
    group: 'Help', slug: 'troubleshooting', title: 'Troubleshooting',
    lead: 'Fixes for the things people run into most.',
    body: [
      h2('It answers everything'),
      p('The Receptionist is on. Switch it off on Agents and build agents for just the things you want answered, or set people to Only you reply.'),
      h2('It answered a hello'),
      p('Open the agent, then Hand over to me when, and check Hellos and small talk is set to <strong>Stay quiet</strong>.'),
      h2('An agent didn’t answer'),
      ol([
        'Is it switched on?',
        'Is it inside <strong>When it works</strong>, and outside its <strong>How often</strong> wait?',
        'Did you send something in that chat a moment before? Agents step back while you chat.',
        'Is the person waiting in your Inbox? Press Done.',
        'For an agent that starts by meaning, check its When to use it sentence describes the message.',
      ]),
      h2('The pairing code didn’t work'),
      p('Codes expire after a few minutes. Ask for a new one and type it under Link with phone number instead.'),
      h2('WhatsApp disconnected'),
      p('Settings, WhatsApp shows why. If Kavedi was removed from Linked devices on your phone, connect again.'),
      h2('Still stuck?'),
      p('Email <a href="mailto:support@kavedi.com">support@kavedi.com</a> or DM <a href="https://x.com/kavedihq">@kavedihq</a>.'),
    ],
  },
  {
    group: 'Help', slug: 'faq', title: 'FAQ',
    lead: 'Questions people ask before and after they start.',
    body: [
      h3('Is this WhatsApp Business API?'),
      p('No. Kavedi links to your existing number as a linked device, like WhatsApp Web. No Meta business verification needed.'),
      h3('Does it work with WhatsApp Business?'),
      p('Usually, yes: the regular WhatsApp app and the WhatsApp Business app both work. A number already connected to Meta’s official Business API can’t be linked.'),
      h3('Will it make up prices?'),
      p('No. It only answers from what you taught it. If it doesn’t know, it says so and offers to pass it on.'),
      h3('Does it understand Pidgin and other languages?'),
      p('Yes. It replies in the language people write in.'),
      h3('Can I still use WhatsApp myself?'),
      p('Yes. Your phone works as normal, and agents step back when you reply.'),
      h3('Does it read photos and voice notes?'),
      p('No. They come to your Inbox. Voice notes can be transcribed there with one tap.'),
      h3('What does Kavedi keep?'),
      p('Message text for 2 days, encrypted, and handed-over conversations for 90 days. Never photos, voice notes or files. See the <a href="/privacy">privacy policy</a>.'),
      h3('How much does it cost?'),
      p('It’s free during the beta. See <a href="/pricing">pricing</a> for the plans after.'),
    ],
  },
];

// ---- Layout ----
const GROUPS = [...new Set(PAGES.map((page) => page.group))];
const urlOf = (page) => (page.slug ? `/docs/${page.slug}` : '/docs/');
const esc = (text) => String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
const plain = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/gi, ' ').replace(/\s+/g, ' ').trim();

function render(page, i) {
  const body = page.body.join('\n');
  const heads = [...body.matchAll(/<h([23]) id="([^"]+)"><a[^>]*>(.*?)<span/g)].map(([, level, id, text]) => ({ level, id, text }));
  const side = GROUPS.map((group) => `<div class="d-group"><div class="d-group-title">${group}</div>${PAGES.filter((one) => one.group === group).map((one) => `<a href="${urlOf(one)}"${one === page ? ' aria-current="page"' : ''}>${one.nav || one.title}</a>`).join('')}</div>`).join('');
  const toc = heads.length > 1 ? `<aside class="d-toc" aria-label="On this page"><div class="d-toc-title">On this page</div><nav>${heads.map((h) => `<a href="#${h.id}"${h.level === '3' ? ' class="is-sub"' : ''}>${h.text}</a>`).join('')}</nav></aside>` : '<aside class="d-toc"></aside>';
  const prev = PAGES[i - 1];
  const next = PAGES[i + 1];
  const pager = `<nav class="d-pager" aria-label="Previous and next">${prev ? `<a href="${urlOf(prev)}"><small>Previous</small><b>${prev.title}</b></a>` : ''}${next ? `<a class="is-next" href="${urlOf(next)}"><small>Next</small><b>${next.title}</b></a>` : ''}</nav>`;
  const title = page.slug ? `${page.title} · Kavedi Docs` : 'Kavedi Docs';
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(page.lead)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(page.lead)}">
<meta property="og:image" content="https://kavedi.com/assets/og.png">
<meta property="og:url" content="https://kavedi.com${urlOf(page)}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/assets/favicon.ico" sizes="48x48">
<link rel="icon" href="/assets/favicon-192.png" sizes="192x192" type="image/png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#ffffff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0E0E0D" media="(prefers-color-scheme: dark)">
<script>try{var t=localStorage.getItem('kavedi.docs.theme');if(t)document.documentElement.dataset.theme=t}catch(e){}</script>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/docs/docs.css">
</head>
<body>
<header class="d-top">
  <button class="d-icon-btn d-menu" id="d-menu" type="button" aria-label="Menu">${icon('menu')}</button>
  <a class="d-brand" href="/docs/"><img src="/assets/mark.webp" alt="" width="24" height="24">Kavedi <span>Docs</span></a>
  <button class="d-search" type="button" data-search aria-label="Search the docs">${icon('search')}<span class="d-q">Search the docs</span><kbd>Ctrl K</kbd></button>
  <div class="d-top-right">
    <a class="d-link d-hide-sm" href="/">kavedi.com</a>
    <a class="d-link d-hide-sm" href="/sign-in">Sign in</a>
    <button class="d-icon-btn" id="d-theme" type="button" aria-label="Light or dark">${icon('theme')}</button>
    <a class="d-btn" href="/beta">Join the beta</a>
  </div>
</header>
<div class="d-layout">
  <nav class="d-side" aria-label="Docs">${side}</nav>
  <main class="d-main" id="main">
    <article class="d-page">
      <div class="d-eyebrow">${page.group}</div>
      <h1>${page.title}</h1>
      <p class="d-lead">${page.lead}</p>
      <div class="d-body">
${body}
      </div>
      ${pager}
      <footer class="d-foot"><span>© 2026 Kavedi. Not affiliated with WhatsApp or Meta.</span><nav><a href="/privacy">Privacy</a><a href="/terms">Terms</a><a href="mailto:support@kavedi.com">support@kavedi.com</a></nav></footer>
    </article>
  </main>
  ${toc}
</div>
<div class="d-dialog" id="d-dialog" role="dialog" aria-modal="true" aria-label="Search the docs">
  <div class="d-find">
    <div class="d-find-bar">${icon('search')}<input id="d-find" type="search" placeholder="Search the docs" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>
    <div class="d-results" id="d-results"></div>
  </div>
</div>
<script src="/docs/docs.js" defer></script>
</body>
</html>
`;
}

for (const file of fs.readdirSync(OUT)) if (file.endsWith('.html')) fs.unlinkSync(path.join(OUT, file));
const search = [];
PAGES.forEach((page, i) => {
  fs.writeFileSync(path.join(OUT, `${page.slug || 'index'}.html`), render(page, i));
  const body = page.body.join('\n');
  search.push({ title: page.title, page: page.title, group: page.group, url: urlOf(page), text: plain(`${page.lead} ${body}`).slice(0, 600) });
  // Each section, with the words under it until the next heading.
  const parts = body.split(/(?=<h[23] id=)/);
  for (const part of parts) {
    const m = part.match(/^<h[23] id="([^"]+)"><a[^>]*>(.*?)<span/);
    if (!m) continue;
    search.push({ title: plain(m[2]), page: page.title, group: page.group, url: `${urlOf(page)}#${m[1]}`, anchor: true, text: plain(part).slice(0, 300) });
  }
});
fs.writeFileSync(path.join(OUT, 'search.json'), JSON.stringify(search));
console.log(`${PAGES.length} pages, ${search.length} search entries`);
