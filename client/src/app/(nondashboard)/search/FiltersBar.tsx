import {
  FiltersState,
  setFilters,
  setViewMode,
  toggleFiltersFullOpen,
} from "@/state";
import { useAppSelector } from "@/state/redux";
import { usePathname, useRouter } from "next/navigation";
import React, { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { debounce } from "lodash";
import { cleanParams, cn, formatPriceValue } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Filter, Grid, List, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PropertyTypeIcons } from "@/lib/constants";

const FiltersBar = () => {
  const dispatch = useDispatch();
  const router = useRouter();
  const pathname = usePathname();

  const filters = useAppSelector((state) => state.global.filters);
  const viewMode = useAppSelector((state) => state.global.viewMode);
  const isFiltersFullOpen = useAppSelector(
    (state) => state.global.isFiltersFullOpen
  );
  const [searchInput, setSearchInput] = useState(filters.location);
  const [nameSearchInput, setNameSearchInput] = useState("");

  const updateURL = debounce((newFilters: FiltersState) => {
    const cleanFilters = cleanParams(newFilters);
    const updatedSearchParams = new URLSearchParams();

    Object.entries(cleanFilters).forEach(([key, value]) => {
      updatedSearchParams.set(
        key,
        Array.isArray(value) ? value.join(",") : value.toString()
      );
    });

    router.push(`${pathname}?${updatedSearchParams.toString()}`);
  });

  const handleFilterChange = (
    key: string,
    value: any,
    isMin: boolean | null
  ) => {
    let newValue = value;

    if (key === "priceRange" || key === "squareFeet") {
      const currentArrayRange = [...filters[key]];
      if (isMin !== null) {
        const index = isMin ? 0 : 1;
        currentArrayRange[index] = value === "any" ? null : Number(value);
      }
      newValue = currentArrayRange;
    } else if (key === "coordinates") {
      newValue = value === "any" ? [0, 0] : value.map(Number);
    } else {
      newValue = value === "any" ? "any" : value;
    }

    const newFilters = { ...filters, [key]: newValue };
    dispatch(setFilters(newFilters));
    updateURL(newFilters);
  };

  const handleLocationSearch = async () => {
    try {
      const trimmedInput = searchInput.trim();
      if (!trimmedInput) return;

      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
          trimmedInput
        )}.json?access_token=${
          process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
        }&fuzzyMatch=true`
      );
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        dispatch(
          setFilters({
            location: trimmedInput,
            coordinates: [lng, lat],
          })
        );
      }
    } catch (err) {
      console.error("Error searching location:", err);
    }
  };

  return (
    <div className="w-full py-5 space-y-4 lg:space-y-0 lg:flex lg:justify-between lg:items-center">
      {/* Filters */}
      <div className="space-y-3 lg:space-y-0 lg:flex lg:justify-between lg:items-center lg:gap-4 lg:p-2">
        {/* All Filters */}
        <div className="w-full lg:w-auto">
          <Button
            variant="outline"
            className={cn(
              "gap-2 rounded-xl border-primary-400 hover:bg-primary-500 hover:text-primary-100 w-full h-12 lg:w-auto lg:h-9",
              isFiltersFullOpen && "bg-primary-700 text-primary-100"
            )}
            onClick={() => dispatch(toggleFiltersFullOpen())}
          >
            <Filter className="w-4 h-4" />
            <span>All Filters</span>
          </Button>
        </div>

        {/* Search Inputs Row */}
        <div className="flex flex-col space-y-3 lg:flex-row lg:space-y-0 lg:items-center lg:gap-4">
          {/* Search Location */}
          <div className="flex items-center">
            <Input
              placeholder="Search location"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 lg:w-40 rounded-l-xl rounded-r-none border-primary-400 border-r-0"
            />
            <Button
              onClick={handleLocationSearch}
              className="rounded-r-xl rounded-l-none border-l-none border-primary-400 shadow-none border hover:bg-primary-700 hover:text-primary-50 px-4 lg:px-3"
            >
              <Search className="w-4 h-4" />
            </Button>
          </div>

          {/* Search Property Name */}
          <div className="flex items-center">
            <Input
              placeholder="Search by property name"
              value={nameSearchInput}
              onChange={(e) => {
                setNameSearchInput(e.target.value);
                const newValue = e.target.value.trim() ? e.target.value : undefined;
                dispatch(setFilters({ name: newValue }));
              }}
              className="w-full lg:w-48 rounded-xl border-primary-400"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="space-y-3 lg:space-y-0 lg:flex lg:items-center lg:gap-4">
          {/* Price Range */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-1">
            {/* Minimum Price Selector */}
            <Select
              value={filters.priceRange[0]?.toString() || "any"}
              onValueChange={(value) =>
                handleFilterChange("priceRange", value, true)
              }
            >
              <SelectTrigger className="w-full h-12 lg:w-22 lg:h-9 rounded-xl border-primary-400">
                <SelectValue>
                  {formatPriceValue(filters.priceRange[0], true)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="any">Any Min Price</SelectItem>
                {[100000, 500000, 1000000, 2000000, 5000000, 10000000, 15000000].map((price) => (
                  <SelectItem key={price} value={price.toString()}>
                    ₦{price >= 1000000 ? `${price / 1000000}M` : `${price / 1000}k`}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Maximum Price Selector */}
            <Select
              value={filters.priceRange[1]?.toString() || "any"}
              onValueChange={(value) =>
                handleFilterChange("priceRange", value, false)
              }
            >
              <SelectTrigger className="w-full h-12 lg:w-22 lg:h-9 rounded-xl border-primary-400">
                <SelectValue>
                  {formatPriceValue(filters.priceRange[1], false)}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="any">Any Max Price</SelectItem>
                {[500000, 1000000, 2000000, 5000000, 10000000, 15000000, 20000000].map((price) => (
                  <SelectItem key={price} value={price.toString()}>
                    &lt;₦{price >= 1000000 ? `${price / 1000000}M` : `${price / 1000}k`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Beds and Baths */}
          <div className="grid grid-cols-2 gap-2 lg:flex lg:gap-1">
            {/* Beds */}
            <Select
              value={filters.beds}
              onValueChange={(value) => handleFilterChange("beds", value, null)}
            >
              <SelectTrigger className="w-full h-12 lg:w-26 lg:h-9 rounded-xl border-primary-400">
                <SelectValue placeholder="Beds" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="any">Any Beds</SelectItem>
                <SelectItem value="1">1+ bed</SelectItem>
                <SelectItem value="2">2+ beds</SelectItem>
                <SelectItem value="3">3+ beds</SelectItem>
                <SelectItem value="4">4+ beds</SelectItem>
              </SelectContent>
            </Select>

            {/* Baths */}
            <Select
              value={filters.baths}
              onValueChange={(value) => handleFilterChange("baths", value, null)}
            >
              <SelectTrigger className="w-full h-12 lg:w-26 lg:h-9 rounded-xl border-primary-400">
                <SelectValue placeholder="Baths" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="any">Any Baths</SelectItem>
                <SelectItem value="1">1+ bath</SelectItem>
                <SelectItem value="2">2+ baths</SelectItem>
                <SelectItem value="3">3+ baths</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="w-full lg:w-auto">
            <Select
              value={filters.propertyType || "any"}
              onValueChange={(value) =>
                handleFilterChange("propertyType", value, null)
              }
            >
              <SelectTrigger className="w-full h-12 lg:w-32 lg:h-9 rounded-xl border-primary-400">
                <SelectValue placeholder="Home Type" />
              </SelectTrigger>
              <SelectContent className="bg-white">
                <SelectItem value="any">Any Property Type</SelectItem>
                {Object.entries(PropertyTypeIcons).map(([type, Icon]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center">
                      <Icon className="w-4 h-4 mr-2" />
                      <span>{type}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* View Mode */}
      <div className="flex justify-center p-2 lg:justify-between lg:items-center lg:gap-4">
        <div className="flex border rounded-xl w-full max-w-xs lg:w-auto lg:max-w-none">
          <Button
            variant="ghost"
            className={cn(
              "rounded-none rounded-l-xl hover:bg-primary-600 hover:text-primary-50 flex-1 h-12 px-4 py-2 lg:flex-none lg:h-9 lg:px-3 lg:py-1",
              viewMode === "list" ? "bg-primary-700 text-primary-50" : ""
            )}
            onClick={() => dispatch(setViewMode("list"))}
          >
            <List className="w-6 h-6 lg:w-5 lg:h-5" />
            <span className="ml-2 lg:hidden">List</span>
          </Button>
          <Button
            variant="ghost"
            className={cn(
              "rounded-none rounded-r-xl hover:bg-primary-600 hover:text-primary-50 flex-1 h-12 px-4 py-2 lg:flex-none lg:h-9 lg:px-3 lg:py-1",
              viewMode === "grid" ? "bg-primary-700 text-primary-50" : ""
            )}
            onClick={() => dispatch(setViewMode("grid"))}
          >
            <Grid className="w-6 h-6 lg:w-5 lg:h-5" />
            <span className="ml-2 lg:hidden">Grid</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FiltersBar;
