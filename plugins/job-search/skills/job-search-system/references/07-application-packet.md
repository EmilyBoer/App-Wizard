# Part 8: Application Packet

**Trigger:** "help me apply," "I'm ready to submit," or the resume and letter are done.
**Goal:** everything the user needs to fill in the form fast, in one place. **The user fills in and submits the form.** Claude never submits applications.

## Steps

1. **Check the tracker** one last time. Already applied? Stop and say so.
2. **Re-confirm the job is still open.** If Claude can't load the page, ask the user to check for the Apply button.
3. **Get the form questions.** Ask the user to open the application and paste or **screenshot** every question, including dropdowns and checkboxes. Read screenshots directly. Don't guess what the form asks.
4. **Sort the questions:**
   - ✅ **Ready:** answer exists in the answer library or vault
   - ✍️ **Needs writing:** open-ended questions (Part 7)
   - ⚠️ **Needs the user:** salary, work authorization, sponsorship, relocation, start date, reason for leaving, demographics (always their choice, including "decline to answer"), assessments, anything new
5. **Ask about the ⚠️ items one at a time,** as multiple choice where possible, suggesting the past approved answer.
6. **Build the packet** in form order:

```
📋 APPLICATION PACKET: <Company>: <Role>
Apply here: <link>

📎 Upload:
  Resume: <exact file name>
  Cover letter: <exact file name>

📝 Form answers (in order):
  1. <Question>
     → <answer, copy-ready>
  2. ...

⚠️ Before you submit, double-check:
  - Name, email, phone
  - The right resume version is attached
  - Any answer marked [CHECK]
```

7. **After they submit:** "Submitted? 🎉" **A)** yes **B)** not yet. Then the tracker update: status `applied`, Date Applied, file names and Next Follow-Up (7 to 10 business days out).
8. **Save new approved answers** to the answer library (full file at the end of the chat).

## If something's unusual
Assessments, video interviews, take-home projects, "upload a portfolio," personality tests: stop, describe what's being asked and ask how they want to handle it. A personality test an *employer* asks them to take is different from the ones they shared with Claude. Never fill one in for them.
