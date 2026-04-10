import { HeroSearch } from '@/components/home/HeroSearch';
import { AdvisorCTA } from '@/components/home/AdvisorCTA';
import { CatalogGrid } from '@/components/home/CatalogGrid';

export default function Home() {
  return (
    <>
      <HeroSearch />
      <AdvisorCTA />
      <CatalogGrid />
    </>
  );
}
