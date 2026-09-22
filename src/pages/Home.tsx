import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useInView, useSpring, useTransform, motion } from "framer-motion";
import {
  Zap,
  Rocket,
  Target,
  Users,
  Award,
  LightbulbIcon as Lightbulb,
  TrendingUp,
  MapPin,
  Mail,
  Phone,
  ArrowRight,
  Linkedin,
  Instagram,
  Youtube,
  Star,
  Calendar,
  Quote,
  ChevronDown,
  ArrowUpRight,
  Cpu,
  BookOpen,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/apiConfig";
import { HOMEPAGE_DEFAULTS } from "@/data/homepageDefaults";

const SectionArrow = ({ target }: { target: string }) => (
  <div className="flex justify-center pt-10 md:pt-12">
    <a
      href={`#${target}`}
      onClick={(event) => {
        event.preventDefault();
        const targetElement = document.getElementById(target);
        if (!targetElement) return;

        window.history.pushState(null, "", `#${target}`);
        const startPosition = window.scrollY;
        const endPosition = targetElement.getBoundingClientRect().top + startPosition - 32;
        const distance = endPosition - startPosition;
        const duration = 1100;
        const startTime = performance.now();
        const animateScroll = (currentTime: number) => {
          const progress = Math.min((currentTime - startTime) / duration, 1);
          const easedProgress = progress < 0.5
            ? 2 * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

          window.scrollTo(0, startPosition + distance * easedProgress);
          if (progress < 1) requestAnimationFrame(animateScroll);
        };

        requestAnimationFrame(animateScroll);
      }}
      aria-label="Scroll to the next section"
      className="section-arrow group inline-flex h-16 w-12 translate-y-1 items-start justify-center text-primary/55 transition-colors duration-300 hover:text-primary md:h-20 md:w-16"
    >
      <span className="section-arrow-container" aria-hidden="true">
        <span className="section-arrow-chevron"><span /></span>
        <span className="section-arrow-chevron"><span /></span>
      </span>
    </a>
  </div>
);

const HeroSection = () => {
  return (
    <section
      className="relative w-full overflow-hidden pb-10 pt-32 font-light text-white antialiased md:pb-16 md:pt-20 bg-background"
    >
      <div className="absolute top-5 right-5 z-50">
        <Link to="/admin-login">
          <button className="neon-button">
            Admin Login
          </button>
        </Link>
      </div>

      <div
        className="absolute right-0 top-0 h-full w-1/2"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />
      <div
        className="absolute left-0 top-0 h-full w-1/2 -scale-x-100"
        style={{
          background:
            "radial-gradient(circle at 70% 20%, rgba(155, 135, 245, 0.15) 0%, rgba(13, 10, 25, 0) 60%)",
        }}
      />

      <div className="container relative z-10 mx-auto max-w-2xl px-4 text-center md:max-w-4xl md:px-6 lg:max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="flex justify-center mb-6">
            <img
              src="/v2v-logo.png"
              alt="V2V Logo"
              className="h-24 md:h-32 w-auto transition-all duration-300 hover:scale-105 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="mx-auto mb-6 max-w-4xl text-4xl font-light md:text-5xl lg:text-7xl">
            Transforming <span className="text-primary">Innovation</span> into Reality
          </h1>
          <p className="mx-auto mb-10 max-w-2xl text-lg text-white/60 md:text-xl">
            V2V focuses on identifying real-world problems, developing innovative solutions through deep R&D, and transferring these technologies to industries and government bodies.
          </p>

          <div className="mb-10 sm:mb-0 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#contact"
              className="neumorphic-button hover:shadow-[0_0_20px_rgba(155,135,245,0.5)] relative w-full overflow-hidden rounded-full border border-white/10 bg-gradient-to-b from-white/10 to-white/5 px-8 py-4 text-white shadow-lg transition-all duration-300 hover:border-primary/30 sm:w-auto"
            >
              Get Started
            </a>
            <a
              href="#features"
              className="flex w-full items-center justify-center gap-2 text-white/70 transition-colors hover:text-white sm:w-auto"
            >
              <span>Learn how it works</span>
              <ChevronDown className="w-4 h-4" />
            </a>
          </div>
        </motion.div>

      </div>
      <SectionArrow target="features" />
    </section>
  );
};

const capabilityIcons = [
  <Lightbulb key="0" className="w-8 h-8" />,
  <Rocket key="1" className="w-8 h-8" />,
  <Target key="2" className="w-8 h-8" />,
  <Users key="3" className="w-8 h-8" />,
  <Award key="4" className="w-8 h-8" />,
  <TrendingUp key="5" className="w-8 h-8" />,
  <Zap key="6" className="w-8 h-8" />,
  <Cpu key="7" className="w-8 h-8" />,
];

const FeaturesSection = () => {
  const [capabilitiesData, setCapabilitiesData] = useState<{
    eyebrow: string;
    title: string;
    description: string;
    items: { title: string; description: string }[];
  }>(HOMEPAGE_DEFAULTS.capabilities as any);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/homepage-content`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.capabilities) {
          setCapabilitiesData(data.data.capabilities);
        }
      })
      .catch((err) => console.error("Error loading capabilities:", err));
  }, []);

  const features = capabilitiesData.items || HOMEPAGE_DEFAULTS.capabilities.items;

  return (
    <section id="features" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            className="text-primary font-medium mb-2 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Zap className="w-4 h-4" />
            {capabilitiesData.eyebrow || "OUR CAPABILITIES"}
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{capabilitiesData.title || "What We Do"}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {capabilitiesData.description || "From concept to implementation, we deliver comprehensive solutions that drive real value."}
          </p>
        </div>

        <div className="what-we-do-list grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="what-we-do-card h-full bg-card">
                <CardHeader>
                  <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                    {capabilityIcons[index % capabilityIcons.length]}
                  </div>
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <SectionArrow target="services" />
    </section>
  );
};

const DetailedServicesSection = () => {
  const defaultServices = [
    {
      id: "problem-identification",
      title: "Problem Identification",
      content: "At V2V Tech, innovation begins with identifying and defining real-world problems. We analyze inefficiencies, engage with stakeholders, and break down complex challenges to ensure every solution is relevant, scalable, and impactful.",
      image: "/services/problem-identification.jpg.png"
    },
    {
      id: "rd-solutions",
      title: "R&D Solutions",
      content: "We transform validated problems into functional technological solutions through structured Research & Development. Our focus is on building prototypes and engineered systems using AI, IoT, robotics, and sustainable materials.",
      image: "/services/rd-solutions.jpg.png"
    },
    {
      id: "technology-transfer",
      title: "Technology Transfer",
      content: "Innovation holds value only when it reaches the real world. We ensure seamless technology transfer from lab to market by converting prototypes and research outcomes into deployable, scalable, and industry-ready solutions.",
      image: "/services/technology-transfer.jpg.png"
    },
    {
      id: "industry-collaboration",
      title: "Industry Collaboration",
      content: "We act as a technology partner, collaborating with industries, startups, and institutions to co-create impact-driven solutions. By bridging the gap between innovative ideas and industrial implementation, we co-build solutions that truly matter.",
      image: "/services/industry-collaboration.jpg.png"
    },
    {
      id: "consulting",
      title: "Consulting",
      content: "Our strategic and technical consulting helps organizations identify, design, and implement technology-driven solutions. Deeply rooted in practical execution and engineering feasibility, we guide you on how to make it work in the real world.",
      image: "/services/services-overview.jpg.png"
    }
  ];

  const [servicesList, setServicesList] = useState(defaultServices);

  useEffect(() => {
    const fetchDetailedServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/footer-services`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          const merged = data.data.map((backendSvc: any, index: number) => {
            const fallback = defaultServices[index] || defaultServices.find(
              d => d.title.toLowerCase() === (backendSvc.name || '').toLowerCase()
            ) || defaultServices[0];

            return {
              id: backendSvc.href ? backendSvc.href.replace(/^\//, '') : fallback.id,
              title: backendSvc.name || fallback.title,
              content: fallback.content,
              image: backendSvc.image && backendSvc.image.trim() ? backendSvc.image : fallback.image
            };
          });
          setServicesList(merged);
        }
      } catch (err) {
        console.error("Failed to fetch detailed services for home section:", err);
      }
    };
    fetchDetailedServices();
  }, []);

  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-16">
          <motion.span
            className="text-primary font-medium mb-2 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Target className="w-4 h-4" />
            OUR DETAILED SERVICES
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">In-Depth Solutions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Comprehensive details about the core services we offer to transform your business.
          </p>
        </div>

        <div className="space-y-16">
          {servicesList.map((service, index) => (
            <motion.div
              key={service.id || index}
              id={service.id}
              className={`flex flex-col md:flex-row gap-8 items-center scroll-mt-8 ${index % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-full md:w-1/2">
                <div className="interactive-image rounded-xl overflow-hidden shadow-2xl border border-primary/20">
                  <img src={service.image} alt={service.title} className="h-auto w-full object-cover" />
                </div>
              </div>
              <div className="w-full md:w-1/2 space-y-4">
                <h3 className="text-3xl font-bold">{service.title}</h3>
                <p className="text-muted-foreground text-lg leading-relaxed">
                  {service.content}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
      <SectionArrow target="about" />
    </section>
  );
};

const AboutUsSection = () => {
  const [teamMembers, setTeamMembers] = useState([
    {
      email: "arunsekar.v2v@gmail.com",
      name: "Arun S",
      role: "Founder (Vision & Strategic Leadership)",
      bio: "Provides the overall vision and strategic direction for V2V. Leverages strong industry connections.",
      image: "/team/arun.jpg",
      linkedin: "https://www.linkedin.com/in/arun-sekar-7617b1253/",
    },
    {
      email: "sivaramireddy.v2v@gmail.com",
      name: "Siva Rami Reddy",
      role: "Hardware R&D Lead",
      bio: "Leads the design, development, and prototyping of innovative hardware solutions.",
      image: "/team/sivarami.jpg",
      linkedin: "https://www.linkedin.com/in/sivaramireddy-venna-37a3661a1/",
    },
    {
      email: "phravin.v2v@gmail.com",
      name: "Phravin S",
      role: "Software R&D Lead",
      bio: "Oversees software development and digital innovation. Focuses on creating intelligent systems.",
      image: "/team/phravin.jpg",
      linkedin: "https://www.linkedin.com/in/phravin-s-467503252",
    },
    {
      email: "mareeswaran.v2v@gmail.com",
      name: "Mareeswaran V",
      role: "Business & Partnerships Lead",
      bio: "Heads business strategy, market engagement, and partnership development.",
      image: "/team/Mareeswaran.jpg",
      linkedin: "https://www.linkedin.com/in/mareeswaran-v-482524306?",
    },
    {
      email: "sivagurunathan.v2v@gmail.com",
      name: "Sivagurunathan",
      role: "Finance & Operations Lead",
      bio: "Manages financial planning, budgeting, and operational efficiency.",
      image: "/team/sivagurunathan.jpg",
      linkedin: "https://www.linkedin.com/in/sivagurunathan-rajasekar-2386bb344/",
    },
    {
      email: "jbavanieswaran.v2v@gmail.com",
      name: "Bavanieswaran J",
      role: "Social media & Outreach Lead",
      bio: "Leads Brand Communication, digital presence, and outreach initiatives.",
      image: "/team/bavanies.jpg",
      linkedin: "https://www.linkedin.com/in/bavanieswaran-j-2a0621268",
    },
  ]);

  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const r = await fetch(`${API_BASE_URL}/api/public-team`);
        if (!r.ok) return;
        const d = await r.json();
        if (d.data) {
          const dbUsers: Array<{ email: string; name: string; image: string; role: string }> = d.data;
          setTeamMembers((prevMembers) =>
            prevMembers.map((m) => {
              const matched = dbUsers.find(
                (u) => String(u.email).toLowerCase() === String(m.email).toLowerCase()
              );
              if (matched && matched.image) {
                return {
                  ...m,
                  name: matched.name || m.name,
                  image: matched.image,
                };
              }
              return m;
            })
          );
        }
      } catch (e) {
        console.error("Failed to fetch dynamic team photos", e);
      }
    };
    fetchTeam();
  }, []);

  // Duplicate the list for infinite scroll
  const scrollingMembers = [...teamMembers, ...teamMembers];

  return (
    <section id="about" className="py-20 bg-background overflow-hidden relative">
      <div className="container mx-auto px-4 mb-12">
        <div className="text-center">
          <motion.span
            className="text-primary font-medium mb-2 flex items-center justify-center gap-2 text-xs"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Users className="w-3.5 h-3.5" />
            OUR TEAM
          </motion.span>
          <h2 className="text-3xl md:text-4xl font-bold mb-3">Brains Behind the Mission</h2>
          <p className="text-muted-foreground text-sm max-w-xl mx-auto">
            Meet the talented individuals behind our mission to transform innovation into reality.
          </p>
        </div>
      </div>

      <div className="relative flex overflow-hidden">
        <motion.div
          className="flex gap-6 px-4"
          animate={{
            x: ["0%", "-50%"],
          }}
          transition={{
            x: {
              repeat: Infinity,
              repeatType: "loop",
              duration: 25,
              ease: "linear",
            },
          }}
        >
          {scrollingMembers.map((member, index) => (
            <div key={index} className="w-64 shrink-0">
              <Card className="h-full hover:shadow-lg transition-all duration-300 overflow-hidden bg-card backdrop-blur-sm border-white/5 group">
                <div className="aspect-square overflow-hidden relative">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
                <CardHeader className="p-4 pb-1">
                  <CardTitle className="text-base group-hover:text-primary transition-colors duration-300">{member.name}</CardTitle>
                  <CardDescription className="text-[10px] font-bold text-primary/70 uppercase tracking-widest">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-2 pb-5">
                  <p className="text-[11px] leading-relaxed text-muted-foreground mb-3 line-clamp-2">
                    {member.bio}
                  </p>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-primary hover:underline transition-all"
                  >
                    <Linkedin className="w-3 h-3" />
                    LinkedIn
                    <ArrowRight className="w-2.5 h-2.5 transition-transform group-hover:translate-x-0.5" />
                  </a>
                </CardContent>
              </Card>
            </div>
          ))}
        </motion.div>

        {/* Side Fades */}
        <div className="pointer-events-none absolute inset-y-0 left-0 w-20 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-20 bg-gradient-to-l from-background to-transparent z-10" />
      </div>
      <SectionArrow target="proof" />
    </section>
  );
};

interface StatCounterProps {
  icon: React.ReactNode;
  value: number;
  label: string;
  suffix: string;
  delay: number;
}

function StatCounter({ icon, value, label, suffix, delay }: StatCounterProps) {
  const countRef = useRef(null);
  const isInView = useInView(countRef, { once: false });
  const [hasAnimated, setHasAnimated] = useState(false);

  const springValue = useSpring(0, {
    stiffness: 50,
    damping: 10,
  });

  useEffect(() => {
    if (isInView && !hasAnimated) {
      springValue.set(value);
      setHasAnimated(true);
    } else if (!isInView && hasAnimated) {
      springValue.set(0);
      setHasAnimated(false);
    }
  }, [isInView, value, springValue, hasAnimated]);

  const displayValue = useTransform(springValue, (latest) => Math.floor(latest));

  return (
    <motion.div
      className="bg-card p-6 rounded-xl flex flex-col items-center text-center group hover:shadow-lg transition-all duration-300"
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.6, delay },
        },
      }}
      whileHover={{ y: -5, transition: { duration: 0.2 } }}
    >
      <motion.div
        className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary"
        whileHover={{ rotate: 360, transition: { duration: 0.8 } }}
      >
        {icon}
      </motion.div>
      <motion.div ref={countRef} className="text-3xl font-bold text-foreground flex items-center">
        <motion.span>{displayValue}</motion.span>
        <span>{suffix}</span>
      </motion.div>
      <p className="text-muted-foreground text-sm mt-1">{label}</p>
    </motion.div>
  );
}

const ProofSection = () => {
  const statsRef = useRef<HTMLDivElement>(null);
  const isStatsInView = useInView(statsRef, { once: false, amount: 0.3 });

  const stats = [
    { icon: <Award />, value: 50, label: "Prototypes Built", suffix: "+" },
    { icon: <Users />, value: 20, label: "Collaborative Solutions", suffix: "+" },
    { icon: <Calendar />, value: 5, label: "Sustainable Solutions", suffix: "+" },
    { icon: <TrendingUp />, value: 95, label: "Customer Retention Rate", suffix: "%" },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  return (
    <section id="proof" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Proven Track Record</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Numbers that speak to our commitment to excellence and innovation.
          </p>
        </div>

        <motion.div
          ref={statsRef}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8"
          initial="hidden"
          animate={isStatsInView ? "visible" : "hidden"}
          variants={containerVariants}
        >
          {stats.map((stat, index) => (
            <StatCounter
              key={index}
              icon={stat.icon}
              value={stat.value}
              label={stat.label}
              suffix={stat.suffix}
              delay={index * 0.1}
            />
          ))}
        </motion.div>
      </div>
    </section>
  );
};

const TestimonialsSection = () => {
  const [testimonialsData, setTestimonialsData] = useState<{
    eyebrow: string;
    title: string;
    description: string;
    items: { name: string; role: string; content: string; rating: number }[];
  }>(HOMEPAGE_DEFAULTS.testimonials as any);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/homepage-content`)
      .then((res) => res.json())
      .then((data) => {
        if (data?.data?.testimonials) {
          setTestimonialsData(data.data.testimonials);
        }
      })
      .catch((err) => console.error("Error loading testimonials:", err));
  }, []);

  const testimonials = testimonialsData.items || HOMEPAGE_DEFAULTS.testimonials.items;

  return (
    <section id="testimonials" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.span
            className="text-primary font-medium mb-2 flex items-center justify-center gap-2"
            initial={{ opacity: 0, y: -10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Star className="w-4 h-4" />
            {testimonialsData.eyebrow || "TESTIMONIALS"}
          </motion.span>
          <h2 className="text-4xl md:text-5xl font-bold mb-4">{testimonialsData.title || "What Our Clients Say"}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {testimonialsData.description || "Trusted by leading organizations across industries."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="interactive-card h-full">
                <CardHeader>
                  <Quote className="w-8 h-8 text-primary mb-4" />
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                    ))}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-6">{testimonial.content}</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
      <SectionArrow target="faq" />
    </section>
  );
};

