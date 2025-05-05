'use server';

/**
 * @fileOverview This file defines a Genkit flow for providing insights and summaries of admin reports,
 * highlighting key trends and potential issues.
 *
 * - generateReportInsights - A function that generates insights and summaries for admin reports.
 * - GenerateReportInsightsInput - The input type for the generateReportInsights function.
 * - GenerateReportInsightsOutput - The return type for the generateReportInsights function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'zod';

const GenerateReportInsightsInputSchema = z.object({
  reportType: z.string().describe('The type of report to generate insights for (e.g., Monthly Revenue, Service Usage).'),
  reportData: z.string().describe('The data of the report, preferably in a JSON or CSV format.'),
});
export type GenerateReportInsightsInput = z.infer<typeof GenerateReportInsightsInputSchema>;

const GenerateReportInsightsOutputSchema = z.object({
  summary: z.string().describe('A summary of the key trends and potential issues identified in the report.'),
  insights: z.array(z.string()).describe('A list of insights derived from the report data.'),
  recommendations: z.array(z.string()).describe('A list of recommendations based on the insights.'),
});
export type GenerateReportInsightsOutput = z.infer<typeof GenerateReportInsightsOutputSchema>;

export async function generateReportInsights(input: GenerateReportInsightsInput): Promise<GenerateReportInsightsOutput> {
  return generateReportInsightsFlow(input);
}

const generateReportInsightsPrompt = ai.definePrompt({
  name: 'generateReportInsightsPrompt',
  input: {
    schema: z.object({
      reportType: z.string().describe('The type of report (e.g., Monthly Revenue, Service Usage).'),
      reportData: z.string().describe('The data of the report, preferably in a JSON or CSV format.'),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string().describe('A summary of the key trends and potential issues identified in the report.'),
      insights: z.array(z.string()).describe('A list of insights derived from the report data.'),
      recommendations: z.array(z.string()).describe('A list of recommendations based on the insights.'),
    }),
  },
  prompt: `You are an AI assistant that helps analyze reports and provide insights.

You will be given a report type and its data. Your task is to analyze the report data and provide a summary of the key trends and potential issues,
along with a list of insights derived from the data and a list of recommendations based on the insights.

Report Type: {{{reportType}}}
Report Data: {{{reportData}}}

Summary:
Insights:
Recommendations: `,
});

const generateReportInsightsFlow = ai.defineFlow<
  typeof GenerateReportInsightsInputSchema,
  typeof GenerateReportInsightsOutputSchema
>(
  {
    name: 'generateReportInsightsFlow',
    inputSchema: GenerateReportInsightsInputSchema,
    outputSchema: GenerateReportInsightsOutputSchema,
  },
  async input => {
    const {output} = await generateReportInsightsPrompt(input);
    return output!;
  }
);
