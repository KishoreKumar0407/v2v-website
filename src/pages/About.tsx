import { motion } from "framer-motion";
import {
  ArrowLeft,
  Target,
  Lightbulb,
  Users,
  Rocket,
  Shield,
  Globe,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.6 },
};

const About = () => {
  const values = [
    {
      icon: <Lightbulb className="w-6 h-6" />,
      title: "Innovation First",
      description:
        "We believe in pushing boundaries and exploring uncharted territories in technology to create solutions that truly matter.",
    },
    {
      icon: <Users className="w-6 h-6" />,
      title: "People Centered",
      description:
        "Every solution we build starts with understanding real human needs. Technology is a tool — people are the purpose.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Integrity & Trust",
      description:
        "We operate with transparency, honesty, and accountability in every partnership and every line of code we write.",
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: "Sustainability",
      description:
        "We are committed to building technology that is environmentally responsible and socially impactful for future generations.",
    },
  ];

  const capabilities = [
    {
      icon: <Target className="w-8 h-8" />,
      title: "Problem Identification",
      description:
        "We analyze inefficiencies, engage with stakeholders, and break down complex challenges to ensure every solution is relevant, scalable, and impactful.",
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "R&D Solutions",
      description:
        "We transform validated problems into functional technological solutions through structured Research & Development using AI, IoT, robotics, and sustainable materials.",
    },
    {
      icon: <Rocket className="w-8 h-8" />,
      title: "Technology Transfer",
      description:
        "We ensure seamless technology transfer from lab to market by converting prototypes and research outcomes into deployable, scalable, and industry-ready solutions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <section className="relative overflow-hidden px-4 py-20 md:px-8">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
        <div className="relative z-10 mx-auto max-w-5xl">
          <Link to="/">
            <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <div className="mb-8 flex justify-center">
              <img
                src="/v2v-logo.png"
                alt="V2V Tech Logo"
                className="h-28 w-28 object-contain transition-transform duration-300 hover:scale-105 drop-shadow-[0_0_20px_rgba(139,92,246,0.5)]"
              />
            </div>
            <h1 className="mb-6 bg-gradient-to-r from-white via-purple-200 to-primary bg-clip-text text-4xl font-bold text-transparent md:text-6xl">
              About V2V Tech
            </h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground md:text-xl">
              Transforming Innovation into Reality — we bridge the gap between visionary ideas and real-world impact through cutting-edge technology and strategic execution.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">Who We Are</h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-primary to-purple-500" />
          </motion.div>

          <div className="grid items-center gap-12 md:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                V2V Tech is a forward-thinking technology company founded with a singular vision: to make innovation accessible, practical, and impactful. We are a team of engineers, researchers, designers, and strategists who share a passion for solving real-world problems through technology.
              </p>
              <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                From AI and IoT to robotics and sustainable engineering, we work across disciplines to deliver solutions that don't just exist in labs — they reach the hands of the people who need them most.
              </p>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Whether we're collaborating with industries, startups, or academic institutions, our approach remains the same: listen deeply, build rigorously, and deliver relentlessly.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="grid gap-4">
                {values.map((value, index) => (
                  <Card key={index} className="interactive-card border-white/10 bg-card/50 backdrop-blur-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                          {value.icon}
                        </div>
                        <div>
                          <h3 className="mb-2 text-xl font-semibold">{value.title}</h3>
                          <p className="text-muted-foreground">{value.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="bg-slate-900/30 px-4 py-20 md:px-8">
        <div className="mx-auto max-w-6xl">
          <motion.div {...fadeInUp} className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold md:text-4xl">What We Do</h2>
            <div className="mx-auto h-1 w-20 rounded-full bg-gradient-to-r from-primary to-purple-500" />
          </motion.div>

          <div className="grid gap-8 md:grid-cols-3">
            {capabilities.map((capability, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="interactive-card h-full border-white/10 bg-card/50 backdrop-blur-sm">
                  <CardContent className="p-8">
                    <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                      {capability.icon}
                    </div>
                    <h3 className="mb-3 text-2xl font-bold">{capability.title}</h3>
                    <p className="leading-relaxed text-muted-foreground">{capability.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
