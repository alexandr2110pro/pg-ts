import * as pg from "pg";
import { QueryFragment, QueryFragmentBuilder } from "../types";

function* sequenceGenerator(seed = 1) {
  let index = seed;
  while (true) {
    yield index++;
  }
}

export const SQLFragment = (parts: TemplateStringsArray, ...inValues: any[]): QueryFragmentBuilder =>
  (seqGen): QueryFragment => ({
    __text: parts.reduce((prev, curr) => `${prev}$${seqGen.next().value}${curr}`),
    __values: inValues,
  });

export const SQL = (parts: TemplateStringsArray, ...inValues: any[]): pg.QueryConfig => {
  const seqGen: IterableIterator<number> = sequenceGenerator();
  const outValues: any[] = [];
  const outText = parts.reduce((prev, curr) => {
    const value = inValues.shift();
    if (typeof value === "function") {
      const { __text, __values } = value(seqGen);
      outValues.push(...__values);

      return `${prev}${__text}${curr}`;
    }
    outValues.push(value);

    return `${prev}$${seqGen.next().value}${curr}`;
  });

  return { text: outText, values: outValues };
};
