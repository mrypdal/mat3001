import SprintDashboard from "@/components/sprint/SprintDashboard";

export const metadata = {
  title: "Sprintmodellen – Keller",
  description: "Estimer v_max og τ i Kellers kinematiske sprintmodell fra tider på ulike distanser.",
};

export default function SprintPage() {
  return <SprintDashboard />;
}
