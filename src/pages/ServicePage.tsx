import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

interface ServicePageProps {
  title: string;
  subtitle: string;
  image: string;
  description: string;
  highlights: string[];
  approach: string;
}

const ServicePage = ({
  title,
  subtitle,
  image,
  description,
  highlights,
  approach,
}: ServicePageProps) => {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-16 md:py-24">
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="interactive-card overflow-hidden rounded-3xl border border-border/60 bg-card shadow-2xl"
        >
          <div className="grid gap-8 p-6 md:grid-cols-2 md:p-10">
            <div className="interactive-image overflow-hidden rounded-2xl border border-border/60 bg-background">
              <img src={image} alt={title} className="h-full w-full object-cover" />
            </div>

            <div className="flex flex-col justify-center">
              <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
                {subtitle}
              </p>
              <h1 className="text-4xl font-bold tracking-tight md:text-5xl">{title}</h1>
              <p className="mt-6 text-base leading-relaxed text-muted-foreground whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>

          <div className="border-t border-border/60 bg-background/40 p-6 md:p-10">
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="mb-4 text-2xl font-bold">What we focus on</h2>
                <ul className="space-y-3">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-muted-foreground">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
                <h2 className="mb-4 text-2xl font-bold">Our approach</h2>
                <p className="leading-relaxed text-muted-foreground">{approach}</p>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </main>
  );
};

export default ServicePage;
