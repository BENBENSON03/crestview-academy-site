/* =========================================================
   ANNOUNCEMENTS DATA  (announcements-data.js)
   The ONE place to edit announcements, events and key dates.
   Used by announcements.html and announcement-details.html.

   IMPORTANT: everything below is SAMPLE CONTENT so the design can be tried out.
   Titles, dates and details are NOT real school information. Replace them with
   verified notices before publishing. Set  sample: false  on real items to
   remove the "Sample" badge.

   HOW TO ADD AN ANNOUNCEMENT: copy one object in ANNOUNCEMENTS, give it a new unique id,
   then fill in the fields:
     id               unique text, used in the details link (announcement-details.html?id=...)
     title, date      date format is YYYY-MM-DD
     category         must match one of ANNOUNCEMENT_CATEGORIES
     summary          short text shown on the cards
     content          list of paragraphs for the details page
     image            Unsplash photo id (the part after "photo-") or a full image URL; "" for none
     important        true only when it really is an important notice, with a reason in importantReason
     documents        optional downloads: [{ label: 'Term timetable (PDF)', url: 'files/timetable.pdf' }]
   A frontend-only site cannot publish new notices on its own: edit this file and upload it again,
   or connect a CMS / backend (see the notes delivered with this page).
   ========================================================= */

const ANNOUNCEMENT_CATEGORIES = [
  'General Notices',
  'Academic Updates',
  'Examinations',
  'Admissions',
  'Events and Activities',
  'Holidays and School Closures',
  'Parent Information'
];

