import { Header } from "./sections/header";
import { Hero } from "./sections/hero";
import { Features } from "./sections/features";
import { Plugins } from "./sections/plugins";
import { Installation } from "./sections/installation";
import { DeveloperExperience } from "./sections/developer-experience";
import { CTA } from "./sections/cta";
import { Footer } from "./sections/footer";

export function App() {
  return (
    <>
      <Header />
      <main>
        <Hero />
        <Features />
        <Plugins />
        <Installation />
        <DeveloperExperience />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
