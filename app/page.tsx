import { HomeExperience } from "@/components/home-experience";
import { isRegistrationOpen } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HomeExperience open={isRegistrationOpen()} />;
}