// Turns a photo id into a full Unsplash link (or passes a full URL through).
function announcementImage(image, width) {
  if (!image) return '';
  if (/^https?:|^\.{0,2}\//.test(image)) return image;
  return 'https://images.unsplash.com/photo-' + image + '?auto=format&fit=crop&q=75&w=' + (width || 800);
}

const SAMPLE_NOTE = 'This is sample content. The school must replace it with verified information.';

const ANNOUNCEMENTS = [
  {
    id: 'ann-016', sample: true, date: '2026-10-14', category: 'Parent Information',
    title: 'Please Confirm Your Contact Details',
    summary: 'Parents are asked to check that the school has the right phone number and email address on file.',
    content: [
      'Please check that the school office has your current phone number and email address, so that important messages reach you quickly.',
      'How to confirm: [Add the school’s real method, for example a form, a call to the office or a note in the school diary.]',
      'Deadline: [Add date]. Please contact the school office if you have any questions.'
    ],
    image: '1741636174186-3fffe1614c39', imageAlt: 'A notice board covered in flyers and notices',
    important: true, importantReason: 'Action needed from parents',
    documents: []
  },
  {
    id: 'ann-015', sample: true, date: '2026-10-10', category: 'Events and Activities',
    title: 'Inter-House Sports Preparations',
    summary: 'Students will begin practising for the annual inter-house sports. Details of teams and practice times to follow.',
    content: [
      'Preparations for the inter-house sports are starting. Students will be told which house they are in and when practices take place.',
      'Practice times: [Add times]. Kit requirements: [Add kit list].',
      'Parents are welcome to encourage their children at home. The school will confirm the competition date in a separate notice.'
    ],
    image: '1710993115031-682d1a3c6529', imageAlt: 'A running track', important: false, documents: []
  },
  {
    id: 'ann-014', sample: true, date: '2026-10-06', category: 'Academic Updates',
    title: 'Library Reading Challenge Begins',
    summary: 'Students are invited to join a termly reading challenge. Sign-up is through the class teacher.',
    content: [
      'The library is starting a reading challenge to encourage students to read more widely.',
      'Who can join: [Add classes]. How to sign up: [Add steps].',
      'Students who take part will be recognised at [Add where and when].'
    ],
    image: '1599689868384-59cb2b01bb21', imageAlt: 'A child reading a book at a table', important: false, documents: []
  },
  {
    id: 'ann-013', sample: true, date: '2026-10-02', category: 'Examinations',
    title: 'Mid-Term Assessment Arrangements',
    summary: 'Information about how mid-term assessments will be organised and what students should bring.',
    content: [
      'Mid-term assessments help teachers and parents see how students are progressing.',
      'Assessment dates and timetable: [Add dates, once confirmed by the school].',
      'Students should bring: [Add list, for example pens, calculator, geometry set]. Parents should make sure children are well rested and arrive on time.'
    ],
    image: '1773489753005-dba9bf8d72bf', imageAlt: 'A student writing on a blackboard', important: false, documents: []
  },
  {
    id: 'ann-012', sample: true, date: '2026-09-28', category: 'General Notices',
    title: 'School Dress and Grooming Reminder',
    summary: 'A friendly reminder to parents about the school’s dress code and grooming standards.',
    content: [
      'Please remind your child to come to school in the correct uniform every day.',
      'The full dress code: [Add the school’s real dress and grooming policy here].',
      'If your child needs a replacement item, please contact the school office: [Add contact].'
    ],
    image: '1648250537652-a648421c588c', imageAlt: 'Students sitting together on steps', important: false, documents: []
  },
  {
    id: 'ann-011', sample: true, date: '2026-09-22', category: 'Admissions',
    title: 'Admission Enquiries for the Next Session',
    summary: 'Parents who wish to enrol a child for the next session can now make enquiries at the school office.',
    content: [
      'The school is receiving admission enquiries for the next academic session.',
      'Classes with places: [Add classes]. Closing date for applications: [Add date].',
      'Please contact the admissions office for the requirements and the application process: [Add contact].'
    ],
    image: '1590012314607-cda9d9b699ae', imageAlt: 'A school building and students', important: false, documents: []
  },
  {
    id: 'ann-010', sample: true, date: '2026-09-18', category: 'Holidays and School Closures',
    title: 'Public Holiday: School Closed',
    summary: 'The school will be closed for an upcoming public holiday. Normal lessons resume afterwards.',
    content: [
      'The school will be closed on [Add date] for the public holiday.',
      'Normal lessons will continue on [Add date].',
      'Please check this page for any change to the arrangements.'
    ],
    image: '', imageAlt: '', important: false, documents: []
  },
  {
    id: 'ann-009', sample: true, date: '2026-09-15', category: 'Events and Activities',
    title: 'Science and Technology Club Open Session',
    summary: 'Students who enjoy experiments and building projects can visit an open session of the science club.',
    content: [
      'The science and technology club is holding an open session for interested students.',
      'Time and place: [Add time and venue]. Who may attend: [Add classes].',
      'Students should ask their class teacher if they would like to take part.'
    ],
    image: '1758685734153-132c8620c1bd', imageAlt: 'Students doing a chemistry experiment', important: false, documents: []
  },
  {
    id: 'ann-008', sample: true, date: '2026-09-10', category: 'Parent Information',
    title: 'Parent-Teacher Communication Guide',
    summary: 'How parents can contact teachers, and the best times to do so, explained in one place.',
    content: [
      'Good communication between home and school helps every child. This notice explains how to reach your child’s teacher.',
      'Preferred contact method: [Add method]. Best times to call or visit: [Add times].',
      'For urgent matters, please contact the school office: [Add contact].'
    ],
    image: '1765020553499-1ec9aeb21298', imageAlt: 'A speaker addressing a classroom', important: false, documents: []
  },
  {
    id: 'ann-007', sample: true, date: '2026-09-05', category: 'Academic Updates',
    title: 'New Term Timetables Available',
    summary: 'Class timetables for the term are now ready. Students should check them and plan their books and kit.',
    content: [
      'Class timetables for the term have been prepared.',
      'Where to find them: [Add where the timetable is displayed or sent].',
      'Please contact the class teacher if you notice any problem.'
    ],
    image: '1773489753005-dba9bf8d72bf', imageAlt: 'A classroom blackboard', important: false,
    documents: []
  },
  {
    id: 'ann-006', sample: true, date: '2026-08-30', category: 'Examinations',
    title: 'External Examination Registration Reminder',
    summary: 'Students in examination classes and their parents are reminded about registration requirements.',
    content: [
      'Students preparing for external examinations must complete registration on time.',
      'Examinations and requirements: [Add the relevant examinations and documents].',
      'Registration deadline: [Add date]. Please contact the examinations officer: [Add contact].'
    ],
    image: '', imageAlt: '', important: false, documents: []
  },
  {
    id: 'ann-005', sample: true, date: '2026-08-25', category: 'General Notices',
    title: 'Welcome Back to a New Term',
    summary: 'A warm welcome to students, parents and staff as the new term gets under way.',
    content: [
      'We welcome all students, parents and staff to the new term.',
      'Please read the notices on this page regularly. They are updated whenever there is something important to share.',
      'We look forward to a productive term together.'
    ],
    image: '1743032937652-d5e03c3236e1', imageAlt: 'Students gathered inside a school building', important: false, documents: []
  },
  {
    id: 'ann-004', sample: true, date: '2026-08-18', category: 'Holidays and School Closures',
    title: 'End-of-Term Break Arrangements',
    summary: 'Information about the break between terms and the date that lessons resume.',
    content: [
      'The end-of-term break begins on [Add date] and lessons resume on [Add date].',
      'Please confirm these dates with the school office before making travel plans.'
    ],
    image: '', imageAlt: '', important: false, documents: []
  },
  {
    id: 'ann-003', sample: true, date: '2026-08-10', category: 'Events and Activities',
    title: 'Cultural Day Planning Meeting',
    summary: 'Parents and students interested in helping with the cultural day are invited to a planning meeting.',
    content: [
      'Cultural day celebrates the traditions and talents of our school community.',
      'Planning meeting: [Add date, time and place]. Ways to help: [Add ways].',
      'Please tell the class teacher if you would like to take part.'
    ],
    image: '1609422431634-fa33dbeb0c36', imageAlt: 'A theatre troupe on stage', important: false, documents: []
  },
  {
    id: 'ann-002', sample: true, date: '2026-07-28', category: 'Admissions',
    title: 'Open Day Invitation for Prospective Families',
    summary: 'Families thinking of joining the school are invited to visit, meet staff and see the classrooms.',
    content: [
      'The school welcomes prospective families to an open day.',
      'Date and time: [Add once confirmed]. Venue: [Add venue].',
      'Please contact the admissions office to reserve a place: [Add contact].'
    ],
    image: '1633734973050-d6499a977c17', imageAlt: 'Graduates celebrating together', important: false, documents: []
  },
  {
    id: 'ann-001', sample: true, date: '2026-07-15', category: 'General Notices',
    title: 'Summer Break Office Hours',
    summary: 'The school office will keep reduced hours over the break. Please plan visits and calls accordingly.',
    content: [
      'During the break the school office will keep reduced hours: [Add hours].',
      'For urgent matters, please contact: [Add contact].'
    ],
    image: '', imageAlt: '', important: false, documents: []
  }
];

/* UPCOMING EVENTS (Section 7)
   Only confirmed details should appear. Until the school confirms them, the fields are placeholders
   and the card shows "Details to be confirmed". Use  confirmed: true  once real details are filled in.
   If the school already has an events page, set EVENTS_PAGE_URL to link to it. */
const EVENTS_PAGE_URL = 'index.html#news';
const EVENTS = [
  { title: 'School Open Day',            category: 'Admissions',           date: '[Add date]', time: '[Add time]', location: '[Add location]', summary: 'A chance for families to visit the school, meet staff and see the classrooms.', confirmed: false },
  { title: 'Parent-Teacher Meeting',     category: 'Parent Information',   date: '[Add date]', time: '[Add time]', location: '[Add location]', summary: 'Parents meet class teachers to talk about their child’s progress.', confirmed: false },
  { title: 'Inter-House Sports',         category: 'Events and Activities', date: '[Add date]', time: '[Add time]', location: '[Add location]', summary: 'Friendly competition between school houses in athletics and team games.', confirmed: false },
  { title: 'Cultural Day',               category: 'Events and Activities', date: '[Add date]', time: '[Add time]', location: '[Add location]', summary: 'A celebration of culture, music, dress and food from our community.', confirmed: false }
];

/* IMPORTANT DATES (Section 8). Dates are placeholders until the school provides them. */
const KEY_DATES = [
  { label: 'Term resumption',          note: 'First day back for students',          date: '[Add date]', icon: 'calendar' },
  { label: 'Admission deadline',       note: 'Last day for applications',            date: '[Add date]', icon: 'pencil' },
  { label: 'Parent-teacher meeting',   note: 'Meet your child’s teacher',       date: '[Add date]', icon: 'users' },
  { label: 'Mid-term break',           note: 'Short break during the term',          date: '[Add dates]', icon: 'sun' },
  { label: 'Examination period',       note: 'Term examinations begin',              date: '[Add dates]', icon: 'book' },
  { label: 'Holiday period',           note: 'End-of-term break',                    date: '[Add dates]', icon: 'star' }
];
