import { NextRequest, NextResponse } from 'next/server';
import { predictDrought, predictDroughtML } from '@/lib/drought-prediction';
import {
  DroughtPredictionInput,
  DroughtPredictionApiResponse,
} from '@/lib/drought-prediction-types';

export const dynamic = 'force-dynamic';

/**
 * POST /api/drought-prediction
 *
 * Accepts drought prediction input features and returns a drought risk forecast
 * using the transparent rule-based scoring system. Optionally includes ML model
 * predictions when available.
 *
 * Request body: DroughtPredictionInput (all numeric features for one area + month)
 * Response: DroughtPredictionApiResponse
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = validateAndParseInput(body);

    // Run rule-based prediction
    const prediction = predictDrought(input);

    // Optionally run ML prediction (returns null if model not loaded)
    const mlPrediction = predictDroughtML(input);

    const response: DroughtPredictionApiResponse = {
      areaName: input.areaName,
      monthLabel: input.monthLabel,
      input,
      prediction,
      ...(mlPrediction ? { mlPrediction } : {}),
      metadata: {
        modelVersion: '1.0.0-rule-based',
        computedAt: new Date().toISOString(),
        disclaimer:
          'This is a drought risk forecast based on satellite-derived indices. ' +
          'It is NOT a deterministic drought prediction. Results should be validated ' +
          'with ground-truth field observations and official meteorological advisories.',
      },
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error: any) {
    console.error('API /api/drought-prediction error:', error);
    return NextResponse.json(
      {
        error: error?.message || 'Failed to compute drought prediction.',
        code: 'DROUGHT_PREDICTION_ERROR',
      },
      { status: 400 }
    );
  }
}

/**
 * GET /api/drought-prediction?demo=true
 *
 * Returns a demo prediction using sample data for testing/demonstration.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isDemoParam = searchParams.get('demo');

  if (isDemoParam !== 'true') {
    return NextResponse.json(
      {
        error: 'Use POST method with DroughtPredictionInput body, or GET with ?demo=true for sample data.',
        code: 'METHOD_HINT',
      },
      { status: 400 }
    );
  }

  // Generate demo input representing a moderate drought scenario
  const demoInput: DroughtPredictionInput = {
    areaName: 'Ahilyanagar',
    monthLabel: 'Oct 2026',
    currentNdvi: 0.28,
    previousMonthNdvi: 0.34,
    sameMonthLastYearNdvi: 0.38,
    fiveYearAvgNdvi: 0.36,
    ndviSlope4Weeks: -1.8,
    ndviSlope8Weeks: -1.2,
    ndviSlope12Weeks: -0.6,
    currentVci: 30.5,
    previousMonthVci: 42.0,
    currentRainfallMm: 35.0,
    longTermAvgRainfallMm: 82.0,
    rainfallDeficitPercent: -57.3,
    temperatureAnomalyC: 2.1,
    consecutiveDeclineWeeks: 3,
  };

  const prediction = predictDrought(demoInput);
  const mlPrediction = predictDroughtML(demoInput);

  const response: DroughtPredictionApiResponse = {
    areaName: demoInput.areaName,
    monthLabel: demoInput.monthLabel,
    input: demoInput,
    prediction,
    ...(mlPrediction ? { mlPrediction } : {}),
    metadata: {
      modelVersion: '1.0.0-rule-based',
      computedAt: new Date().toISOString(),
      disclaimer:
        'DEMO DATA — This is a drought risk forecast using sample input for demonstration. ' +
        'It is NOT a deterministic drought prediction.',
    },
  };

  return NextResponse.json(response, { status: 200 });
}

// ═══════════════════════════════════════════════════════════════════════════
// INPUT VALIDATION
// ═══════════════════════════════════════════════════════════════════════════
function validateAndParseInput(body: any): DroughtPredictionInput {
  if (!body || typeof body !== 'object') {
    throw new Error('Request body must be a JSON object with drought prediction input features.');
  }

  const requiredFields: (keyof DroughtPredictionInput)[] = [
    'areaName',
    'monthLabel',
    'currentNdvi',
    'previousMonthNdvi',
    'sameMonthLastYearNdvi',
    'fiveYearAvgNdvi',
    'ndviSlope4Weeks',
    'ndviSlope8Weeks',
    'ndviSlope12Weeks',
    'currentVci',
    'previousMonthVci',
    'currentRainfallMm',
    'longTermAvgRainfallMm',
    'rainfallDeficitPercent',
    'temperatureAnomalyC',
  ];

  const missing = requiredFields.filter((f) => body[f] === undefined || body[f] === null);
  if (missing.length > 0) {
    throw new Error(`Missing required input features: ${missing.join(', ')}`);
  }

  // Validate numeric ranges
  const numericFields = requiredFields.filter((f) => f !== 'areaName' && f !== 'monthLabel');
  for (const field of numericFields) {
    if (typeof body[field] !== 'number' || Number.isNaN(body[field])) {
      throw new Error(`Field "${field}" must be a valid number. Received: ${body[field]}`);
    }
  }

  if (typeof body.areaName !== 'string' || body.areaName.trim().length === 0) {
    throw new Error('Field "areaName" must be a non-empty string.');
  }

  if (typeof body.monthLabel !== 'string' || body.monthLabel.trim().length === 0) {
    throw new Error('Field "monthLabel" must be a non-empty string.');
  }

  return {
    areaName: body.areaName.trim(),
    monthLabel: body.monthLabel.trim(),
    currentNdvi: body.currentNdvi,
    previousMonthNdvi: body.previousMonthNdvi,
    sameMonthLastYearNdvi: body.sameMonthLastYearNdvi,
    fiveYearAvgNdvi: body.fiveYearAvgNdvi,
    ndviSlope4Weeks: body.ndviSlope4Weeks,
    ndviSlope8Weeks: body.ndviSlope8Weeks,
    ndviSlope12Weeks: body.ndviSlope12Weeks,
    currentVci: body.currentVci,
    previousMonthVci: body.previousMonthVci,
    currentRainfallMm: body.currentRainfallMm,
    longTermAvgRainfallMm: body.longTermAvgRainfallMm,
    rainfallDeficitPercent: body.rainfallDeficitPercent,
    temperatureAnomalyC: body.temperatureAnomalyC,
    consecutiveDeclineWeeks: typeof body.consecutiveDeclineWeeks === 'number' ? body.consecutiveDeclineWeeks : 0,
  };
}
