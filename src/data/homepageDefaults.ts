export const HOMEPAGE_DEFAULTS = {
  hero: {
    title: 'Transforming Innovation into Reality',
    description: 'V2V focuses on identifying real-world problems, developing innovative solutions through deep R&D, and transferring these technologies to industries and government bodies.'
  },
  capabilities: {
    eyebrow: 'OUR CAPABILITIES', title: 'What We Do', description: 'From concept to implementation, we deliver comprehensive solutions that drive real value.',
    items: [
      { title: 'Problem Identification', description: 'We identify critical real-world challenges through comprehensive research and industry analysis.' },
      { title: 'Deep R&D', description: 'Our team conducts extensive research and development to create innovative, practical solutions.' },
      { title: 'Technology Transfer', description: 'We seamlessly transfer proven technologies to industries and government organizations.' },
      { title: 'Industry Collaboration', description: 'Strong partnerships with leading industries ensure real-world applicability and impact.' },
      { title: 'Quality Assurance', description: 'Rigorous testing and validation processes guarantee excellence in every solution.' },
      { title: 'Continuous Innovation', description: 'We stay ahead of the curve with ongoing research and technology advancement.' }
    ]
  },
  detailed_services: {
    eyebrow: 'OUR DETAILED SERVICES', title: 'In-Depth Solutions', description: 'Comprehensive details about the core services we offer to transform your business.',
    items: [
      { id: 'problem-identification', title: 'Problem Identification', content: 'At V2V Tech, innovation begins with identifying and defining real-world problems. We analyze inefficiencies, engage with stakeholders, and break down complex challenges to ensure every solution is relevant, scalable, and impactful.', image: '/services/problem-identification.jpg.png' },
      { id: 'rd-solutions', title: 'R&D Solutions', content: 'We transform validated problems into functional technological solutions through structured Research & Development. Our focus is on building prototypes and engineered systems using AI, IoT, robotics, and sustainable materials.', image: '/services/rd-solutions.jpg.png' },
      { id: 'technology-transfer', title: 'Technology Transfer', content: 'Innovation holds value only when it reaches the real world. We ensure seamless technology transfer from lab to market by converting prototypes and research outcomes into deployable, scalable, and industry-ready solutions.', image: '/services/technology-transfer.jpg.png' },
      { id: 'industry-collaboration', title: 'Industry Collaboration', content: 'We act as a technology partner, collaborating with industries, startups, and institutions to co-create impact-driven solutions. By bridging the gap between innovative ideas and industrial implementation, we co-build solutions that truly matter.', image: '/services/industry-collaboration.jpg.png' },
      { id: 'consulting', title: 'Consulting', content: 'Our strategic and technical consulting helps organizations identify, design, and implement technology-driven solutions. Deeply rooted in practical execution and engineering feasibility, we guide you on how to make it work in the real world.', image: '/services/services-overview.jpg.png' }
    ]
  },
  track_record: {
    title: 'Proven Track Record', description: 'Numbers that speak to our commitment to excellence and innovation.',
    stats: [
      { value: 50, label: 'Prototypes Built', suffix: '+' }, { value: 20, label: 'Collaborative Solutions', suffix: '+' }, { value: 5, label: 'Sustainable Solutions', suffix: '+' }, { value: 95, label: 'Customer Retention Rate', suffix: '%' }
    ]
  },
  footer_contact: { address: 'Tamilnadu,India', email: 'info.v2vtech@gmail.com', phone: '+91 80128 85499' },
  testimonials: {
    eyebrow: 'TESTIMONIALS', title: 'What Our Clients Say', description: 'Trusted by leading organizations across industries.',
    items: [
      { name: 'Venkatesan Dhakshinamurthy', role: 'Founder, Veba Systems, Chennai', content: 'V2V helped us develop an IoT-based server hardware health monitoring system with firmware integration. Their innovative approach and technical expertise were outstanding.', rating: 5 },
      { name: 'Dr. B.Perumal', role: 'Founder, PMD Systems, Virudhunagar', content: 'We worked with V2V to redesign a LoRa-based IoT system for pond monitoring, complete with AI-driven suggestions for farmers. Their solutions are practical and impactful.', rating: 5 },
      { name: 'Ashok', role: 'VP Engineering, FutureSystems', content: 'The team at V2V delivered beyond our expectations. Their commitment to quality and innovation is evident in every project they undertake.', rating: 5 }
    ]
  },
  our_team: {
    eyebrow: 'OUR TEAM',
    title: 'Brains Behind the Mission',
    description: 'Meet the talented individuals behind our mission to transform innovation into reality.',
    items: [
      {
        name: 'Arun Sekar',
        role: 'Founder (Vision & Strategic Leadership)',
        bio: 'Provides the overall vision and strategic direction for V2V. Leverages strong industry connections.',
        image: '/team/arun.jpg',
        linkedin: 'https://www.linkedin.com/in/arun-sekar-7617b1253/',
        email: 'arunsekar.v2v@gmail.com'
      },
      {
        name: 'Siva Rami Reddy',
        role: 'Hardware R&D Lead',
        bio: 'Leads the design, development, and prototyping of innovative hardware solutions.',
        image: '/team/sivarami.jpg',
        linkedin: 'https://www.linkedin.com/in/sivaramireddy-venna-37a3661a1/',
        email: 'sivaramireddy.v2v@gmail.com'
      },
      {
        name: 'Phravin S',
        role: 'Software R&D Lead',
        bio: 'Oversees software development and digital innovation. Focuses on creating intelligent systems.',
        image: '/team/phravin.jpg',
        linkedin: 'https://www.linkedin.com/in/phravin-s-467503252',
        email: 'phravin.v2v@gmail.com'
      },
      {
        name: 'Mareeswaran V',
        role: 'Business & Partnerships Lead',
        bio: 'Heads business strategy, market engagement, and partnership development.',
        image: '/team/Mareeswaran.jpg',
        linkedin: 'https://www.linkedin.com/in/mareeswaran-v-482524306?',
        email: 'mareeswaran.v2v@gmail.com'
      },
      {
        name: 'Sivagurunathan',
        role: 'Finance & Operations Lead',
        bio: 'Manages financial planning, budgeting, and operational efficiency.',
        image: '/team/sivagurunathan.jpg',
        linkedin: 'https://www.linkedin.com/in/sivagurunathan-rajasekar-2386bb344/',
        email: 'sivagurunathan.v2v@gmail.com'
      },
      {
        name: 'Bavanieswaran J',
        role: 'Social Media & Outreach Lead',
        bio: 'Leads Brand Communication, digital presence, and outreach initiatives.',
        image: '/team/bavanies.jpg',
        linkedin: 'https://www.linkedin.com/in/bavanieswaran-j-2a0621268',
        email: 'jbavanieswaran.v2v@gmail.com'
      }
    ]
  }
} as const;
