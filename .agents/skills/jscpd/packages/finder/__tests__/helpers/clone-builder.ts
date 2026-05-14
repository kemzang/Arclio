import type { IClone } from '@jscpd/core';

type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K];
};

const defaultDuplication = (sourceId: string) => ({
  sourceId,
  start: { line: 1, column: 1, position: 0 },
  end: { line: 10, column: 1, position: 100 },
  range: [0, 100] as [number, number],
  fragment: 'function foo() {\n  return 42;\n}\n',
  blame: undefined,
});

export function buildClone(overrides: DeepPartial<IClone> = {}): IClone {
  const base: IClone = {
    format: 'javascript',
    isNew: false,
    duplicationA: defaultDuplication('/project/src/a.js'),
    duplicationB: defaultDuplication('/project/src/b.js'),
  };

  return {
    ...base,
    ...overrides,
    duplicationA: { ...base.duplicationA, ...(overrides.duplicationA as any) },
    duplicationB: { ...base.duplicationB, ...(overrides.duplicationB as any) },
  };
}

export function buildBlameData(sourceId: string, startLine: number, endLine: number) {
  const blame: Record<string, { line: number; author: string; date: string }> = {};
  for (let i = startLine; i <= endLine; i++) {
    blame[String(i)] = { line: i, author: 'author-' + i, date: `2024-01-${String((i % 28) + 1).padStart(2, '0')}` };
  }
  return { [sourceId]: blame };
}
