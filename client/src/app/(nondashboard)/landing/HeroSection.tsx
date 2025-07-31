"use client";

import Image from "next/image";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useDispatch } from "react-redux";
import { useRouter } from "next/navigation";
import { setFilters } from "@/state";
import { Search } from "lucide-react";

const HeroSection = () => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = async () => {
    try {
      const trimmedQuery = searchQuery.trim();
      if (!trimmedQuery) return;

      // Try geocoding first to see if it's a location
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedQuery
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&fuzzyMatch=true`
      );
      const data = await response.json();

      const params = new URLSearchParams();

      if (data.features && data.features.length > 0) {
        // It's a location search
        const [lng, lat] = data.features[0].center;
        dispatch(
          setFilters({
            location: trimmedQuery,
            coordinates: [lng, lat],
          })
        );
        params.set("location", trimmedQuery);
        params.set("lat", lat.toString());
        params.set("lng", lng.toString());
      } else {
        // Treat it as a property name search
        dispatch(
          setFilters({
            name: trimmedQuery,
          })
        );
        params.set("name", trimmedQuery);
      }

      router.push(`/search?${params.toString()}`);
    } catch (error) {
      console.error("Error searching:", error);
    }
  };

  return (
    <div className="relative h-screen">
      <Image
        src="/landing-splash.jpg"
        alt="HomeMatch Rental Platform Hero Section"
        fill
        className="object-cover object-center"
        priority
      />
      <div className="absolute inset-0 bg-black bg-opacity-60"></div>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="absolute top-1/3 transform -translate-x-1/2 -translate-y-1/2 text-center w-full"
      >
        <div className="max-w-4xl mx-auto px-16 sm:px-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Start your journey to finding the perfect place to call home
          </h1>
          <p className="text-xl text-white mb-8">
            Explore our wide range of rental properties tailored to fit your
            lifestyle and needs!
          </p>

          <div className="flex justify-center">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by city, neighborhood, address, or property name"
              className="w-full max-w-lg rounded-none rounded-l-xl border-none bg-white h-12"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch();
                }
              }}
            />
            <Button
              onClick={handleSearch}
              className="bg-secondary-500 text-white rounded-none rounded-r-xl border-none hover:bg-secondary-600 h-12"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HeroSection;
