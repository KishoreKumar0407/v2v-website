import { motion } from "framer-motion";
import { ArrowLeft, Linkedin, Quote } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

import { useEffect, useState } from "react";
import { API_BASE_URL } from "@/lib/apiConfig";

interface TeamMember {
  name: string;
  role: string;
  bio: string;
  image: string;
  linkedin?: string;
  quote?: string;
  email?: string;
}

const Team = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([
    {
      email: "arunsekar.v2v@gmail.com",
      name: "Arun S",
      role: "Founder (Vision & Strategic Leadership)",
      bio: "Provides the overall vision and strategic direction for V2V. Leverages strong industry connections.",
      image: "/team/arun.jpg",
      linkedin: "https://www.linkedin.com/in/arun-sekar-7617b1253/",
      quote: "Innovation distinguishes between a leader and a follower.",
    },
    {
      email: "sivaramireddy.v2v@gmail.com",
      name: "Siva Rami Reddy",
      role: "Hardware R&D Lead",
      bio: "Leads the design, development, and prototyping of innovative hardware solutions.",
      image: "/team/sivarami.jpg",
      linkedin: "https://www.linkedin.com/in/sivaramireddy-venna-37a3661a1/",
      quote: "The best way to predict the future is to invent it.",
    },
    {
      email: "phravin.v2v@gmail.com",
      name: "Phravin S",
      role: "Software R&D Lead",
      bio: "Oversees software development and digital innovation. Focuses on creating intelligent systems.",
      image: "/team/phravin.jpg",
      linkedin: "https://www.linkedin.com/in/phravin-s-467503252",
      quote: "Code is like humor. When you have to explain it, it's bad.",
    },
    {
      email: "mareeswaran.v2v@gmail.com",
      name: "Mareeswaran V",
      role: "Business & Partnerships Lead",
      bio: "Heads business strategy, market engagement, and partnership development.",
      image: "/team/Mareeswaran.jpg",
      linkedin: "https://www.linkedin.com/in/mareeswaran-v-482524306?",
      quote: "Great ideas become powerful when backed by the right partnerships.",
    },
    {
      email: "sivagurunathan.v2v@gmail.com",
      name: "Sivagurunathan",
      role: "Finance & Operations Lead",
      bio: "Manages financial planning, budgeting, and operational efficiency.",
      image: "/team/sivagurunathan.jpg",
      linkedin: "https://www.linkedin.com/in/sivagurunathan-rajasekar-2386bb344/",
      quote: "Strong systems create sustainable growth.",
    },
    {
      email: "jbavanieswaran.v2v@gmail.com",
      name: "Bavanieswaran J",
      role: "Social Media & Outreach Lead",
      bio: "Leads brand communication, digital presence, and outreach initiatives.",
      image: "/team/bavanies.jpg",
      linkedin: "https://www.linkedin.com/in/bavanieswaran-j-2a0621268",
      quote: "A clear story inspires trust and moves people to act.",
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
          setTeamMembers(prevMembers => {
            const updated = prevMembers.map(m => {
              const matched = dbUsers.find(u => String(u.email).toLowerCase() === String(m.email).toLowerCase());
              if (matched) {
                return {
                  ...m,
                  name: matched.name || m.name,
                  image: matched.image || m.image,
                  role: matched.role === 'MAIN_ADMIN' ? 'Founder (Vision & Strategic Leadership)' : m.role,
                };
              }
              return m;
            });

            // Handle newly added admins
            dbUsers.forEach(dbu => {
              const exists = prevMembers.some(m => String(m.email).toLowerCase() === String(dbu.email).toLowerCase());
              if (!exists) {
                updated.push({
                  email: dbu.email,
                  name: dbu.name || dbu.email.split('@')[0],
                  role: dbu.role === 'MAIN_ADMIN' ? 'Main Administrator' : 'Co-Founder',
                  bio: 'Vision2Value core team member.',
                  image: dbu.image || '/team/default.jpg',
                  quote: 'Turning problems into real-world solutions.'
                });
              }
            });

            return updated;
          });
        }
      } catch (e) {
        console.error("Failed to fetch dynamic team photos", e);
      }
    };
    fetchTeam();
  }, []);

  return (
    <div className="min-h-screen bg-background px-4 py-16 md:px-8">
      <div className="mx-auto max-w-7xl">
        <Link to="/">
          <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-16 text-center"
        >
          <div className="mb-6 flex justify-center">
            <img
              src="/v2v-logo.png"
              alt="V2V Tech Logo"
              className="h-24 w-24 object-contain drop-shadow-[0_0_15px_rgba(139,92,246,0.6)]"
            />
          </div>
          <h1 className="mb-6 text-4xl font-bold md:text-5xl">Brains Behind the Mission</h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Our team brings together research, engineering, strategy, and business expertise to turn ambitious ideas into practical solutions. Each member contributes unique skills, experience, and perspective, helping us build technology that is meaningful, scalable, and impactful.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group flex h-full flex-col overflow-hidden rounded-[2rem] border-white/10 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-xl">
                <div className="flex justify-center pb-4 pt-8">
                  <div className="relative h-64 w-56 rounded-2xl bg-gradient-to-tr from-primary/10 to-transparent p-2">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="h-full w-full rounded-xl object-cover shadow-lg transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                </div>

                <CardHeader className="p-6 pb-2 text-center">
                  <CardTitle className="text-xl transition-colors duration-300 group-hover:text-primary">
                    {member.name}
                  </CardTitle>
                  <CardDescription className="mt-1 text-xs font-bold uppercase tracking-widest text-primary/80">
                    {member.role}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-grow flex-col p-6 pt-2">
                  <div className="relative mb-4 px-4">
                    <Quote className="absolute -left-0 -top-1 h-4 w-4 text-primary/20" />
                    <p className="text-center text-xs italic text-muted-foreground/80">"{member.quote}"</p>
                  </div>

                  <p className="flex-grow text-center text-sm text-muted-foreground">{member.bio}</p>

                  <div className="mt-6 flex justify-center">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary hover:text-primary-foreground"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team;
