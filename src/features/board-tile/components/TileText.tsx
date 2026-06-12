'use client';

import { propNameSize, propPriceSize, shadowOnLight, splitAtFirst } from '../boardTile.constants';

interface TileTextProps {
  name:      string;
  price?:    number | null;
  textColor: string;
  doSplit:   boolean;
}

export function TileText({ name, price, textColor, doSplit }: TileTextProps) {
  const [line1, line2] = doSplit ? splitAtFirst(name) : [name, null];

  return (
    <div className="min-w-0 overflow-hidden text-center">
      {doSplit && line2 ? (
        <>
          <p
            className="font-sans font-semibold uppercase leading-tight overflow-hidden whitespace-nowrap"
            style={{ fontSize: propNameSize, textShadow: shadowOnLight }}
          >
            {line1}
          </p>
          <p
            className="break-all font-sans font-black uppercase leading-tight overflow-hidden"
            style={{ fontSize: propNameSize, textShadow: shadowOnLight }}
          >
            {line2}
          </p>
        </>
      ) : (
        <h3
          className="break-all font-sans font-semibold uppercase leading-tight overflow-hidden"
          style={{ fontSize: propNameSize, textShadow: shadowOnLight }}
        >
          {name}
        </h3>
      )}
      {price != null && (
        <p
          className="font-sans font-black overflow-hidden whitespace-nowrap"
          style={{ fontSize: propPriceSize, color: textColor, opacity: 0.90, textShadow: shadowOnLight }}
        >
          ${price}
        </p>
      )}
    </div>
  );
}
