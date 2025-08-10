"use client";

import React from "react";
import { useGetPropertiesQuery } from "@/state/api";
import Card from "@/components/Card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import Loading from "@/components/Loading";

const PropertiesSection = () => {
  // Fetch a limited number of featured properties
  const { data: properties, isLoading, isError } = useGetPropertiesQuery({});

  if (isLoading) return <div className="text-center py-10"><Loading /></div>;
  if (isError || !properties) return null;

  // Display only the first 3 properties
  const featuredProperties = properties.slice(0, 3);

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Featured Properties</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Discover our selection of premium properties available for rent. Find your perfect home today.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredProperties.map((property) => (
            <Card
              key={property.id}
              property={property}
              isFavorite={false}
              onFavoriteToggle={() => {}}
              showFavoriteButton={false}
              propertyLink={`/search/${property.id}`}
            />
          ))}
        </div>

        <div className="text-center">
          <Link href="/search">
            <Button className="bg-secondary-600 hover:bg-secondary-600/90 text-white px-8 py-2 rounded-md text-lg">
              View All Properties
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default PropertiesSection;