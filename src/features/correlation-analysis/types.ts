export type PsychologyField =
  | 'preMood'
  | 'preConfidence'
  | 'anxietyDuring'
  | 'executionSatisfaction';

export type BooleanPsychologyField =
  | 'fomoFlag'
  | 'revengeFlag'
  | 'urgeToExitEarly'
  | 'urgeToAdd';

export type PnlMetric = 'netPnl' | 'pnlPercent' | 'rMultiple';

export type ScatterPoint = {
  x: number;
  y: number;
  tradeId: string;
  ticker: string;
  date: string;
};

export type CorrelationPair = {
  xField: string;
  xLabel: string;
  yField: string;
  yLabel: string;
  correlation: number; // Pearson r (-1 to 1)
  sampleSize: number;
  dataPoints: ScatterPoint[];
};

export type BooleanCorrelation = {
  field: string;
  label: string;
  trueAvgPnl: number;
  falseAvgPnl: number;
  trueCount: number;
  falseCount: number;
  pnlDifference: number; // trueAvg - falseAvg
};

export type CorrelationInsight = {
  text: string;
  strength: 'strong' | 'moderate' | 'weak';
};

export type CorrelationData = {
  pairs: CorrelationPair[];
  booleanCorrelations: BooleanCorrelation[];
  insights: CorrelationInsight[];
};
