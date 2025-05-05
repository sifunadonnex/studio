'use server';

/**
 * @fileOverview This file contains the Genkit flow for predicting the next maintenance date for a vehicle.
 *
 * - predictMaintenanceDate - A function that predicts the next maintenance date for a vehicle based on its past service history.
 * - PredictMaintenanceInput - The input type for the predictMaintenanceDate function.
 * - PredictMaintenanceOutput - The return type for the predictMaintenanceDate function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const PredictMaintenanceInputSchema = z.object({
  vehicleId: z.string().describe('The ID of the vehicle.'),
  serviceHistory: z
    .string()
    .describe(
      'A string containing the service history of the vehicle, including dates and services performed.'
    ),
});
export type PredictMaintenanceInput = z.infer<typeof PredictMaintenanceInputSchema>;

const PredictMaintenanceOutputSchema = z.object({
  predictedMaintenanceDate: z
    .string()
    .describe('The predicted date for the next maintenance, in ISO 8601 format (YYYY-MM-DD).'),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the predicted maintenance date, explaining which services are due and when.'
    ),
});
export type PredictMaintenanceOutput = z.infer<typeof PredictMaintenanceOutputSchema>;

export async function predictMaintenanceDate(input: PredictMaintenanceInput): Promise<PredictMaintenanceOutput> {
  return predictMaintenanceFlow(input);
}

const prompt = ai.definePrompt({
  name: 'predictMaintenancePrompt',
  input: {
    schema: z.object({
      vehicleId: z.string().describe('The ID of the vehicle.'),
      serviceHistory: z
        .string()
        .describe(
          'A string containing the service history of the vehicle, including dates and services performed.'
        ),
    }),
  },
  output: {
    schema: z.object({
      predictedMaintenanceDate: z
        .string()
        .describe('The predicted date for the next maintenance, in ISO 8601 format (YYYY-MM-DD).'),
      reasoning: z
        .string()
        .describe(
          'The reasoning behind the predicted maintenance date, explaining which services are due and when.'
        ),
    }),
  },
  prompt: `You are an expert mechanic specializing in predictive maintenance.

  Based on the vehicle's service history, predict the next maintenance date.
  Provide the predicted date in ISO 8601 format (YYYY-MM-DD).
  Also, explain your reasoning.

  Vehicle ID: {{{vehicleId}}}
  Service History: {{{serviceHistory}}}
  `,
});

const predictMaintenanceFlow = ai.defineFlow<
  typeof PredictMaintenanceInputSchema,
  typeof PredictMaintenanceOutputSchema
>({
  name: 'predictMaintenanceFlow',
  inputSchema: PredictMaintenanceInputSchema,
  outputSchema: PredictMaintenanceOutputSchema,
},
async input => {
  const {output} = await prompt(input);
  return output!;
});
