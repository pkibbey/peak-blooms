import { Button } from "@/components/ui/button";
import Link from "next/link";
import Hero from "@/components/site/Hero";
import FeaturedCollections from "@/components/site/FeaturedCollections";
import FeaturedInspiration from "@/components/site/FeaturedInspiration";
import FeaturedProducts from "@/components/site/FeaturedProducts";

export default function Home() {
  return (
    <>
      <Hero 
        title="The art of bloom"
        subtitle="Sourced for the discerning florist."
        cta={
          <Button asChild>
            <Link href="/shop" className="inline-flex items-center gap-1">
              Explore collections
            </Link>
          </Button>
        }
      />
      <FeaturedCollections />
      <FeaturedInspiration />
      <FeaturedProducts />
    </>
  );
}
