import ServicePage from "./ServicePage";

const TechTransfer = () => (
  <ServicePage
    title="Technology Transfer"
    subtitle="Step 3 — Our Innovation Pipeline"
    image="/services/technology-transfer.jpg.png"
    description="Innovation holds value only when it reaches the real world. We ensure seamless technology transfer from lab to market by converting prototypes and research outcomes into deployable, scalable, and industry-ready solutions.\n\nOur transfer process covers validation, optimization, manufacturing setup, and integration — ensuring your innovation successfully transitions from concept to commercial reality."
    highlights={[
      "Rigorous validation to ensure reliability outside controlled conditions",
      "Performance optimization for real-world constraints and requirements",
      "Manufacturing process design for scalable production",
      "Integration support for seamless deployment into existing systems",
    ]}
    approach="We understand that the gap between a working prototype and a market-ready product is where most innovations fail. Our team bridges that gap with systematic processes and deep industry experience."
  />
);

export default TechTransfer;