interface FAQItem {
  id?: number;
  question: string;
  answer: string;
}

const FAQSection = () => {
  const [faqs, setFaqs] = useState<FAQItem[]>([]);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/faqs`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setFaqs(data.data);
        }
      } catch (err) {
        console.error("Error fetching FAQs:", err);
      }
    };
    fetchFaqs();
  }, []);

  const displayFaqs = faqs.length > 0 ? faqs : [
    {
      question: "What is V2V's primary focus?",
      answer: "V2V specializes in identifying real-world problems, conducting deep R&D to develop innovative solutions, and transferring these technologies to industries and government bodies.",
    },
    {
      question: "How does the technology transfer process work?",
      answer: "We follow a comprehensive process that includes problem identification, solution development through R&D, validation and testing, and finally seamless integration with your existing systems and processes.",
    },
    {
      question: "What industries do you work with?",
      answer: "We collaborate with a wide range of industries including manufacturing, healthcare, energy, transportation, and government sectors, providing tailored solutions for each domain.",
    },
    {
      question: "How long does a typical project take?",
      answer: "Project timelines vary based on complexity and scope. Typically, projects range from 3 to 12 months, with ongoing support and optimization available after implementation.",
    },
    {
      question: "Do you provide post-implementation support?",
      answer: "Yes, we offer comprehensive post-implementation support including training, maintenance, updates, and continuous optimization to ensure long-term success.",
    },
  ];

  return (
    <section id="faq" className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground">
            Find answers to common questions about our services and process.
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {displayFaqs.map((faq, index) => (
            <AccordionItem key={index} value={`item - ${index} `}>
              <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
      <SectionArrow target="contact" />
    </section>
  );
};



const ContactSection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");

    try {
      // Use Local API
      const response = await fetch(`${API_BASE_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit message');
      }

      setStatus("success");
      setFormData({ name: "", email: "", message: "" });
      setTimeout(() => setStatus("idle"), 5000);
    } catch (error) {
      console.error("Error submitting form:", error);
      setStatus("error");
    }
  };

  return (
    <section id="contact" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">Get In Touch</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Ready to transform your vision into value? Contact us today to discuss your project.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div>
              <h3 className="text-2xl font-semibold mb-6">Contact Information</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Email</p>
                    <a href="mailto:contact@v2v.com" className="text-muted-foreground hover:text-primary transition-colors">
                      info.v2vtech@gmail.com
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Phone</p>
                    <a href="tel:+1234567890" className="text-muted-foreground hover:text-primary transition-colors">
                      +91 80128 85499
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium mb-1">Location</p>
                    <p className="text-muted-foreground">Tamilnadu,India</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="interactive-card bg-card">
              <CardHeader>
                <CardTitle>Send us a message</CardTitle>
                <CardDescription>Fill out the form below and we'll get back to you soon.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Input
                      id="contact-name"
                      name="name"
                      autoComplete="name"
                      placeholder="Your Name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Input
                      id="contact-email"
                      name="email"
                      autoComplete="email"
                      type="email"
                      placeholder="Your Email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Textarea
                      id="contact-message"
                      name="message"
                      placeholder="Your Message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={5}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={status === "submitting"}>
                    {status === "submitting" ? "Sending..." : "Send Message"}
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                  {status === "success" && <p className="text-green-500 mt-2 text-center">Message sent successfully!</p>}
                  {status === "error" && <p className="text-red-500 mt-2 text-center">Failed to send message. Please try again.</p>}


                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  const [services, setServices] = useState<{ name: string; href: string; image?: string }[]>([
    { name: "Problem Identification", href: "/problem-identification" },
    { name: "R&D Solutions", href: "/rd-solutions" },
    { name: "Technology Transfer", href: "/technology-transfer" },
    { name: "Industry Collaboration", href: "/industry-collaboration" },
    { name: "Consulting", href: "/consulting" },
  ]);

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/footer-services`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data) && data.data.length > 0) {
          setServices(data.data);
        }
      } catch (err) {
        console.error("Failed to fetch footer services:", err);
      }
    };
    fetchServices();
  }, []);

  return (
    <footer id="site-footer" className="relative bg-background pt-20 pb-12 overflow-hidden border-t">


      <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 max-w-7xl mx-auto">
          <div className="group">
            <div className="flex items-center mb-6">
              <img
                src="/v2v-logo.png"
                alt="Vision2Value Logo"
                className="h-16 w-auto transition-all duration-300 group-hover:scale-105 drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
              />
            </div>
            <p className="text-muted-foreground leading-relaxed mb-6">
              V2V Tech is not just a technology company — it is a system that transforms problems into real-world solutions through engineering, innovation, and execution.
            </p>
            <div className="flex space-x-4">
              {[
                { icon: Linkedin, href: "https://www.linkedin.com/in/v2v-tech-vision-to-value-technologies-b91498396?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app" },
                { icon: Mail, href: "mailto:info.v2vtech@gmail.com" },
                { icon: Instagram, href: "https://www.instagram.com/v2vtech?igsh=MXBuaDI2dWJwZGx1Zg==" },
                { icon: Youtube, href: "https://youtube.com/@v2vtech-visiontovaluetech?si=gquIOnoofqTtUQ-1" },
              ].map((social, idx) => (
                <a
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-transparent transition-all duration-300 shadow-sm hover:shadow-lg"
                >
                  <social.icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-bold tracking-tight mb-6">Services</h4>
            <ul className="space-y-4">
              {services.map((service, idx) => {
                const isExternal = service.href.startsWith('http://') || service.href.startsWith('https://');
                return (
                  <li key={(service as any).id || idx}>
                    {isExternal ? (
                      <a
                        href={service.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center group"
                      >
                        {service.image ? (
                          <img src={service.image} alt={service.name} className="w-5 h-5 object-contain mr-2.5 rounded shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        )}
                        <span>{service.name}</span>
                      </a>
                    ) : (
                      <Link
                        to={service.href}
                        className="text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center group"
                      >
                        {service.image ? (
                          <img src={service.image} alt={service.name} className="w-5 h-5 object-contain mr-2.5 rounded shrink-0" />
                        ) : (
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                        )}
                        <span>{service.name}</span>
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold tracking-tight mb-6">Company</h4>
            <ul className="space-y-4">
              {[
                { name: "About Us", href: "/about" },
                { name: "Team", href: "/team" },
                { name: "Blogs", href: "/blogs" },
                { name: "Experiments", href: "/experiments" },
                { name: "Admin Portal", href: "/admin-login" },
              ].map((item, idx) => (
                <li key={idx}>
                  <Link to={item.href} className="text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center group">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-lg font-bold tracking-tight mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="text-muted-foreground flex items-center">
                <MapPin className="w-5 h-5 mr-2 text-muted-foreground/70" />
                Tamilnadu,India
              </li>
              <li>
                <a href="mailto:contact@v2v.com" className="text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center group">
                  <Mail className="w-5 h-5 mr-2 text-muted-foreground/70" />
                  info.v2vtech@gmail.com
                </a>
              </li>
              <li>
                <a href="tel:+1234567890" className="text-muted-foreground hover:text-foreground transition-colors duration-300 flex items-center group">
                  <Phone className="w-5 h-5 mr-2 text-muted-foreground/70" />
                  +91 80128 85499
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-sm font-medium">
            © {new Date().getFullYear()} Vision2Value (V2V). All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy-policy" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-300">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors duration-300">
              Terms & Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

interface ManagerField {
  id: number;
  name: string;
  field_type: string;
  required: boolean;
  options: string[];
}

interface ManagerRecord {
  id: number;
  values: Record<string, string>;
}

interface PublicManagerData {
  manager: {
    id: number;
    name: string;
    slug: string;
    description: string;
    category?: string;
    project_name?: string;
    icon?: string;
    image?: string;
    status?: string;
  };
  fields: ManagerField[];
  records: ManagerRecord[];
}

const DynamicManagersSection = () => {
  const [managerSections, setManagerSections] = useState<PublicManagerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public-managers`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setManagerSections(data.data);
        }
      } catch (err) {
        console.error("Error fetching dynamic managers:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchManagers();
  }, []);

  if (loading) return null;

  const activeSections = managerSections.filter(s => s.records && s.records.length > 0);
  if (activeSections.length === 0) return null;

  return (
    <>
      {activeSections.map((sec) => {
        const { manager, fields, records } = sec;

        const imageField = fields.find(f => f.field_type === 'image' || /image|cover|photo/i.test(f.name));
        const urlField = fields.find(f => f.field_type === 'url' || /url|link/i.test(f.name));
        const titleField = fields.find(f => (f.field_type === 'text' || f.field_type === 'email') && /name|title/i.test(f.name)) ||
          fields.find(f => f.field_type === 'text');

        return (
          <section key={manager.id} className="py-24 bg-background relative overflow-hidden border-t border-border/40">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 opacity-50" />
            <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
              <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-primary">
                  {manager.name}
                </h2>
                {manager.description && (
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {manager.description}
                  </p>
                )}
                <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-primary to-purple-500" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {records.map((record) => {
                  const recordTitle = titleField ? record.values[titleField.name] : `Record #${record.id}`;
                  const imageUrl = imageField ? record.values[imageField.name] : '';
                  const linkUrl = urlField ? record.values[urlField.name] : '';

                  const propertyFields = fields.filter(f =>
                    f.id !== imageField?.id &&
                    f.id !== urlField?.id &&
                    f.id !== titleField?.id &&
                    f.field_type !== 'long_text'
                  );

                  const descFields = fields.filter(f => f.field_type === 'long_text');

                  return (
                    <Card key={record.id} className="interactive-card group flex flex-col h-full overflow-hidden rounded-[2rem] border-white/10 bg-card/45 backdrop-blur-sm">
                      <div className="interactive-image relative h-48 w-full overflow-hidden bg-slate-950/20 shrink-0 border-b border-border/10">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={recordTitle}
                            className="w-full h-full object-contain p-4 bg-slate-950/40 transition-transform duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-primary/10">
                            <Cpu className="w-12 h-12 text-primary/30" />
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-grow p-6 justify-between">
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors">
                            {recordTitle}
                          </h3>

                          {descFields.map(df => {
                            const val = record.values[df.name];
                            if (!val) return null;
                            return (
                              <p key={df.id} className="text-sm text-muted-foreground/80 line-clamp-3">
                                {val}
                              </p>
                            );
                          })}

                          {propertyFields.length > 0 && (
                            <div className="flex flex-wrap gap-2 pt-2">
                              {propertyFields.map(pf => {
                                const val = record.values[pf.name];
                                if (!val) return null;
                                return (
                                  <div key={pf.id} className="text-[11px] font-medium bg-slate-950/40 border border-border/40 px-2.5 py-1 rounded-md flex items-center gap-1.5">
                                    <span className="text-muted-foreground">{pf.name}:</span>
                                    <span className="text-foreground">{val}</span>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {linkUrl && (
                          <div className="mt-6">
                            <a
                              href={linkUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 hover:border-transparent px-4 py-2 rounded-xl transition-all duration-300"
                            >
                              Learn More <ArrowUpRight className="w-4 h-4 ml-1.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
            <SectionArrow target="insights" />
          </section>
        );
      })}
    </>
  );
};

interface HomeBlogItem {
  id: number;
  title: string;
  description: string;
  content?: string;
  image?: string;
  category?: string;
  author?: string;
  published_at: string;
}

const RecentBlogsSection = () => {
  const [blogs, setBlogs] = useState<HomeBlogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomeBlogs = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/public-blogs`);
        const data = await response.json();
        if (data.data && Array.isArray(data.data)) {
          setBlogs(data.data.slice(0, 3));
        }
      } catch (err) {
        console.error("Error fetching blogs for home page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchHomeBlogs();
  }, []);

  if (!loading && blogs.length === 0) return null;

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <section id="insights" className="py-24 bg-background relative overflow-hidden border-t border-border/40">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div>
            <motion.span
              className="text-primary font-medium mb-2 flex items-center gap-2 text-sm tracking-wider uppercase"
              initial={{ opacity: 0, y: -10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <BookOpen className="w-4 h-4 text-primary" />
              LATEST INSIGHTS & ARTICLES
            </motion.span>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">From Our R&D Lab</h2>
            <p className="text-muted-foreground mt-2 text-base max-w-xl">
              Discover our latest published research, technical articles, and technology transfer case studies.
            </p>
          </div>
          <Link to="/blogs">
            <Button variant="outline" className="group rounded-xl border-primary/30 hover:border-primary">
              View All Articles
              <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 rounded-3xl bg-card/40 border border-border/40 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {blogs.map((blog, index) => (
              <motion.div
                key={blog.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="interactive-card h-full flex flex-col overflow-hidden rounded-[2rem] group bg-card/45 backdrop-blur-sm border-white/10">
                  <div className="interactive-image relative h-52 w-full overflow-hidden bg-slate-950/40 shrink-0 border-b border-border/10">
                    {blog.image ? (
                      <img
                        src={blog.image}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <BookOpen className="w-12 h-12 text-primary/30" />
                      </div>
                    )}
                    <span className="absolute top-4 left-4 bg-slate-900/80 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase px-3 py-1 rounded-full border border-primary/30 text-primary">
                      {blog.category || 'V2V Insights'}
                    </span>
                  </div>

                  <CardHeader className="flex-1 p-6 pb-2">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(blog.published_at)}
                      </span>
                      {blog.author && (
                        <span className="flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5" />
                          {blog.author}
                        </span>
                      )}
                    </div>
                    <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                      {blog.title}
                    </CardTitle>
                    <CardDescription className="line-clamp-3 text-sm text-muted-foreground/80 mt-2 leading-relaxed">
                      {blog.description}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-6 pt-2 mt-auto">
                    <Link
                      to={`/blogs/${blog.id}`}
                      className="inline-flex items-center text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-foreground bg-primary/10 hover:bg-primary border border-primary/20 hover:border-transparent px-4 py-2.5 rounded-xl transition-all duration-300"
                    >
                      Read Article <ArrowUpRight className="w-4 h-4 ml-1.5" />
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
      <SectionArrow target="faq" />
    </section>
  );
};

const Home = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />
      <FeaturesSection />
      <DetailedServicesSection />
      <AboutUsSection />
      <ProofSection />
      <TestimonialsSection />
      <DynamicManagersSection />
      <RecentBlogsSection />
      <FAQSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Home;
