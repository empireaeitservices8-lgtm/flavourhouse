"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function FeaturedCategories({ acf }: { acf?: any }) {
  const [counts, setCounts] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    fetch("/api/products/", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          const tally: { [key: string]: number } = {};
          data.forEach((p: any) => {
            const cat = (p.category || "").toLowerCase();
            if (cat.includes("pasta") || cat.includes("macaroni")) tally.pasta = (tally.pasta || 0) + 1;
            else if (cat.includes("noodle")) tally.noodles = (tally.noodles || 0) + 1;
            else if (cat.includes("vermicelli")) tally.vermicelli = (tally.vermicelli || 0) + 1;
            else if (cat.includes("cookie")) tally.cookies = (tally.cookies || 0) + 1;
          });
          setCounts(tally);
        }
      })
      .catch(() => {});
  }, []);

  const dynamicCategories = [
    {
      id: "pasta",
      title: acf?.category_1_title || "Pasta",
      subtitle: counts.pasta ? `${counts.pasta} Varieties` : (acf?.category_1_subtitle || "Varieties"),
      image: acf?.category_1_image || "/images/pasta.png",
      className: "col-span-1 md:col-span-2 md:row-span-2",
      link: acf?.category_1_link || "/products?category=Pasta",
    },
    {
      id: "noodles",
      title: acf?.category_2_title || "Noodles",
      subtitle: counts.noodles ? `${counts.noodles} Varieties` : (acf?.category_2_subtitle || "Varieties"),
      image: acf?.category_2_image || "/images/noodles.png",
      className: "col-span-1",
      link: acf?.category_2_link || "/products?category=Noodles",
    },
    {
      id: "vermicelli",
      title: acf?.category_3_title || "Vermicelli",
      subtitle: counts.vermicelli ? `${counts.vermicelli} Varieties` : (acf?.category_3_subtitle || "Varieties"),
      image: acf?.category_3_image || "/images/vermicelli.png",
      className: "col-span-1",
      link: acf?.category_3_link || "/products?category=Vermicelli",
    },
    {
      id: "cookies",
      title: acf?.category_4_title || "Cookies",
      subtitle: counts.cookies ? `${counts.cookies} Varieties` : (acf?.category_4_subtitle || "Varieties"),
      image: acf?.category_4_image || "/images/cookies.png",
      className: "col-span-1 md:col-span-2",
      link: acf?.category_4_link || "/products?category=Cookies",
    },
  ];

  return (
    <section className="py-24 bg-brand-cream">
      <div className="container mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <span className="font-button text-sm uppercase tracking-widest text-brand-primary mb-3 block">
            {acf?.categories_badge || "Discover Our Range"}
          </span>
          <h2 className="font-heading text-4xl md:text-5xl font-bold text-brand-dark mb-4">
            {acf?.categories_title || "Wholesome Collections"}
          </h2>
          <div className="w-24 h-1 bg-brand-primary mx-auto rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 auto-rows-[250px] md:auto-rows-auto md:grid-rows-[300px_300px] gap-6">
          {dynamicCategories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={cn(
                "relative group rounded-3xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500",
                category.className
              )}
            >
              <Link href={category.link} className="block w-full h-full relative">
                {/* Background image */}
                <img
                  src={category.image}
                  alt={category.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Subtle gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-dark/90 via-brand-dark/30 to-transparent"></div>

                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-8 flex flex-col justify-end text-white">
                  <span className="font-button text-xs uppercase tracking-widest text-brand-sand mb-1 block">
                    {category.subtitle}
                  </span>
                  <h3 className="font-heading text-2xl md:text-3xl font-bold tracking-wide">
                    {category.title}
                  </h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
