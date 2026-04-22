# Future features for the Clements Budget App

Ideas captured during the build. None of these are in progress — just
notes so we don't forget what we wanted when we come back.

## Mobile + tablet layout (agreed, priority)

The current design was built for a 1380px-wide laptop screen. It
works on phones and tablets (everything scrolls), but the topbar,
tables, and hero cards weren't designed for small screens.

**Scope when we build it:**
- Phone portrait (most common use)
- Phone landscape
- Tablet (iPad etc)

**Things that will probably need rework:**
- Topbar: brand + view-switcher + Add button need to stack or collapse on narrow widths
- Hero cards (Net / Income / Expenses / Savings stat blocks): currently side-by-side, will need to wrap or stack
- Budget table: the 12-month row is wide. Options — horizontal scroll, or collapse to "current month + next 2" with a tap-to-expand, or pivot to show one month at a time on phones
- Transaction history: probably fine as-is, rows already wrap
- Modal forms: check that they fit on a 375px-wide screen with the keyboard up
- Fact card: already has some flex behavior but worth verifying
- Touch targets: buttons that are currently fine on desktop might be too small for thumbs

**Approach:**
CSS media queries at standard breakpoints (768px for tablet, 480px for phone). No separate mobile app or framework, just responsive styles. Probably 150-300 lines of additional CSS.

## Other ideas mentioned during the build

These are less urgent but worth keeping on the list.

### CSV bank statement import
You've got 2,463 transactions in the database that came from manual entry over 2+ years. Going forward, importing CSV exports from Chase / Citizens / Chime would save hours of typing. Design would need: a file picker, column mapping UI (since every bank's export is different), a category-guess based on merchant text, and a preview-before-commit step.

### Recurring transaction templates
Rent, cell phone, Spotify, etc. — same amount every month. A "templates" list that auto-creates transactions on their due date (or prompts you to confirm) would cut daily-use friction significantly.

### Trends / charts dashboard
Year-over-year category spending, savings rate over time, top merchants. The data is all there; just needs a view to surface it. Recharts library is already available in the artifact.

### Export to Excel
For tax prep or year-end review. One-click export of filtered transactions to `.xlsx`. Uses SheetJS, which is already imported.

### Better onboarding for new users
If you ever onboard someone other than Brittany (kids when they're older?), the signup flow needs work. Right now users have to be created manually in Supabase. An invite link system would fix this.

### Bill reminders / approaching budget limits
Notification when an expense category is 80% through its monthly
budget. Would need push notifications, which PWAs support but take
some setup.

### Pet mode for Bailey and Sadie
Auto-categorize any transaction from Chewy/Petsmart into Pets. Low
priority but would be funny.
