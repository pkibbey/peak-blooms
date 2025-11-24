import { Button } from "@/components/ui/button";
import Link from "next/link";
import Hero from "@/components/site/Hero";
import FeaturedCollections from "@/components/site/FeaturedCollections";
import FeaturedProducts from "@/components/site/FeaturedProducts";

export default function Home() {
  return (
    <>
      <Hero 
        title="Your premier flower distributor"
        subtitle="We deliver the highest quality, freshest flowers at competitive prices to florists and retailers."
        cta={
          <Button asChild>
            <Link href="/shop" className="inline-flex items-center gap-1">
              Explore collections
            </Link>
          </Button>
        }
      />
      <FeaturedCollections />
      <FeaturedProducts />
    </>
  );
}
