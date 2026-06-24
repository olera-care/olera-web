# Student Caregiver Program — Provider Service Agreement (source)

This is the canonical text for the Olera Student Caregiver Program
provider service agreement that gets attached to the Step 1 post-consent
email. It is kept
here in markdown so it stays diffable and reviewable; the actual binary
PDF that gets attached lives in Supabase Storage.

## Generating + uploading the PDF

For MVP, this is a manual one-time step (dynamic per-provider PDFs are
intentionally deferred — see `docs/STAFFING_OUTREACH_DEFERRED.md`).

1. Convert this markdown to PDF using any tool you like — pandoc, the
   browser print-to-PDF dialog, or a Mac Quick Look export. Keep
   formatting clean; this is a legal document.
2. Filename: `olera-student-caregiver-pilot-agreement.pdf`
3. Upload to Supabase Storage:
   - Bucket: `pilot-agreements` (create if missing, public read)
   - Path: `olera-student-caregiver-pilot-agreement.pdf`
4. Copy the public URL and set it as an env var:
   ```
   PILOT_AGREEMENT_PDF_URL=https://<project>.supabase.co/storage/v1/object/public/pilot-agreements/olera-student-caregiver-pilot-agreement.pdf
   ```
5. PR 2's email-send code reads `PILOT_AGREEMENT_PDF_URL` to attach the
   agreement to the Step 1 email and reference it in the T&C modal.

When the agreement copy changes, edit this file, regenerate the PDF, and
re-upload (overwriting the same path so URL stays stable).

---

## Student Caregiver Program — Provider Service Agreement

**Olera, Inc. — Student Caregiver Program**

**Parties.** This Service Agreement (the "Agreement") is entered into
between Olera, Inc. ("Olera") and Provider User ("Provider"), effective
on the date last signed below.

**Term.** This Agreement begins on the effective date and continues until
either party ends it with written notice. Ending it does not affect
placements already made.

**Scope.** Olera will recruit and vet pre-nursing and pre-medical
students from recruitment channels at partner universities and match
them to Provider as candidate caregivers. Provider receives a free
account with access to the candidate board hosted on the Olera, Inc.
website (https://olera.care/medjobs/candidates), where Provider may
review student profiles, invite candidates to interview, and make hiring
offers. Provider is free to browse, interview, and connect at no cost.

**Cost.** There is no fee to browse, interview, or connect with students,
and no payment information is required to create an account or review
candidates. Provider pays Olera a one-time placement fee of $200 for each
student it hires, invoiced after the hire. If a hired student works fewer
than fifteen (15) hours, Olera refunds that placement fee in full.

**Feedback and research participation (optional).** Olera may request
feedback on the Provider's experience during participation, the
candidate board interview scheduling system, or on any individual
students Provider interviews or hires. Olera may also invite Provider,
students, and where appropriate and with Provider permission, clients to
participate in providing feedback on their experience participating in
the program. This may be feedback sessions, surveys, or other formal or
informal ways to assess the experience participating in the program for
program improvement and validation purposes. All participation in
feedback and research participation is optional and at the discretion of
the Provider. Olera will be mindful of privacy and will not share
participant-identifiable feedback externally without consent.

**Hiring and employment.** Any hiring decisions and employment
relationships are between Provider and the student. Olera is not the
employer of any student and is not a staffing agency or employment
agency. Provider is responsible for its own hiring practices, background
checks, and compliance with applicable employment laws.

**Confidentiality.** Each party will keep non-public information shared
by the other party confidential and use it only for purposes of the
program.

**Limitation of liability.** The platform and services are provided
as-is. Olera is not liable for indirect or consequential damages arising
from use of the platform or from any hiring or employment decision made
by Provider.

**General.** This Agreement is the entire agreement between the parties
regarding the program. It is governed by the laws of the State of Texas.
Amendments must be in writing and signed by both parties.
