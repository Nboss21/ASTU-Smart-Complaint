import { KnowledgeBaseDocument } from "../models/KnowledgeBaseDocument";
import { ingestTextAsChunks } from "./kbIngestion.service";

export async function seedInitialKnowledgeBase() {
  try {
    const total = await KnowledgeBaseDocument.countDocuments();
    if (total > 0) {
      return;
    }

    const seeds = [
      {
        baseTitle: "How the ASTU Complaint & Support Assistant Works",
        content:
          "This assistant is designed to help ASTU students and staff understand and navigate the university's complaint and support processes. " +
          "You can ask about how to submit a complaint, what each category means, typical timelines, and who is responsible for different types of issues. " +
          "The assistant cannot change records or make decisions; it only explains the process and points you to the right channels.\n\n" +
          "When you submit a complaint, it is routed to the appropriate unit (academics, hostel, finance, facilities, student services, or administration) based on the category you select. " +
          "Staff and administrators then review, update the status, and may request additional information. You will see status updates inside the portal and may receive notifications.\n\n" +
          "The categories in the system are: Academics & Examination, Facilities & Infrastructure, Hostel & Accommodation, Finance & Fees, Student Services & Welfare, and Administration & Policy. " +
          "Choose the category that best matches the main nature of your issue. If you are unsure, you can still file the complaint and staff may recategorize it internally.",
        sourceType: "policy" as const,
        category: "Administration & Policy",
        tags: ["overview", "assistant", "process"],
      },
      {
        baseTitle: "ASTU Complaint Categories and Examples",
        content:
          "Academics & Examination: For issues related to teaching, course content, exam timetables, grading disputes, missing marks, academic advising, and progression rules.\n\n" +
          "Facilities & Infrastructure: For problems with classrooms, laboratories, libraries, internet and network access, electricity, water, sanitation, and other physical infrastructure on campus.\n\n" +
          "Hostel & Accommodation: For concerns about hostel rooms, allocation, roommate conflicts, noise, security in residences, cleanliness, water supply, and hostel rules.\n\n" +
          "Finance & Fees: For questions and issues about tuition payments, payment deadlines, penalties, scholarships, stipends, refunds, invoices, and finance office communication.\n\n" +
          "Student Services & Welfare: For counseling, health services, mental health support, extracurricular activities, clubs, events, and general student well-being.\n\n" +
          "Administration & Policy: For issues related to registration, academic calendar, regulations, disciplinary processes, documentation (ID cards, transcripts, letters), and other governance matters.",
        sourceType: "policy" as const,
        category: "Administration & Policy",
        tags: ["categories", "examples"],
      },
      {
        baseTitle: "Frequently Asked Questions about Complaints at ASTU",
        content:
          "Q: When should I use this complaint system?\n" +
          "A: Use it whenever you experience a problem that affects your learning, living conditions, safety, finances, or access to university services, and you need formal follow-up from the university.\n\n" +
          "Q: How do I submit a complaint?\n" +
          "A: Log in to the portal, go to the complaints section, choose the most relevant category, write a clear title and detailed description, optionally attach supporting documents (such as screenshots, letters, or forms), and then submit.\n\n" +
          "Q: What makes a good complaint description?\n" +
          "A: Be specific about dates, locations, people involved (if appropriate), and what impact the issue has on you. Focus on facts, avoid abusive language, and clearly state what kind of resolution you are hoping for.\n\n" +
          "Q: How long does it take to get a response?\n" +
          "A: Timelines depend on the complexity of the issue and the responsible unit. Simple issues may be addressed within a few working days, while complex academic or disciplinary matters can take longer. If you see no update for an extended period, you may contact the relevant office or raise a follow-up.\n\n" +
          "Q: Who can see my complaint?\n" +
          "A: Only authorized staff and administrators in the units responsible for handling your category can see and work on your complaint. The system aims to protect your privacy while allowing the right people to resolve your issue.",
        sourceType: "faq" as const,
        category: "Administration & Policy",
        tags: ["faq", "students"],
      },
      {
        baseTitle: "Guidelines for Staff Handling Student Complaints",
        content:
          "Staff members are expected to handle complaints in a timely, fair, and transparent manner. Each complaint should be acknowledged, reviewed, and updated in the system as it moves through different stages.\n\n" +
          "Status updates such as 'received', 'in review', 'awaiting information', 'resolved', or 'closed' should accurately reflect the current state. Remarks should be written in clear, professional language and avoid any sensitive personal information that is not necessary for resolving the case.\n\n" +
          "When appropriate, staff should contact the student for clarification or additional documents. Decisions and outcomes should be consistent with ASTU policies and communicated clearly through the portal and, where needed, via official email.\n\n" +
          "If a complaint falls outside the scope of your unit, reassign it or consult the relevant office rather than leaving it unresolved. Escalate serious or urgent issues (for example, safety, discrimination, or harassment) according to institutional procedures.",
        sourceType: "policy" as const,
        category: "Administration & Policy",
        tags: ["staff", "guidelines"],
      },
      {
        baseTitle: "Student Conduct and Respectful Communication in Complaints",
        content:
          "Students are encouraged to communicate respectfully and constructively when using the complaint system. The purpose is to solve problems and improve the university environment, not to insult or attack individuals.\n\n" +
          "Complaints should focus on behaviors, decisions, and conditions rather than personal attacks. Avoid offensive language, threats, or discrimination. Submitting false information or abusing the system may lead to disciplinary action under university regulations.\n\n" +
          "At the same time, ASTU is committed to taking student concerns seriously. You have the right to raise issues without fear of retaliation, and sensitive matters should be handled confidentially by appropriate offices.",
        sourceType: "policy" as const,
        category: "Student Services & Welfare",
        tags: ["conduct", "respect"],
      },
    ];

    for (const seed of seeds) {
      await ingestTextAsChunks({
        baseTitle: seed.baseTitle,
        content: seed.content,
        sourceType: seed.sourceType,
        category: seed.category,
        tags: seed.tags,
        isPublic: true,
      });
    }

    console.log("Seeded initial knowledge base documents");
  } catch (err) {
    console.error("Failed to seed initial knowledge base", err);
  }
}
