
import bcrypt from 'bcryptjs'
import { prisma } from '../utils/prismaClient'

async function main() {
  console.log('🌱 Starting database seeding...')

  // Create roles
  console.log('📝 Creating roles...')
  const adminRole = await prisma.roles.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      code: 'ADMIN'
    }
  })

  const userRole = await prisma.roles.upsert({
    where: { name: 'USER' },
    update: {},
    create: {
      name: 'USER',
      code: 'USER'
    }
  })

  const recruiterRole = await prisma.roles.upsert({
    where: { name: 'RECRUITER' },
    update: {},
    create: {
      name: 'RECRUITER',
      code: 'RECRUITER'
    }
  })

  console.log('✅ Roles created:', { adminRole, userRole, recruiterRole })

  // Create company types
  console.log('🏢 Creating company types...')
  const techCompanyType = await prisma.companytypes.upsert({
    where: { name: 'Technology' },
    update: {},
    create: {
      name: 'Technology',
      description: 'Software development, IT services, and tech startups'
    }
  })

  const financeCompanyType = await prisma.companytypes.upsert({
    where: { name: 'Finance' },
    update: {},
    create: {
      name: 'Finance',
      description: 'Banking, investment, and financial services'
    }
  })

  const healthcareCompanyType = await prisma.companytypes.upsert({
    where: { name: 'Healthcare' },
    update: {},
    create: {
      name: 'Healthcare',
      description: 'Medical services, pharmaceuticals, and healthcare technology'
    }
  })

  const educationCompanyType = await prisma.companytypes.upsert({
    where: { name: 'Education' },
    update: {},
    create: {
      name: 'Education',
      description: 'Educational institutions and edtech companies'
    }
  })

  console.log('✅ Company types created')

  // Create job types
  console.log('💼 Creating job types...')
  const fullTimeJobType = await prisma.jobtypes.upsert({
    where: { name: 'Full Time' },
    update: {},
    create: {
      name: 'Full Time',
      description: 'Full-time employment with benefits'
    }
  })

  const partTimeJobType = await prisma.jobtypes.upsert({
    where: { name: 'Part Time' },
    update: {},
    create: {
      name: 'Part Time',
      description: 'Part-time employment'
    }
  })

  const contractJobType = await prisma.jobtypes.upsert({
    where: { name: 'Contract' },
    update: {},
    create: {
      name: 'Contract',
      description: 'Contract-based work'
    }
  })

  const internshipJobType = await prisma.jobtypes.upsert({
    where: { name: 'Internship' },
    update: {},
    create: {
      name: 'Internship',
      description: 'Internship opportunities'
    }
  })

  const freelanceJobType = await prisma.jobtypes.upsert({
    where: { name: 'Freelance' },
    update: {},
    create: {
      name: 'Freelance',
      description: 'Freelance and project-based work'
    }
  })

  console.log('✅ Job types created')

  // Create sample companies
  console.log('🏢 Creating sample companies...')
  const techCorp = await prisma.companies.upsert({
    where: { email: 'hr@techcorp.com' },
    update: {},
    create: {
      name: 'TechCorp Solutions',
      email: 'hr@techcorp.com',
      website: 'https://techcorp.com',
      logo: 'https://via.placeholder.com/150x150/3B82F6/FFFFFF?text=TC',
      postlimit: 10
    }
  })

  const startupHub = await prisma.companies.upsert({
    where: { email: 'careers@startuphub.com' },
    update: {},
    create: {
      name: 'StartupHub',
      email: 'careers@startuphub.com',
      website: 'https://startuphub.com',
      logo: 'https://via.placeholder.com/150x150/DC2626/FFFFFF?text=SH',
      postlimit: 5
    }
  })

  const financeGroup = await prisma.companies.upsert({
    where: { email: 'jobs@financegroup.com' },
    update: {},
    create: {
      name: 'Finance Group Inc',
      email: 'jobs@financegroup.com',
      website: 'https://financegroup.com',
      logo: 'https://via.placeholder.com/150x150/059669/FFFFFF?text=FG',
      postlimit: 8
    }
  })

  console.log('✅ Sample companies created')

  // Create admin user
  console.log('👤 Creating admin user...')
  const adminPassword = await bcrypt.hash('Admin123!', 10)
  const adminUser = await prisma.users.upsert({
    where: { email: 'admin@interviewapp.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@interviewapp.com',
      password: adminPassword,
      phone: '+1-555-0001',
      roleId: adminRole.id
    }
  })

  // Create sample recruiter
  console.log('👤 Creating sample recruiter...')
  const recruiterPassword = await bcrypt.hash('Recruiter123!', 10)
  const recruiterUser = await prisma.users.upsert({
    where: { email: 'recruiter@techcorp.com' },
    update: {},
    create: {
      name: 'Sarah Johnson',
      email: 'recruiter@techcorp.com',
      password: recruiterPassword,
      phone: '+1-555-0002',
      roleId: recruiterRole.id,
      companyId: techCorp.id
    }
  })

  // Create sample users
  console.log('👤 Creating sample users...')
  const userPassword = await bcrypt.hash('User123!', 10)
  
  const johnDoe = await prisma.users.upsert({
    where: { email: 'john.doe@email.com' },
    update: {},
    create: {
      name: 'John Doe',
      email: 'john.doe@email.com',
      password: userPassword,
      phone: '+1-555-0003',
      roleId: userRole.id
    }
  })

  const janeSmith = await prisma.users.upsert({
    where: { email: 'jane.smith@email.com' },
    update: {},
    create: {
      name: 'Jane Smith',
      email: 'jane.smith@email.com',
      password: userPassword,
      phone: '+1-555-0004',
      roleId: userRole.id
    }
  })

  const mikeWilson = await prisma.users.upsert({
    where: { email: 'mike.wilson@email.com' },
    update: {},
    create: {
      name: 'Mike Wilson',
      email: 'mike.wilson@email.com',
      password: userPassword,
      phone: '+1-555-0005',
      roleId: userRole.id
    }
  })

  console.log('✅ Sample users created')

  // Create user details
  console.log('📋 Creating user details...')
  await prisma.userdetails.upsert({
    where: { userId: johnDoe.id },
    update: {},
    create: {
      userId: johnDoe.id,
      experience: 3,
      phone: '+1-555-0003',
      resumelink: 'https://example.com/resumes/john-doe-resume.pdf',
      skills: ['JavaScript', 'React', 'Node.js', 'TypeScript', 'MongoDB'],
      location: 'San Francisco, CA',
      bio: 'Full-stack developer with 3 years of experience in modern web technologies.',
      linkedin: 'https://linkedin.com/in/johndoe',
      portfolio: 'https://johndoe.dev',
      github: 'https://github.com/johndoe',
      expected_salary: 80000,
      availability: 'Available immediately'
    }
  })

  await prisma.userdetails.upsert({
    where: { userId: janeSmith.id },
    update: {},
    create: {
      userId: janeSmith.id,
      experience: 5,
      phone: '+1-555-0004',
      resumelink: 'https://example.com/resumes/jane-smith-resume.pdf',
      skills: ['Python', 'Django', 'PostgreSQL', 'AWS', 'Docker'],
      location: 'New York, NY',
      bio: 'Senior backend developer specializing in Python and cloud technologies.',
      linkedin: 'https://linkedin.com/in/janesmith',
      portfolio: 'https://janesmith.dev',
      github: 'https://github.com/janesmith',
      expected_salary: 95000,
      availability: 'Available in 2 weeks'
    }
  })

  await prisma.userdetails.upsert({
    where: { userId: mikeWilson.id },
    update: {},
    create: {
      userId: mikeWilson.id,
      experience: 2,
      phone: '+1-555-0005',
      resumelink: 'https://example.com/resumes/mike-wilson-resume.pdf',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Git', 'Agile'],
      location: 'Austin, TX',
      bio: 'Junior software developer with strong foundation in Java and Spring framework.',
      linkedin: 'https://linkedin.com/in/mikewilson',
      portfolio: 'https://mikewilson.dev',
      github: 'https://github.com/mikewilson',
      expected_salary: 65000,
      availability: 'Available immediately'
    }
  })

  console.log('✅ User details created')

  // Create sample jobs
  console.log('💼 Creating sample jobs...')
  const seniorDevJob = await prisma.jobs.create({
    data: {
      title: 'Senior Full Stack Developer',
      description: 'We are looking for an experienced full-stack developer to join our growing team. You will work on cutting-edge web applications using modern technologies.',
      companyid: techCorp.id,
      jobtypeid: fullTimeJobType.id,
      location: 'San Francisco, CA',
      isremote: true,
      salarymin: 90000,
      salarymax: 120000,
      salarycurrency: 'USD',
      requirements: '5+ years of experience with React, Node.js, and TypeScript. Experience with cloud platforms (AWS/Azure). Strong problem-solving skills.',
      responsibilities: 'Develop and maintain web applications, collaborate with cross-functional teams, mentor junior developers, participate in code reviews.',
      benefits: 'Health insurance, 401k matching, flexible work hours, professional development budget, stock options.',
      contactemail: 'hr@techcorp.com',
      applicationdeadline: new Date('2024-12-31'),
      experiencerequired: 5,
      educationlevel: 'Bachelor\'s Degree',
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
      isactive: true,
      isfeatured: true,
      postedby: recruiterUser.id
    }
  })

  const juniorDevJob = await prisma.jobs.create({
    data: {
      title: 'Junior Software Developer',
      description: 'Perfect opportunity for recent graduates or career changers. We provide mentorship and training to help you grow in your software development career.',
      companyid: startupHub.id,
      jobtypeid: fullTimeJobType.id,
      location: 'Austin, TX',
      isremote: true,
      salarymin: 60000,
      salarymax: 80000,
      salarycurrency: 'USD',
      requirements: 'Basic knowledge of programming languages (Java, Python, or JavaScript), understanding of software development fundamentals, eagerness to learn.',
      responsibilities: 'Write clean, maintainable code, participate in code reviews, work on bug fixes and small features, collaborate with senior developers.',
      benefits: 'Mentorship program, flexible schedule, health insurance, professional development, equity participation.',
      contactemail: 'jobs@startuphub.com',
      applicationdeadline: new Date('2024-11-25'),
      experiencerequired: 0,
      educationlevel: 'Bachelor\'s Degree',
      skills: ['Java', 'Python', 'JavaScript', 'Git', 'Agile'],
      isactive: true,
      isfeatured: false,
      postedby: recruiterUser.id
    }
  })

  const dataAnalystJob = await prisma.jobs.create({
    data: {
      title: 'Data Analyst',
      description: 'Join our data team to analyze financial data and provide insights that drive business decisions. Work with large datasets and modern analytics tools.',
      companyid: financeGroup.id,
      jobtypeid: fullTimeJobType.id,
      location: 'New York, NY',
      isremote: false,
      salarymin: 70000,
      salarymax: 95000,
      salarycurrency: 'USD',
      requirements: 'Bachelor\'s degree in Statistics, Mathematics, or related field. Experience with SQL, Python, and data visualization tools. Strong analytical skills.',
      responsibilities: 'Analyze financial data, create reports and dashboards, collaborate with stakeholders, identify trends and patterns.',
      benefits: 'Competitive salary, health benefits, retirement plan, professional development opportunities, flexible work arrangements.',
      contactemail: 'careers@financegroup.com',
      applicationdeadline: new Date('2024-12-15'),
      experiencerequired: 2,
      educationlevel: 'Bachelor\'s Degree',
      skills: ['SQL', 'Python', 'Tableau', 'Excel', 'Statistics'],
      isactive: true,
      isfeatured: true,
      postedby: recruiterUser.id
    }
  })

  console.log('✅ Sample jobs created')

  // Create sample applications
  console.log('📝 Creating sample applications...')
  await prisma.applications.create({
    data: {
      jobid: seniorDevJob.id,
      userid: johnDoe.id,
      coverletter: 'I am excited to apply for the Senior Full Stack Developer position. With my 3 years of experience in React and Node.js, I believe I can contribute significantly to your team.',
      relevancescore: 8.5,
      relevancecomment: 'Strong technical skills and relevant experience. Good cultural fit and communication skills.',
      interviewdate: new Date('2024-10-15'),
      notes: 'Candidate shows strong potential. Schedule technical interview.'
    }
  })

  await prisma.applications.create({
    data: {
      jobid: juniorDevJob.id,
      userid: mikeWilson.id,
      coverletter: 'I am a recent computer science graduate with strong foundation in Java and Spring. I am eager to learn and grow in a supportive environment.',
      relevancescore: 7.2,
      relevancecomment: 'Good educational background and enthusiasm. Needs some mentoring but shows promise.',
      interviewdate: new Date('2024-10-20'),
      notes: 'Schedule initial screening call.'
    }
  })

  await prisma.applications.create({
    data: {
      jobid: dataAnalystJob.id,
      userid: janeSmith.id,
      coverletter: 'With my background in Python and data analysis, I am confident I can help Finance Group Inc make data-driven decisions.',
      relevancescore: 9.1,
      relevancecomment: 'Excellent match for the role. Strong analytical skills and relevant experience.',
      interviewdate: new Date('2024-10-18'),
      notes: 'Top candidate. Proceed to final interview.'
    }
  })

  console.log('✅ Sample applications created')

  // Create email templates
  console.log('📧 Creating email templates...')
  await prisma.emailtemplates.upsert({
    where: { code: 'APPLICATION_RECEIVED' },
    update: {},
    create: {
      name: 'Application Received',
      code: 'APPLICATION_RECEIVED',
      subject: 'Application Received - {{jobTitle}}',
      body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{companyName}}. We have received your application and will review it carefully.

Our team will be in touch within 5-7 business days to discuss next steps.

Best regards,
{{companyName}} HR Team`,
      description: 'Email sent to candidates when their application is received'
    }
  })

  await prisma.emailtemplates.upsert({
    where: { code: 'INTERVIEW_SCHEDULED' },
    update: {},
    create: {
      name: 'Interview Scheduled',
      code: 'INTERVIEW_SCHEDULED',
      subject: 'Interview Scheduled - {{jobTitle}}',
      body: `Dear {{candidateName}},

Congratulations! We would like to invite you for an interview for the {{jobTitle}} position.

Interview Details:
- Date: {{interviewDate}}
- Time: {{interviewTime}}
- Location: {{interviewLocation}}
- Interviewer: {{interviewerName}}

Please confirm your attendance by replying to this email.

Best regards,
{{companyName}} HR Team`,
      description: 'Email sent to candidates when interview is scheduled'
    }
  })

  await prisma.emailtemplates.upsert({
    where: { code: 'APPLICATION_REJECTED' },
    update: {},
    create: {
      name: 'Application Rejected',
      code: 'APPLICATION_REJECTED',
      subject: 'Update on Your Application - {{jobTitle}}',
      body: `Dear {{candidateName}},

Thank you for your interest in the {{jobTitle}} position at {{companyName}}. After careful consideration, we have decided to move forward with other candidates.

We encourage you to apply for other positions that match your skills and experience.

Best regards,
{{companyName}} HR Team`,
      description: 'Email sent to candidates when application is rejected'
    }
  })

  console.log('✅ Email templates created')

  console.log('🎉 Database seeding completed successfully!')
  console.log('\n📋 Summary:')
  console.log(`- Roles: 3 created`)
  console.log(`- Company Types: 4 created`)
  console.log(`- Job Types: 5 created`)
  console.log(`- Companies: 3 created`)
  console.log(`- Users: 4 created (1 admin, 1 recruiter, 3 regular users)`)
  console.log(`- User Details: 3 created`)
  console.log(`- Jobs: 3 created`)
  console.log(`- Applications: 3 created`)
  console.log(`- Email Templates: 3 created`)

  console.log('\n🔑 Test Credentials:')
  console.log('Admin: admin@interviewapp.com / Admin123!')
  console.log('Recruiter: recruiter@techcorp.com / Recruiter123!')
  console.log('User: john.doe@email.com / User123!')
  console.log('User: jane.smith@email.com / User123!')
  console.log('User: mike.wilson@email.com / User123!')
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
