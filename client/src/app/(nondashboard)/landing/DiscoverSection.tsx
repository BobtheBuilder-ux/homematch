"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Image from "next/image";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      when: "beforeChildren",
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: 0.5,
    } 
  },
};

const DiscoverSection = () => {
  // Add state to track if component is mounted in browser
  const [isMounted, setIsMounted] = useState(false);
  
  // Only run animations after component is mounted on client
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // If not mounted yet (server-side), render without animations
  if (!isMounted) {
    return (
      <div className="py-12 bg-white mb-16 w-full overflow-hidden">
        <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="my-12 text-center">
            <h2 className="text-3xl font-semibold leading-tight text-gray-800">
              Discover
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              Find your Dream Rental Property Today!
            </p>
            <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
              Searching for your dream rental property has never been easier. With
              our user-friendly search feature, you can quickly find the perfect
              home that meets all your needs. Start your search today and discover
              your dream rental property!
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 text-center">
            {[
              {
                imageSrc: "/landing-icon-wand.png",
                title: "Search for Properties",
                description:
                  "Browse through our extensive collection of rental properties in your desired location.",
              },
              {
                imageSrc: "/landing-icon-calendar.png",
                title: "Book Your Rental",
                description:
                  "Once you've found the perfect rental property, easily book it online with just a few clicks.",
              },
              {
                imageSrc: "/landing-icon-heart.png",
                title: "Enjoy your New Home",
                description:
                  "Move into your new rental property and start enjoying your dream home.",
              },
            ].map((card, index) => (
              <div key={index}>
                <DiscoverCard {...card} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className="py-12 bg-white mb-16 w-full overflow-hidden"
    >
      <div className="max-w-6xl xl:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <motion.div variants={itemVariants} className="my-12 text-center">
          <h2 className="text-3xl font-semibold leading-tight text-gray-800">
            Discover
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Find your Dream Rental Property Today!
          </p>
          <p className="mt-2 text-gray-500 max-w-3xl mx-auto">
            Searching for your dream rental property has never been easier. With
            our user-friendly search feature, you can quickly find the perfect
            home that meets all your needs. Start your search today and discover
            your dream rental property!
          </p>
        </motion.div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 text-center">
          {[
            {
              imageSrc: "/landing-icon-wand.png",
              title: "Search for Properties",
              description:
                "Browse through our extensive collection of rental properties in your desired location.",
            },
            {
              imageSrc: "/landing-icon-calendar.png",
              title: "Book Your Rental",
              description:
                "Once you've found the perfect rental property, easily book it online with just a few clicks.",
            },
            {
              imageSrc: "/landing-icon-heart.png",
              title: "Enjoy your New Home",
              description:
                "Move into your new rental property and start enjoying your dream home.",
            },
          ].map((card, index) => (
            <motion.div key={index} variants={itemVariants}>
              <DiscoverCard {...card} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

const DiscoverCard = ({
  imageSrc,
  title,
  description,
}: {
  imageSrc: string;
  title: string;
  description: string;
}) => (
  <div className="px-4 py-8 md:py-12 shadow-lg rounded-lg bg-white border border-gray-100 h-full min-h-[200px] md:min-h-[250px] flex flex-col items-center justify-start">
    <div className="bg-primary-700 p-[0.6rem] rounded-full mb-4 h-10 w-10 mx-auto">
      <Image
        src={imageSrc}
        width={30}
        height={30}
        className="w-full h-full object-contain"
        alt={title}
        priority
      />
    </div>
    <h3 className="mt-4 text-xl font-medium text-gray-800">{title}</h3>
    <p className="mt-2 text-base text-gray-500">{description}</p>
  </div>
);

export default DiscoverSection;
