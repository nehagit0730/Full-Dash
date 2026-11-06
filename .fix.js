const fs = require('fs');
const p = 'backend/routes/subscriptions.ts';
let s = fs.readFileSync(p, 'utf8');

const old = [
  '          subscription = updatedList.find((s: any) => ',
  '            (subscriptionId && String(s.id) === String(subscriptionId)) ||',
  '            (emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)',
  '          ) || subscription;'
].join('\n');

const neu = [
  '          // Reports back the plan that was actually changed, using the same',
  '          // rule the update above applied.',
  '          subscription = updatedList.find((s: any) =>',
  '            subscriptionId',
  '              ? String(s.id) === String(subscriptionId)',
  '              : Boolean(emailClean && String(s.customerEmail || "").toLowerCase().trim() === emailClean)',
  '          ) || subscription;'
].join('\n');

const count = s.split(old).length - 1;
s = s.split(old).join(neu);
fs.writeFileSync(p, s);
console.log('replaced', count);
