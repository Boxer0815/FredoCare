import { View } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';

interface Punkt {
  label: string;
  wert: number;
}

interface Props {
  daten: Punkt[];
  hoehe?: number;
  farbe?: string;
  dunkel: boolean;
}

export default function LinienChart({ daten, hoehe = 160, farbe = '#5B8DEF', dunkel }: Props) {
  const breite = 320;
  const padLinks = 28;
  const padRechts = 8;
  const padOben = 16;
  const padUnten = 28;
  const plotBreite = breite - padLinks - padRechts;
  const plotHoehe = hoehe - padOben - padUnten;

  const maxWert = Math.max(...daten.map((d) => d.wert), 1);
  const achsenFarbe = dunkel ? '#555' : '#DDD';
  const textFarbe = dunkel ? '#AAA' : '#8E8E93';
  const yTicks = 4;

  if (daten.length === 0) return null;

  const punkte = daten.map((d, i) => {
    const x = padLinks + (i / Math.max(daten.length - 1, 1)) * plotBreite;
    const y = padOben + plotHoehe - (d.wert / maxWert) * plotHoehe;
    return { x, y, ...d };
  });

  const polylinePunkte = punkte.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <View>
      <Svg width={breite} height={hoehe}>
        {/* Y-Gitter */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padOben + (plotHoehe / yTicks) * i;
          return (
            <Line
              key={i}
              x1={padLinks}
              y1={y}
              x2={breite - padRechts}
              y2={y}
              stroke={achsenFarbe}
              strokeWidth={0.5}
            />
          );
        })}
        {/* Y-Labels */}
        {Array.from({ length: yTicks + 1 }).map((_, i) => {
          const y = padOben + (plotHoehe / yTicks) * i;
          const val = Math.round(maxWert - (maxWert / yTicks) * i);
          return (
            <SvgText key={`yl-${i}`} x={padLinks - 4} y={y + 4} fontSize={9} fill={textFarbe} textAnchor="end">
              {val}
            </SvgText>
          );
        })}
        {/* Linie */}
        <Polyline
          points={polylinePunkte}
          fill="none"
          stroke={farbe}
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {/* Punkte + X-Labels */}
        {punkte.map((p, i) => (
          <View key={i}>
            <Circle cx={p.x} cy={p.y} r={4} fill={farbe} />
            <SvgText x={p.x} y={hoehe - 6} fontSize={9} fill={textFarbe} textAnchor="middle">
              {p.label}
            </SvgText>
          </View>
        ))}
      </Svg>
    </View>
  );
}
