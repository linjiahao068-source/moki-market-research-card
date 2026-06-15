export type ExpectationSignal = 'strong_beat' | 'beat' | 'inline' | 'miss' | 'strong_miss' | 'unknown';

const expectationLabels: Record<ExpectationSignal, string> = {
  strong_beat: '明显超预期',
  beat: '超预期',
  inline: '基本符合',
  miss: '低于预期',
  strong_miss: '明显低于预期',
  unknown: '数据不足',
};

export function signalToLabel(signal: ExpectationSignal) {
  return expectationLabels[signal];
}

export function getExpectationLabel(signal: ExpectationSignal) {
  return signalToLabel(signal);
}

export function getExpectationSignal(value?: number, metricType: 'eps' | 'default' = 'default'): ExpectationSignal {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 'unknown';
  }

  const strongThreshold = metricType === 'eps' ? 5 : 3;
  const threshold = metricType === 'eps' ? 2 : 1;

  if (value >= strongThreshold) {
    return 'strong_beat';
  }

  if (value > threshold) {
    return 'beat';
  }

  if (value <= -strongThreshold) {
    return 'strong_miss';
  }

  if (value < -threshold) {
    return 'miss';
  }

  return 'inline';
}
