import { z } from "zod";
import type { TamboTool } from "@tambo-ai/react";
import {
  getCountryPopulations,
  getGlobalPopulationTrend,
} from "@/services/population-stats";

export const populationStatsTool: TamboTool = {
  name: "countryPopulation",
  description:
    "A tool to get population statistics by country with advanced filtering options",
  tool: getCountryPopulations,
  inputSchema: z.object({
    continent: z.string().optional(),
    sortBy: z.enum(["population", "growthRate"]).optional(),
    limit: z.number().optional(),
    order: z.enum(["asc", "desc"]).optional(),
  }),
  outputSchema: z.array(
    z.object({
      countryCode: z.string(),
      countryName: z.string(),
      continent: z.enum([
        "Asia",
        "Africa",
        "Europe",
        "North America",
        "South America",
        "Oceania",
      ]),
      population: z.number(),
      year: z.number(),
      growthRate: z.number(),
    }),
  ),
};

export const globalPopulationTool: TamboTool = {
  name: "globalPopulation",
  description:
    "A tool to get global population trends with optional year range filtering",
  tool: getGlobalPopulationTrend,
  inputSchema: z.object({
    startYear: z.number().optional(),
    endYear: z.number().optional(),
  }),
  outputSchema: z.array(
    z.object({
      year: z.number(),
      population: z.number(),
      growthRate: z.number(),
    }),
  ),
};
