import ServicePage from "./ServicePage";

const ProblemIdentification = () => (
  <ServicePage
    title="Problem Identification"
    subtitle="Step 1 — Our Innovation Pipeline"
    image="/services/problem-identification.jpg.png"
    description="At V2V Tech, innovation begins with identifying and defining real-world problems. We don't chase ideas — we validate problems worth solving.\n\nOur team conducts in-depth research, engages with stakeholders, and analyzes industry inefficiencies to uncover root causes. We break down complex challenges into manageable components, ensuring every solution we build is relevant, scalable, and impactful."
    highlights={[
      "Real-world problem discovery through field research and stakeholder interviews",
      "Root cause analysis to understand the core of each challenge",
      "Stakeholder collaboration to gather diverse perspectives and requirements",
      "Feasibility and impact evaluation before committing resources",
    ]}
    approach="We believe that the best solutions come from the best problems. Our identification process is rigorous, data-driven, and human-centered — ensuring we solve the right problems in the right way."
  />
);

export default ProblemIdentification;
