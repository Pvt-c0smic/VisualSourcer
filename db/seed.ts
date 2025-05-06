import { db } from "./index";
import * as schema from "@shared/schema";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { defaultCertificateTemplate } from "../server/services/pdf.service";

async function seed() {
  try {
    console.log("Starting database seed...");

    // ----------------------------------------
    // Create Users with different roles
    // ----------------------------------------
    const hashedPassword = await bcrypt.hash("password123", 10);
    
    // Check if admin already exists
    const existingAdmin = await db.query.users.findFirst({
      where: eq(schema.users.username, "admin")
    });

    if (!existingAdmin) {
      console.log("Creating admin user...");
      await db.insert(schema.users).values({
        username: "admin",
        password: hashedPassword,
        name: "System Administrator",
        email: "admin@military-lms.com",
        role: "admin",
        rank: "LTC",
        unit: "HQ"
      });
    }

    // Create trainer if doesn't exist
    const existingTrainer = await db.query.users.findFirst({
      where: eq(schema.users.username, "trainer")
    });

    if (!existingTrainer) {
      console.log("Creating trainer user...");
      await db.insert(schema.users).values({
        username: "trainer",
        password: hashedPassword,
        name: "Lead Trainer",
        email: "trainer@military-lms.com",
        role: "trainer",
        rank: "MAJ",
        unit: "NETBn Training Div"
      });
    }

    // Create training director if doesn't exist
    const existingDirector = await db.query.users.findFirst({
      where: eq(schema.users.username, "director")
    });

    if (!existingDirector) {
      console.log("Creating training director user...");
      await db.insert(schema.users).values({
        username: "director",
        password: hashedPassword,
        name: "Training Director",
        email: "director@military-lms.com",
        role: "training_director",
        rank: "COL",
        unit: "NETBn HQ"
      });
    }

    // Create trainees if they don't exist
    const existingTrainee1 = await db.query.users.findFirst({
      where: eq(schema.users.username, "trainee1")
    });

    if (!existingTrainee1) {
      console.log("Creating trainee users...");
      await db.insert(schema.users).values([
        {
          username: "trainee1",
          password: hashedPassword,
          name: "Cyber Trainee",
          email: "trainee1@military-lms.com",
          role: "trainee",
          rank: "CPT",
          unit: "NETBn Cyber Sec",
          skillSets: [
            { id: 1, name: "Cybersecurity", category: "Technical", level: 2 }
          ]
        },
        {
          username: "trainee2",
          password: hashedPassword,
          name: "Network Trainee",
          email: "trainee2@military-lms.com",
          role: "trainee",
          rank: "LT",
          unit: "NETBn Network Ops",
          skillSets: [
            { id: 2, name: "Networking", category: "Technical", level: 1 }
          ]
        },
        {
          username: "trainee3",
          password: hashedPassword,
          name: "System Admin Trainee",
          email: "trainee3@military-lms.com",
          role: "trainee",
          rank: "WO1",
          unit: "NETBn System Admin",
          skillSets: [
            { id: 3, name: "System Administration", category: "Technical", level: 3 }
          ]
        }
      ]);
    }

    // ----------------------------------------
    // Create Skill Sets
    // ----------------------------------------
    const existingSkillSet = await db.query.skillSets.findFirst({
      where: eq(schema.skillSets.name, "Cybersecurity")
    });

    if (!existingSkillSet) {
      console.log("Creating skill sets...");
      await db.insert(schema.skillSets).values([
        {
          name: "Cybersecurity",
          category: "Technical",
          level: 4, // Maximum level available
          description: "Security measures to protect networked systems from unauthorized access"
        },
        {
          name: "Networking",
          category: "Technical",
          level: 4,
          description: "Design, implementation and management of computer networks"
        },
        {
          name: "System Administration",
          category: "Technical",
          level: 4,
          description: "Management and maintenance of computer systems and servers"
        },
        {
          name: "Command and Control",
          category: "Leadership",
          level: 4,
          description: "Decision-making and directive authority in operations"
        },
        {
          name: "Information Operations",
          category: "Operational",
          level: 4,
          description: "Integrated employment of information capabilities"
        }
      ]);
    }

    // ----------------------------------------
    // Get admin and trainer user IDs for reference
    // ----------------------------------------
    const admin = await db.query.users.findFirst({
      where: eq(schema.users.username, "admin")
    });
    
    const trainer = await db.query.users.findFirst({
      where: eq(schema.users.username, "trainer")
    });

    if (!admin || !trainer) {
      throw new Error("Required users not found");
    }

    // ----------------------------------------
    // Create Programs
    // ----------------------------------------
    const existingProgram = await db.query.programs.findFirst({
      where: eq(schema.programs.code, "CYBR-101")
    });

    // Get skill set IDs
    const cybersecuritySkill = await db.query.skillSets.findFirst({
      where: eq(schema.skillSets.name, "Cybersecurity")
    });
    
    const networkingSkill = await db.query.skillSets.findFirst({
      where: eq(schema.skillSets.name, "Networking")
    });
    
    const sysadminSkill = await db.query.skillSets.findFirst({
      where: eq(schema.skillSets.name, "System Administration")
    });

    if (!existingProgram && cybersecuritySkill && networkingSkill && sysadminSkill) {
      console.log("Creating training programs...");
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 7); // Start next week

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30); // Start in a month

      await db.insert(schema.programs).values([
        {
          code: "CYBR-101",
          name: "Cybersecurity Fundamentals",
          description: "Introduction to cybersecurity principles and practices for network battalion personnel",
          skillSetId: cybersecuritySkill.id,
          skillSetLevel: 1,
          startDate: startDate,
          duration: "2 weeks",
          capacity: 20,
          venue: "Face-to-Face",
          location: "Building 203, Training Center",
          objectives: [
            "Understand basic cybersecurity concepts",
            "Identify common cyber threats",
            "Apply basic security controls",
            "Perform vulnerability assessments"
          ],
          prerequisites: [
            "Basic computer knowledge",
            "Network fundamentals"
          ],
          status: "Open",
          passingScore: 75,
          certificateTitle: "Certificate of Completion - Cybersecurity Fundamentals",
          createdById: trainer.id
        },
        {
          code: "NET-201",
          name: "Advanced Networking",
          description: "Advanced networking concepts for military network operations",
          skillSetId: networkingSkill.id,
          skillSetLevel: 2,
          startDate: futureDate,
          duration: "3 weeks",
          capacity: 15,
          venue: "VTC",
          location: "Virtual Training Center",
          objectives: [
            "Configure complex network topologies",
            "Implement routing protocols",
            "Deploy secure network services",
            "Perform network troubleshooting"
          ],
          prerequisites: [
            "Basic networking knowledge",
            "TCP/IP fundamentals",
            "Router/switch experience"
          ],
          status: "Open",
          passingScore: 80,
          certificateTitle: "Certificate of Proficiency - Advanced Networking",
          createdById: trainer.id
        },
        {
          code: "SYSADM-301",
          name: "Military System Administration",
          description: "System administration skills tailored for military computing environments",
          skillSetId: sysadminSkill.id,
          skillSetLevel: 3,
          startDate: futureDate,
          duration: "4 weeks",
          capacity: 10,
          venue: "Face-to-Face",
          location: "Building 305, Technical Training Facility",
          objectives: [
            "Manage military-grade servers",
            "Implement security policies",
            "Perform system hardening",
            "Execute disaster recovery procedures"
          ],
          prerequisites: [
            "Basic Linux administration",
            "Windows Server experience",
            "Security clearance"
          ],
          status: "Open",
          passingScore: 85,
          certificateTitle: "Certificate of Expertise - Military System Administration",
          createdById: trainer.id
        }
      ]);
    }

    // ----------------------------------------
    // Create Program Modules
    // ----------------------------------------
    const cyberProgram = await db.query.programs.findFirst({
      where: eq(schema.programs.code, "CYBR-101")
    });

    const networkProgram = await db.query.programs.findFirst({
      where: eq(schema.programs.code, "NET-201")
    });

    const sysadminProgram = await db.query.programs.findFirst({
      where: eq(schema.programs.code, "SYSADM-301")
    });

    if (cyberProgram) {
      const existingModule = await db.query.programModules.findFirst({
        where: eq(schema.programModules.programId, cyberProgram.id)
      });

      if (!existingModule) {
        console.log("Creating program modules...");
        await db.insert(schema.programModules).values([
          {
            programId: cyberProgram.id,
            title: "Introduction to Cybersecurity",
            description: "Overview of cybersecurity principles and importance in military operations",
            content: "# Module 1: Introduction to Cybersecurity\n\nThis module covers the fundamental concepts of cybersecurity with a focus on military applications...",
            order: 1,
            estimatedDuration: "2 days"
          },
          {
            programId: cyberProgram.id,
            title: "Threat Intelligence",
            description: "Understanding cyber threats and attack vectors",
            content: "# Module 2: Threat Intelligence\n\nThis module explores common attack vectors and how to identify potential threats...",
            order: 2,
            estimatedDuration: "2 days"
          },
          {
            programId: cyberProgram.id,
            title: "Security Controls",
            description: "Implementing effective security controls",
            content: "# Module 3: Security Controls\n\nThis module addresses the implementation of security controls according to military standards...",
            order: 3,
            estimatedDuration: "3 days"
          },
          {
            programId: cyberProgram.id,
            title: "Vulnerability Assessment",
            description: "Techniques for identifying and addressing vulnerabilities",
            content: "# Module 4: Vulnerability Assessment\n\nThis module covers methodologies for conducting vulnerability assessments on military networks...",
            order: 4,
            estimatedDuration: "3 days"
          }
        ]);
      }
    }

    if (networkProgram) {
      const existingModule = await db.query.programModules.findFirst({
        where: eq(schema.programModules.programId, networkProgram.id)
      });

      if (!existingModule) {
        await db.insert(schema.programModules).values([
          {
            programId: networkProgram.id,
            title: "Advanced Routing Protocols",
            description: "Implementation of OSPF, BGP, and military-specific routing protocols",
            content: "# Module 1: Advanced Routing Protocols\n\nThis module covers advanced routing configurations for military network environments...",
            order: 1,
            estimatedDuration: "4 days"
          },
          {
            programId: networkProgram.id,
            title: "Secure Network Services",
            description: "Deployment and hardening of critical network services",
            content: "# Module 2: Secure Network Services\n\nThis module focuses on secure implementation of DNS, DHCP, and other critical services...",
            order: 2,
            estimatedDuration: "3 days"
          },
          {
            programId: networkProgram.id,
            title: "Network Monitoring",
            description: "Tools and techniques for effective network monitoring",
            content: "# Module 3: Network Monitoring\n\nThis module explores network monitoring tools and techniques for military networks...",
            order: 3,
            estimatedDuration: "4 days"
          },
          {
            programId: networkProgram.id,
            title: "Tactical Communications",
            description: "Field-deployable network solutions",
            content: "# Module 4: Tactical Communications\n\nThis module covers rapid deployment of field communications in tactical environments...",
            order: 4,
            estimatedDuration: "4 days"
          }
        ]);
      }
    }
    
    // ----------------------------------------
    // Create Certificate Template
    // ----------------------------------------
    const existingTemplate = await db.query.certificateTemplates.findFirst({
      where: eq(schema.certificateTemplates.name, "Military Training Certificate")
    });

    if (!existingTemplate && admin) {
      console.log("Creating certificate template...");
      await db.insert(schema.certificateTemplates).values({
        name: "Military Training Certificate",
        description: "Official training certificate for completed military courses",
        htmlTemplate: defaultCertificateTemplate,
        isDefault: true,
        createdById: admin.id
      });
    }

    // ----------------------------------------
    // Create sample meetings
    // ----------------------------------------
    const trainees = await db.query.users.findMany({
      where: eq(schema.users.role, "trainee")
    });

    const director = await db.query.users.findFirst({
      where: eq(schema.users.username, "director")
    });

    if (trainer && trainees.length > 0 && director) {
      const existingMeeting = await db.query.meetings.findFirst({
        where: eq(schema.meetings.title, "Training Planning Session")
      });

      if (!existingMeeting) {
        console.log("Creating sample meetings...");
        const meetingDate = new Date();
        meetingDate.setDate(meetingDate.getDate() + 2); // Meeting in 2 days
        meetingDate.setHours(10, 0, 0, 0); // 10:00 AM

        const endDate = new Date(meetingDate);
        endDate.setHours(11, 30, 0, 0); // 11:30 AM

        // Create meeting
        const [meeting] = await db.insert(schema.meetings).values({
          title: "Training Planning Session",
          description: "Quarterly planning session for upcoming training programs",
          startTime: meetingDate,
          endTime: endDate,
          location: "Building 101, Conference Room A",
          type: "Face-to-Face",
          agenda: [
            "Review previous quarter training results",
            "Discuss new training requirements",
            "Assign instructors to upcoming courses",
            "Equipment and resource allocation"
          ],
          status: "Scheduled",
          createdById: trainer.id
        }).returning();

        // Add meeting participants
        if (meeting) {
          await db.insert(schema.meetingParticipants).values([
            {
              meetingId: meeting.id,
              userId: trainer.id,
              role: "Organizer",
              status: "Confirmed"
            },
            {
              meetingId: meeting.id,
              userId: director.id,
              role: "Presenter",
              status: "Confirmed"
            },
            // Add first trainee as attendee
            {
              meetingId: meeting.id,
              userId: trainees[0].id,
              role: "Attendee",
              status: "Pending"
            }
          ]);
        }

        // Create a VTC meeting
        const vtcDate = new Date();
        vtcDate.setDate(vtcDate.getDate() + 5); // Meeting in 5 days
        vtcDate.setHours(14, 0, 0, 0); // 2:00 PM

        const vtcEndDate = new Date(vtcDate);
        vtcEndDate.setHours(15, 0, 0, 0); // 3:00 PM

        const [vtcMeeting] = await db.insert(schema.meetings).values({
          title: "Cybersecurity Update Briefing",
          description: "Monthly update on cybersecurity threats and countermeasures",
          startTime: vtcDate,
          endTime: vtcEndDate,
          location: "Virtual Training Center",
          type: "VTC",
          agenda: [
            "Recent cyber incidents review",
            "New threat vectors identification",
            "Updated security protocols",
            "Q&A session"
          ],
          status: "Scheduled",
          createdById: trainer.id
        }).returning();

        // Add VTC meeting participants
        if (vtcMeeting) {
          const participantValues = [
            {
              meetingId: vtcMeeting.id,
              userId: trainer.id,
              role: "Presenter",
              status: "Confirmed"
            }
          ];

          // Add all trainees as attendees
          trainees.forEach(trainee => {
            participantValues.push({
              meetingId: vtcMeeting.id,
              userId: trainee.id,
              role: "Attendee",
              status: "Pending"
            });
          });

          await db.insert(schema.meetingParticipants).values(participantValues);
        }
      }
    }

    console.log("Database seed completed successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

seed();
